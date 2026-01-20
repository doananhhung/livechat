import { TestHarness } from './utils/test-harness';
import request from 'supertest';
import { ConversationStatus } from '@live-chat/shared-types';
import { Conversation } from '../src/inbox/entities/conversation.entity';
import { ProjectRole } from '@live-chat/shared-types';
import { randomUUID } from 'crypto';

describe('Assignments Engine (E2E)', () => {
  const harness = new TestHarness();
  let agent: ReturnType<typeof request.agent>;
  let managerToken: string;
  let managerId: string;
  let memberToken: string;
  let memberId: string;
  let strangerToken: string;
  let projectId: number;
  let conversationId: string;

  beforeAll(async () => {
    await harness.bootstrap();
    agent = request.agent(harness.app.getHttpServer());
  });

  afterAll(async () => {
    await harness.teardown();
  });

  beforeEach(async () => {
    await harness.cleanDatabase();

    // 1. Setup Users
    // Manager
    const managerRes = await agent.post('/auth/register').send({
      email: 'manager@example.com',
      password: 'Password123!',
      fullName: 'Manager',
    });
    managerId = (
      await harness.dataSource.query(
        `SELECT id FROM users WHERE email = 'manager@example.com'`
      )
    )[0].id;
    // Verify & Login Manager
    const mgrEmail = harness.mailService.findEmailByType('CONFIRMATION');
    await agent.get('/auth/verify-email').query({ token: mgrEmail.token });
    const mgrLogin = await agent
      .post('/auth/login')
      .send({ email: 'manager@example.com', password: 'Password123!' });
    managerToken = mgrLogin.body.accessToken;

    // Member
    await agent.post('/auth/register').send({
      email: 'member@example.com',
      password: 'Password123!',
      fullName: 'Member',
    });
    memberId = (
      await harness.dataSource.query(
        `SELECT id FROM users WHERE email = 'member@example.com'`
      )
    )[0].id;
    const memEmail = harness.mailService.findEmailByType('CONFIRMATION'); // Note: logic might pick last one
    // A cleaner way is to mock verify or just use SQL update for verify
    await harness.dataSource.query(
      `UPDATE users SET "is_email_verified" = true WHERE id = '${memberId}'`
    );
    const memLogin = await agent
      .post('/auth/login')
      .send({ email: 'member@example.com', password: 'Password123!' });
    memberToken = memLogin.body.accessToken;

    // Stranger
    await agent.post('/auth/register').send({
      email: 'stranger@example.com',
      password: 'Password123!',
      fullName: 'Stranger',
    });
    const strId = (
      await harness.dataSource.query(
        `SELECT id FROM users WHERE email = 'stranger@example.com'`
      )
    )[0].id;
    await harness.dataSource.query(
      `UPDATE users SET "is_email_verified" = true WHERE id = '${strId}'`
    );
    const strLogin = await agent
      .post('/auth/login')
      .send({ email: 'stranger@example.com', password: 'Password123!' });
    strangerToken = strLogin.body.accessToken;

    // 2. Setup Project
    const projRes = await agent
      .post('/projects')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Test Project', whitelistedDomains: ['localhost'] }) // Add whitelist to pass validation
      .expect(201);

    projectId = projRes.body.id;
    expect(projectId).toBeDefined();

    // 3. Add Member to Project
    await harness.dataSource.query(`
      INSERT INTO project_members (project_id, user_id, role)
      VALUES (${projectId}, '${memberId}', '${ProjectRole.AGENT}')
    `);

    // 4. Create Conversation (Simulate Visitor)
    // Create Visitor
    const visitorRes = await harness.dataSource.query(`
      INSERT INTO visitors (project_id, visitor_uid)
      VALUES (${projectId}, '${randomUUID()}')
      RETURNING id
    `);
    const visitorId = visitorRes[0].id;

    // Create Conversation
    const convRes = await harness.dataSource.query(`
      INSERT INTO conversations (project_id, visitor_id, status, unread_count)
      VALUES (${projectId}, ${visitorId}, '${ConversationStatus.OPEN}', 0)
      RETURNING id
    `);
    conversationId = convRes[0].id;
  });

  describe('POST /projects/:projectId/inbox/conversations/:id/assignments', () => {
    it('should assign conversation to self (Manager)', async () => {
      await agent
        .post(
          `/projects/${projectId}/inbox/conversations/${conversationId}/assignments`
        )
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ assigneeId: managerId })
        .expect(200);

      const conv = await harness.dataSource
        .getRepository(Conversation)
        .findOne({ where: { id: conversationId }, relations: ['assignee'] });
      expect(conv!.assigneeId).toBe(managerId);
      expect(conv!.assignedAt).toBeDefined();
    });

    it('should assign conversation to another member', async () => {
      await agent
        .post(
          `/projects/${projectId}/inbox/conversations/${conversationId}/assignments`
        )
        .set('Authorization', `Bearer ${managerToken}`) // Manager assigns to Member
        .send({ assigneeId: memberId })
        .expect(200);

      const conv = await harness.dataSource
        .getRepository(Conversation)
        .findOne({ where: { id: conversationId } });
      expect(conv!.assigneeId).toBe(memberId);
    });

    it('should allow member to claim conversation', async () => {
      await agent
        .post(
          `/projects/${projectId}/inbox/conversations/${conversationId}/assignments`
        )
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ assigneeId: memberId }) // Member assigns to Self
        .expect(200);

      const conv = await harness.dataSource
        .getRepository(Conversation)
        .findOne({ where: { id: conversationId } });
      expect(conv!.assigneeId).toBe(memberId);
    });

    it('should overwrite existing assignment', async () => {
      // First assign to Manager
      await agent
        .post(`/conversations/${conversationId}/assignments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ assigneeId: managerId });

      // Then re-assign to Member
      await agent
        .post(
          `/projects/${projectId}/inbox/conversations/${conversationId}/assignments`
        )
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ assigneeId: memberId })
        .expect(200);

      const conv = await harness.dataSource
        .getRepository(Conversation)
        .findOne({ where: { id: conversationId } });
      expect(conv!.assigneeId).toBe(memberId);
    });

    it('should fail if assignee is NOT in project', async () => {
      // Stranger is not in project
      const strangerId = (
        await harness.dataSource.query(
          `SELECT id FROM users WHERE email = 'stranger@example.com'`
        )
      )[0].id;

      await agent
        .post(
          `/projects/${projectId}/inbox/conversations/${conversationId}/assignments`
        )
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ assigneeId: strangerId })
        .expect(403); // Or 400? The service throws Forbidden if user not in project.
      // ProjectService.validateProjectMembership throws ForbiddenException usually.
    });

    it('should fail if actor is NOT in project', async () => {
      await agent
        .post(
          `/projects/${projectId}/inbox/conversations/${conversationId}/assignments`
        )
        .set('Authorization', `Bearer ${strangerToken}`) // Stranger tries to assign
        .send({ assigneeId: managerId })
        .expect(403);
    });

    it('should return 404 if conversation does not exist', async () => {
      await agent
        .post(`/projects/${projectId}/inbox/conversations/999999/assignments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ assigneeId: managerId })
        .expect(404);
    });

    it('should return 400 if assigneeId is invalid UUID', async () => {
      await agent
        .post(
          `/projects/${projectId}/inbox/conversations/${conversationId}/assignments`
        )
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ assigneeId: 'not-a-uuid' })
        .expect(400);
    });
  });

  describe('DELETE /projects/:projectId/inbox/conversations/:id/assignments', () => {
    it('should unassign conversation', async () => {
      // Setup: Assign first
      await harness.dataSource.query(
        `UPDATE conversations SET assignee_id = '${managerId}', assigned_at = NOW() WHERE id = ${conversationId}`
      );

      await agent
        .delete(
          `/projects/${projectId}/inbox/conversations/${conversationId}/assignments`
        )
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      const conv = await harness.dataSource
        .getRepository(Conversation)
        .findOne({ where: { id: conversationId } });
      expect(conv!.assigneeId).toBeNull();
      expect(conv!.assignedAt).toBeNull();
    });

    it('should succeed even if already unassigned', async () => {
      await agent
        .delete(
          `/projects/${projectId}/inbox/conversations/${conversationId}/assignments`
        )
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });
  });
});
