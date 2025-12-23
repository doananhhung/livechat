
import { TestHarness } from './utils/test-harness';
import request from 'supertest';
import { ProjectRole } from '@live-chat/shared-types';
import { Invitation, InvitationStatus } from '../src/database/entities';

type SuperTestAgent = ReturnType<typeof request.agent>;

describe('Project Invitation Lifecycle (E2E)', () => {
  const harness = new TestHarness();
  let managerAgent: SuperTestAgent;
  let inviteeAgent: SuperTestAgent;
  let intruderAgent: SuperTestAgent;

  let managerToken: string;
  let inviteeToken: string;
  let intruderToken: string;

  let managerUser: any;
  let inviteeUser: any;
  let intruderUser: any;

  beforeAll(async () => {
    await harness.bootstrap();
    managerAgent = request.agent(harness.app.getHttpServer());
    inviteeAgent = request.agent(harness.app.getHttpServer());
    intruderAgent = request.agent(harness.app.getHttpServer());
  });

  afterAll(async () => {
    await harness.teardown();
  });

  beforeEach(async () => {
    await harness.cleanDatabase();
    harness.mailService.clear();

    // Setup Users
    managerUser = { email: 'manager@test.com', password: 'Password123!', fullName: 'Manager' };
    inviteeUser = { email: 'invitee@test.com', password: 'Password123!', fullName: 'Invitee' };
    intruderUser = { email: 'intruder@test.com', password: 'Password123!', fullName: 'Intruder' };

    managerToken = await registerAndLogin(managerAgent, managerUser);
    inviteeToken = await registerAndLogin(inviteeAgent, inviteeUser);
    intruderToken = await registerAndLogin(intruderAgent, intruderUser);
  });

  async function registerAndLogin(agent: SuperTestAgent, user: any): Promise<string> {
    await agent.post('/auth/register').send(user).expect(201);
    const email = harness.mailService.findEmailByType('CONFIRMATION');
    await agent.get('/auth/verify-email').query({ token: email.token }).expect(200);
    harness.mailService.clear(); // Clear confirmation email
    const loginRes = await agent.post('/auth/login').send({ email: user.email, password: user.password }).expect(200);
    return loginRes.body.accessToken;
  }

  async function createProject(agent: SuperTestAgent, token: string, name: string) {
    const res = await agent
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name, whitelistedDomains: ['example.com'] })
      .expect(201);
    return res.body.id;
  }

  it('Happy Path: Manager invites -> Invitee fetches details -> Invitee accepts', async () => {
    // 1. Manager creates project
    const projectId = await createProject(managerAgent, managerToken, 'Alpha Project');

    // 2. Manager invites Invitee
    await managerAgent
      .post(`/projects/${projectId}/invitations`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        email: inviteeUser.email,
        role: ProjectRole.AGENT,
      })
      .expect(201);

    const inviteEmail = harness.mailService.findEmailByType('INVITATION');
    expect(inviteEmail).toBeDefined();
    const token = inviteEmail.token;

    // 3. Invitee fetches invitation details (Public Endpoint)
    const detailsRes = await inviteeAgent
      .get('/projects/invitations/details')
      .query({ token })
      .expect(200);

    expect(detailsRes.body.email).toBe(inviteeUser.email);
    expect(detailsRes.body.project.name).toBe('Alpha Project');
    expect(detailsRes.body.status).toBe(InvitationStatus.PENDING);

    // 4. Invitee accepts invitation
    await inviteeAgent
      .post('/projects/invitations/accept')
      .set('Authorization', `Bearer ${inviteeToken}`)
      .query({ token })
      .expect(201);

    // 5. Verify Membership
    const projectsRes = await inviteeAgent.get('/projects').set('Authorization', `Bearer ${inviteeToken}`).expect(200);
    const joinedProject = projectsRes.body.find((p: any) => p.id === projectId);
    expect(joinedProject).toBeDefined();
    expect(joinedProject.myRole).toBe(ProjectRole.AGENT);
  });

  it('Security: Email Mismatch - Intruder cannot accept invitation for another email', async () => {
    const projectId = await createProject(managerAgent, managerToken, 'Secure Project');

    // Manager invites Invitee
    await managerAgent
      .post(`/projects/${projectId}/invitations`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        email: inviteeUser.email,
        role: ProjectRole.AGENT,
      })
      .expect(201);

    const inviteEmail = harness.mailService.findEmailByType('INVITATION');
    const token = inviteEmail.token;

    // Intruder attempts to accept
    await intruderAgent
      .post('/projects/invitations/accept')
      .set('Authorization', `Bearer ${intruderToken}`)
      .query({ token })
      .expect(403); // Forbidden
  });

  it('Expiration: Cannot accept expired invitation', async () => {
    const projectId = await createProject(managerAgent, managerToken, 'Expired Project');

    // Manager invites Invitee
    await managerAgent
      .post(`/projects/${projectId}/invitations`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        email: inviteeUser.email,
        role: ProjectRole.AGENT,
      })
      .expect(201);

    const inviteEmail = harness.mailService.findEmailByType('INVITATION');
    const token = inviteEmail.token;

    // Manually expire the invitation in DB
    const invitationRepo = harness.dataSource.getRepository(Invitation);
    const invitation = await invitationRepo.findOneBy({ token });
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    invitation!.expiresAt = yesterday;
    await invitationRepo.save(invitation!);

    // Invitee attempts to accept
    await inviteeAgent
      .post('/projects/invitations/accept')
      .set('Authorization', `Bearer ${inviteeToken}`)
      .query({ token })
      .expect(400); // Bad Request: Expired
      
    // Verify status updated to EXPIRED
    const updatedInvitation = await invitationRepo.findOneBy({ token });
    expect(updatedInvitation!.status).toBe(InvitationStatus.EXPIRED);
  });

  it('Revocation: Manager cancels invitation -> Invitee cannot accept', async () => {
    const projectId = await createProject(managerAgent, managerToken, 'Revoked Project');

    // Manager invites Invitee
    await managerAgent
      .post(`/projects/${projectId}/invitations`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        email: inviteeUser.email,
        role: ProjectRole.AGENT,
      })
      .expect(201);

    const inviteEmail = harness.mailService.findEmailByType('INVITATION');
    const token = inviteEmail.token;

    // Get Invitation ID to cancel
    const invitationsRes = await managerAgent
      .get(`/projects/${projectId}/invitations`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);
    const invitationId = invitationsRes.body[0].id;

    // Manager cancels invitation
    await managerAgent
      .delete(`/projects/${projectId}/invitations/${invitationId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    // Invitee attempts to accept
    await inviteeAgent
      .post('/projects/invitations/accept')
      .set('Authorization', `Bearer ${inviteeToken}`)
      .query({ token })
      .expect(404); // Not Found (since it was deleted)
  });

  it('Double Acceptance: Cannot accept an already used token', async () => {
    const projectId = await createProject(managerAgent, managerToken, 'Replay Project');

    // Manager invites Invitee
    await managerAgent
      .post(`/projects/${projectId}/invitations`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        email: inviteeUser.email,
        role: ProjectRole.AGENT,
      })
      .expect(201);

    const inviteEmail = harness.mailService.findEmailByType('INVITATION');
    const token = inviteEmail.token;

    // First acceptance (Success)
    await inviteeAgent
      .post('/projects/invitations/accept')
      .set('Authorization', `Bearer ${inviteeToken}`)
      .query({ token })
      .expect(201);

    // Second acceptance (Fail)
    await inviteeAgent
      .post('/projects/invitations/accept')
      .set('Authorization', `Bearer ${inviteeToken}`)
      .query({ token })
      .expect(400); // Bad Request: Already used
  });
});
