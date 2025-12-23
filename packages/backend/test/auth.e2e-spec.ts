import { TestHarness } from './utils/test-harness';
import request from 'supertest';
import * as otplib from 'otplib';

describe('Authentication System (E2E)', () => {
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
    email: 'test@example.com',
    password: 'Password123!',
    fullName: 'Test User',
  };

  it('should handle the full identity lifecycle: Register -> Verify -> Login -> 2FA -> Logout', async () => {
    // 1. Registration
    await agent
      .post('/auth/register')
      .send(userData)
      .expect(201);

    const confirmationEmail = harness.mailService.findEmailByType('CONFIRMATION');
    expect(confirmationEmail).toBeDefined();
    const verificationToken = confirmationEmail.token;

    // 2. Email Verification
    await agent
      .get('/auth/verify-email')
      .query({ token: verificationToken })
      .expect(200);

    // 3. Login (Local)
    const loginResponse = await agent
      .post('/auth/login')
      .send({ email: userData.email, password: userData.password })
      .expect(200);

    expect(loginResponse.body.accessToken).toBeDefined();
    expect(loginResponse.body.user.email).toBe(userData.email);
    
    // Verify Refresh Token Cookie
    const cookies = loginResponse.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    expect(cookieArray.some((c: string) => c.includes('refresh_token'))).toBeTruthy();

    const accessToken = loginResponse.body.accessToken;

    // 4. 2FA Setup
    // Generate Secret
    const generateResponse = await agent
      .post('/2fa/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const otpAuthUrl = generateResponse.body.otpAuthUrl;
    const secretMatch = otpAuthUrl.match(/secret=([A-Z0-9]+)/);
    const secret = secretMatch[1];

    const token = otplib.authenticator.generate(secret);

    // Turn On 2FA
    const turnOnResponse = await agent
      .post('/2fa/turn-on')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: token })
      .expect(200);

    expect(turnOnResponse.body.recoveryCodes).toHaveLength(10);

    // 5. 2FA Login Flow
    // Logout first
    await agent.post('/auth/logout').set('Authorization', `Bearer ${accessToken}`).expect(200);

    // Login again - should require 2FA
    const login2faResponse = await agent
      .post('/auth/login')
      .send({ email: userData.email, password: userData.password })
      .expect(401);

    expect(login2faResponse.body.message).toBe('2FA required');
    
    // Extract partial token cookie
    const partialCookies = login2faResponse.headers['set-cookie'];
    const partialCookieArray = Array.isArray(partialCookies) ? partialCookies : [partialCookies];
    expect(partialCookieArray.some((c: string) => c.includes('2fa_partial_token'))).toBeTruthy();

    // Authenticate with 2FA
    const newToken = otplib.authenticator.generate(secret);
    const auth2faResponse = await agent
      .post('/2fa/authenticate')
      .send({ code: newToken })
      .expect(200);

    expect(auth2faResponse.body.accessToken).toBeDefined();

    // 6. Session Management (Refresh Token)
    // Wait 1.1s to ensure new token has different iat (issued-at) timestamp
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const refreshResponse = await agent
      .get('/auth/refresh')
      .expect(200);

    expect(refreshResponse.body.accessToken).toBeDefined();
    expect(refreshResponse.body.accessToken).not.toBe(auth2faResponse.body.accessToken);
  });
});
