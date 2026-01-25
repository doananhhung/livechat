import { EntityManager } from 'typeorm';
import { CreateMessageDto, ListMessagesDto } from '@live-chat/shared-dtos';
import { Conversation, Message, User } from '../../database/entities';
import { MessageStatus } from '@live-chat/shared-types';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RealtimeSessionService } from '../../realtime-session/realtime-session.service';
import { ProjectService } from '../../projects/project.service';
import { MessagePersistenceService } from './persistence/message.persistence.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConversationService } from './conversation.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentMessageSentEvent } from '../events';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly realtimeSessionService: RealtimeSessionService,
    private readonly eventEmitter: EventEmitter2,
    private readonly projectService: ProjectService,
    private readonly messagePersistenceService: MessagePersistenceService,
    @InjectQueue('conversation-workflow-queue')
    private readonly workflowQueue: Queue,
    private readonly conversationService: ConversationService
  ) {}

  /**
   * Create a new message, called from EventConsumerService.
   * This method is designed to run inside a transaction.
   */
  async createMessageAndVerifySent(
    tempId: string,
    visitorUid: string,
    data: CreateMessageDto,
    manager: EntityManager
  ): Promise<Message> {
    const savedMessage = await this.messagePersistenceService.createMessage(
      tempId,
      visitorUid,
      data,
      manager
    );

    this.logger.log(
      `Message ${savedMessage.id} created for visitor ${visitorUid}. It will be sent via Redis pub/sub.`
    );

    return savedMessage;
  }

  /**
   * Send a reply message from an agent.
   * This method is called by InboxController.
   */
  async sendAgentReply(
    user: User,
    conversationId: string,
    replyText: string
  ): Promise<Message> {
    const { savedMessage, project, visitorSocketId } =
      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          // Step 1: Find related conversation and visitor
          const conversation = await transactionalEntityManager.findOne(
            Conversation,
            {
              where: { id: conversationId },
              relations: ['visitor', 'project'],
            }
          );

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

          // Step 2: Look up socket.id from Redis (Moved inside transaction to determine status)
          const visitorSocketId =
            await this.realtimeSessionService.getVisitorSession(visitorUid);

          const status = visitorSocketId
            ? MessageStatus.SENT
            : MessageStatus.DELIVERED;

          const message = transactionalEntityManager.create(Message, {
            conversation: { id: conversationId },
            content: replyText,
            senderId: user.id.toString(),
            recipientId: visitorUid,
            fromCustomer: false,
            status: status,
          });
          const saved = await transactionalEntityManager.save(message);

          // DEBUG: Verify DB state immediately
          await transactionalEntityManager
            .findOne(Message, { where: { id: saved.id } })
            .then((reloaded) => {
              this.logger.warn(
                `[DEBUG] Immediate DB read for ${saved.id}: status=${reloaded?.status}`
              );
            });

          // Update conversation last message and ID (don't increment unread for agent messages)
          await this.conversationService.updateLastMessage(
            conversationId,
            replyText,
            (saved as any).createdAt,
            (saved as any).id,
            transactionalEntityManager,
            false // Agent messages should not increment unread count
          );

          return {
            savedMessage: saved,
            project: (conversation as any).project,
            visitorSocketId,
          };
        }
      );

    // Step 4: Emit Event for Gateway to handle
    const event = new AgentMessageSentEvent();
    event.visitorSocketId = visitorSocketId;
    event.message = savedMessage as any;
    event.projectId = (project as any).id;
    this.eventEmitter.emit('agent.message.sent', event);

    this.logger.debug(`message: ${JSON.stringify(savedMessage)}`);
    this.logger.log(
      `Agent reply message ${(savedMessage as any).id} saved with status ${
        (savedMessage as any).status
      }`
    );

    // Step 5: Schedule Auto-Pending Job if enabled
    if (
      (project as any).autoResolveMinutes &&
      (project as any).autoResolveMinutes > 0
    ) {
      await this.workflowQueue.add(
        'auto-pending',
        {
          conversationId,
          projectId: (project as any).id,
          triggerMessageId: (savedMessage as any).id,
        },
        {
          delay: (project as any).autoResolveMinutes * 60 * 1000,
          jobId: `auto-pending-${(savedMessage as any).id}`, // Deduplicate by message ID if needed
          removeOnComplete: true,
        }
      );
      this.logger.log(
        `Scheduled auto-pending job for conversation ${conversationId} in ${
          (project as any).autoResolveMinutes
        } minutes.`
      );
    }

    return savedMessage as any;
  }

  async listByConversation(
    user: User,
    conversationId: string,
    query: ListMessagesDto
  ): Promise<any> {
    const limit = Number(query.limit) || 20;
    const { cursor } = query;

    // Permission check: Ensure user has access to this conversation
    const conversation = await this.entityManager.findOne(Conversation, {
      where: { id: conversationId },
      relations: ['project'],
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

    const qb = this.entityManager
      .createQueryBuilder(Message, 'message')
      .where('message.conversationId = :conversationId', { conversationId });

    if (cursor) {
      qb.andWhere('message.id < :cursor', { cursor });
    }

    qb.orderBy('message.createdAt', 'DESC').take(limit + 1); // Get 1 more to check hasNextPage

    const messages = await qb.getMany();

    const hasNextPage = messages.length > limit;
    if (hasNextPage) {
      messages.pop(); // Remove extra element
    }

    return {
      data: messages.reverse(), // Display oldest messages first
      hasNextPage,
      nextCursor: hasNextPage ? messages[0].id : null,
    };
  }
}
