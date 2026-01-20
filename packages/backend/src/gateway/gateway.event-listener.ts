import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventsGateway } from './events.gateway';
import { VisitorUpdatedEvent } from '../visitors/events';
import {
  ConversationUpdatedEvent,
  ConversationDeletedEvent,
  AgentTypingEvent,
  AgentMessageSentEvent,
  VisitorSessionReadyEvent,
  VisitorMessageProcessedEvent,
  VisitorContextUpdatedEvent,
} from '../inbox/events';
import {
  WebSocketEvent,
  VisitorContextUpdatedPayload,
  AutomationTriggeredPayload,
  WidgetMessageDto,
} from '@live-chat/shared-types';
import { Message } from '../database/entities';

@Injectable()
export class GatewayEventListener {
  private readonly logger = new Logger(GatewayEventListener.name);

  constructor(private readonly eventsGateway: EventsGateway) {}

  @OnEvent('visitor.updated')
  handleVisitorUpdated(event: VisitorUpdatedEvent) {
    this.logger.log(
      `Broadcasting visitor updated for visitor ${event.visitorId} in project ${event.projectId}`
    );
    this.eventsGateway.server
      .to(`project:${event.projectId}`)
      .emit(WebSocketEvent.VISITOR_UPDATED, {
        projectId: event.projectId,
        visitorId: event.visitorId,
        visitor: event.visitor,
      });
  }

  @OnEvent('conversation.updated')
  handleConversationUpdated(event: ConversationUpdatedEvent) {
    this.eventsGateway.emitConversationUpdated(event.projectId, event.payload);
  }

  @OnEvent('conversation.deleted')
  handleConversationDeleted(event: ConversationDeletedEvent) {
    this.eventsGateway.emitConversationDeleted(
      event.projectId,
      event.conversationId
    );
  }

  @OnEvent('agent.typing')
  handleAgentTyping(event: AgentTypingEvent) {
    this.eventsGateway.sendAgentTypingToVisitor(
      event.visitorSocketId,
      event.isTyping,
      event.agentName
    );
  }

  @OnEvent('agent.message.sent')
  handleAgentMessageSent(event: AgentMessageSentEvent) {
    if (event.visitorSocketId) {
      this.eventsGateway.sendReplyToVisitor(
        event.visitorSocketId,
        this.mapToWidgetMessageDto(event.message)
      );
    }
    // Broadcast to project room
    this.eventsGateway.server
      .to(`project:${event.projectId}`)
      .emit(WebSocketEvent.NEW_MESSAGE, event.message);
  }

  @OnEvent('visitor.session.ready')
  handleVisitorSessionReady(event: VisitorSessionReadyEvent) {
    this.eventsGateway.prepareSocketForVisitor(
      event.socketId,
      event.visitor,
      event.conversation,
      event.projectId,
      event.visitorUid,
      event.messages
    );
  }

  @OnEvent('visitor.message.processed')
  handleVisitorMessageProcessed(event: VisitorMessageProcessedEvent) {
    // Update socket conversationId if it's a new conversation
    const socket = this.eventsGateway.server.sockets.sockets.get(
      event.visitorSocketId
    );
    if (
      socket &&
      event.payload.finalMessage &&
      event.payload.finalMessage.conversationId
    ) {
      const newConvId = String(event.payload.finalMessage.conversationId);
      if (socket.data.conversationId !== newConvId) {
        socket.data.conversationId = newConvId;
        this.logger.debug(
          `Updated conversationId on socket ${event.visitorSocketId} to ${newConvId} (from message processed)`
        );
      }
    }
    this.eventsGateway.visitorMessageSent(event.visitorSocketId, event.payload);
  }

  @OnEvent('visitor.context.updated')
  handleVisitorContextUpdated(event: VisitorContextUpdatedEvent) {
    const broadcastPayload: VisitorContextUpdatedPayload = {
      conversationId: event.conversationId,
      currentUrl: event.currentUrl,
    };
    this.eventsGateway.server
      .to(`project:${event.projectId}`)
      .emit(WebSocketEvent.VISITOR_CONTEXT_UPDATED, broadcastPayload);
  }

  @OnEvent('context.updated.response')
  handleContextUpdatedResponse(event: {
    socketId: string;
    conversationId: string;
  }) {
    const socket = this.eventsGateway.server.sockets.sockets.get(
      event.socketId
    );
    if (socket) {
      socket.data.conversationId = event.conversationId;
      this.logger.debug(
        `Updated conversationId on socket ${event.socketId} to ${event.conversationId}`
      );
    }
  }

  @OnEvent('automation.triggered')
  handleAutomationTriggered(
    event: AutomationTriggeredPayload & { projectId: number }
  ) {
    const payload: AutomationTriggeredPayload = {
      conversationId: event.conversationId,
      type: event.type,
      message: event.message,
    };
    this.eventsGateway.server
      .to(`project:${event.projectId}`)
      .emit(WebSocketEvent.AUTOMATION_TRIGGERED, payload);
  }

  @OnEvent('form.request.sent')
  async handleFormRequestSent(event: {
    message: any;
    conversationId: number;
    projectId: number;
    visitorUid?: string;
  }) {
    this.logger.log(
      `Broadcasting form request to project:${event.projectId} and visitor:${event.visitorUid}`
    );

    // Broadcast to project room for agents
    this.eventsGateway.server
      .to(`project:${event.projectId}`)
      .emit(WebSocketEvent.NEW_MESSAGE, event.message);

    // Send to visitor socket if available
    if (event.visitorUid) {
      const visitorSocketId = await this.getVisitorSocket(event.visitorUid);
      if (visitorSocketId) {
        // Send full message through AGENT_REPLIED (consistent with text messages)
        this.eventsGateway.server
          .to(visitorSocketId)
          .emit(WebSocketEvent.AGENT_REPLIED, event.message);
      }
    }
  }

  private async getVisitorSocket(visitorUid: string): Promise<string | null> {
    // Access the server sockets to find the visitor's socket by their UID
    for (const [socketId, socket] of this.eventsGateway.server.sockets
      .sockets) {
      if (socket.data.visitorUid === visitorUid) {
        return socketId;
      }
    }
    return null;
    return null;
  }

  private mapToWidgetMessageDto(message: Message): WidgetMessageDto {
    return {
      ...message,
      conversationId: Number(message.conversationId),
      content: message.content,
      createdAt:
        message.createdAt instanceof Date
          ? message.createdAt.toISOString()
          : message.createdAt,
      contentType: message.contentType,
      metadata: message.metadata ?? undefined,
    };
  }
}
