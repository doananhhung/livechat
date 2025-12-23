
import { TestHarness } from './utils/test-harness';
import request from 'supertest';
import * as otplib from 'otplib';

describe('2FA Recovery System (E2E)', () => {
  const harness = new TestHarness();
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    await harness.bootstrap();
    agent = request.agent(harness.app.getHttpServer());
  });

  afterAll(async () => {
    await harness.teardown();
  });

  beforeEach(async () => {
    await harness.cleanDatabase();
    harness.mailService.clear();
  });

  const userData = {
    email: 'recovery-test@example.com',
    password: 'Password123!',
    fullName: 'Recovery User',
  };

  it('should allow login via recovery code and burn the code upon use', async () => {
    // 1. Register & Verify
    await agent.post('/auth/register').send(userData).expect(201);
    const verificationToken = harness.mailService.findEmailByType('CONFIRMATION').token;
    await agent.get('/auth/verify-email').query({ token: verificationToken }).expect(200);

    // 2. Login & Setup 2FA
    const loginRes = await agent.post('/auth/login').send({ email: userData.email, password: userData.password }).expect(200);
    const accessToken = loginRes.body.accessToken;

    // Generate Secret
    const genRes = await agent.post('/2fa/generate').set('Authorization', `Bearer ${accessToken}`).expect(201);
    const otpAuthUrl = genRes.body.otpAuthUrl;
    const secretMatch = otpAuthUrl.match(/secret=([A-Z0-9]+)/);
    const secret = secretMatch[1];
    const token = otplib.authenticator.generate(secret);

    // Turn On 2FA & Capture Recovery Codes
    const turnOnRes = await agent
      .post('/2fa/turn-on')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: token })
      .expect(200);

    const recoveryCodes: string[] = turnOnRes.body.recoveryCodes;
    expect(recoveryCodes).toHaveLength(10);
    const codeToUse = recoveryCodes[0];

    // 3. Logout
    await agent.post('/auth/logout').set('Authorization', `Bearer ${accessToken}`).expect(200);

    // 4. Login (Partial)
    const partialLoginRes = await agent
      .post('/auth/login')
      .send({ email: userData.email, password: userData.password })
      .expect(401);
    
    expect(partialLoginRes.body.message).toBe('2FA required');
    // Ensure partial token cookie is set
    const cookies = partialLoginRes.headers['set-cookie'];
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    expect(cookieArray.some((c: string) => c.includes('2fa_partial_token'))).toBeTruthy();

    // 5. Recover with Backup Code
    const recoverRes = await agent
      .post('/2fa/recover')
      .send({ code: codeToUse })
      .expect(200);

    expect(recoverRes.body.accessToken).toBeDefined();
    expect(recoverRes.body.user.email).toBe(userData.email);

    // 6. Verify Burn-on-Use (Replay Attack Prevention)
    // Logout again
    await agent.post('/auth/logout').set('Authorization', `Bearer ${recoverRes.body.accessToken}`).expect(200);

    // Login (Partial) again
    await agent
      .post('/auth/login')
      .send({ email: userData.email, password: userData.password })
      .expect(401);

    // Attempt to use the SAME code again
    await agent
      .post('/2fa/recover')
      .send({ code: codeToUse })
      .expect(401); // Should fail now
  });
});
