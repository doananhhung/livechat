// src/event-consumer/event-consumer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  MessageStatus,
  WorkerEventTypes,
  WorkerEvent,
  NewMessageFromVisitorPayload,
  HistoryVisibilityMode,
} from '@live-chat/shared-types';
import { VisitorPersistenceService } from '../inbox/services/persistence/visitor.persistence.service';
import { ConversationPersistenceService } from '../inbox/services/persistence/conversation.persistence.service';
import { MessagePersistenceService } from '../inbox/services/persistence/message.persistence.service';
import { OutboxPersistenceService } from './outbox.persistence.service';
import { Project } from '../database/entities';

@Injectable()
export class EventConsumerService {
  private readonly logger = new Logger(EventConsumerService.name);

  constructor(
    private readonly conversationPersistenceService: ConversationPersistenceService,
    private readonly visitorPersistenceService: VisitorPersistenceService,
    private readonly messagePersistenceService: MessagePersistenceService,
    private readonly outboxPersistenceService: OutboxPersistenceService,
    private readonly entityManager: EntityManager
  ) {}

  /**
   * Process an incoming worker event.
   * Uses typed events from @live-chat/shared-types for type safety.
   */
  public async processEvent(event: WorkerEvent): Promise<void> {
    const { type, payload } = event;

    this.logger.log(`Processing event type: ${type}`);

    try {
      switch (type) {
        case WorkerEventTypes.NEW_MESSAGE_FROM_VISITOR:
          await this.handleNewMessageFromVisitor(
            payload as NewMessageFromVisitorPayload
          );
          break;
        default:
          this.logger.warn(`Unhandled event type: ${type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing event ${type}`, error);
      throw error;
    }
  }

  private async handleNewMessageFromVisitor(
    payload: NewMessageFromVisitorPayload
  ): Promise<void> {
    this.logger.log(`Handling new message from visitor: ${payload.visitorUid}`);
    const { tempId, visitorUid, projectId, content } = payload;

    await this.entityManager.transaction(async (manager) => {
      this.logger.log(`[Transaction] Started for visitor: ${visitorUid}`);

      const visitor = await this.visitorPersistenceService.findOrCreateByUid(
        projectId,
        visitorUid,
        manager
      );
      this.logger.log(`[Transaction] Found or created visitor: ${visitor.id}`);

      // Fetch project settings to determine history visibility
      const projectRepo = manager.getRepository(Project);
      const project = await projectRepo.findOne({
        where: { id: projectId },
        select: ['id', 'widgetSettings'],
      });

      const historyMode: HistoryVisibilityMode = 
        project?.widgetSettings?.historyVisibility || 'limit_to_active';

      const conversation =
        await this.conversationPersistenceService.findOrCreateByVisitorId(
          projectId,
          visitor.id,
          manager,
          historyMode
        );
      this.logger.log(
        `[Transaction] Found or created conversation: ${conversation.id}`
      );

      const savedMessage = await this.messagePersistenceService.createMessage(
        tempId,
        visitorUid,
        {
          conversationId: Number(conversation.id),
          content: content,
          senderId: visitor.visitorUid,
          recipientId: `project_${projectId}`,
          fromCustomer: true,
          status: MessageStatus.SENT,
        },
        manager
      );
      this.logger.log(`[Transaction] Created message: ${savedMessage.id}`);

      await this.conversationPersistenceService.updateLastMessage(
        conversation.id,
        content,
        new Date(),
        savedMessage.id,
        manager
      );
      this.logger.log(
        `[Transaction] Updated last message for conversation: ${conversation.id}`
      );

      // Use OutboxPersistenceService instead of raw SQL
      await this.outboxPersistenceService.createEvent(
        'message',
        savedMessage.id,
        WorkerEventTypes.NEW_MESSAGE_FROM_VISITOR,
        {
          message: savedMessage,
          tempId,
          visitorUid,
          projectId,
        },
        manager
      );
      this.logger.log(
        `[Transaction] Inserted event for message ${savedMessage.id} into outbox.`
      );
    });
  }
}