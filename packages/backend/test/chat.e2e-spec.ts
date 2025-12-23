import { TestHarness } from './utils/test-harness';
import request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { EventEmitter2 } from '@nestjs/event-emitter';

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

  const PORT = 3001; 

  beforeAll(async () => {
    await harness.bootstrap();
    await harness.app.listen(PORT);
  }, 60000);

  afterAll(async () => {
    if (visitorSocket) visitorSocket.disconnect();
    if (agentSocket) agentSocket.disconnect();
    // Small delay to allow sockets to fully disconnect
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      await harness.teardown();
    } catch {
      // Ignore Redis connection close errors during teardown
    }
  }, 60000);

  beforeEach(async () => {
    await harness.cleanDatabase();
    harness.mailService.clear();

    const agentUser = { email: 'chat_agent@test.com', password: 'Password123!', fullName: 'Chat Agent' };
    
    await request(harness.app.getHttpServer()).post('/auth/register').send(agentUser);
    const email = harness.mailService.findEmailByType('CONFIRMATION');
    await request(harness.app.getHttpServer()).get('/auth/verify-email').query({ token: email.token });
    const loginRes = await request(harness.app.getHttpServer()).post('/auth/login').send({ email: agentUser.email, password: agentUser.password });
    agentToken = loginRes.body.accessToken;

    const projRes = await request(harness.app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ 
        name: 'Chat Project',
        whitelistedDomains: ['localhost.com']
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

  it('should connect visitor and agent sockets and emit events on message send', (done) => {
    const visitorUid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    
    // Track event emission
    const eventEmitter = harness.app.get(EventEmitter2);
    let eventEmitted = false;
    
    eventEmitter.on('visitor.message.received', () => {
      eventEmitted = true;
    });
    
    visitorSocket = io(`http://localhost:${PORT}`, {
      query: { projectId: projectId.toString() },
      extraHeaders: { Origin: 'http://localhost.com' }
    });

    agentSocket = io(`http://localhost:${PORT}`, {
      auth: { token: agentToken }
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
            tempId: 'temp-1'
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
});
