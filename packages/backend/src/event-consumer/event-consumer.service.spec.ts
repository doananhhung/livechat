import { Test, TestingModule } from '@nestjs/testing';
import { EventConsumerService } from './event-consumer.service';
import { EntityManager } from 'typeorm';
import { Message, Visitor, Project } from '../database/entities';
import {
  MessageStatus,
  WorkerEventTypes,
  WorkerEvent,
  NewMessageFromVisitorPayload,
} from '@live-chat/shared-types';
import { VisitorPersistenceService } from '../inbox/services/persistence/visitor.persistence.service';
import { ConversationPersistenceService } from '../inbox/services/persistence/conversation.persistence.service';
import { MessagePersistenceService } from '../inbox/services/persistence/message.persistence.service';
import { OutboxPersistenceService } from './outbox.persistence.service';

describe('EventConsumerService', () => {
  let service: EventConsumerService;
  let visitorPersistenceService: jest.Mocked<VisitorPersistenceService>;
  let conversationPersistenceService: jest.Mocked<ConversationPersistenceService>;
  let messagePersistenceService: jest.Mocked<MessagePersistenceService>;
  let outboxPersistenceService: jest.Mocked<OutboxPersistenceService>;
  let entityManager: jest.Mocked<EntityManager>;

  const mockProjectRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const mockEntityManager = {
      transaction: jest.fn().mockImplementation((cb) => cb(mockEntityManager)),
      query: jest.fn(),
      getRepository: jest.fn().mockReturnValue(mockProjectRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventConsumerService,
        {
          provide: VisitorPersistenceService,
          useValue: {
            findOrCreateByUid: jest.fn(),
          },
        },
        {
          provide: ConversationPersistenceService,
          useValue: {
            findOrCreateByVisitorId: jest.fn(),
            updateLastMessage: jest.fn(),
          },
        },
        {
          provide: MessagePersistenceService,
          useValue: {
            createMessage: jest.fn(),
          },
        },
        {
          provide: OutboxPersistenceService,
          useValue: {
            createEvent: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<EventConsumerService>(EventConsumerService);
    visitorPersistenceService = module.get(VisitorPersistenceService);
    conversationPersistenceService = module.get(ConversationPersistenceService);
    messagePersistenceService = module.get(MessagePersistenceService);
    outboxPersistenceService = module.get(OutboxPersistenceService);
    entityManager = module.get(EntityManager);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processEvent', () => {
    it('should handle NEW_MESSAGE_FROM_VISITOR event', async () => {
      const handleNewMessageSpy = jest
        .spyOn(service as any, 'handleNewMessageFromVisitor')
        .mockResolvedValue(undefined);

      const event: WorkerEvent<NewMessageFromVisitorPayload> = {
        type: WorkerEventTypes.NEW_MESSAGE_FROM_VISITOR,
        payload: {
          tempId: 'temp-1',
          content: 'Hello',
          visitorUid: 'visitor-123',
          projectId: 1,
          socketId: 'socket-abc',
        },
      };

      await service.processEvent(event);

      expect(handleNewMessageSpy).toHaveBeenCalledWith(event.payload);
    });

    it('should log warning for unhandled event type', async () => {
      // Cast to WorkerEvent to test unhandled type scenario
      const event = {
        type: 'UNKNOWN_TYPE',
        payload: {},
      } as unknown as WorkerEvent;

      await expect(service.processEvent(event)).resolves.not.toThrow();
    });
  });

  describe('handleNewMessageFromVisitor', () => {
    it('should create entities and insert outbox event', async () => {
      const payload: NewMessageFromVisitorPayload = {
        tempId: 'temp-1',
        content: 'Hello',
        visitorUid: 'visitor-123',
        projectId: 1,
        socketId: 'socket-abc',
      };

      const visitor = new Visitor();
      visitor.id = 1;
      visitor.visitorUid = 'visitor-123';

      const conversation = { id: 100 };
      const savedMessage = { id: 'msg-1' } as Message;

      visitorPersistenceService.findOrCreateByUid.mockResolvedValue(visitor);
      conversationPersistenceService.findOrCreateByVisitorId.mockResolvedValue(
        conversation as any
      );
      messagePersistenceService.createMessage.mockResolvedValue(savedMessage);
      outboxPersistenceService.createEvent.mockResolvedValue({} as any);
      
      // Mock project settings finding
      mockProjectRepo.findOne.mockResolvedValue({
        id: 1,
        widgetSettings: { historyVisibility: 'limit_to_active' }
      });

      // Call private method via casting
      await (service as any).handleNewMessageFromVisitor(payload);

      expect(visitorPersistenceService.findOrCreateByUid).toHaveBeenCalledWith(
        payload.projectId,
        payload.visitorUid,
        expect.anything()
      );
      
      // Verify fetching project settings
      expect(entityManager.getRepository).toHaveBeenCalledWith(Project);
      expect(mockProjectRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: payload.projectId } }));

      expect(
        conversationPersistenceService.findOrCreateByVisitorId
      ).toHaveBeenCalledWith(payload.projectId, visitor.id, expect.anything(), 'limit_to_active');
      
      expect(messagePersistenceService.createMessage).toHaveBeenCalledWith(
        payload.tempId,
        payload.visitorUid,
        expect.objectContaining({
          conversationId: conversation.id,
          content: payload.content,
          senderId: visitor.visitorUid,
          status: MessageStatus.SENT,
        }),
        expect.anything()
      );
      expect(
        conversationPersistenceService.updateLastMessage
      ).toHaveBeenCalled();

      // Verify outbox persistence service was called
      expect(outboxPersistenceService.createEvent).toHaveBeenCalledWith(
        'message',
        savedMessage.id,
        WorkerEventTypes.NEW_MESSAGE_FROM_VISITOR,
        expect.objectContaining({
          message: savedMessage,
          tempId: payload.tempId,
          visitorUid: payload.visitorUid,
        }),
        expect.anything()
      );
    });
  });
});
