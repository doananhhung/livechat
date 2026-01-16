
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
  VisitorContextUpdatedEvent
} from '../inbox/events';
import { WebSocketEvent, VisitorContextUpdatedPayload } from '@live-chat/shared-types';

@Injectable()
export class GatewayEventListener {
  private readonly logger = new Logger(GatewayEventListener.name);

  constructor(private readonly eventsGateway: EventsGateway) {}

  @OnEvent('visitor.updated')
  handleVisitorUpdated(event: VisitorUpdatedEvent) {
    this.logger.log(`Broadcasting visitor updated for visitor ${event.visitorId} in project ${event.projectId}`);
    this.eventsGateway.server.to(`project:${event.projectId}`).emit(WebSocketEvent.VISITOR_UPDATED, {
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
    this.eventsGateway.emitConversationDeleted(event.projectId, event.conversationId);
  }

  @OnEvent('agent.typing')
  handleAgentTyping(event: AgentTypingEvent) {
    this.eventsGateway.sendAgentTypingToVisitor(event.visitorSocketId, event.isTyping, event.agentName);
  }

  @OnEvent('agent.message.sent')
  handleAgentMessageSent(event: AgentMessageSentEvent) {
    if (event.visitorSocketId) {
      this.eventsGateway.sendReplyToVisitor(event.visitorSocketId, event.message);
    }
    // Broadcast to project room
    this.eventsGateway.server.to(`project:${event.projectId}`).emit(WebSocketEvent.NEW_MESSAGE, event.message);
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
    this.eventsGateway.visitorMessageSent(event.visitorSocketId, event.payload);
  }

  @OnEvent('visitor.context.updated')
  handleVisitorContextUpdated(event: VisitorContextUpdatedEvent) {
    const broadcastPayload: VisitorContextUpdatedPayload = {
      conversationId: event.conversationId,
      currentUrl: event.currentUrl,
    };
    this.eventsGateway.server.to(`project:${event.projectId}`).emit(WebSocketEvent.VISITOR_CONTEXT_UPDATED, broadcastPayload);
  }

  @OnEvent('context.updated.response')
  handleContextUpdatedResponse(event: { socketId: string; conversationId: string }) {
    const socket = this.eventsGateway.server.sockets.sockets.get(event.socketId);
    if (socket) {
      socket.data.conversationId = event.conversationId;
      this.logger.debug(`Updated conversationId on socket ${event.socketId} to ${event.conversationId}`);
    }
  }

  @OnEvent('automation.triggered')
  handleAutomationTriggered(event: { projectId: number; conversationId: string; type: string; message: string }) {
    this.eventsGateway.server.to(`project:${event.projectId}`).emit('automation.triggered', {
      conversationId: event.conversationId,
      type: event.type,
      message: event.message,
    });
  }
}
