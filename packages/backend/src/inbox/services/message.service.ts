
// src/inbox/services/message.service.ts

import { EntityManager } from 'typeorm';
import {
  CreateMessageDto,
  ListMessagesDto,
} from '@live-chat/shared-dtos';
import {
  Conversation,
  Message,
  User,
  Project,
} from '../../database/entities';
import { MessageStatus, WebSocketEvent } from '@live-chat/shared-types';
import { EventsGateway } from '../../gateway/events.gateway';
import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RealtimeSessionService } from '../../realtime-session/realtime-session.service';
import { ProjectService } from '../../projects/project.service';
import { MessagePersistenceService } from './persistence/message.persistence.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConversationService } from './conversation.service';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly realtimeSessionService: RealtimeSessionService,
    private readonly eventsGateway: EventsGateway,
    private readonly projectService: ProjectService,
    private readonly messagePersistenceService: MessagePersistenceService,
    @InjectQueue('conversation-workflow-queue') private readonly workflowQueue: Queue,
    private readonly conversationService: ConversationService
  ) {
    this.logger.log(`EventGateWay server: ${this.eventsGateway.server}`);
  }

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
    const { savedMessage, project } = await this.entityManager.transaction(
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
          conversation.projectId,
          user.id
        );

        const visitorUid = conversation.visitor.visitorUid;

        // Step 2: Create and save message to DB
        const message = transactionalEntityManager.create(Message, {
          conversation: { id: conversationId },
          content: replyText,
          senderId: user.id.toString(),
          recipientId: visitorUid,
          fromCustomer: false,
          status: MessageStatus.SENDING,
        });
        const saved = await transactionalEntityManager.save(message);

        // Update conversation last message and ID (don't increment unread for agent messages)
        await this.conversationService.updateLastMessage(
            conversationId,
            replyText,
            saved.createdAt,
            saved.id,
            transactionalEntityManager,
            false // Agent messages should not increment unread count
        );

        return { savedMessage: saved, project: conversation.project };
      }
    );

    // Subsequent steps do not interact with DB, can be outside transaction
    // Step 3: Look up socket.id from Redis
    const visitorSocketId = await this.realtimeSessionService.getVisitorSession(
      savedMessage.recipientId
    );

    // Step 4: Send real-time event and update final status
    if (visitorSocketId) {
      this.eventsGateway.sendReplyToVisitor(visitorSocketId, savedMessage);
      savedMessage.status = MessageStatus.SENT;
    } else {
      savedMessage.status = MessageStatus.DELIVERED;
    }

    this.logger.debug(`message: ${JSON.stringify(savedMessage)}`);

    this.logger.log(
      `Agent reply message ${savedMessage.id} status updated to ${savedMessage.status}`
    );

    // Step 4b: Broadcast to project room for agent dashboard real-time updates
    this.eventsGateway.server
      .to(`project:${project.id}`)
      .emit(WebSocketEvent.NEW_MESSAGE, savedMessage);
    
    const updatedMessage = await this.entityManager.save(savedMessage);

    // Step 5: Schedule Auto-Pending Job if enabled
    if (project.autoResolveMinutes && project.autoResolveMinutes > 0) {
        await this.workflowQueue.add(
            'auto-pending',
            {
                conversationId,
                projectId: project.id,
                triggerMessageId: updatedMessage.id,
            },
            {
                delay: project.autoResolveMinutes * 60 * 1000,
                jobId: `auto-pending-${updatedMessage.id}`, // Deduplicate by message ID if needed
                removeOnComplete: true,
            }
        );
        this.logger.log(`Scheduled auto-pending job for conversation ${conversationId} in ${project.autoResolveMinutes} minutes.`);
    }

    return updatedMessage;
  }

  async listByConversation(
    user: User,
    conversationId: string,
    query: ListMessagesDto
  ): Promise<any> {
    const { limit = 20, cursor } = query;

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
      conversation.projectId,
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
