
import { TestHarness } from './utils/test-harness';
import request from 'supertest';
import { io, Socket } from 'socket.io-client';

describe('Gateway Robustness & Security (E2E)', () => {
  const harness = new TestHarness();
  const PORT = 3002; // Use a different port to avoid conflicts

  let attackerToken: string;
  let victimToken: string;
  let victimProjectId: number;
  let attackerSocket: Socket;

  beforeAll(async () => {
    await harness.bootstrap();
    await harness.app.listen(PORT);
  });

  afterAll(async () => {
    if (attackerSocket) attackerSocket.disconnect();
    await harness.teardown();
  });

  beforeEach(async () => {
    await harness.cleanDatabase();

    // 1. Setup Victim (Owner of Project A)
    const victimUser = { email: 'victim@test.com', password: 'Password123!', fullName: 'Victim' };
    await request(harness.app.getHttpServer()).post('/auth/register').send(victimUser);
    const victimEmail = harness.mailService.findEmailByType('CONFIRMATION');
    await request(harness.app.getHttpServer()).get('/auth/verify-email').query({ token: victimEmail.token });
    const victimLogin = await request(harness.app.getHttpServer()).post('/auth/login').send({ email: victimUser.email, password: victimUser.password });
    victimToken = victimLogin.body.accessToken;

    const projRes = await request(harness.app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${victimToken}`)
      .send({ name: 'Victim Project' });
    victimProjectId = projRes.body.id;

    // 2. Setup Attacker (Not a member of Project A)
    const attackerUser = { email: 'attacker@test.com', password: 'Password123!', fullName: 'Attacker' };
    harness.mailService.clear();
    await request(harness.app.getHttpServer()).post('/auth/register').send(attackerUser);
    const attackerEmail = harness.mailService.findEmailByType('CONFIRMATION');
    await request(harness.app.getHttpServer()).get('/auth/verify-email').query({ token: attackerEmail.token });
    const attackerLogin = await request(harness.app.getHttpServer()).post('/auth/login').send({ email: attackerUser.email, password: attackerUser.password });
    attackerToken = attackerLogin.body.accessToken;
  });

  afterEach(() => {
    if (attackerSocket) {
      attackerSocket.disconnect();
      attackerSocket = null as any;
    }
  });

  it('should reject connection with invalid JWT', (done) => {
    let finished = false;
    const socket = io(`http://localhost:${PORT}`, {
      auth: { token: 'invalid-token-signature' },
      forceNew: true,
    });

    // Socket.io connects first, then server validates JWT in handleConnection.
    // If JWT is invalid, server calls client.disconnect(true) - causing disconnect event.
    socket.on('connect', () => {
      // Connection established - wait for server to validate and disconnect
      // If we're still connected after 2 seconds, the test fails
      setTimeout(() => {
        if (!finished && socket.connected) {
          finished = true;
          socket.close();
          done(new Error('Server should have disconnected the socket'));
        }
      }, 2000);
    });

    socket.on('connect_error', (err) => {
      if (!finished) {
        finished = true;
        expect(err).toBeDefined();
        socket.close();
        done();
      }
    });

    socket.on('disconnect', (reason) => {
      if (!finished) {
        finished = true;
        // Server kicked us out due to invalid JWT
        expect(reason).toBe('io server disconnect');
        done();
      }
    });
  });

  it('should prevent unauthorized users from joining a project room', (done) => {
    let finished = false;
    attackerSocket = io(`http://localhost:${PORT}`, {
      auth: { token: attackerToken },
      forceNew: true,
    });

    attackerSocket.on('connect', () => {
      // Attempt to join Victim's project room
      attackerSocket.emit('joinProjectRoom', { projectId: victimProjectId }, (response: any) => {
        // We expect an error response or exception
        if (!finished) {
          finished = true;
          expect(response).toBeDefined();
          expect(response.status).not.toBe('ok');
          done();
        }
      });
    });

    attackerSocket.on('exception', (error) => {
      if (!finished) {
        finished = true;
        expect(error.status).toBe('error');
        // Attacker is authenticated but not authorized for this project
        expect(error.message).toContain('Forbidden');
        done();
      }
    });
  });

  it('should reject malformed payloads via ValidationPipe', (done) => {
    let finished = false;
    attackerSocket = io(`http://localhost:${PORT}`, {
      auth: { token: attackerToken },
      forceNew: true,
    });

    attackerSocket.on('connect', () => {
      // Send malformed payload (missing projectId)
      attackerSocket.emit('joinProjectRoom', { wrongField: 123 });
    });

    attackerSocket.on('exception', (error) => {
      if (!finished) {
        finished = true;
        expect(error.status).toBe('error');
        expect(error.message).toBeDefined();
        // Validation errors or auth errors - both are acceptable failures
        done();
      }
    });
  });
});
