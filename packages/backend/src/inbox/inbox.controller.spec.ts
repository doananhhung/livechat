import { Test, TestingModule } from '@nestjs/testing';
import { InboxController } from './inbox.controller';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { VisitorService } from './services/visitor.service';
import {
  AgentTypingDto,
  ConversationListResponseDto,
  ListConversationsDto,
  ListMessagesDto,
  SendReplyDto,
  UpdateConversationDto,
} from '@live-chat/shared-dtos';
import { ConversationStatus } from '@live-chat/shared-types';
import { User } from '../database/entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';

describe('InboxController', () => {
  let controller: InboxController;
  let conversationService: jest.Mocked<ConversationService>;
  let messageService: jest.Mocked<MessageService>;
  let visitorService: jest.Mocked<VisitorService>;

  const mockUser = { id: '1' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InboxController],
      providers: [
        {
          provide: ConversationService,
          useValue: {
            listByProject: jest.fn(),
            updateStatus: jest.fn(),
            markAsRead: jest.fn(),
            handleAgentTyping: jest.fn(),
          },
        },
        {
          provide: MessageService,
          useValue: {
            sendAgentReply: jest.fn(),
            listByConversation: jest.fn(),
          },
        },
        {
          provide: VisitorService,
          useValue: {
            getVisitorById: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InboxController>(InboxController);
    conversationService = module.get(ConversationService);
    messageService = module.get(MessageService);
    visitorService = module.get(VisitorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listConversations', () => {
    it('should call conversationService.listByProject', async () => {
      const projectId = 1;
      const query: ListConversationsDto = {};
      const response: ConversationListResponseDto = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };
      conversationService.listByProject.mockResolvedValue(response as any);

      const result = await controller.listConversations(mockUser, projectId, query);

      expect(conversationService.listByProject).toHaveBeenCalledWith(
        mockUser,
        projectId,
        query
      );
      expect(result).toEqual(response);
    });
  });

  describe('sendReply', () => {
    it('should call messageService.sendAgentReply', async () => {
      const body: SendReplyDto = { text: 'Hello' };
      await controller.sendReply(mockUser, '1', body);
      expect(messageService.sendAgentReply).toHaveBeenCalledWith(
        mockUser,
        '1',
        'Hello'
      );
    });
  });

  describe('updateConversation', () => {
    it('should call conversationService.updateStatus', async () => {
      const body: UpdateConversationDto = { status: ConversationStatus.CLOSED };
      await controller.updateConversation(mockUser, '1', body);
      expect(conversationService.updateStatus).toHaveBeenCalledWith(
        mockUser.id,
        '1',
        ConversationStatus.CLOSED
      );
    });

    it('should call conversationService.markAsRead', async () => {
      const body: UpdateConversationDto = { read: true };
      await controller.updateConversation(mockUser, '1', body);
      expect(conversationService.markAsRead).toHaveBeenCalledWith(mockUser.id, '1');
    });

    it('should throw an error if no valid body is provided', async () => {
      const body = {};
      await expect(
        controller.updateConversation(mockUser, '1', body)
      ).rejects.toThrow();
    });
  });

  describe('listMessages', () => {
    it('should call messageService.listByConversation', async () => {
      const query: ListMessagesDto = {};
      await controller.listMessages(mockUser, '1', query);
      expect(messageService.listByConversation).toHaveBeenCalledWith(
        mockUser,
        '1',
        query
      );
    });
  });

  describe('handleAgentTyping', () => {
    it('should call conversationService.handleAgentTyping', async () => {
      const body: AgentTypingDto = { isTyping: true };
      await controller.handleAgentTyping(mockUser, '1', body);
      expect(conversationService.handleAgentTyping).toHaveBeenCalledWith(
        mockUser,
        '1',
        true
      );
    });
  });

  describe('getVisitor', () => {
    it('should call visitorService.getVisitorById', async () => {
      await controller.getVisitor(mockUser, 123);
      expect(visitorService.getVisitorById).toHaveBeenCalledWith(123);
    });
  });
});
