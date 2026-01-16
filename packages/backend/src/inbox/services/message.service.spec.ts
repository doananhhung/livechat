import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service';
import { EntityManager } from 'typeorm';
import { RealtimeSessionService } from '../../realtime-session/realtime-session.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { ProjectService } from '../../projects/project.service';
import { MessagePersistenceService } from './persistence/message.persistence.service';
import { ConversationService } from './conversation.service';
import { getQueueToken } from '@nestjs/bullmq';
import { User, Conversation, Message, Project, Visitor } from '../../database/entities';
import { MessageStatus } from '@live-chat/shared-types';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('MessageService', () => {
  let service: MessageService;
  let entityManager: EntityManager;
  let workflowQueue: any;
  let conversationService: ConversationService;

  const mockEntityManager = {
    transaction: jest.fn(),
    save: jest.fn(),
  };

  const mockRealtimeSessionService = {
    getVisitorSession: jest.fn(),
  };

  const mockEventsGateway = {
    server: {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    },
    sendReplyToVisitor: jest.fn(),
  };

  const mockProjectService = {
    validateProjectMembership: jest.fn(),
  };

  const mockMessagePersistenceService = {
    createMessage: jest.fn(),
  };

  const mockConversationService = {
    updateLastMessage: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: EntityManager, useValue: mockEntityManager },
        { provide: RealtimeSessionService, useValue: mockRealtimeSessionService },
        { provide: EventsGateway, useValue: mockEventsGateway },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: MessagePersistenceService, useValue: mockMessagePersistenceService },
        { provide: ConversationService, useValue: mockConversationService },
        { provide: getQueueToken('conversation-workflow-queue'), useValue: mockQueue },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
    entityManager = module.get<EntityManager>(EntityManager);
    workflowQueue = module.get(getQueueToken('conversation-workflow-queue'));
    conversationService = module.get<ConversationService>(ConversationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendAgentReply', () => {
    const user = { id: 1 } as unknown as User;
    const conversationId = '1';
    const replyText = 'Hello';
    const project = { id: 1, autoResolveMinutes: 10 } as unknown as Project;
    const conversation = {
      id: conversationId,
      projectId: 1,
      visitor: { visitorUid: 'v1' } as Visitor,
      project: project,
    } as Conversation;
    const savedMessage = {
      id: '100',
      recipientId: 'v1',
      createdAt: new Date(),
      status: MessageStatus.SENDING,
    } as Message;

    it('should schedule a job if autoResolveMinutes is > 0', async () => {
      mockEntityManager.transaction.mockImplementation(async (cb) => {
        const transactionalEntityManager = {
          findOne: jest.fn().mockResolvedValue(conversation),
          create: jest.fn(),
          save: jest.fn().mockResolvedValue(savedMessage),
        };
        return cb(transactionalEntityManager);
      });

      mockEntityManager.save.mockResolvedValue(savedMessage);

      await service.sendAgentReply(user, conversationId, replyText);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'auto-pending',
        {
          conversationId,
          projectId: project.id,
          triggerMessageId: savedMessage.id,
        },
        expect.objectContaining({
          delay: (project.autoResolveMinutes ?? 0) * 60 * 1000,
        })
      );
    });

    it('should NOT schedule a job if autoResolveMinutes is 0', async () => {
        const projectDisabled = { ...project, autoResolveMinutes: 0 };
        const conversationDisabled = { ...conversation, project: projectDisabled };

        mockEntityManager.transaction.mockImplementation(async (cb) => {
            const transactionalEntityManager = {
              findOne: jest.fn().mockResolvedValue(conversationDisabled),
              create: jest.fn(),
              save: jest.fn().mockResolvedValue(savedMessage),
            };
            return cb(transactionalEntityManager);
        });
        
        mockEntityManager.save.mockResolvedValue(savedMessage);

        await service.sendAgentReply(user, conversationId, replyText);

        expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should NOT schedule a job if autoResolveMinutes is null', async () => {
        const projectNull = { ...project, autoResolveMinutes: null };
        const conversationNull = { ...conversation, project: projectNull };

        mockEntityManager.transaction.mockImplementation(async (cb) => {
            const transactionalEntityManager = {
              findOne: jest.fn().mockResolvedValue(conversationNull),
              create: jest.fn(),
              save: jest.fn().mockResolvedValue(savedMessage),
            };
            return cb(transactionalEntityManager);
        });
        
        mockEntityManager.save.mockResolvedValue(savedMessage);

        await service.sendAgentReply(user, conversationId, replyText);

        expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });
});
