import { TestHarness } from './utils/test-harness';
import request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Conversation } from '../src/database/entities'; // Import Conversation entity
import {
  VisitorSessionMetadata,
  WebSocketEvent,
  ConversationUpdatedPayload,
  NavigationEntry,
} from '@live-chat/shared-types'; // Import shared types
import { EntityManager } from 'typeorm'; // Import EntityManager for DB queries
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4

const MAX_URL_HISTORY_LENGTH = 50; // Use the same constant as in the gateway

/**
 * Tests the WebSocket gateway and event emission flow.
 *
 * Full end-to-end flow (Visitor -> Gateway -> Worker -> DB -> Outbox -> Redis -> Gateway -> Agent)
 * requires worker to use the same database as the test environment.
 *
 * This test verifies:
 * 1. WebSocket connections work for visitors and agents
 * 2. Events are emitted correctly when messages are sent
 */
describe('Realtime Chat Architecture (E2E)', () => {
  const harness = new TestHarness();
  let agentToken: string;
  let projectId: number;
  let visitorSocket: Socket;
  let agentSocket: Socket;
  let entityManager: EntityManager; // Declare entityManager

  const PORT = 3001;

  beforeAll(async () => {
    await harness.bootstrapWithWorker();
    await harness.app.listen(PORT);
    entityManager = harness.app.get(EntityManager); // Get EntityManager instance
  }, 60000);

  afterAll(async () => {
    if (visitorSocket) visitorSocket.disconnect();
    if (agentSocket) agentSocket.disconnect();
    // Small delay to allow sockets to fully disconnect
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      await harness.teardown();
    } catch {
      // Ignore Redis connection close errors during teardown
    }
  }, 60000);

  beforeEach(async () => {
    await harness.cleanDatabase();
    harness.mailService.clear();

    const agentUser = {
      email: 'chat_agent@test.com',
      password: 'Password123!',
      fullName: 'Chat Agent',
    };

    await request(harness.app.getHttpServer())
      .post('/auth/register')
      .send(agentUser);
    const email = harness.mailService.findEmailByType('CONFIRMATION');
    await request(harness.app.getHttpServer())
      .get('/auth/verify-email')
      .query({ token: email.token });
    const loginRes = await request(harness.app.getHttpServer())
      .post('/auth/login')
      .send({ email: agentUser.email, password: agentUser.password });
    agentToken = loginRes.body.accessToken;

    const projRes = await request(harness.app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        name: 'Chat Project',
        whitelistedDomains: ['localhost.com'],
      });
    projectId = projRes.body.id;

    await request(harness.app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ whitelistedDomains: ['localhost.com'] });
  });

  afterEach(() => {
    if (visitorSocket) {
      visitorSocket.disconnect();
      visitorSocket = null as any;
    }
    if (agentSocket) {
      agentSocket.disconnect();
      agentSocket = null as any;
    }
  });

  // Helper function to connect sockets and identify visitor
  const connectAndIdentify = async (visitorUid: string) => {
    visitorSocket = io(`http://localhost:${PORT}`, {
      query: { projectId: projectId.toString() },
      extraHeaders: { Origin: 'http://localhost.com' },
    });

    agentSocket = io(`http://localhost:${PORT}`, {
      auth: { token: agentToken },
    });

    await new Promise<void>((resolve, reject) => {
      let visitorConnected = false;
      let agentConnected = false;

      const checkAllConnected = () => {
        if (visitorConnected && agentConnected) {
          visitorSocket.emit('identify', { projectId, visitorUid });
          resolve();
        }
      };

      visitorSocket.on('connect', () => {
        visitorConnected = true;
        checkAllConnected();
      });

      agentSocket.on('connect', () => {
        agentSocket.emit('joinProjectRoom', { projectId });
        agentConnected = true;
        checkAllConnected();
      });

      setTimeout(
        () => reject(new Error('Sockets did not connect in time')),
        10000
      );
    });
    // Small delay for identify to process
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  it('should connect visitor and agent sockets and emit events on message send', (done) => {
    const visitorUid = uuidv4(); // Use uuidv4()

    // Track event emission
    const eventEmitter = harness.app.get(EventEmitter2);
    let eventEmitted = false;

    eventEmitter.on('visitor.message.received', () => {
      eventEmitted = true;
    });

    visitorSocket = io(`http://localhost:${PORT}`, {
      query: { projectId: projectId.toString() },
      extraHeaders: { Origin: 'http://localhost.com' },
    });

    agentSocket = io(`http://localhost:${PORT}`, {
      auth: { token: agentToken },
    });

    let visitorConnected = false;
    let agentConnected = false;

    const checkBothConnected = () => {
      if (visitorConnected && agentConnected) {
        // Both connected - visitor identifies and sends message
        visitorSocket.emit('identify', { projectId, visitorUid });

        // Small delay for identify to process
        setTimeout(() => {
          visitorSocket.emit('sendMessage', {
            content: 'Hello from Visitor',
            tempId: 'temp-1',
          });

          // Wait for event to be emitted
          setTimeout(() => {
            try {
              expect(eventEmitted).toBe(true);
              done();
            } catch (error) {
              done(error);
            }
          }, 500);
        }, 500);
      }
    };

    visitorSocket.on('connect', () => {
      visitorConnected = true;
      checkBothConnected();
    });

    agentSocket.on('connect', () => {
      agentSocket.emit('joinProjectRoom', { projectId });
      agentConnected = true;
      checkBothConnected();
    });

    // Timeout fallback
    setTimeout(() => {
      if (!visitorConnected || !agentConnected) {
        done(new Error('Sockets did not connect in time'));
      }
    }, 5000);
  }, 15000);

  it('should store sessionMetadata on first sendMessage', async () => {
    const visitorUid = uuidv4(); // Use uuidv4()
    const metadata: VisitorSessionMetadata = {
      referrer: 'https://external.com/refer',
      landingPage: 'http://localhost.com/lp',
      urlHistory: [
        {
          url: 'http://localhost.com/lp',
          title: 'Landing Page',
          timestamp: new Date().toISOString(),
        },
        {
          url: 'http://localhost.com/page1',
          title: 'Page 1',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await connectAndIdentify(visitorUid);

    visitorSocket.emit('sendMessage', {
      content: 'Hello with metadata',
      tempId: 'temp-meta-1',
      sessionMetadata: metadata, // Pass sessionMetadata
    });

    // Allow time for message to be processed by worker
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const conversationRepo = entityManager.getRepository(Conversation);
    const conversation = await conversationRepo.findOne({
      where: { visitor: { visitorUid } },
      relations: ['visitor'],
      select: ['id', 'metadata'], // Explicitly select metadata
    });

    expect(conversation).toBeDefined();
    expect(conversation?.metadata).toEqual(metadata);
    expect(conversation?.metadata?.referrer).toBe('https://external.com/refer');
  });

  it('should append URL to history and emit conversationUpdated on updateContext', async () => {
    const visitorUid = uuidv4(); // Use uuidv4()
    const initialMetadata: VisitorSessionMetadata = {
      referrer: 'https://initial.com',
      landingPage: 'http://localhost.com/initial',
      urlHistory: [
        {
          url: 'http://localhost.com/initial',
          title: 'Initial Page',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await connectAndIdentify(visitorUid);

    // 1. Send initial message to create conversation with metadata
    visitorSocket.emit('sendMessage', {
      content: 'First message',
      tempId: 'temp-initial',
      sessionMetadata: initialMetadata,
    });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 2. Listen for conversationUpdated event on agent socket
    let conversationUpdatedPayload: ConversationUpdatedPayload | null = null;
    agentSocket.on(
      WebSocketEvent.CONVERSATION_UPDATED,
      (payload: ConversationUpdatedPayload) => {
        conversationUpdatedPayload = payload;
      }
    );

    // 3. Emit updateContext
    const newUrl = 'http://localhost.com/new-page';
    const newTitle = 'New Page Title'; // Assuming frontend sends title in real implementation, but for E2E we'll check URL
    visitorSocket.emit('updateContext', {
      currentUrl: newUrl,
      currentTitle: newTitle,
    }); // Pass title for consistency
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 4. Verify DB update
    const conversationRepo = entityManager.getRepository(Conversation);
    const conversation = await conversationRepo.findOne({
      where: { visitor: { visitorUid } },
      relations: ['visitor'],
      select: ['id', 'metadata'], // Explicitly select metadata
    });

    expect(conversation).toBeDefined();
    expect(conversation?.metadata?.urlHistory).toHaveLength(2);
    expect(conversation?.metadata?.urlHistory[1].url).toBe(newUrl);

    // 5. Verify agent received conversationUpdated event
    expect(conversationUpdatedPayload).toBeDefined();
    if (conversationUpdatedPayload) {
      // Check for null before accessing fields
      const payload: ConversationUpdatedPayload = conversationUpdatedPayload; // Explicit cast
      expect(payload.conversationId).toBe(conversation?.id);
      expect(payload.fields).toHaveProperty('metadata');
      expect(payload.fields.metadata.urlHistory[1].url).toBe(newUrl);
    }
  });

  it('should respect MAX_URL_HISTORY_LENGTH on updateContext', async () => {
    const visitorUid = uuidv4(); // Use uuidv4()
    const initialHistory: NavigationEntry[] = []; // Explicitly type as NavigationEntry[]
    for (let i = 0; i < MAX_URL_HISTORY_LENGTH; i++) {
      initialHistory.push({
        url: `http://localhost.com/page-${i}`,
        title: `Page ${i}`,
        timestamp: new Date().toISOString(),
      });
    }
    const initialMetadata: VisitorSessionMetadata = {
      referrer: 'https://initial.com',
      landingPage: 'http://localhost.com/initial',
      urlHistory: initialHistory,
    };

    await connectAndIdentify(visitorUid);

    // 1. Send initial message to create conversation with pre-filled history
    visitorSocket.emit('sendMessage', {
      content: 'First message with full history',
      tempId: 'temp-full-history',
      sessionMetadata: initialMetadata,
    });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 2. Emit updateContext with a new URL
    const newUrl = 'http://localhost.com/new-page-over-limit';
    const newTitle = 'New Page Over Limit';
    visitorSocket.emit('updateContext', {
      currentUrl: newUrl,
      currentTitle: newTitle,
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 3. Verify DB update - history length should still be MAX_URL_HISTORY_LENGTH
    const conversationRepo = entityManager.getRepository(Conversation);
    const conversation = await conversationRepo.findOne({
      where: { visitor: { visitorUid } },
      relations: ['visitor'],
      select: ['id', 'metadata'], // Explicitly select metadata
    });

    expect(conversation).toBeDefined();
    expect(conversation?.metadata?.urlHistory).toHaveLength(
      MAX_URL_HISTORY_LENGTH
    );
    // The oldest entry should have been removed
    expect(conversation?.metadata?.urlHistory[0].url).toBe(
      'http://localhost.com/page-1'
    );
    // The new entry should be the last one
    expect(
      conversation?.metadata?.urlHistory[MAX_URL_HISTORY_LENGTH - 1].url
    ).toBe(newUrl);
  });
});
