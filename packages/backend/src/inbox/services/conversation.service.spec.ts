import { Test, TestingModule } from '@nestjs/testing';
import { ConversationService } from './conversation.service';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { RealtimeSessionService } from '../../realtime-session/realtime-session.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { ProjectService } from '../../projects/project.service';
import { ConversationPersistenceService } from './persistence/conversation.persistence.service';
import { ConversationStatus, User } from '@live-chat/shared-types';
import { NotFoundException } from '@nestjs/common';
import { ListConversationsDto } from '@live-chat/shared-dtos';

describe('ConversationService', () => {
  let service: ConversationService;
  let persistenceService: ConversationPersistenceService;
  let entityManager: EntityManager;
  let realtimeSessionService: RealtimeSessionService;

  const mockSelectQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockEntityManager = {
    findOne: jest.fn(),
    transaction: jest.fn((cb) => cb(mockEntityManager)),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockSelectQueryBuilder),
  };

  const mockPersistenceService = {
    findOrCreateByVisitorId: jest.fn(),
    updateLastMessage: jest.fn(),
  };

  const mockProjectService = {
    validateProjectMembership: jest.fn(),
  };

  const mockRealtimeSessionService = {
    getManyVisitorCurrentUrls: jest.fn().mockResolvedValue(new Map()),
    getVisitorSession: jest.fn(),
  };

  const mockEventsGateway = {
    sendAgentTypingToVisitor: jest.fn(),
    emitConversationUpdated: jest.fn(),
    emitConversationDeleted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        { provide: EntityManager, useValue: mockEntityManager },
        { provide: RealtimeSessionService, useValue: mockRealtimeSessionService },
        { provide: EventsGateway, useValue: mockEventsGateway },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: ConversationPersistenceService, useValue: mockPersistenceService },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
    persistenceService = module.get<ConversationPersistenceService>(ConversationPersistenceService);
    entityManager = module.get<EntityManager>(EntityManager);
    realtimeSessionService = module.get<RealtimeSessionService>(RealtimeSessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateStatus', () => {
    it('should update status successfully to SPAM', async () => {
      const conversationId = '1';
      const userId = 'user-1';
      const status = ConversationStatus.SPAM;
      
      const mockConversation = { id: conversationId, projectId: 1, status: ConversationStatus.OPEN };
      
      mockEntityManager.findOne.mockResolvedValue(mockConversation);
      mockProjectService.validateProjectMembership.mockResolvedValue(true);
      mockEntityManager.save.mockResolvedValue({ ...mockConversation, status });

      const result = await service.updateStatus(userId, conversationId, status);

      expect(mockEntityManager.findOne).toHaveBeenCalled();
      expect(mockProjectService.validateProjectMembership).toHaveBeenCalledWith(1, userId);
      expect(mockEntityManager.save).toHaveBeenCalledWith(expect.objectContaining({ status: ConversationStatus.SPAM }));
      expect(result.status).toEqual(ConversationStatus.SPAM);
    });

    it('should throw NotFoundException if conversation not found', async () => {
        mockEntityManager.findOne.mockResolvedValue(null);
        await expect(service.updateStatus('user-1', '999', ConversationStatus.SPAM))
            .rejects.toThrow(NotFoundException);
    });
  });

  describe('listByProject', () => {
    it('should filter conversations by SOLVED status', async () => {
      const user = { id: 'user-1' } as any;
      const projectId = 1;
      const query: ListConversationsDto = { status: ConversationStatus.SOLVED, page: 1, limit: 10 };
      
      const mockConversations = [
        { id: '1', status: ConversationStatus.SOLVED, visitor: { visitorUid: 'v1' } },
        { id: '2', status: ConversationStatus.SOLVED, visitor: { visitorUid: 'v2' } },
      ];
      mockSelectQueryBuilder.getManyAndCount.mockResolvedValue([mockConversations, 2]);

      const result = await service.listByProject(user, projectId, query);

      expect(mockEntityManager.createQueryBuilder).toHaveBeenCalled();
      expect(mockSelectQueryBuilder.where).toHaveBeenCalledWith('project.id = :projectId', { projectId });
      expect(mockSelectQueryBuilder.andWhere).toHaveBeenCalledWith('conversation.status = :status', { status: ConversationStatus.SOLVED });
      expect(result.data).toHaveLength(2);
      expect(result.data[0].status).toBe(ConversationStatus.SOLVED);
    });
  });
});