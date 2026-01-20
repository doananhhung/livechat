import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import {
  VisitorIdentifiedEvent,
  VisitorMessageReceivedEvent,
  VisitorSessionReadyEvent,
  VisitorMessageProcessedEvent,
  AgentMessageSentEvent,
  UpdateContextRequestEvent,
} from './events';
import { VisitorDisconnectedEvent } from '../visitors/events';
import { ConversationService } from './services/conversation.service';
import { VisitorService } from './services/visitor.service';
import { RealtimeSessionService } from '../realtime-session/realtime-session.service';
import { BullMqProducerService } from '../event-producer/bullmq-producer.service';
import { EntityManager } from 'typeorm';
import {
  WorkerEventTypes,
  WebSocketEvent,
  MessageSentPayload,
  HistoryVisibilityMode,
} from '@live-chat/shared-types';
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
function isValidRedisMessagePayload(
  data: unknown
): data is RedisMessagePayload {
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
    private readonly eventEmitter: EventEmitter2,
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

    let messagesForFrontend: any[] = [];
    if (
      conversation &&
      conversation.messages &&
      conversation.messages.length > 0
    ) {
      messagesForFrontend = conversation.messages.map((msg) => ({
        id: msg.id,
        content: msg.content || '',
        senderId: msg.senderId,
        fromCustomer: msg.fromCustomer,
        conversationId: msg.conversationId,
        status: msg.status as any,
        createdAt:
          typeof msg.createdAt === 'string'
            ? msg.createdAt
            : msg.createdAt.toISOString(),
        contentType: msg.contentType,
        metadata: msg.metadata,
      }));
    }

    const event = new VisitorSessionReadyEvent();
    event.socketId = payload.socketId;
    event.visitor = visitor;
    event.conversation = conversation;
    event.projectId = payload.projectId;
    event.visitorUid = payload.visitorUid;
    event.messages = messagesForFrontend;
    this.eventEmitter.emit('visitor.session.ready', event);
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
        sessionMetadata: payload.sessionMetadata,
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
        senderId: (message as any).senderId,
        fromCustomer: message.fromCustomer,
        conversationId: message.conversationId,
        status: message.status,
        createdAt: message.createdAt,
      };

      this.logger.debug(
        `message for frontend: ${JSON.stringify(messageForFrontend)}`
      );

      if (visitorSocketId) {
        const event = new VisitorMessageProcessedEvent();
        event.visitorSocketId = visitorSocketId;
        event.payload = { tempId, finalMessage: messageForFrontend };
        this.eventEmitter.emit('visitor.message.processed', event);
      }

      // We still need to broadcast to the project room, but we can do it via event or keep it here?
      // The blueprint says "Emit VisitorMessageProcessedEvent instead of calling Gateway methods directly".
      // But the Gateway method called was `server.to(roomName).emit(...)`.
      // We can emit an event for this too, or let the GatewayEventListener handle it.
      // Let's use a generic event or reuse AgentMessageSentEvent? No, this is a visitor message.
      // Let's add a new event or just use the existing pattern.
      // Actually, `InboxEventHandlerService` was calling `eventsGateway.server.to(roomName).emit(WebSocketEvent.NEW_MESSAGE, message);`
      // I should probably move this to `GatewayEventListener` as well.
      // I'll reuse `AgentMessageSentEvent` but that implies agent.
      // I'll create a generic `MessageBroadcastEvent`? Or just use `AgentMessageSentEvent` logic which does exactly this.
      // But `AgentMessageSentEvent` takes a `Message` entity. `message` here is a plain object from Redis.
      // I'll just emit `AgentMessageSentEvent` with the message object casted, as the listener just emits it.
      // Wait, `AgentMessageSentEvent` expects `Message` entity.
      // Let's just add a `BroadcastMessageEvent`.
      // Or better, `VisitorMessageProcessedEvent` can handle the broadcast too if I add `projectId` and `message` to it.

      // Let's modify `VisitorMessageProcessedEvent` in `src/inbox/events.ts` (I can't modify it again in this turn easily without re-outputting).
      // I'll just use `AgentMessageSentEvent` logic but I need to be careful about types.
      // Actually, I can just emit `agent.message.sent` with `visitorSocketId: null` and `message: message as any`.
      // The listener does: `if (visitorSocketId) ...; server.to(project).emit(...)`.
      // This fits perfectly.

      const conversation = await this.conversationService.findById(
        String(message.conversationId)
      );

      if (conversation && conversation.projectId) {
        const event = new AgentMessageSentEvent(); // Reusing this event for broadcasting
        event.visitorSocketId = null; // Already handled above via VisitorMessageProcessedEvent if needed, or I can combine them.
        // Actually, let's just use this event for the broadcast part.
        event.message = message as any;
        event.projectId = conversation.projectId;
        this.eventEmitter.emit('agent.message.sent', event);
      }
    } catch (error) {
      this.logger.error('Error processing message from Redis:', error);
    }
  }

  @OnEvent('visitor.disconnected')
  async handleVisitorDisconnected(
    event: VisitorDisconnectedEvent
  ): Promise<void> {
    this.logger.debug(
      `Handling visitor.disconnected for visitorUid: ${event.visitorUid}`
    );

    // Truncate URL history to 5 entries on disconnect
    if (event.conversationId) {
      try {
        await this.conversationService.truncateUrlHistory(
          event.conversationId,
          5
        );
      } catch (err) {
        this.logger.error(
          `Failed to truncate URL history for conversation ${event.conversationId}`,
          err
        );
      }
    }
  }

  @OnEvent('update.context.request')
  async handleUpdateContextRequest(
    event: UpdateContextRequestEvent
  ): Promise<void> {
    this.logger.debug(
      `Handling update.context.request for visitorUid: ${event.visitorUid}`
    );

    try {
      await this.realtimeSessionService.setVisitorCurrentUrl(
        event.visitorUid,
        event.currentUrl
      );
    } catch (err) {
      this.logger.error(`Failed to update visitor current URL in Redis`, err);
    }

    const resolvedConversationId = await this.conversationService.updateContext(
      event.projectId,
      event.visitorUid,
      event.currentUrl,
      event.conversationId
    );

    // Emit response event with resolved conversation ID so Gateway can update socket data
    if (resolvedConversationId) {
      this.eventEmitter.emit('context.updated.response', {
        socketId: event.socketId,
        conversationId: resolvedConversationId,
      });
    }
  }
}
