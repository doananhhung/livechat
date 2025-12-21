// src/event-consumer/event-consumer.service.ts
import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ConversationService } from '../inbox/services/conversation.service';
import { VisitorService } from '../inbox/services/visitor.service';
import { MessageService } from '../inbox/services/message.service';
import { MessageStatus } from '@live-chat/shared-types';
import { type Redis } from 'ioredis';
import { REDIS_PUBLISHER_CLIENT } from '../redis/redis.module';

@Injectable()
export class EventConsumerService {
  private readonly logger = new Logger(EventConsumerService.name);

  constructor(
    private readonly conversationService: ConversationService,
    private readonly visitorService: VisitorService,
    private readonly messageService: MessageService,
    private readonly entityManager: EntityManager,
    @Inject(REDIS_PUBLISHER_CLIENT) private readonly redisPublisher: Redis
  ) {}

  public async processEvent(event: any) {
    const { type, payload } = event;

    this.logger.log(`Processing event type: ${type}`);

    try {
        if (type === 'NEW_MESSAGE_FROM_VISITOR') {
            await this.handleNewMessageFromVisitor(payload);
        } else {
            this.logger.warn(`Unhandled event type: ${type}`);
        }
    } catch (error) {
        this.logger.error(`Error processing event ${type}`, error);
        throw error;
    }
  }

  private async handleNewMessageFromVisitor(payload: {
    tempId: string;
    content: string;
    visitorUid: string;
    projectId: number;
    socketId: string;
  }) {
    this.logger.log(`Handling new message from visitor: ${payload.visitorUid}`);
    const { tempId, visitorUid, projectId, content } = payload;

    await this.entityManager.transaction(async (manager) => {
      this.logger.log(`[Transaction] Started for visitor: ${visitorUid}`);
      const visitor = await this.visitorService.findOrCreateByUid(
        projectId,
        visitorUid,
        manager
      );
      this.logger.log(`[Transaction] Found or created visitor: ${visitor.id}`);

      const conversation =
        await this.conversationService.findOrCreateByVisitorId(
          projectId,
          visitor.id,
          manager
        );
      this.logger.log(
        `[Transaction] Found or created conversation: ${conversation.id}`
      );

      const savedMessage = await this.messageService.createMessageAndVerifySent(
        tempId,
        visitorUid,
        {
          conversationId: conversation.id,
          content: content,
          senderId: visitor.visitorUid,
          recipientId: `project_${projectId}`,
          fromCustomer: true,
          status: MessageStatus.SENT,
        },
        manager
      );
      this.logger.log(`[Transaction] Created message: ${savedMessage.id}`);

      await this.conversationService.updateLastMessage(
        conversation.id,
        content,
        new Date(),
        manager
      );
      this.logger.log(
        `[Transaction] Updated last message for conversation: ${conversation.id}`
      );

      const eventPayloadForOutbox = {
        message: savedMessage,
        tempId: tempId,
        visitorUid: visitorUid,
      };

      await manager.query(
        `INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload)
         VALUES ($1, $2, $3, $4)`,
        [
          'message',
          savedMessage.id,
          'NEW_MESSAGE_FROM_VISITOR',
          eventPayloadForOutbox,
        ]
      );
      this.logger.log(
        `[Transaction] Inserted event for message ${savedMessage.id} into outbox.`
      );
    });
  }
}
