import { Test, TestingModule } from '@nestjs/testing';
import { ConversationPersistenceService } from './conversation.persistence.service';
import { EntityManager, Repository } from 'typeorm';
import { Conversation } from '../../../database/entities';
import { ConversationStatus } from '@live-chat/shared-types';

describe('ConversationPersistenceService', () => {
  let service: ConversationPersistenceService;
  let entityManager: EntityManager;
  let conversationRepo: Repository<Conversation>;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    increment: jest.fn(),
    update: jest.fn(),
  };

  const mockEntityManager = {
    getRepository: jest.fn(() => mockRepository),
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
    // @ts-ignore
    conversationRepo = mockRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateLastMessage', () => {
    it('should auto-open conversation when a new message is added', async () => {
      const conversationId = '1';
      const lastMessageSnippet = 'Hello';
      const lastMessageTimestamp = new Date();
      const lastMessageId = '100';

      mockRepository.findOne.mockResolvedValue({ id: conversationId, status: ConversationStatus.PENDING });

      await service.updateLastMessage(conversationId, lastMessageSnippet, lastMessageTimestamp, lastMessageId, entityManager);

      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(Conversation);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: conversationId } });
      expect(mockRepository.increment).toHaveBeenCalledWith({ id: conversationId }, 'unreadCount', 1);
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: conversationId },
        {
          lastMessageSnippet: lastMessageSnippet.substring(0, 100),
          lastMessageTimestamp,
          lastMessageId,
          status: ConversationStatus.OPEN,
        }
      );
    });

    it('should NOT auto-open conversation if it is SPAM', async () => {
      const conversationId = '1';
      const lastMessageSnippet = 'Hello';
      const lastMessageTimestamp = new Date();
      const lastMessageId = '100';

      mockRepository.findOne.mockResolvedValue({ id: conversationId, status: ConversationStatus.SPAM });

      await service.updateLastMessage(conversationId, lastMessageSnippet, lastMessageTimestamp, lastMessageId, entityManager);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: conversationId } });
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: conversationId },
        {
          lastMessageSnippet: lastMessageSnippet.substring(0, 100),
          lastMessageTimestamp,
          lastMessageId,
          status: ConversationStatus.SPAM,
        }
      );
    });
  });
});
