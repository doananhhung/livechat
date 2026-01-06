import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowConsumer } from './workflow.consumer';
import { EntityManager, Repository } from 'typeorm';
import { Conversation } from '../../database/entities';
import { EventsGateway } from '../../gateway/events.gateway';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConversationStatus } from '@live-chat/shared-types';
import { Job } from 'bullmq';

describe('WorkflowConsumer', () => {
  let consumer: WorkflowConsumer;
  let conversationRepo: Repository<Conversation>;
  let eventsGateway: EventsGateway;

  const mockQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  const mockRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockEventsGateway = {
    emitConversationUpdated: jest.fn(),
    server: {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowConsumer,
        { provide: getRepositoryToken(Conversation), useValue: mockRepository },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    consumer = module.get<WorkflowConsumer>(WorkflowConsumer);
    conversationRepo = module.get<Repository<Conversation>>(getRepositoryToken(Conversation));
    eventsGateway = module.get<EventsGateway>(EventsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    const jobData = {
      conversationId: '1',
      projectId: 1,
      triggerMessageId: '100',
    };
    const job = { data: jobData } as Job;

    it('should update status to PENDING if conversation is OPEN and lastMessageId matches', async () => {
      // Mock update result indicating success (1 row affected)
      (mockQueryBuilder.execute as jest.Mock).mockResolvedValue({ affected: 1 });

      await consumer.process(job);

      expect(conversationRepo.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(Conversation);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ status: ConversationStatus.PENDING });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :id', { id: jobData.conversationId });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('status = :status', { status: ConversationStatus.OPEN });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('last_message_id = :triggerId', { triggerId: jobData.triggerMessageId });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();

      expect(eventsGateway.emitConversationUpdated).toHaveBeenCalledWith(jobData.projectId, {
        conversationId: jobData.conversationId,
        fields: {
          status: ConversationStatus.PENDING,
        },
      });

      expect(eventsGateway.server.to).toHaveBeenCalledWith(`project:${jobData.projectId}`);
      expect(eventsGateway.server.emit).toHaveBeenCalledWith('automation.triggered', expect.any(Object));
    });

    it('should NOT emit events if update affects 0 rows (condition failed)', async () => {
      // Mock update result indicating failure (0 rows affected)
      (mockQueryBuilder.execute as jest.Mock).mockResolvedValue({ affected: 0 });

      await consumer.process(job);

      expect(mockQueryBuilder.execute).toHaveBeenCalled();
      expect(eventsGateway.emitConversationUpdated).not.toHaveBeenCalled();
      expect(eventsGateway.server.emit).not.toHaveBeenCalled();
    });
  });
});
