
import { Test, TestingModule } from '@nestjs/testing';
import { EventConsumerService } from './event-consumer.service';
import { ConversationService } from '../inbox/services/conversation.service';
import { VisitorService } from '../inbox/services/visitor.service';
import { MessageService } from '../inbox/services/message.service';
import { EntityManager } from 'typeorm';
import { REDIS_PUBLISHER_CLIENT } from '../redis/redis.module';
import { ConfigService } from '@nestjs/config';
import { Message, Visitor } from '../database/entities';
import { MessageStatus } from '@live-chat/shared-types';

describe('EventConsumerService', () => {
  let service: EventConsumerService;
  let conversationService: jest.Mocked<ConversationService>;
  let visitorService: jest.Mocked<VisitorService>;
  let messageService: jest.Mocked<MessageService>;
  let entityManager: jest.Mocked<EntityManager>;
  let redisPublisher: jest.Mocked<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventConsumerService,
        {
          provide: ConversationService,
          useValue: {
            findOrCreateByVisitorId: jest.fn(),
            updateLastMessage: jest.fn(),
          },
        },
        {
          provide: VisitorService,
          useValue: {
            findOrCreateByUid: jest.fn(),
          },
        },
        {
          provide: MessageService,
          useValue: {
            createMessageAndVerifySent: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            transaction: jest.fn().mockImplementation((cb) => cb(entityManager)),
          },
        },
        {
          provide: REDIS_PUBLISHER_CLIENT,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventConsumerService>(EventConsumerService);
    conversationService = module.get(ConversationService);
    visitorService = module.get(VisitorService);
    messageService = module.get(MessageService);
    entityManager = module.get(EntityManager);
    redisPublisher = module.get(REDIS_PUBLISHER_CLIENT);
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
      const event = {
        type: 'NEW_MESSAGE_FROM_VISITOR',
        payload: { some: 'payload' },
      };

      await service.processEvent(event);

      expect(handleNewMessageSpy).toHaveBeenCalledWith(event.payload);
    });

    it('should log warning for unhandled event type', async () => {
      // We can't easily spy on logger without more setup, but we verify it doesn't throw
      const event = { type: 'UNKNOWN_TYPE', payload: {} };
      await expect(service.processEvent(event)).resolves.not.toThrow();
    });
  });

  describe('handleNewMessageFromVisitor', () => {
    it('should create entities and insert outbox event', async () => {
      const payload = {
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

      visitorService.findOrCreateByUid.mockResolvedValue(visitor);
      conversationService.findOrCreateByVisitorId.mockResolvedValue(conversation as any);
      messageService.createMessageAndVerifySent.mockResolvedValue(savedMessage);

      // Mock entityManager.query for outbox insertion
      entityManager.query = jest.fn().mockResolvedValue(undefined);

      // Call private method via casting
      await (service as any).handleNewMessageFromVisitor(payload);

      expect(visitorService.findOrCreateByUid).toHaveBeenCalledWith(
        payload.projectId,
        payload.visitorUid,
        expect.anything()
      );
      expect(conversationService.findOrCreateByVisitorId).toHaveBeenCalledWith(
        payload.projectId,
        visitor.id,
        expect.anything()
      );
      expect(messageService.createMessageAndVerifySent).toHaveBeenCalledWith(
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
      expect(conversationService.updateLastMessage).toHaveBeenCalled();
      
      // Verify outbox insertion
      expect(entityManager.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO outbox_events'),
        expect.arrayContaining(['message', savedMessage.id, 'NEW_MESSAGE_FROM_VISITOR'])
      );
    });
  });
});