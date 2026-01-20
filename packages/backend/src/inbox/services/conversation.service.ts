import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  ListConversationsDto,
  UpdateConversationDto,
} from '@live-chat/shared-dtos';
import {
  ConversationStatus,
  HistoryVisibilityMode,
  NavigationEntry,
} from '@live-chat/shared-types';
import { Conversation, User, Message, Visitor } from '../../database/entities';
import { RealtimeSessionService } from '../../realtime-session/realtime-session.service';
import { ProjectService } from '../../projects/project.service';
import { ConversationPersistenceService } from './persistence/conversation.persistence.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ConversationUpdatedEvent,
  ConversationDeletedEvent,
  AgentTypingEvent,
  VisitorContextUpdatedEvent,
} from '../events';

const MAX_URL_HISTORY_LENGTH = 10;

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly realtimeSessionService: RealtimeSessionService,
    private readonly eventEmitter: EventEmitter2,
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
   * @param mode - History visibility mode.
   * @returns The found or newly created Conversation.
   */
  async findOrCreateByVisitorId(
    projectId: number,
    visitorId: number,
    manager: EntityManager,
    mode: HistoryVisibilityMode = 'limit_to_active'
  ): Promise<Conversation> {
    return this.conversationPersistenceService.findOrCreateByVisitorId(
      projectId,
      visitorId,
      manager,
      mode
    );
  }

  /**
   * Updates the conversation's metadata after a new message is received.
   * Intended to be called from the EventConsumer within a transaction.
   * @param conversationId - The ID of the conversation to update.
   * @param lastMessageSnippet - A snippet of the last message.
   * @param lastMessageTimestamp - The timestamp of the last message.
   * @param manager - The EntityManager from the transaction.
   * @param incrementUnread - Whether to increment the unread count (default: true). Set to false for agent messages.
   */
  async updateLastMessage(
    conversationId: string,
    lastMessageSnippet: string,
    lastMessageTimestamp: Date,
    lastMessageId: string,
    manager: EntityManager,
    incrementUnread: boolean = true
  ): Promise<void> {
    return this.conversationPersistenceService.updateLastMessage(
      conversationId,
      lastMessageSnippet,
      lastMessageTimestamp,
      lastMessageId,
      manager,
      incrementUnread
    );
  }

  /**
   * Lists conversations for a specific project, intended for the agent dashboard.
   * @param user - The authenticated user making the request.
   * @param projectId - The ID of the project to fetch conversations for.
   * @param query - DTO for pagination and filtering.
   * @returns A paginated list of conversations.
   */
  async listByProject(
    user: User,
    projectId: number,
    query: ListConversationsDto
  ) {
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
      (qb as any).andWhere('conversation.status = :status', { status });
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
        await this.realtimeSessionService.getManyVisitorCurrentUrls(
          visitorUids
        );

      data.forEach((conversation) => {
        if (conversation.visitor) {
          (conversation.visitor as any).currentUrl =
            urlMap.get((conversation.visitor as any).visitorUid) ?? null;
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

        (conversation as any).status = status;
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

        (conversation as any).unreadCount = 0;
        return transactionalEntityManager.save(conversation);
      }
    );
  }

  /**
   * Finds an appropriate conversation to show to the widget based on visibility settings.
   * Returns null if no suitable conversation exists (lazy creation).
   * Delegates to persistence service.
   *
   * @param projectId The ID of the project.
   * @param visitorId The ID of the visitor.
   * @param manager The EntityManager to perform database operations.
   * @param mode The history visibility mode.
   * @returns The conversation with messages, or null.
   */
  async findConversationForWidget(
    projectId: number,
    visitorId: number,
    manager: EntityManager,
    mode: HistoryVisibilityMode = 'limit_to_active'
  ): Promise<Conversation | null> {
    return this.conversationPersistenceService.findByVisitorId(
      projectId,
      visitorId,
      manager,
      mode
    );
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
      (conversation as any).projectId,
      user.id
    );

    const visitorUid = (conversation as any).visitor.visitorUid;

    // Step 2: Look up visitor's socket.id
    const visitorSocketId =
      await this.realtimeSessionService.getVisitorSession(visitorUid);
    if (visitorSocketId) {
      const event = new AgentTypingEvent();
      event.visitorSocketId = visitorSocketId;
      event.isTyping = isTyping;
      event.agentName = user.fullName || 'Agent';
      this.eventEmitter.emit('agent.typing', event);
    }
  }

  /**
   * Assigns a conversation to a specific agent (user).
   * @param actorId - The ID of the user performing the assignment.
   * @param conversationId - The ID of the conversation.
   * @param assigneeId - The ID of the user to assign the conversation to.
   */
  async assign(
    actorId: string,
    conversationId: string,
    assigneeId: string
  ): Promise<Conversation> {
    return this.entityManager.transaction(async (manager) => {
      // 1. Fetch Conversation
      const conversation = await manager.findOne(Conversation, {
        where: { id: conversationId },
        relations: ['project'],
      });

      if (!conversation) {
        throw new NotFoundException(
          `Conversation with ID ${conversationId} not found.`
        );
      }

      // 2. Validate Actor (must be member of project)
      await this.projectService.validateProjectMembership(
        conversation.projectId,
        actorId
      );

      // 3. Validate Assignee (must be member of project)
      await this.projectService.validateProjectMembership(
        (conversation as any).projectId,
        assigneeId
      );

      // 4. Update Conversation
      (conversation as any).assigneeId = assigneeId;
      (conversation as any).assignedAt = new Date();

      const updated = await manager.save(conversation);

      // 5. Emit Event
      const event = new ConversationUpdatedEvent();
      event.projectId = conversation.projectId;
      event.payload = {
        conversationId: conversation.id,
        fields: {
          assigneeId: (conversation as any).assigneeId,
          assignedAt: (conversation as any).assignedAt,
        },
      };
      this.eventEmitter.emit('conversation.updated', event);

      return updated;
    });
  }

  /**
   * Unassigns a conversation.
   * @param actorId - The ID of the user performing the unassignment.
   * @param conversationId - The ID of the conversation.
   */
  async unassign(
    actorId: string,
    conversationId: string
  ): Promise<Conversation> {
    return this.entityManager.transaction(async (manager) => {
      // 1. Fetch Conversation
      const conversation = await manager.findOne(Conversation, {
        where: { id: conversationId },
        relations: ['project'],
      });

      if (!conversation) {
        throw new NotFoundException(
          `Conversation with ID ${conversationId} not found.`
        );
      }

      // 2. Validate Actor (must be member of project)
      await this.projectService.validateProjectMembership(
        conversation.projectId,
        actorId
      );

      // 3. Update Conversation
      (conversation as any).assigneeId = null;
      (conversation as any).assignedAt = null;

      const updated = await manager.save(conversation);

      // 4. Emit Event
      const event = new ConversationUpdatedEvent();
      event.projectId = conversation.projectId;
      event.payload = {
        conversationId: conversation.id,
        fields: {
          assigneeId: null,
          assignedAt: null,
        },
      };
      this.eventEmitter.emit('conversation.updated', event);

      return updated;
    });
  }

  /**
   * Permanently deletes a conversation and all its messages.
   * @param actorId - The ID of the user performing the deletion.
   * @param conversationId - The ID of the conversation to delete.
   */
  async deleteConversation(
    actorId: string,
    conversationId: string
  ): Promise<void> {
    const conversation = await this.entityManager.findOne(Conversation, {
      where: { id: conversationId },
      relations: ['project'],
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found.`
      );
    }

    // Validate actor has access to the project
    await this.projectService.validateProjectMembership(
      conversation.projectId,
      actorId
    );

    const projectId = (conversation as any).projectId;

    // Hard delete - messages will cascade due to entity configuration
    await this.entityManager.delete(Conversation, conversationId);

    // Emit event to notify connected clients
    const event = new ConversationDeletedEvent();
    event.projectId = projectId;
    event.conversationId = conversationId;
    this.eventEmitter.emit('conversation.deleted', event);
  }

  /**
   * Truncates the URL history of a conversation to keep only the most recent N entries.
   * Used when a visitor disconnects to reduce stored history size.
   * @param conversationId The ID of the conversation.
   * @param limit The maximum number of entries to keep.
   */
  async truncateUrlHistory(
    conversationId: string,
    limit: number
  ): Promise<void> {
    const conversation = await this.entityManager.findOne(Conversation, {
      where: { id: conversationId },
    });

    if (
      (conversation as any)?.metadata?.urlHistory &&
      (conversation as any).metadata.urlHistory.length > limit
    ) {
      // Keep only the last N entries (most recent)
      (conversation as any).metadata.urlHistory = (
        conversation as any
      ).metadata.urlHistory.slice(-limit);
      await this.entityManager.save(Conversation, conversation as any);
      this.logger.debug(
        `Truncated URL history for conversation ${conversationId} to ${limit} entries`
      );
    }
  }

  /**
   * Updates the visitor's current context (URL) and conversation metadata.
   * Handles lazy conversation resolution.
   *
   * @param projectId The project ID.
   * @param visitorUid The visitor's UID.
   * @param currentUrl The new URL.
   * @param conversationId Optional conversation ID if known.
   * @returns The resolved conversation ID or null if none exists.
   */
  async updateContext(
    projectId: number,
    visitorUid: string,
    currentUrl: string,
    conversationId?: string
  ): Promise<string | null> {
    // 1. Resolve conversationId if missing
    let targetConversationId = conversationId;
    if (!targetConversationId) {
      const conversation = await this.entityManager
        .getRepository(Conversation)
        .findOne({
          where: { visitor: { visitorUid } },
          select: ['id'],
        });
      if (conversation) {
        targetConversationId = conversation.id;
      } else {
        // No conversation exists yet, so we can't update metadata.
        // But we still update Redis for presence.
        await this.realtimeSessionService.setVisitorCurrentUrl(
          visitorUid,
          currentUrl
        );
        return null;
      }
    }

    // 2. Update Redis
    await this.realtimeSessionService.setVisitorCurrentUrl(
      visitorUid,
      currentUrl
    );

    // 3. Update DB Metadata
    try {
      const conversation = await this.entityManager
        .getRepository(Conversation)
        .findOne({
          where: { id: targetConversationId },
        });

      if (conversation) {
        if (!conversation.metadata) {
          conversation.metadata = {
            referrer: null,
            landingPage: currentUrl,
            urlHistory: [],
          };
        }

        const newEntry: NavigationEntry = {
          url: currentUrl,
          title: currentUrl,
          timestamp: new Date().toISOString(),
        };

        (conversation as any).metadata.urlHistory.push(newEntry);
        if (
          (conversation as any).metadata.urlHistory.length >
          MAX_URL_HISTORY_LENGTH
        ) {
          (conversation as any).metadata.urlHistory.shift();
        }

        await this.entityManager
          .getRepository(Conversation)
          .save(conversation as any);

        // 4. Emit ConversationUpdated
        const event = new ConversationUpdatedEvent();
        event.projectId = (conversation as any).projectId;
        event.payload = {
          conversationId: (conversation as any).id,
          fields: { metadata: (conversation as any).metadata },
        };
        this.eventEmitter.emit('conversation.updated', event);
      }
    } catch (error) {
      this.logger.error(`Error updating conversation metadata:`, error);
    }

    // 5. Emit VisitorContextUpdated
    const contextEvent = new VisitorContextUpdatedEvent();
    contextEvent.projectId = projectId;
    contextEvent.currentUrl = currentUrl;
    contextEvent.conversationId = targetConversationId!;
    this.eventEmitter.emit('visitor.context.updated', contextEvent);

    return targetConversationId!;
  }
}
