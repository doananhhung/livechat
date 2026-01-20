import { TestHarness } from './utils/test-harness';
import request from 'supertest';
import {
  ProjectRole,
  ActionFieldType,
  ConversationStatus,
} from '@live-chat/shared-types';
import { Conversation } from '../src/inbox/entities/conversation.entity';
import { Visitor } from '../src/visitors/entities/visitor.entity';
import { EntityManager } from 'typeorm';

type SuperTestAgent = ReturnType<typeof request.agent>;

describe('Actions & Smart Forms (E2E)', () => {
  const harness = new TestHarness();
  let managerAgent: SuperTestAgent;
  let agentAgent: SuperTestAgent;
  let managerToken: string;
  let agentToken: string;
  let projectId: number;
  let conversationId: string;

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
    await setupEnvironment();
  });

  async function registerAndLogin(testAgent: SuperTestAgent, user: any) {
    await testAgent.post('/auth/register').send(user).expect(201);
    const email = harness.mailService.findEmailByType('CONFIRMATION');
    await testAgent
      .get('/auth/verify-email')
      .query({ token: email.token })
      .expect(200);
    const res = await testAgent
      .post('/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);
    return res.body.accessToken;
  }

  async function setupEnvironment() {
    const managerUser = {
      email: 'manager@actions.com',
      password: 'Password123!',
      fullName: 'Manager',
    };
    const agentUser = {
      email: 'agent@actions.com',
      password: 'Password123!',
      fullName: 'Agent',
    };

    // 1. Setup Users
    managerToken = await registerAndLogin(managerAgent, managerUser);
    agentToken = await registerAndLogin(agentAgent, agentUser);
    harness.mailService.clear();

    // 2. Manager Creates Project
    const createProjectRes = await managerAgent
      .post('/projects')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Action Project',
        whitelistedDomains: ['localhost.com'],
      })
      .expect(201);
    projectId = createProjectRes.body.id;

    // 3. Manager Invites Agent
    await managerAgent
      .post(`/projects/${projectId}/invitations`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        email: agentUser.email,
        role: ProjectRole.AGENT,
      })
      .expect(201);

    const inviteEmail = harness.mailService.findEmailByType('INVITATION');
    await agentAgent
      .post('/projects/invitations/accept')
      .set('Authorization', `Bearer ${agentToken}`)
      .query({ token: inviteEmail.token })
      .expect(201);

    // 4. Create a Conversation via DB (Bypass socket flow for speed)
    const entityManager = harness.app.get(EntityManager);

    // Need a visitor first
    const visitor = new Visitor();
    visitor.projectId = projectId;
    visitor.visitorUid = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
    await entityManager.save(Visitor, visitor);

    const conversation = new Conversation();
    conversation.projectId = projectId; // No BigInt needed for creation, number works with TypeORM usually, but entity says bigint
    conversation.visitorId = visitor.id;
    conversation.status = ConversationStatus.OPEN; // Fixed: was 'active'
    // conversation.channel = 'web'; // Removed: field does not exist
    await entityManager.save(Conversation, conversation);

    conversationId = conversation.id;
  }

  it('should allow Manager to create Action Template', async () => {
    const templateDto = {
      name: 'Refund Request',
      definition: {
        fields: [
          {
            key: 'orderId',
            label: 'Order ID',
            type: ActionFieldType.TEXT,
            required: true,
          },
          {
            key: 'amount',
            label: 'Amount',
            type: ActionFieldType.NUMBER,
            required: true,
          },
        ],
      },
    };

    const res = await managerAgent
      .post(`/projects/${projectId}/action-templates`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send(templateDto)
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Refund Request');
  });

  it('should forbid Agent from creating Action Template', async () => {
    const templateDto = {
      name: 'Hacked Template',
      definition: { fields: [] },
    };

    await agentAgent
      .post(`/projects/${projectId}/action-templates`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send(templateDto)
      .expect(403);
  });

  it('should allow Agent to list templates', async () => {
    // Manager creates one
    await managerAgent
      .post(`/projects/${projectId}/action-templates`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'T1', definition: { fields: [] } });

    const res = await agentAgent
      .get(`/projects/${projectId}/action-templates`)
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('T1');
  });

  it('should allow Agent to submit valid Action', async () => {
    // 1. Create Template
    const tplRes = await managerAgent
      .post(`/projects/${projectId}/action-templates`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Refund',
        definition: {
          fields: [
            {
              key: 'orderId',
              label: 'ID',
              type: ActionFieldType.TEXT,
              required: true,
            },
            {
              key: 'amount',
              label: 'Amt',
              type: ActionFieldType.NUMBER,
              required: true,
            },
          ],
        },
      });
    const templateId = tplRes.body.id;

    // 2. Submit Action
    const submissionDto = {
      templateId,
      data: { orderId: 'ORD-123', amount: 50.5 },
    };

    const res = await agentAgent
      .post(`/conversations/${conversationId}/actions`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send(submissionDto)
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('submitted');
  });

  it('should reject invalid Action submission', async () => {
    // 1. Create Template
    const tplRes = await managerAgent
      .post(`/projects/${projectId}/action-templates`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Strict',
        definition: {
          fields: [
            {
              key: 'age',
              label: 'Age',
              type: ActionFieldType.NUMBER,
              required: true,
            },
          ],
        },
      });
    const templateId = tplRes.body.id;

    // 2. Submit Invalid Data (String instead of Number)
    await agentAgent
      .post(`/conversations/${conversationId}/actions`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        templateId,
        data: { age: 'Thirty' },
      })
      .expect(400);

    // 3. Submit Missing Data
    await agentAgent
      .post(`/conversations/${conversationId}/actions`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        templateId,
        data: {},
      })
      .expect(400);

    // 4. Submit Extra Data (Strict Mode)
    await agentAgent
      .post(`/conversations/${conversationId}/actions`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        templateId,
        data: { age: 30, extra: 'Malicious' },
      })
      .expect(400);
  });

  it('should retrieve action history for conversation', async () => {
    // 1. Create Template
    const tplRes = await managerAgent
      .post(`/projects/${projectId}/action-templates`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Log', definition: { fields: [] } });
    const templateId = tplRes.body.id;

    // 2. Submit Action
    await agentAgent
      .post(`/conversations/${conversationId}/actions`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ templateId, data: {} });

    // 3. Get History
    const res = await agentAgent
      .get(`/conversations/${conversationId}/actions`)
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].templateId).toBe(templateId);
  });

  // ==================== FORM REQUEST E2E TESTS ====================

  it('should allow Agent to send form request to visitor', async () => {
    // 1. Create Template
    const tplRes = await managerAgent
      .post(`/projects/${projectId}/action-templates`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Customer Feedback',
        definition: {
          fields: [
            {
              key: 'rating',
              label: 'Rating',
              type: ActionFieldType.NUMBER,
              required: true,
            },
          ],
        },
      });
    const templateId = tplRes.body.id;

    // 2. Send Form Request
    const res = await agentAgent
      .post(`/conversations/${conversationId}/form-request`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ templateId })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.contentType).toBe('form_request');
    expect(res.body.metadata).toBeDefined();
    expect(res.body.metadata.templateId).toBe(templateId);
  });

  it('should reject form request without auth', async () => {
    await request(harness.app.getHttpServer())
      .post(`/conversations/${conversationId}/form-request`)
      .send({ templateId: 1 })
      .expect(401);
  });

  it('should reject form request with disabled template', async () => {
    // 1. Create Template
    const tplRes = await managerAgent
      .post(`/projects/${projectId}/action-templates`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Disabled Form',
        definition: { fields: [] },
      });
    const templateId = tplRes.body.id;

    // 2. Disable Template
    await managerAgent
      .patch(`/projects/${projectId}/action-templates/${templateId}/toggle`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    // 3. Attempt to send form request
    await agentAgent
      .post(`/conversations/${conversationId}/form-request`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ templateId })
      .expect(400);
  });

  // ==================== SUBMISSION MANAGEMENT E2E TESTS ====================

  it('should allow user to update their own submission', async () => {
    // 1. Create Template
    const tplRes = await managerAgent
      .post(`/projects/${projectId}/action-templates`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Updateable',
        definition: {
          fields: [
            {
              key: 'note',
              label: 'Note',
              type: ActionFieldType.TEXT,
              required: true,
            },
          ],
        },
      });
    const templateId = tplRes.body.id;

    // 2. Submit Action
    const subRes = await agentAgent
      .post(`/conversations/${conversationId}/actions`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ templateId, data: { note: 'Original' } })
      .expect(201);
    const submissionId = subRes.body.id;

    // 3. Update Submission
    const updateRes = await agentAgent
      .put(`/submissions/${submissionId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ data: { note: 'Updated' } })
      .expect(200);

    expect(updateRes.body.data.note).toBe('Updated');
  });

  it('should allow agent to delete submission', async () => {
    // 1. Create Template
    const tplRes = await managerAgent
      .post(`/projects/${projectId}/action-templates`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Deleteable',
        definition: { fields: [] },
      });
    const templateId = tplRes.body.id;

    // 2. Submit Action
    const subRes = await agentAgent
      .post(`/conversations/${conversationId}/actions`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ templateId, data: {} })
      .expect(201);
    const submissionId = subRes.body.id;

    // 3. Delete Submission
    await agentAgent
      .delete(`/submissions/${submissionId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(204);

    // 4. Verify deleted
    const history = await agentAgent
      .get(`/conversations/${conversationId}/actions`)
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    expect(history.body).toHaveLength(0);
  });
});
