
import { Test, TestingModule } from '@nestjs/testing';
import { ConversationPersistenceService } from './conversation.persistence.service';
import { EntityManager, Repository } from 'typeorm';
import { Conversation } from '../../../database/entities';
import { ConversationStatus, VisitorSessionMetadata } from '@live-chat/shared-types';

describe('ConversationPersistenceService', () => {
  let service: ConversationPersistenceService;
  let entityManager: EntityManager;
  let conversationRepo: Repository<Conversation>;

  const mockConversationRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    increment: jest.fn(),
    update: jest.fn(),
  };

  const mockEntityManager = {
    getRepository: jest.fn().mockReturnValue(mockConversationRepo),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationPersistenceService,
        { provide: EntityManager, useValue: mockEntityManager },
      ],
    }).compile();

    service = module.get<ConversationPersistenceService>(ConversationPersistenceService);
    entityManager = module.get<EntityManager>(EntityManager);
    conversationRepo = entityManager.getRepository(Conversation);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreateByVisitorId', () => {
    const projectId = 1;
    const visitorId = 100;
    const metadata: VisitorSessionMetadata = {
      referrer: 'google.com',
      landingPage: '/home',
      urlHistory: [],
    };

    it('should create a new conversation with metadata if none exists', async () => {
      mockConversationRepo.findOne.mockResolvedValue(null);
      mockConversationRepo.create.mockReturnValue({
        id: '1',
        projectId,
        visitorId,
        metadata,
        status: ConversationStatus.OPEN,
      });
      mockConversationRepo.save.mockResolvedValue({
        id: '1',
        projectId,
        visitorId,
        metadata,
        status: ConversationStatus.OPEN,
      });

      const result = await service.findOrCreateByVisitorId(
        projectId,
        visitorId,
        entityManager,
        'limit_to_active',
        metadata,
      );

      expect(mockConversationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          project: { id: projectId },
          visitor: { id: visitorId },
          status: ConversationStatus.OPEN,
          metadata: metadata,
        }),
      );
      expect(mockConversationRepo.save).toHaveBeenCalled();
      expect(result.metadata).toEqual(metadata);
    });

    it('should update existing conversation with metadata if it was missing', async () => {
      const existingConversation = {
        id: '1',
        projectId,
        visitorId,
        status: ConversationStatus.OPEN,
        metadata: null,
      };

      mockConversationRepo.findOne.mockResolvedValue(existingConversation);
      mockConversationRepo.save.mockResolvedValue({
        ...existingConversation,
        metadata,
      });

      const result = await service.findOrCreateByVisitorId(
        projectId,
        visitorId,
        entityManager,
        'limit_to_active',
        metadata,
      );

      expect(mockConversationRepo.create).not.toHaveBeenCalled();
      // Should save the updated conversation with new metadata
      expect(mockConversationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          metadata: metadata,
        }),
      );
      expect(result.metadata).toEqual(metadata);
    });

    it('should overwrite existing metadata if new metadata is provided', async () => {
      const existingMetadata = { referrer: 'direct', landingPage: '/old', urlHistory: [] };
      const existingConversation = {
        id: '1',
        projectId,
        visitorId,
        status: ConversationStatus.OPEN,
        metadata: existingMetadata,
      };

      mockConversationRepo.findOne.mockResolvedValue(existingConversation);
      mockConversationRepo.save.mockResolvedValue({
        ...existingConversation,
        metadata,
      });

      const result = await service.findOrCreateByVisitorId(
        projectId,
        visitorId,
        entityManager,
        'limit_to_active',
        metadata, // New metadata passed
      );

      expect(mockConversationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          metadata: metadata,
        }),
      );
      expect(result.metadata).toEqual(metadata);
    });
  });
});
