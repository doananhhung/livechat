import { TestHarness } from './utils/test-harness';
import request from 'supertest';
import { ProjectRole } from '@live-chat/shared-types';

type SuperTestAgent = ReturnType<typeof request.agent>;

describe('Project Management & RBAC (E2E)', () => {
  const harness = new TestHarness();
  let managerAgent: SuperTestAgent;
  let agentAgent: SuperTestAgent;

  beforeAll(async () => {
    await harness.bootstrap();
    managerAgent = request.agent(harness.app.getHttpServer());
    agentAgent = request.agent(harness.app.getHttpServer());
  });

  afterAll(async () => {
    await harness.teardown();
  });

  beforeEach(async () => {
    await harness.cleanDatabase();
    harness.mailService.clear();
  });

  async function registerAndLogin(testAgent: SuperTestAgent, user: any) {
    await testAgent.post('/auth/register').send(user).expect(201);
    const email = harness.mailService.findEmailByType('CONFIRMATION');
    await testAgent.get('/auth/verify-email').query({ token: email.token }).expect(200);
    const res = await testAgent.post('/auth/login').send({ email: user.email, password: user.password }).expect(200);
    return res.body.accessToken;
  }

  it('should enforce RBAC: Manager creates project, invites Agent, Agent accepts but cannot update settings', async () => {
    const managerUser = { email: 'manager@test.com', password: 'Password123!', fullName: 'Manager' };
    const agentUser = { email: 'agent@test.com', password: 'Password123!', fullName: 'Agent' };

    // 1. Setup Users
    const managerToken = await registerAndLogin(managerAgent, managerUser);
    const agentToken = await registerAndLogin(agentAgent, agentUser);
    harness.mailService.clear();

    // 2. Manager Creates Project
    const createProjectRes = await managerAgent
      .post('/projects')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ 
        name: 'Test Project',
        whitelistedDomains: ['localhost.com']
      })
      .expect(201);

    const projectId = createProjectRes.body.id;

    // 3. Manager Invites Agent
    await managerAgent
      .post(`/projects/${projectId}/invitations`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        email: agentUser.email,
        role: ProjectRole.AGENT
      })
      .expect(201);

    const inviteEmail = harness.mailService.findEmailByType('INVITATION');
    expect(inviteEmail).toBeDefined();
    expect(inviteEmail.to).toBe(agentUser.email);

    // 4. Agent Accepts Invitation
    await agentAgent
      .post('/projects/invitations/accept')
      .set('Authorization', `Bearer ${agentToken}`)
      .query({ token: inviteEmail.token })
      .expect(201);

    // 5. Verify Permission Boundaries
    
    // Agent attempts to update Widget Settings (Manager only)
    await agentAgent
      .patch(`/projects/${projectId}/widget-settings`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ color: '#000000' })
      .expect(403);

    // Manager attempts to update Widget Settings (Allowed)
    await managerAgent
      .patch(`/projects/${projectId}/widget-settings`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ color: '#FFFFFF' })
      .expect(200);

    // Agent attempts to view members (Manager only)
    await agentAgent
      .get(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(403);

    // Manager views members
    const membersRes = await managerAgent
      .get(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);
    
    expect(membersRes.body).toHaveLength(2);
  });
});
