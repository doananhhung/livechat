
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
import { ConversationPersistenceService } from './persistence/conversation.persistence.service';

@Injectable()
export class ConversationService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly realtimeSessionService: RealtimeSessionService,
    @Inject(forwardRef(() => EventsGateway))
    private readonly eventsGateway: EventsGateway,
    private readonly projectService: ProjectService,
    private readonly conversationPersistenceService: ConversationPersistenceService
  ) {}

  async findById(id: string): Promise<Conversation> {
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
    return this.conversationPersistenceService.findOrCreateByVisitorId(
      projectId,
      visitorId,
      manager
    );
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
    conversationId: string,
    lastMessageSnippet: string,
    lastMessageTimestamp: Date,
    lastMessageId: string,
    manager: EntityManager
  ): Promise<void> {
    return this.conversationPersistenceService.updateLastMessage(
      conversationId,
      lastMessageSnippet,
      lastMessageTimestamp,
      lastMessageId,
      manager
    );
  }

  /**
   * Lists conversations for a specific project, intended for the agent dashboard.
   * @param user - The authenticated user making the request.
   * @param projectId - The ID of the project to fetch conversations for.
   * @param query - DTO for pagination and filtering.
   * @returns A paginated list of conversations.
   */
  async listByProject(user: User, projectId: number, query: ListConversationsDto) {
    const { status, page = 1, limit = 10 } = query;

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

    // Populate currentUrl for each visitor from Redis using bulk MGET
    const visitorUids = data
      .filter((c) => c.visitor?.visitorUid)
      .map((c) => c.visitor.visitorUid);

    if (visitorUids.length > 0) {
      const urlMap =
        await this.realtimeSessionService.getManyVisitorCurrentUrls(visitorUids);

      data.forEach((conversation) => {
        if (conversation.visitor) {
          conversation.visitor.currentUrl =
            urlMap.get(conversation.visitor.visitorUid) ?? null;
        }
      });
    }

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
    conversationId: string,
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
    conversationId: string
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
   * Returns null if no open conversation exists (lazy conversation creation pattern).
   *
   * This method is used during widget open (identify event) to load existing
   * conversation history. It does NOT create a new conversation - that only
   * happens when the visitor sends their first message.
   *
   * @param projectId The ID of the project.
   * @param visitorId The ID of the visitor.
   * @param manager The EntityManager to perform database operations.
   * @returns The open conversation with messages, or null if none exists.
   */
  async findOpenByVisitorId(
    projectId: number,
    visitorId: number,
    manager: EntityManager
  ): Promise<Conversation | null> {
    const conversationRepo = manager.getRepository(Conversation);

    const conversation = await conversationRepo.findOne({
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

    return conversation;
  }

  /**
   * @NEW_FEATURE
   * Handles and emits "agent typing" event to the visitor.
   */
  async handleAgentTyping(
    user: User,
    conversationId: string,
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

  /**
   * Assigns a conversation to a specific agent (user).
   * @param actorId - The ID of the user performing the assignment.
   * @param conversationId - The ID of the conversation.
   * @param assigneeId - The ID of the user to assign the conversation to.
   */
  async assign(actorId: string, conversationId: string, assigneeId: string): Promise<Conversation> {
    return this.entityManager.transaction(async (manager) => {
      // 1. Fetch Conversation
      const conversation = await manager.findOne(Conversation, {
        where: { id: conversationId },
        relations: ['project'],
      });

      if (!conversation) {
        throw new NotFoundException(`Conversation with ID ${conversationId} not found.`);
      }

      // 2. Validate Actor (must be member of project)
      await this.projectService.validateProjectMembership(conversation.projectId, actorId);

      // 3. Validate Assignee (must be member of project)
      await this.projectService.validateProjectMembership(conversation.projectId, assigneeId);

      // 4. Update Conversation
      conversation.assigneeId = assigneeId;
      conversation.assignedAt = new Date();
      
      const updated = await manager.save(conversation);

      // 5. Emit Event
      this.eventsGateway.emitConversationUpdated(conversation.projectId, {
        conversationId: conversation.id,
        fields: {
          assigneeId: conversation.assigneeId,
          assignedAt: conversation.assignedAt,
        },
      });

      return updated;
    });
  }

  /**
   * Unassigns a conversation.
   * @param actorId - The ID of the user performing the unassignment.
   * @param conversationId - The ID of the conversation.
   */
  async unassign(actorId: string, conversationId: string): Promise<Conversation> {
    return this.entityManager.transaction(async (manager) => {
      // 1. Fetch Conversation
      const conversation = await manager.findOne(Conversation, {
        where: { id: conversationId },
        relations: ['project'],
      });

      if (!conversation) {
        throw new NotFoundException(`Conversation with ID ${conversationId} not found.`);
      }

      // 2. Validate Actor (must be member of project)
      await this.projectService.validateProjectMembership(conversation.projectId, actorId);

      // 3. Update Conversation
      conversation.assigneeId = null;
      conversation.assignedAt = null;
      
      const updated = await manager.save(conversation);

      // 4. Emit Event
      this.eventsGateway.emitConversationUpdated(conversation.projectId, {
        conversationId: conversation.id,
        fields: {
          assigneeId: null,
          assignedAt: null,
        },
      });

      return updated;
    });
  }

  /**
   * Permanently deletes a conversation and all its messages.
   * @param actorId - The ID of the user performing the deletion.
   * @param conversationId - The ID of the conversation to delete.
   */
  async deleteConversation(actorId: string, conversationId: string): Promise<void> {
    const conversation = await this.entityManager.findOne(Conversation, {
      where: { id: conversationId },
      relations: ['project'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found.`);
    }

    // Validate actor has access to the project
    await this.projectService.validateProjectMembership(conversation.projectId, actorId);

    const projectId = conversation.projectId;

    // Hard delete - messages will cascade due to entity configuration
    await this.entityManager.delete(Conversation, conversationId);

    // Emit event to notify connected clients
    this.eventsGateway.emitConversationDeleted(projectId, conversationId);
  }
}
