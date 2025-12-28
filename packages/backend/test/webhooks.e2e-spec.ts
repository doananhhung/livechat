import { TestHarness } from './utils/test-harness';
import request from 'supertest';
import axios from 'axios';
import { NEW_MESSAGE_CHANNEL } from '../src/common/constants';
import { WebhookSubscription } from '../src/webhooks/entities/webhook-subscription.entity';
import { WebhookDelivery, DeliveryStatus } from '../src/webhooks/entities/webhook-delivery.entity';
import { REDIS_PUBLISHER_CLIENT } from '../src/redis/redis.module';
import { Redis } from 'ioredis';

describe('Webhooks Engine (E2E)', () => {
  const harness = new TestHarness();
  let agent: ReturnType<typeof request.agent>;
  let accessToken: string;
  let projectId: number;
  let redisPublisher: Redis;

  beforeAll(async () => {
    await harness.bootstrap();
    agent = request.agent(harness.app.getHttpServer());
    redisPublisher = harness.app.get<Redis>(REDIS_PUBLISHER_CLIENT);
  });

  afterAll(async () => {
    await harness.teardown();
  });

  beforeEach(async () => {
    await harness.cleanDatabase();
    jest.clearAllMocks(); // Clear spies

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
  });

  // Spy on Axios
  const axiosPostSpy = jest.spyOn(axios, 'post');

  describe('Happy Path', () => {
    it('should create subscription, dispatch event, and deliver webhook', async () => {
      // 1. Create Subscription
      const targetUrl = 'https://webhook.site/test-endpoint';
      const subRes = await agent
        .post(`/projects/${projectId}/webhooks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          url: targetUrl,
          eventTriggers: ['message.created'],
          isActive: true
        })
        .expect(201);

      const subscription: WebhookSubscription = subRes.body;
      expect(subscription.secret).toBeDefined();
      expect(subscription.url).toBe(targetUrl);

      // Mock Axios Success
      axiosPostSpy.mockResolvedValue({ status: 200, data: 'OK' });

      // 2. Trigger Event via Redis
      const eventPayload = {
        projectId,
        message: { id: 123, text: 'Hello World' },
        visitorUid: 'visitor-1',
        tempId: 'temp-1'
      };

      // We publish to the channel the Dispatcher listens to
      await redisPublisher.publish(NEW_MESSAGE_CHANNEL, JSON.stringify(eventPayload));

      // 3. Wait for Processing (Poll DB for Delivery)
      // Since processing is async (Queue -> Worker), we need to wait.
      await waitForDelivery(harness, subscription.id);

      // 4. Verify Delivery Record
      const deliveries = await harness.dataSource.getRepository(WebhookDelivery).find({
        where: { subscriptionId: subscription.id },
      });

      expect(deliveries.length).toBeGreaterThan(0);
      const delivery = deliveries[0];
      expect(delivery.status).toBe(DeliveryStatus.SUCCESS);
      expect(delivery.responseStatus).toBe(200);
      expect(delivery.requestPayload).toEqual(eventPayload);

      // 5. Verify Axios Call
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      const [url, body, config] = axiosPostSpy.mock.calls[0];
      expect(url).toBe(targetUrl);
      expect(body).toEqual(eventPayload);
      
      const headers = config?.headers as Record<string, string>;
      expect(headers).toBeDefined();
      expect(headers['X-Hub-Signature-256']).toMatch(/^sha256=[a-f0-9]{64}$/);
      expect(headers['X-LiveChat-Event']).toBe('message.created');
    }, 10000); // Increase timeout for queue processing
  });

  describe('Edge Cases', () => {
    it('should not dispatch if subscription is inactive', async () => {
       await agent
        .post(`/projects/${projectId}/webhooks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          url: 'https://example.com/inactive',
          eventTriggers: ['message.created'],
          isActive: false
        })
        .expect(201);

      const eventPayload = { projectId, message: { id: 456 }, visitorUid: 'v2' };
      await redisPublisher.publish(NEW_MESSAGE_CHANNEL, JSON.stringify(eventPayload));

      // Wait a bit to ensure nothing happens
      await new Promise(r => setTimeout(r, 2000));

      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('should reject internal IP addresses (SSRF)', async () => {
      const internalUrls = [
        'https://localhost/webhook',
        'https://127.0.0.1/webhook',
        'https://192.168.1.1/webhook',
        'https://10.0.0.1/webhook'
      ];

      for (const url of internalUrls) {
        await agent
          .post(`/projects/${projectId}/webhooks`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            url: url,
            eventTriggers: ['message.created'],
          })
          .expect(400); // Expect Bad Request
      }
    });
  });

  describe('Error Handling', () => {
    it('should record failure when target returns 500', async () => {
      // Create Subscription
      const subRes = await agent
        .post(`/projects/${projectId}/webhooks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          url: 'https://webhook.site/fail',
          eventTriggers: ['message.created'],
        })
        .expect(201);
      
      const subscriptionId = subRes.body.id;

      // Mock Axios Failure
      axiosPostSpy.mockRejectedValue({
        isAxiosError: true,
        response: { status: 500, statusText: 'Server Error' },
        message: 'Request failed with status code 500'
      });

      // Trigger
      const eventPayload = { projectId, message: { id: 999 } };
      await redisPublisher.publish(NEW_MESSAGE_CHANNEL, JSON.stringify(eventPayload));

      // Wait for delivery attempt
      await waitForDelivery(harness, subscriptionId);

      const deliveries = await harness.dataSource.getRepository(WebhookDelivery).find({
        where: { subscriptionId },
        order: { createdAt: 'DESC' }
      });

      expect(deliveries.length).toBeGreaterThan(0);
      const delivery = deliveries[0];
      
      expect(delivery.status).toBe(DeliveryStatus.FAILURE);
      expect(delivery.responseStatus).toBe(500);
    }, 10000);

    it('should fail with timeout error when target times out', async () => {
      // Create Subscription
      const subRes = await agent
        .post(`/projects/${projectId}/webhooks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          url: 'https://webhook.site/timeout',
          eventTriggers: ['message.created'],
        })
        .expect(201);
      
      const subscriptionId = subRes.body.id;

      // Mock Axios Timeout
      axiosPostSpy.mockRejectedValue({
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      });

      // Trigger
      const eventPayload = { projectId, message: { id: 1000 } };
      await redisPublisher.publish(NEW_MESSAGE_CHANNEL, JSON.stringify(eventPayload));

      // Wait for delivery attempt
      await waitForDelivery(harness, subscriptionId);

      const deliveries = await harness.dataSource.getRepository(WebhookDelivery).find({
        where: { subscriptionId },
        order: { createdAt: 'DESC' }
      });

      expect(deliveries.length).toBeGreaterThan(0);
      const delivery = deliveries[0];
      
      expect(delivery.status).toBe(DeliveryStatus.FAILURE);
      // Response status should be 0 or null for timeout
      expect(delivery.responseStatus).toBe(0);
      expect(delivery.error).toContain('timeout');
    }, 10000);
  });
});

async function waitForDelivery(harness: TestHarness, subscriptionId: string, timeout = 5000) {
  const start = Date.now();
  const repo = harness.dataSource.getRepository(WebhookDelivery);
  
  while (Date.now() - start < timeout) {
    const count = await repo.count({ where: { subscriptionId } });
    if (count > 0) return;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('Timeout waiting for webhook delivery');
}
