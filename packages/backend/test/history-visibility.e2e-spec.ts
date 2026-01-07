
import { TestHarness } from './utils/test-harness';
import { EventConsumerService } from '../src/event-consumer/event-consumer.service';
import { WorkerEventTypes, ConversationStatus, HistoryVisibilityMode } from '@live-chat/shared-types';
import { Project, Visitor, Conversation } from '../src/database/entities';
import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

describe('History Visibility (E2E)', () => {
  const harness = new TestHarness();
  let eventConsumerService: EventConsumerService;
  let entityManager: EntityManager;

  beforeAll(async () => {
    // We bootstrap the worker app directly to test the consumer logic
    await harness.bootstrapWorker();
    eventConsumerService = harness.workerApp.get(EventConsumerService);
    // harness.dataSource might be from the main app, but workerApp has its own TypeORM connection
    // We need to get the DataSource or EntityManager from the workerApp
    entityManager = harness.workerApp.get(EntityManager);
  }, 60000);

  afterAll(async () => {
    await harness.teardown();
  });

  beforeEach(async () => {
    // We need a clean DB. harness.cleanDatabase uses harness.dataSource.
    // If harness.bootstrapWorker() sets harness.dataSource (it doesn't seem to in the code I read),
    // we might need to manually clean or set harness.dataSource.
    // Looking at TestHarness code, bootstrapWorker doesn't set harness.dataSource.
    // So we'll manually clean using the worker's entity manager.
    
    const tables = ['outbox_events', 'messages', 'conversations', 'visitors', 'project_members', 'projects', 'users'];
    for (const table of tables) {
      await entityManager.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
    }
  });

  const createProject = async (mode: HistoryVisibilityMode) => {
    const project = new Project();
    project.name = 'Test Project';
    project.widgetSettings = { historyVisibility: mode };
    return await entityManager.save(project);
  };

  const createVisitor = async (project: Project, uid: string) => {
    const visitor = new Visitor();
    visitor.project = project;
    visitor.visitorUid = uid;
    return await entityManager.save(visitor);
  };

  const createConversation = async (project: Project, visitor: Visitor, status: ConversationStatus) => {
    const conversation = new Conversation();
    conversation.project = project;
    conversation.visitor = visitor;
    conversation.status = status;
    return await entityManager.save(conversation);
  };

  it('FOREVER mode: should re-open SOLVED conversation', async () => {
    const project = await createProject('forever');
    const visitorUid = uuidv4();
    const visitor = await createVisitor(project, visitorUid);
    const oldConversation = await createConversation(project, visitor, ConversationStatus.SOLVED);

    const payload = {
      tempId: 'temp-1',
      content: 'Hello again',
      visitorUid,
      projectId: project.id,
      socketId: 'socket-1',
    };

    await eventConsumerService.processEvent({
      type: WorkerEventTypes.NEW_MESSAGE_FROM_VISITOR,
      payload,
    });

    // Verify
    const updatedConversation = await entityManager.findOne(Conversation, { where: { id: oldConversation.id } });
    expect(updatedConversation).toBeDefined();
    expect(updatedConversation?.status).toBe(ConversationStatus.OPEN);
    
    const count = await entityManager.count(Conversation, { where: { visitor: { id: visitor.id } } });
    expect(count).toBe(1); // Should still be 1 conversation
  });

  it('LIMIT_TO_ACTIVE mode: should create NEW conversation if previous is SOLVED', async () => {
    const project = await createProject('limit_to_active');
    const visitorUid = uuidv4();
    const visitor = await createVisitor(project, visitorUid);
    const oldConversation = await createConversation(project, visitor, ConversationStatus.SOLVED);

    const payload = {
      tempId: 'temp-2',
      content: 'New issue',
      visitorUid,
      projectId: project.id,
      socketId: 'socket-2',
    };

    await eventConsumerService.processEvent({
      type: WorkerEventTypes.NEW_MESSAGE_FROM_VISITOR,
      payload,
    });

    // Verify old conversation is untouched
    const checkOld = await entityManager.findOne(Conversation, { where: { id: oldConversation.id } });
    expect(checkOld?.status).toBe(ConversationStatus.SOLVED);

    // Verify new conversation created
    const conversations = await entityManager.find(Conversation, { 
      where: { visitor: { id: visitor.id } },
      order: { createdAt: 'DESC' } 
    });
    
    expect(conversations).toHaveLength(2);
    expect(conversations[0].status).toBe(ConversationStatus.OPEN);
    expect(conversations[0].id).not.toBe(oldConversation.id);
  });

  it('LIMIT_TO_ACTIVE mode: should reuse ACTIVE conversation', async () => {
    const project = await createProject('limit_to_active');
    const visitorUid = uuidv4();
    const visitor = await createVisitor(project, visitorUid);
    const activeConversation = await createConversation(project, visitor, ConversationStatus.OPEN);

    const payload = {
      tempId: 'temp-3',
      content: 'Still here',
      visitorUid,
      projectId: project.id,
      socketId: 'socket-3',
    };

    await eventConsumerService.processEvent({
      type: WorkerEventTypes.NEW_MESSAGE_FROM_VISITOR,
      payload,
    });

    const conversations = await entityManager.find(Conversation, { where: { visitor: { id: visitor.id } } });
    expect(conversations).toHaveLength(1);
    expect(conversations[0].id).toBe(activeConversation.id);
  });
});
