/**
 * Webhooks Engine E2E Tests
 * 
 * Design Philosophy:
 * -----------------
 * These tests use a REAL HTTP test server to receive webhook deliveries,
 * eliminating the need to mock axios. This is true E2E testing:
 * 
 * 1. Test creates a local HTTP server on a random port
 * 2. Test creates webhook subscription pointing to this server
 * 3. Test triggers events via Redis pubsub
 * 4. Real BullMQ processor makes real HTTP calls to our test server
 * 5. Test server records received webhooks for verification
 * 
 * This approach is reliable because:
 * - No mocking of axios or any HTTP library
 * - No timing issues with Jest spies across module boundaries
 * - Real end-to-end flow from event → queue → processor → HTTP delivery
 */
import { TestHarness } from './utils/test-harness';
import request from 'supertest';
import http from 'http';
import { AddressInfo } from 'net';
import { NEW_MESSAGE_CHANNEL, WEBHOOKS_QUEUE } from '../src/common/constants';
import { WebhookSubscription } from '../src/webhooks/entities/webhook-subscription.entity';
import { WebhookDelivery, DeliveryStatus } from '../src/webhooks/entities/webhook-delivery.entity';
import { REDIS_PUBLISHER_CLIENT } from '../src/redis/redis.module';
import { Redis } from 'ioredis';
import { ConversationStatus } from '@live-chat/shared-types';
import { randomUUID } from 'crypto';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';

/**
 * Simple HTTP test server that records incoming webhook requests.
 * Can be configured to respond with different status codes per path.
 */
class WebhookTestServer {
  private server: http.Server;
  public receivedWebhooks: Array<{
    path: string;
    body: any;
    headers: http.IncomingHttpHeaders;
    timestamp: Date;
  }> = [];
  private responseConfig: Map<string, { status: number; delay?: number }> = new Map();

  constructor() {
    this.server = http.createServer(async (req, res) => {
      const path = req.url || '/';
      
      // Collect body
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString());

      // Record the webhook
      this.receivedWebhooks.push({
        path,
        body,
        headers: req.headers,
        timestamp: new Date(),
      });

      // Get configured response
      const config = this.responseConfig.get(path) || { status: 200 };
      
      // Apply delay if configured
      if (config.delay) {
        await new Promise(r => setTimeout(r, config.delay));
      }

      res.writeHead(config.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));
    });
  }

  async start(): Promise<string> {
    return new Promise((resolve) => {
      this.server.listen(0, '127.0.0.1', () => {
        const addr = this.server.address() as AddressInfo;
        resolve(`http://127.0.0.1:${addr.port}`);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => resolve());
    });
  }

  /**
   * Configure response for a specific path
   * @param path - URL path (e.g., '/success', '/fail')
   * @param status - HTTP status code to return
   * @param delay - Optional delay in ms before responding (for timeout testing)
   */
  configureResponse(path: string, status: number, delay?: number): void {
    this.responseConfig.set(path, { status, delay });
  }

  /** Clear recorded webhooks between tests */
  clear(): void {
    this.receivedWebhooks = [];
  }

  /** Wait for a webhook to be received with timeout */
  async waitForWebhook(path: string, timeoutMs = 5000): Promise<typeof this.receivedWebhooks[0] | null> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const webhook = this.receivedWebhooks.find(w => w.path === path);
      if (webhook) return webhook;
      await new Promise(r => setTimeout(r, 100));
    }
    return null;
  }

  /** Get all webhooks for a path */
  getWebhooks(path: string): typeof this.receivedWebhooks {
    return this.receivedWebhooks.filter(w => w.path === path);
  }
}

describe('Webhooks Engine (E2E)', () => {
  const harness = new TestHarness();
  let agent: ReturnType<typeof request.agent>;
  let accessToken: string;
  let projectId: number;
  let redisPublisher: Redis;
  let conversationId: number;
  let visitorId: number;
  let visitorUid: string;
  let testServer: WebhookTestServer;
  let testServerUrl: string;

  beforeAll(async () => {
    // Isolate queue to prevent background workers from stealing jobs
    process.env.BULL_PREFIX = `test-webhook-${randomUUID()}`;

    // Start test server FIRST
    testServer = new WebhookTestServer();
    testServerUrl = await testServer.start();
    console.log(`[Test] Webhook test server started at ${testServerUrl}`);

    // Bootstrap app with worker (includes WebhookProcessor)
    await harness.bootstrapWithWorker();
    agent = request.agent(harness.app.getHttpServer());
    redisPublisher = harness.app.get<Redis>(REDIS_PUBLISHER_CLIENT);

    // Give BullMQ worker time to initialize and connect to Redis
    // This is necessary because workers connect asynchronously
    await new Promise(r => setTimeout(r, 5000));
  });

  afterAll(async () => {
    await testServer.stop();
    await harness.teardown();
  });

  beforeEach(async () => {
    await harness.cleanDatabase();
    testServer.clear();

    // Clear Queue
    const queue = harness.app.get<Queue>(getQueueToken(WEBHOOKS_QUEUE));
    await queue.drain();
    await queue.clean(0, 1000, 'completed');
    await queue.clean(0, 1000, 'failed');
    await queue.clean(0, 1000, 'active');
    await queue.clean(0, 1000, 'delayed');

    // 1. Register and Login
    const userPayload = {
      email: 'webhook-admin@example.com',
      password: 'Password123!',
      fullName: 'Webhook Admin',
    };

    await agent.post('/auth/register').send(userPayload).expect(201);
    
    // Verify email to login
    const confirmationEmail = harness.mailService.findEmailByType('CONFIRMATION');
    await agent.get('/auth/verify-email').query({ token: confirmationEmail.token }).expect(200);

    const loginRes = await agent.post('/auth/login').send({
      email: userPayload.email,
      password: userPayload.password,
    }).expect(200);

    accessToken = loginRes.body.accessToken;

    // 2. Create Project
    const projectRes = await agent
      .post('/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ 
        name: 'Webhook Project',
        whitelistedDomains: ['localhost'] 
      })
      .expect(201);
    
    projectId = projectRes.body.id;

    // 3. Create Visitor and Conversation
    visitorUid = randomUUID();
    const visitorRes = await harness.dataSource.query(`
      INSERT INTO visitors (project_id, visitor_uid)
      VALUES (${projectId}, '${visitorUid}')
      RETURNING id
    `);
    visitorId = Number(visitorRes[0].id);

    const convRes = await harness.dataSource.query(`
      INSERT INTO conversations (project_id, visitor_id, status, unread_count)
      VALUES (${projectId}, ${visitorId}, '${ConversationStatus.OPEN}', 0)
      RETURNING id
    `);
    conversationId = Number(convRes[0].id);
  });

  describe('Happy Path', () => {
    it('should create subscription, dispatch event, and deliver webhook to real server', async () => {
      // Configure test server to return 200
      testServer.configureResponse('/success', 200);

      // 1. Create Subscription pointing to our test server
      const subRes = await agent
        .post(`/projects/${projectId}/webhooks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          url: `${testServerUrl}/success`,
          eventTriggers: ['message.created'],
          isActive: true
        });
      
      // Debug output
      if (subRes.status !== 201) {
        throw new Error(`Failed to create subscription: ${JSON.stringify(subRes.body)}`);
      }
      expect(subRes.status).toBe(201);

      const subscription: WebhookSubscription = subRes.body;
      expect(subscription.secret).toBeDefined();
      expect(subscription.url).toBe(`${testServerUrl}/success`);

      // 2. Trigger Event via Redis
      const eventPayload = {
        projectId,
        message: { 
          id: 123, 
          content: 'Hello World',
          conversationId,
          fromCustomer: true,
          status: 'sent',
          createdAt: new Date().toISOString()
        },
        visitorUid,
        tempId: 'temp-1'
      };

      await redisPublisher.publish(NEW_MESSAGE_CHANNEL, JSON.stringify(eventPayload));

      // 3. Wait for webhook to be received by our test server
      const receivedWebhook = await testServer.waitForWebhook('/success', 10000);
      
      expect(receivedWebhook).not.toBeNull();

      // 4. Verify received payload
      expect(receivedWebhook!.body).toEqual(eventPayload);
      
      // 5. Verify signature header exists
      expect(receivedWebhook!.headers['x-hub-signature-256']).toMatch(/^sha256=[a-f0-9]{64}$/);
      expect(receivedWebhook!.headers['x-livechat-event']).toBe('message.created');

      // 6. Verify delivery record in DB
      // Note: May have multiple deliveries if processors are duplicated
      const deliveries = await harness.dataSource.getRepository(WebhookDelivery).find({
        where: { subscriptionId: subscription.id },
        order: { createdAt: 'DESC' }
      });
      expect(deliveries.length).toBeGreaterThan(0);
      
      // Find the successful delivery
      const successfulDelivery = deliveries.find(d => d.status === DeliveryStatus.SUCCESS);
      expect(successfulDelivery).toBeDefined();
      expect(successfulDelivery!.responseStatus).toBe(200);
    }, 15000);
  });

  describe('Edge Cases', () => {
    it('should not dispatch if subscription is inactive', async () => {
      testServer.configureResponse('/inactive', 200);

      // Create inactive subscription
      await agent
        .post(`/projects/${projectId}/webhooks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          url: `${testServerUrl}/inactive`,
          eventTriggers: ['message.created'],
          isActive: false
        })
        .expect(201);

      // Trigger event
      const eventPayload = { 
        projectId, 
        message: { 
          id: 456, 
          content: 'Test', 
          conversationId,
          fromCustomer: true,
          status: 'sent',
          createdAt: new Date().toISOString() 
        }, 
        visitorUid,
        tempId: 'temp-2'
      };
      await redisPublisher.publish(NEW_MESSAGE_CHANNEL, JSON.stringify(eventPayload));

      // Wait and verify NO webhook was received
      await new Promise(r => setTimeout(r, 2000));
      expect(testServer.getWebhooks('/inactive')).toHaveLength(0);
    });

    it('should reject internal IP addresses (SSRF protection)', async () => {
      // Note: localhost and 127.0.0.1 are allowed in test mode for local test servers.
      // We only test non-loopback private IPs here.
      const internalUrls = [
        'https://192.168.1.1/webhook',
        'https://10.0.0.1/webhook',
        'https://172.16.0.1/webhook'
      ];

      for (const url of internalUrls) {
        const res = await agent
          .post(`/projects/${projectId}/webhooks`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            url: url,
            eventTriggers: ['message.created'],
          });
        expect(res.status).toBe(400);
      }
    });
  });

  describe('Error Handling', () => {
    it('should record failure when target returns 500', async () => {
      // Configure test server to return 500
      testServer.configureResponse('/fail-500', 500);

      // Create Subscription
      const subRes = await agent
        .post(`/projects/${projectId}/webhooks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          url: `${testServerUrl}/fail-500`,
          eventTriggers: ['message.created'],
        })
        .expect(201);
      
      const subscriptionId = subRes.body.id;

      // Trigger event
      const eventPayload = { 
        projectId, 
        message: { 
          id: 999,
          content: 'Error 500 Test', 
          conversationId,
          fromCustomer: true,
          status: 'sent',
          createdAt: new Date().toISOString() 
        },
        visitorUid,
        tempId: 'temp-3'
      };
      await redisPublisher.publish(NEW_MESSAGE_CHANNEL, JSON.stringify(eventPayload));

      // Poll DB for delivery record - more reliable than waiting for webhook at test server
      // because BullMQ worker timing is variable
      let deliveries: WebhookDelivery[] = [];
      const startTime = Date.now();
      const timeout = 15000;
      
      while (Date.now() - startTime < timeout) {
        deliveries = await harness.dataSource.getRepository(WebhookDelivery).find({
          where: { subscriptionId },
          order: { createdAt: 'DESC' }
        });
        
        // Check for a delivery with FAILURE status and 500 response
        const failedDelivery = deliveries.find(d => 
          d.status === DeliveryStatus.FAILURE && d.responseStatus === 500
        );
        if (failedDelivery) break;
        
        await new Promise(r => setTimeout(r, 500));
      }

      expect(deliveries.length).toBeGreaterThan(0);
      const failedDelivery = deliveries.find(d => d.status === DeliveryStatus.FAILURE);
      expect(failedDelivery).toBeDefined();
      expect(failedDelivery!.responseStatus).toBe(500);
    }, 20000);

    it('should record timeout when target takes too long', async () => {
      // Configure test server to delay response beyond axios timeout (5s)
      testServer.configureResponse('/timeout', 200, 7000);

      // Create Subscription
      const subRes = await agent
        .post(`/projects/${projectId}/webhooks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          url: `${testServerUrl}/timeout`,
          eventTriggers: ['message.created'],
        })
        .expect(201);
      
      const subscriptionId = subRes.body.id;

      // Trigger event
      const eventPayload = { 
        projectId, 
        message: { 
          id: 1000,
          content: 'Timeout Test', 
          conversationId,
          fromCustomer: true,
          status: 'sent',
          createdAt: new Date().toISOString() 
        },
        visitorUid,
        tempId: 'temp-4'
      };
      await redisPublisher.publish(NEW_MESSAGE_CHANNEL, JSON.stringify(eventPayload));

      // Wait for timeout to occur (axios timeout is 5s, then retry, so wait for processing)
      await new Promise(r => setTimeout(r, 10000));

      const deliveries = await harness.dataSource.getRepository(WebhookDelivery).find({
        where: { subscriptionId },
        order: { createdAt: 'DESC' }
      });

      expect(deliveries.length).toBeGreaterThan(0);
      // Find a delivery with FAILURE status (may have retries)
      const failedDelivery = deliveries.find(d => d.status === DeliveryStatus.FAILURE);
      expect(failedDelivery).toBeDefined();
      expect(failedDelivery!.responseStatus).toBe(0); // No response due to timeout
      expect(failedDelivery!.error).toContain('timeout');
    }, 25000);
  });
});
