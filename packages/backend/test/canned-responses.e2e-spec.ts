import { TestHarness } from './utils/test-harness';
import request from 'supertest';
import { ProjectRole } from '@live-chat/shared-types';

describe('Canned Responses (E2E)', () => {
  const harness = new TestHarness();
  let agent: ReturnType<typeof request.agent>;
  let managerToken: string;
  let agentToken: string;
  let projectId: number;

  beforeAll(async () => {
    await harness.bootstrap();
    agent = request.agent(harness.app.getHttpServer());
  });

  afterAll(async () => {
    await harness.teardown();
  });

  beforeEach(async () => {
    await harness.cleanDatabase();

    // 1. Setup Manager
    const mgrRes = await agent.post('/auth/register').send({ email: 'mgr@canned.com', password: 'Password123!', fullName: 'Manager' });
    const mgrId = (await harness.dataSource.query(`SELECT id FROM users WHERE email = 'mgr@canned.com'`))[0].id;
    await harness.dataSource.query(`UPDATE users SET "is_email_verified" = true WHERE id = '${mgrId}'`);
    const mgrLogin = await agent.post('/auth/login').send({ email: 'mgr@canned.com', password: 'Password123!' });
    managerToken = mgrLogin.body.accessToken;

    // 2. Setup Project
    const projRes = await agent.post('/projects')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Canned Project', whitelistedDomains: ['localhost'] });
    projectId = projRes.body.id;

    // 3. Setup Agent
    const agtRes = await agent.post('/auth/register').send({ email: 'agt@canned.com', password: 'Password123!', fullName: 'Agent' });
    const agtId = (await harness.dataSource.query(`SELECT id FROM users WHERE email = 'agt@canned.com'`))[0].id;
    await harness.dataSource.query(`UPDATE users SET "is_email_verified" = true WHERE id = '${agtId}'`);
    const agtLogin = await agent.post('/auth/login').send({ email: 'agt@canned.com', password: 'Password123!' });
    agentToken = agtLogin.body.accessToken;

    // Add Agent to Project
    await harness.dataSource.query(`
      INSERT INTO project_members (project_id, user_id, role)
      VALUES (${projectId}, '${agtId}', '${ProjectRole.AGENT}')
    `);
  });

  describe('CRUD Operations', () => {
    it('should create a canned response as Manager', async () => {
      const res = await agent
        .post(`/projects/${projectId}/canned-responses`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ shortcut: 'hi', content: 'Hello there!' })
        .expect(201);
      
      expect(res.body.shortcut).toBe('hi');
      expect(res.body.content).toBe('Hello there!');
    });

    it('should prevent Agent from creating', async () => {
      await agent
        .post(`/projects/${projectId}/canned-responses`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ shortcut: 'hi', content: 'Hello' })
        .expect(403);
    });

    it('should list responses as Agent', async () => {
      // Seed one
      await agent
        .post(`/projects/${projectId}/canned-responses`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ shortcut: 'bye', content: 'Goodbye!' });

      const res = await agent
        .get(`/projects/${projectId}/canned-responses`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);
      
      expect(res.body).toHaveLength(1);
      expect(res.body[0].shortcut).toBe('bye');
    });

    it('should prevent Duplicate shortcuts', async () => {
      await agent
        .post(`/projects/${projectId}/canned-responses`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ shortcut: 'test', content: 'Test 1' })
        .expect(201);

      await agent
        .post(`/projects/${projectId}/canned-responses`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ shortcut: 'test', content: 'Test 2' })
        .expect(409);
    });

    it('should update a response', async () => {
      const createRes = await agent
        .post(`/projects/${projectId}/canned-responses`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ shortcut: 'old', content: 'Old content' });
      
      const id = createRes.body.id;

      await agent
        .patch(`/projects/${projectId}/canned-responses/${id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ content: 'New content' })
        .expect(200);
      
      const getRes = await agent
        .get(`/projects/${projectId}/canned-responses`)
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(getRes.body[0].content).toBe('New content');
    });

    it('should delete a response', async () => {
      const createRes = await agent
        .post(`/projects/${projectId}/canned-responses`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ shortcut: 'del', content: 'Delete me' });
      
      const id = createRes.body.id;

      await agent
        .delete(`/projects/${projectId}/canned-responses/${id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
      
      const getRes = await agent
        .get(`/projects/${projectId}/canned-responses`)
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(getRes.body).toHaveLength(0);
    });
  });
});
