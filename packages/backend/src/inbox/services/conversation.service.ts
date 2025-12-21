import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  ListConversationsDto,
  UpdateConversationDto,
} from '@live-chat/shared-dtos';
import { ConversationStatus } from '@live-chat/shared-types';
import {
  Conversation,
  User,
  Message,
  Visitor,
} from '../../database/entities';
import { RealtimeSessionService } from '../../realtime-session/realtime-session.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { ProjectService } from '../../projects/project.service';

@Injectable()
export class ConversationService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly realtimeSessionService: RealtimeSessionService,
    @Inject(forwardRef(() => EventsGateway))
    private readonly eventsGateway: EventsGateway,
    private readonly projectService: ProjectService
  ) {}

  async findById(id: number): Promise<Conversation> {
    const conversation = await this.entityManager.findOne(Conversation, {
      where: { id },
    });
    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found.`);
    }
    return conversation;
  }

  /**
   * Finds an existing conversation for a visitor or creates a new one.
   * This is intended to be called from the EventConsumer within a transaction.
   * @param projectId - The ID of the project.
   * @param visitorId - The ID of the visitor.
   * @param manager - The EntityManager from the transaction.
   * @returns The found or newly created Conversation.
   */
  async findOrCreateByVisitorId(
    projectId: number,
    visitorId: number,
    manager: EntityManager
  ): Promise<Conversation> {
    const conversationRepo = manager.getRepository(Conversation);

    let conversation = await conversationRepo.findOne({
      where: {
        project: { id: projectId },
        visitor: { id: visitorId },
      },
    });

    if (!conversation) {
      conversation = conversationRepo.create({
        project: { id: projectId },
        visitor: { id: visitorId },
        status: ConversationStatus.OPEN,
      });
      await conversationRepo.save(conversation);
    }

    return conversation;
  }

  /**
   * Updates the conversation's metadata after a new message is received.
   * Intended to be called from the EventConsumer within a transaction.
   * @param conversationId - The ID of the conversation to update.
   * @param lastMessageSnippet - A snippet of the last message.
   * @param lastMessageTimestamp - The timestamp of the last message.
   * @param manager - The EntityManager from the transaction.
   */
  async updateLastMessage(
    conversationId: number,
    lastMessageSnippet: string,
    lastMessageTimestamp: Date,
    manager: EntityManager
  ): Promise<void> {
    const conversationRepo = manager.getRepository(Conversation);
    // Increment unread count by 1 for new incoming messages
    await conversationRepo.increment({ id: conversationId }, 'unreadCount', 1);

    await conversationRepo.update(
      { id: conversationId },
      {
        lastMessageSnippet: lastMessageSnippet.substring(0, 100),
        lastMessageTimestamp,
        status: ConversationStatus.OPEN, // Re-open conversation on new message
      }
    );
  }

  /**
   * Lists conversations for a specific project, intended for the agent dashboard.
   * @param user - The authenticated user making the request.
   * @param projectId - The ID of the project to fetch conversations for.
   * @param query - DTO for pagination and filtering.
   * @returns A paginated list of conversations.
   */
  async listByProject(user: User, query: ListConversationsDto) {
    const { projectId, status, page = 1, limit = 10 } = query;

    const qb = this.entityManager
      // SQL: SELECT ... FROM conversation
      // Don't use .select() to let TypeORM select all fields automatically
      .createQueryBuilder(Conversation, 'conversation')

      // SQL: LEFT JOIN project ...
      .leftJoin('conversation.project', 'project')

      // SQL: INNER JOIN project_member ... ON ... AND member.userId = :userId
      // This checks if the current user is a member of the project.
      .innerJoin('project.members', 'member', 'member.userId = :userId', {
        userId: user.id,
      })

      // SQL: LEFT JOIN visitor ...
      // Also adds all columns from 'visitor' to the SELECT clause.
      .leftJoinAndSelect('conversation.visitor', 'visitor')

      // SQL: WHERE project.id = :projectId
      .where('project.id = :projectId', { projectId });

    if (status) {
      // SQL: AND conversation.status = :status
      qb.andWhere('conversation.status = :status', { status });
    }

    // SQL: ORDER BY conversation.lastMessageTimestamp DESC
    qb.orderBy('conversation.lastMessageTimestamp', 'DESC')
      // SQL: OFFSET (page - 1) * limit
      .skip((page - 1) * limit)
      // SQL: LIMIT limit
      .take(limit);

    // This executes the query built above.
    const [data, total] = await qb.getManyAndCount();

    // Populate currentUrl for each visitor from Redis
    await Promise.all(
      data.map(async (conversation) => {
        if (conversation.visitor) {
          conversation.visitor.currentUrl =
            await this.realtimeSessionService.getVisitorCurrentUrl(
              conversation.visitor.visitorUid
            );
        }
      })
    );

    return { data, total, page, limit };
  }
  /**
   * Updates the status of a conversation (e.g., 'open', 'closed').
   * @param user - The authenticated user.
   * @param conversationId - The ID of the conversation.
   * @param status - The new status.
   * @returns The updated conversation.
   */
  async updateStatus(
    userId: string,
    conversationId: number,
    status: ConversationStatus
  ): Promise<Conversation> {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const conversation = await transactionalEntityManager.findOne(
          Conversation,
          {
            where: { id: conversationId },
            relations: ['project'],
          }
        );

        if (!conversation) {
          throw new NotFoundException(
            `Conversation with ID ${conversationId} not found.`
          );
        }

        await this.projectService.validateProjectMembership(
          conversation.projectId,
          userId
        );

        conversation.status = status;
        return transactionalEntityManager.save(conversation);
      }
    );
  }

  /**
   * Marks a conversation as read by resetting its unread count.
   * @param user - The authenticated user.
   * @param conversationId - The ID of the conversation.
   * @returns The updated conversation.
   */
  async markAsRead(
    userId: string,
    conversationId: number
  ): Promise<Conversation> {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const conversation = await transactionalEntityManager.findOne(
          Conversation,
          {
            where: { id: conversationId },
            relations: ['project'],
          }
        );

        if (!conversation) {
          throw new NotFoundException(
            `Conversation with ID ${conversationId} not found.`
          );
        }

        await this.projectService.validateProjectMembership(
          conversation.projectId,
          userId
        );

        conversation.unreadCount = 0;
        return transactionalEntityManager.save(conversation);
      }
    );
  }

  /**
   * Finds an open conversation for a visitor, including its message history.
   * If one doesn't exist, a new conversation is created.
   *
   * @param visitorId The ID of the visitor.
   * @param projectId The ID of the project.
   * @param manager The EntityManager to perform database operations.
   * @returns A Promise containing the conversation (with or without messages).
   */
  async getOrCreateHistoryByVisitorId(
    projectId: number,
    visitorId: number,
    manager: EntityManager
  ): Promise<Conversation> {
    const conversationRepo = manager.getRepository(Conversation);

    let conversation = await conversationRepo.findOne({
      where: {
        visitor: { id: visitorId },
        project: { id: projectId },
        status: ConversationStatus.OPEN,
      },
      relations: ['messages'], // Eagerly load messages
      order: {
        messages: {
          createdAt: 'ASC', // Order messages chronologically
        },
      },
    });

    if (!conversation) {
      conversation = conversationRepo.create({
        project: { id: projectId },
        visitor: { id: visitorId },
        status: ConversationStatus.OPEN,
      });
      await conversationRepo.save(conversation);

      conversation.messages = [];
    }

    return conversation;
  }

  /**
   * @NEW_FEATURE
   * Handles and emits "agent typing" event to the visitor.
   */
  async handleAgentTyping(
    user: User,
    conversationId: number,
    isTyping: boolean
  ): Promise<void> {
    // Step 1: Check permissions and get visitor information
    const conversation = await this.entityManager.findOne(Conversation, {
      where: { id: conversationId },
      relations: ['visitor', 'project'],
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found.`
      );
    }

    await this.projectService.validateProjectMembership(
      conversation.projectId,
      user.id
    );

    const visitorUid = conversation.visitor.visitorUid;

    // Step 2: Look up visitor's socket.id
    const visitorSocketId =
      await this.realtimeSessionService.getVisitorSession(visitorUid);
    if (visitorSocketId) {
      this.eventsGateway.sendAgentTypingToVisitor(
        visitorSocketId,
        isTyping,
        user.fullName || 'Agent' // Use fullName or a default name
      );
    }
  }
}
