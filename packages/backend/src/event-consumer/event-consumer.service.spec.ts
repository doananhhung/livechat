import { Test, TestingModule } from '@nestjs/testing';
import { EventConsumerService } from './event-consumer.service';
import { ConversationService } from '../inbox/services/conversation.service';
import { VisitorService } from '../inbox/services/visitor.service';
import { MessageService } from '../inbox/services/message.service';
import { EntityManager } from 'typeorm';
import { REDIS_PUBLISHER_CLIENT } from '../redis/redis.module';
import { SQSClient } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { Message, Visitor } from '@live-chat/shared';
import { Logger } from '@nestjs/common';

describe('EventConsumerService', () => {
  let service: EventConsumerService;
  let conversationService: jest.Mocked<ConversationService>;
  let visitorService: jest.Mocked<VisitorService>;
  let messageService: jest.Mocked<MessageService>;
  let entityManager: jest.Mocked<EntityManager>;
  let redisPublisher: jest.Mocked<any>;
  let sqsClient: jest.Mocked<SQSClient>;
  let configService: jest.Mocked<ConfigService>;

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
        {
          provide: SQSClient,
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
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
    sqsClient = module.get(SQSClient);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onApplicationBootstrap', () => {
    it('should get queue url and start polling', async () => {
      sqsClient.send.mockImplementation(() => Promise.resolve({ QueueUrl: 'test-url' } as any));
      const startPollingSpy = jest
        .spyOn(service as any, 'startPolling')
        .mockImplementation(() => {});

      await service.onApplicationBootstrap();

      expect(sqsClient.send).toHaveBeenCalled();
      expect(startPollingSpy).toHaveBeenCalled();
    });

    it('should log an error if getting queue url fails', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      sqsClient.send.mockImplementation(() => Promise.reject(new Error('SQS Error')));
      await expect(service.onApplicationBootstrap()).rejects.toThrow('SQS Error');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('handleMessage', () => {
    it('should handle NEW_MESSAGE_FROM_VISITOR event', async () => {
      const handleNewMessageSpy = jest
        .spyOn(service as any, 'handleNewMessageFromVisitor')
        .mockResolvedValue(undefined);
      const message = {
        MessageId: '1',
        Body: JSON.stringify({
          type: 'NEW_MESSAGE_FROM_VISITOR',
          payload: {},
        }),
      };

      await service.handleMessage(message as any);

      expect(handleNewMessageSpy).toHaveBeenCalled();
    });

    it('should log an error for empty message body', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      const message = { MessageId: '1', Body: null };
      await expect(service.handleMessage(message as any)).rejects.toThrow(
        'Message body is empty.'
      );
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('handleNewMessageFromVisitor', () => {
    it('should create entities and publish to redis', async () => {
      const payload = {
        tempId: 'temp-1',
        content: 'Hello',
        visitorUid: 'visitor-123',
        projectId: 1,
        socketId: 'socket-abc',
      };
      const visitor = new Visitor();
      visitor.id = 1;
      const conversation = { id: 1 };
      const savedMessage = { id: 'msg-1' } as Message;

      visitorService.findOrCreateByUid.mockResolvedValue(visitor);
      conversationService.findOrCreateByVisitorId.mockResolvedValue(conversation as any);
      messageService.createMessageAndVerifySent.mockResolvedValue(savedMessage);

      await (service as any).handleNewMessageFromVisitor(payload);

      expect(visitorService.findOrCreateByUid).toHaveBeenCalled();
      expect(conversationService.findOrCreateByVisitorId).toHaveBeenCalled();
      expect(messageService.createMessageAndVerifySent).toHaveBeenCalled();
      expect(conversationService.updateLastMessage).toHaveBeenCalled();
      expect(redisPublisher.publish).toHaveBeenCalledWith(
        'new_message_channel',
        JSON.stringify({
          message: savedMessage,
          tempId: payload.tempId,
          visitorUid: payload.visitorUid,
        })
      );
    });
  });
});