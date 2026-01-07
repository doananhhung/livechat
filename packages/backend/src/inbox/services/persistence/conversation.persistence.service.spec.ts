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

  describe('findByVisitorId', () => {
    it('should find active conversation in limit_to_active mode (default)', async () => {
      const projectId = 1;
      const visitorId = 1;
      const mockConversation = { id: '1', status: ConversationStatus.OPEN };
      
      mockRepository.findOne.mockResolvedValue(mockConversation);

      const result = await service.findByVisitorId(projectId, visitorId, entityManager);

      expect(mockRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          status: expect.anything(), // In([OPEN, PENDING])
        })
      }));
      expect(result).toEqual(mockConversation);
    });

    it('should find any non-spam conversation in forever mode', async () => {
      const projectId = 1;
      const visitorId = 1;
      const mockConversation = { id: '1', status: ConversationStatus.SOLVED };
      
      mockRepository.findOne.mockResolvedValue(mockConversation);

      const result = await service.findByVisitorId(projectId, visitorId, entityManager, 'forever');

      expect(mockRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          status: expect.anything(), // Not(SPAM)
        })
      }));
      expect(result).toEqual(mockConversation);
    });
  });

  describe('findOrCreateByVisitorId', () => {
    it('should create new conversation if none active in limit_to_active mode', async () => {
      const projectId = 1;
      const visitorId = 1;
      
      // Simulate no active conversation found
      mockRepository.findOne.mockResolvedValue(null);
      const newConversation = { id: '2', status: ConversationStatus.OPEN };
      mockRepository.create.mockReturnValue(newConversation);
      mockRepository.save.mockResolvedValue(newConversation);

      const result = await service.findOrCreateByVisitorId(projectId, visitorId, entityManager, 'limit_to_active');

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(newConversation);
    });

    it('should return existing SOLVED conversation in forever mode (re-opening logic)', async () => {
      const projectId = 1;
      const visitorId = 1;
      const solvedConversation = { id: '1', status: ConversationStatus.SOLVED };
      
      // Simulate finding a solved conversation
      mockRepository.findOne.mockResolvedValue(solvedConversation);

      const result = await service.findOrCreateByVisitorId(projectId, visitorId, entityManager, 'forever');

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual(solvedConversation);
    });
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