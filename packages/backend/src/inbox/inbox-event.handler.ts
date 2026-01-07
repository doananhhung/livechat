import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { VisitorIdentifiedEvent, VisitorMessageReceivedEvent } from './events';
import { ConversationService } from './services/conversation.service';
import { VisitorService } from './services/visitor.service';
import { RealtimeSessionService } from '../realtime-session/realtime-session.service';
import { BullMqProducerService } from '../event-producer/bullmq-producer.service';
import { EventsGateway } from '../gateway/events.gateway';
import { EntityManager } from 'typeorm';
import { WorkerEventTypes, WebSocketEvent, MessageSentPayload, HistoryVisibilityMode } from '@live-chat/shared-types';
import { Project } from '../database/entities';

/**
 * Expected payload structure from Redis pub/sub channel.
 * Used as a type guard to validate incoming messages.
 */
interface RedisMessagePayload {
  message: {
    id: string | number;
    content: string;
    conversationId: number;
    fromCustomer: boolean;
    status: string;
    createdAt: string;
  };
  tempId: string;
  visitorUid: string;
}

/**
 * Type guard to validate Redis message payload structure.
 * Returns true if the payload has all required fields with correct types.
 */
function isValidRedisMessagePayload(data: unknown): data is RedisMessagePayload {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const payload = data as Record<string, unknown>;

  // Check required top-level fields
  if (
    typeof payload.tempId !== 'string' ||
    typeof payload.visitorUid !== 'string' ||
    typeof payload.message !== 'object' ||
    payload.message === null
  ) {
    return false;
  }

  const message = payload.message as Record<string, unknown>;

  // Check required message fields
  if (
    (typeof message.id !== 'string' && typeof message.id !== 'number') ||
    typeof message.content !== 'string' ||
    typeof message.conversationId !== 'number'
  ) {
    return false;
  }

  return true;
}

@Injectable()
export class InboxEventHandlerService {
  private readonly logger = new Logger(InboxEventHandlerService.name);

  constructor(
    private readonly conversationService: ConversationService,
    private readonly visitorService: VisitorService,
    private readonly realtimeSessionService: RealtimeSessionService,
    private readonly bullMqProducerService: BullMqProducerService,
    private readonly eventsGateway: EventsGateway,
    private readonly entityManager: EntityManager
  ) {}

  @OnEvent('visitor.identified')
  async handleVisitorIdentified(payload: VisitorIdentifiedEvent) {
    this.logger.debug(
      `Handling visitor.identified event for visitorUid: ${payload.visitorUid}`
    );

    await this.realtimeSessionService.setVisitorSession(
      payload.visitorUid,
      payload.socketId
    );

    const { visitor, conversation } = await this.entityManager.transaction(
      async (manager) => {
        const visitor = await this.visitorService.findOrCreateByUid(
          payload.projectId,
          payload.visitorUid,
          manager
        );

        // Fetch project settings to determine history visibility
        const projectRepo = manager.getRepository(Project);
        const project = await projectRepo.findOne({
          where: { id: payload.projectId },
          select: ['id', 'widgetSettings'],
        });

        const historyMode: HistoryVisibilityMode = 
          project?.widgetSettings?.historyVisibility || 'limit_to_active';

        // Lazy conversation creation: Only find existing conversation based on mode.
        // do NOT create a new one. Conversation is created on first message.
        const conversation = 
          await this.conversationService.findConversationForWidget(
            payload.projectId,
            visitor.id,
            manager,
            historyMode
          );
        return { visitor, conversation };
      }
    );

    this.eventsGateway.prepareSocketForVisitor(
      payload.socketId,
      visitor,
      conversation, // Can be null for new visitors or limited history
      payload.projectId,
      payload.visitorUid
    );
  }

  @OnEvent('visitor.message.received')
  async handleVisitorMessageReceived(payload: VisitorMessageReceivedEvent) {
    this.logger.debug(
      `Handling visitor.message.received event from visitorUid: ${payload.visitorUid}`
    );

    await this.realtimeSessionService.setVisitorSession(
      payload.visitorUid,
      payload.socketId
    );
    this.logger.debug(
      `Reset session for visitorUid: ${payload.visitorUid} with socketId: ${payload.socketId}`
    );

    const eventPayload = {
      type: WorkerEventTypes.NEW_MESSAGE_FROM_VISITOR,
      payload: {
        tempId: payload.tempId,
        content: payload.content,
        visitorUid: payload.visitorUid,
        projectId: payload.projectId,
        socketId: payload.socketId,
      },
      timestamp: new Date().toISOString(),
    };

    await this.bullMqProducerService.sendMessage(eventPayload);
  }

  @OnEvent('redis.message.received')
  async handleRedisMessageReceived(messageData: string) {
    try {
      const data: unknown = JSON.parse(messageData);

      // Validate payload structure before processing
      if (!isValidRedisMessagePayload(data)) {
        this.logger.error(
          `Invalid Redis message payload structure: ${messageData.substring(0, 200)}`
        );
        return;
      }

      const { message, tempId, visitorUid } = data;
      this.logger.log(
        `Received new message from Redis channel: ${JSON.stringify(message)}`
      );

      const visitorSocketId =
        await this.realtimeSessionService.getVisitorSession(visitorUid);
      const messageForFrontend = {
        id: message.id,
        content: message.content,
        sender: {
          type: message.fromCustomer ? 'visitor' : 'agent',
        },
        status: message.status,
        timestamp: message.createdAt,
      };

      this.logger.debug(
        `message for frontend: ${JSON.stringify(messageForFrontend)}`
      );
      
      if (visitorSocketId) {
        const payload: MessageSentPayload = { tempId, finalMessage: messageForFrontend };
        this.eventsGateway.server
          .to(visitorSocketId)
          .emit(WebSocketEvent.MESSAGE_SENT, payload);
      }

      const conversation = await this.conversationService.findById(
        String(message.conversationId)
      );

      if (conversation && conversation.projectId) {
        const projectId = conversation.projectId;
        const roomName = `project:${projectId}`;

        this.eventsGateway.server.to(roomName).emit(WebSocketEvent.NEW_MESSAGE, message);

        this.logger.log(`Emitted '${WebSocketEvent.NEW_MESSAGE}' to room: ${roomName}`);
      }
    } catch (error) {
      this.logger.error('Error processing message from Redis:', error);
    }
  }
}