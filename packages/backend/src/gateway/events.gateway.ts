import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { WsAuthService } from './services/ws-auth.service';
import { Server, Socket } from 'socket.io';
import {
  Logger,
  Inject,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RealtimeSessionService } from '../realtime-session/realtime-session.service';
import { type Redis } from 'ioredis';
import { REDIS_SUBSCRIBER_CLIENT } from '../redis/redis.module';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  VisitorIdentifiedEvent,
  VisitorMessageReceivedEvent,
} from '../inbox/events';
import {
  VisitorDisconnectedEvent,
  VisitorConnectedEvent,
} from '../visitors/events';
import { Conversation, Visitor } from '../database/entities';
import {
  MessageStatus,
  WidgetMessageDto,
  WebSocketEvent,
} from '@live-chat/shared-types';
import { ProjectService } from '../projects/project.service';
import { ActionsService } from '../actions/actions.service';
import { ConfigService } from '@nestjs/config';
import {
  IdentifyPayload,
  SendMessagePayload,
  VisitorTypingPayload,
  UpdateContextPayload,
  JoinRoomPayload,
  AgentTypingPayload,
  VisitorTypingBroadcastPayload,
  ConversationUpdatedPayload,
  VisitorStatusChangedPayload,
  VisitorFillingFormPayload,
  FormRequestSentPayload,
  FormSubmittedPayload,
  FormUpdatedPayload,
  FormDeletedPayload,
  SubmitFormPayload,
} from '@live-chat/shared-types';

import { UpdateContextRequestEvent } from '../inbox/events';

const NEW_MESSAGE_CHANNEL = 'new_message_channel';

@UseGuards(WsJwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@WebSocketGateway()
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly realtimeSessionService: RealtimeSessionService,
    @Inject(REDIS_SUBSCRIBER_CLIENT) private readonly redisSubscriber: Redis,
    private readonly eventEmitter: EventEmitter2,
    private readonly projectService: ProjectService,
    private readonly wsAuthService: WsAuthService,
    private readonly actionsService: ActionsService
  ) {}

  public emitToProject(projectId: number, event: string, payload: any) {
    this.logger.log(`Emitting ${event} to project:${projectId}`);
    this.server.to(`project:${projectId}`).emit(event, payload);
  }

  public emitConversationUpdated(
    projectId: number,
    payload: ConversationUpdatedPayload
  ) {
    this.logger.log(`Emitting conversationUpdated to project:${projectId}`);
    this.server
      .to(`project:${projectId}`)
      .emit(WebSocketEvent.CONVERSATION_UPDATED, payload);
  }

  public emitConversationDeleted(projectId: number, conversationId: string) {
    this.logger.log(`Emitting conversationDeleted to project:${projectId}`);
    this.server
      .to(`project:${projectId}`)
      .emit(WebSocketEvent.CONVERSATION_DELETED, { conversationId });
  }

  /**
   * Emits a VISITOR_STATUS_CHANGED event to all clients in the project room.
   * @param projectId The ID of the project.
   * @param visitorUid The UID of the visitor whose status changed.
   * @param isOnline The new online status of the visitor.
   */
  public emitVisitorStatusChanged(
    projectId: number,
    visitorUid: string,
    isOnline: boolean
  ) {
    this.logger.log(
      `Emitting VISITOR_STATUS_CHANGED for visitorUid:${visitorUid} (isOnline: ${isOnline}) to project:${projectId}`
    );
    const payload: VisitorStatusChangedPayload = {
      visitorUid,
      projectId,
      isOnline,
    };
    this.server
      .to(`project:${projectId}`)
      .emit(WebSocketEvent.VISITOR_STATUS_CHANGED, payload);
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    const result = await this.wsAuthService.validateConnection(client);

    if (!result.valid) {
      this.logger.warn(`Connection rejected for ${client.id}: ${result.error}`);
      client.disconnect(true);
      return;
    }

    if (result.user) {
      client.data.user = result.user;
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    if (client.data.visitorUid && client.data.projectId) {
      this.realtimeSessionService.deleteVisitorSession(
        client.data.visitorUid,
        client.id
      );
      // Emit visitor offline status change
      this.emitVisitorStatusChanged(
        client.data.projectId,
        client.data.visitorUid,
        false
      );

      // Emit visitor.disconnected event for domain handlers to process
      const disconnectedEvent = new VisitorDisconnectedEvent();
      disconnectedEvent.projectId = client.data.projectId;
      disconnectedEvent.visitorUid = client.data.visitorUid;
      disconnectedEvent.conversationId = client.data.conversationId;
      this.eventEmitter.emit('visitor.disconnected', disconnectedEvent);
    }
  }

  afterInit(server: Server) {
    this.logger.log('Gateway Initialized. Subscribing to Redis channel...');
    this.redisSubscriber.subscribe(NEW_MESSAGE_CHANNEL, (err) => {
      if (err) {
        this.logger.error('Failed to subscribe to Redis channel', err);
      } else {
        this.logger.log(`Subscribed successfully to "${NEW_MESSAGE_CHANNEL}"`);
      }
    });

    this.redisSubscriber.on('message', (channel, message) => {
      this.logger.log(`Received message on channel: ${channel}`);
      if (channel === NEW_MESSAGE_CHANNEL) {
        this.eventEmitter.emit('redis.message.received', message);
      }
    });

    this.server.use((socket, next) => {
      socket.onAny((event, ...args) => {
        this.logger.log(`Socket event: ${event}`, {
          socketId: socket.id,
        });
      });
      next();
    });
  }

  public prepareSocketForVisitor(
    socketId: string,
    visitor: Visitor,
    conversation: Conversation | null,
    projectId: number,
    visitorUid: string,
    messages: WidgetMessageDto[] = []
  ) {
    const socket = this.server.sockets.sockets.get(socketId);
    if (!socket) {
      this.logger.warn(`Could not find socket with id: ${socketId}`);
      return;
    }

    socket.data.projectId = projectId;
    socket.data.visitorUid = visitorUid;

    if (visitor && visitor.id) {
      this.logger.log(
        `Associating visitorId ${visitor.id} with socket ${socket.id}`
      );
      socket.data.visitorId = visitor.id;
    }

    // Handle lazy conversation creation: conversation may be null for new visitors
    if (conversation) {
      socket.data.conversationId = conversation.id;

      if (messages.length > 0) {
        this.logger.log(
          `Loaded ${messages.length} messages for conversationId ${conversation.id}`
        );
      } else {
        this.logger.log(
          `No messages found for conversationId ${conversation.id}`
        );
      }
    } else {
      // New visitor - no conversation yet (will be created on first message)
      this.logger.log(
        `No existing conversation for visitor ${visitorUid} - will be created on first message`
      );
    }

    this.logger.log(`Emitting conversationHistory to ${socket.id}`);
    socket.emit(WebSocketEvent.CONVERSATION_HISTORY, {
      messages: messages,
    });
  }

  @SubscribeMessage(WebSocketEvent.IDENTIFY)
  async handleIdentify(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: IdentifyPayload
  ): Promise<void> {
    this.logger.debug(
      `Identify event from client ${client.id} for visitorUid: ${payload.visitorUid} in projectId: ${payload.projectId}`
    );

    const event = new VisitorIdentifiedEvent();
    event.projectId = payload.projectId;
    event.visitorUid = payload.visitorUid;
    event.socketId = client.id;
    this.eventEmitter.emit('visitor.identified', event);

    // Emit visitor online status change
    this.emitVisitorStatusChanged(payload.projectId, payload.visitorUid, true);

    // Emit visitor.connected event for domain handlers to process
    const connectedEvent = new VisitorConnectedEvent();
    connectedEvent.projectId = payload.projectId;
    connectedEvent.visitorUid = payload.visitorUid;
    this.eventEmitter.emit('visitor.connected', connectedEvent);
  }

  @SubscribeMessage(WebSocketEvent.SEND_MESSAGE)
  async handleSendMessage(
    @MessageBody() data: SendMessagePayload,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    if (!client.data.visitorUid || !client.data.projectId) {
      return;
    }

    const event = new VisitorMessageReceivedEvent();
    event.tempId = data.tempId;
    event.content = data.content;
    event.visitorUid = client.data.visitorUid;
    event.projectId = client.data.projectId;
    event.socketId = client.id;
    event.sessionMetadata = data.sessionMetadata; // Pass sessionMetadata
    this.eventEmitter.emit('visitor.message.received', event);
  }

  @SubscribeMessage(WebSocketEvent.VISITOR_TYPING)
  handleVisitorTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: VisitorTypingPayload
  ): void {
    const { projectId, conversationId } = client.data;
    if (projectId) {
      this.logger.log(`Emitting visitorIsTyping to project ${projectId}`);
      const broadcastPayload: VisitorTypingBroadcastPayload = {
        conversationId,
        isTyping: payload.isTyping,
      };
      this.server
        .to(`project:${projectId}`)
        .emit(WebSocketEvent.VISITOR_TYPING, broadcastPayload);
    }
  }

  @SubscribeMessage(WebSocketEvent.UPDATE_CONTEXT)
  async handleUpdateContext(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: UpdateContextPayload
  ): Promise<void> {
    const { projectId, visitorUid } = client.data;
    let { conversationId } = client.data;

    this.logger.debug(
      `updateContext event from client ${client.id} for visitorUid: ${visitorUid} in projectId: ${projectId}`
    );

    // Validate required fields
    if (!projectId) {
      this.logger.warn(
        `Missing projectId for socket ${client.id} in handleUpdateContext`
      );
      return;
    }
    if (!visitorUid) {
      this.logger.warn(
        `Missing visitorUid for socket ${client.id} in handleUpdateContext`
      );
      return;
    }

    // Emit update.context.request event for domain handlers to process
    const contextEvent = new UpdateContextRequestEvent();
    contextEvent.projectId = projectId;
    contextEvent.visitorUid = visitorUid;
    contextEvent.currentUrl = payload.currentUrl;
    contextEvent.conversationId = conversationId;
    contextEvent.socketId = client.id;
    this.eventEmitter.emit('update.context.request', contextEvent);
  }

  @SubscribeMessage(WebSocketEvent.JOIN_PROJECT_ROOM)
  async handleJoinProjectRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload
  ): Promise<{ status: string; roomName: string }> {
    // Security Check: Ensure user is authenticated
    if (!client.data.user) {
      throw new WsException(
        'Unauthorized: You must be logged in to join a project room.'
      );
    }

    // Security Check: Ensure user is a member of the project
    try {
      await this.projectService.validateProjectMembership(
        payload.projectId,
        client.data.user.id
      );
    } catch (error) {
      this.logger.warn(
        `User ${client.data.user.id} attempted to join unauthorized project ${payload.projectId}`
      );
      throw new WsException('Forbidden: You are not a member of this project.');
    }

    const roomName = `project:${payload.projectId}`;
    client.join(roomName);
    this.logger.log(
      `Client ${client.id} (User: ${client.data.user.email}) joined room: ${roomName}`
    );
    return { status: 'ok', roomName };
  }

  @SubscribeMessage(WebSocketEvent.LEAVE_PROJECT_ROOM)
  handleLeaveProjectRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload
  ): { status: string; roomName: string } {
    const roomName = `project:${payload.projectId}`;
    client.leave(roomName);
    this.logger.log(`Client with ${client.id} left room: ${roomName}`);
    return { status: 'ok', roomName };
  }

  public sendAgentTypingToVisitor(
    visitorSocketId: string,
    isTyping: boolean,
    agentName: string
  ) {
    this.logger.log(`Emitting agentIsTyping to ${visitorSocketId}`);
    const payload: AgentTypingPayload = {
      agentName,
      isTyping,
    };
    this.server.to(visitorSocketId).emit(WebSocketEvent.AGENT_TYPING, payload);
  }

  public sendReplyToVisitor(visitorSocketId: string, message: any) {
    this.logger.log(`Emitting agentReplied to ${visitorSocketId}`);
    this.server.to(visitorSocketId).emit(WebSocketEvent.AGENT_REPLIED, message);
  }

  public visitorMessageSent(visitorSocketId: string, data: any) {
    try {
      this.logger.log(`Emitting messageSent to ${visitorSocketId}`);
      this.server.to(visitorSocketId).emit(WebSocketEvent.MESSAGE_SENT, data);
    } catch (error) {
      this.logger.log(error);
    }
  }

  // ==================== FORM EVENTS ====================

  /**
   * Handle visitor filling form status.
   * Broadcasts to project room so agents can see "filling form" indicator.
   */
  @SubscribeMessage(WebSocketEvent.VISITOR_FILLING_FORM)
  handleVisitorFillingForm(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: VisitorFillingFormPayload
  ): void {
    const { projectId, conversationId } = client.data;
    if (projectId) {
      this.logger.log(`Emitting visitorFillingForm to project ${projectId}`);
      const broadcastPayload: VisitorFillingFormPayload = {
        conversationId: conversationId?.toString() ?? payload.conversationId,
        isFilling: payload.isFilling,
      };
      this.server
        .to(`project:${projectId}`)
        .emit(WebSocketEvent.VISITOR_FILLING_FORM, broadcastPayload);
    }
  }

  /**
   * Handle visitor form submission.
   * Validates socket session, calls ActionsService, and emits FORM_SUBMITTED.
   */
  @SubscribeMessage(WebSocketEvent.SUBMIT_FORM)
  async handleSubmitForm(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SubmitFormPayload
  ): Promise<{ success: boolean; error?: string }> {
    const { visitorId, conversationId, projectId } = client.data;

    // INV-1: Visitor must be identified
    if (!visitorId || !conversationId) {
      this.logger.warn(
        `SUBMIT_FORM rejected: missing visitorId or conversationId`
      );
      return {
        success: false,
        error: 'Session not ready. Please refresh the page.',
      };
    }

    try {
      const result = await this.actionsService.submitFormAsVisitor(
        conversationId.toString(),
        visitorId,
        {
          formRequestMessageId: payload.formRequestMessageId,
          data: payload.data,
        }
      );

      // Emit FORM_SUBMITTED to both visitor and project room
      const formSubmittedPayload: FormSubmittedPayload = {
        conversationId: conversationId.toString(),
        submissionId: result.submission.id,
        messageId: result.message.id.toString(),
        message: {
          id: result.message.id,
          content: result.message.content,
          senderId: result.message.senderId,
          conversationId: Number(result.message.conversationId),
          fromCustomer: result.message.fromCustomer,
          status: result.message.status,
          createdAt: result.message.createdAt.toISOString(),
          contentType: result.message.contentType,
          metadata: result.message.metadata ?? undefined,
        },
        submittedBy: 'visitor',
        data: payload.data,
      };

      // Emit to project room (agents)
      this.server
        .to(`project:${projectId}`)
        .emit(WebSocketEvent.FORM_SUBMITTED, formSubmittedPayload);
      // Emit to visitor socket
      client.emit(WebSocketEvent.FORM_SUBMITTED, formSubmittedPayload);

      this.logger.log(
        `Form submitted by visitor ${visitorId} for message ${payload.formRequestMessageId}`
      );
      return { success: true };
    } catch (error: any) {
      this.logger.error(`SUBMIT_FORM failed: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Form submission failed',
      };
    }
  }

  /**
   * Emit form request sent event to visitor socket.
   */
  public emitFormRequestSent(
    visitorSocketId: string,
    payload: FormRequestSentPayload
  ) {
    this.logger.log(`Emitting formRequestSent to ${visitorSocketId}`);
    this.server
      .to(visitorSocketId)
      .emit(WebSocketEvent.FORM_REQUEST_SENT, payload);
  }

  /**
   * Emit form submitted event to both visitor and project room.
   */
  public emitFormSubmitted(
    projectId: number,
    visitorSocketId: string | null,
    payload: FormSubmittedPayload
  ) {
    this.logger.log(`Emitting formSubmitted to project:${projectId}`);
    // Emit to project room (agents)
    this.server
      .to(`project:${projectId}`)
      .emit(WebSocketEvent.FORM_SUBMITTED, payload);
    // Also emit to visitor if socket provided
    if (visitorSocketId) {
      this.server
        .to(visitorSocketId)
        .emit(WebSocketEvent.FORM_SUBMITTED, payload);
    }
  }

  /**
   * Emit form updated event to project room.
   */
  public emitFormUpdated(projectId: number, payload: FormUpdatedPayload) {
    this.logger.log(`Emitting formUpdated to project:${projectId}`);
    this.server
      .to(`project:${projectId}`)
      .emit(WebSocketEvent.FORM_UPDATED, payload);
  }

  /**
   * Emit form deleted event to project room.
   */
  public emitFormDeleted(projectId: number, payload: FormDeletedPayload) {
    this.logger.log(`Emitting formDeleted to project:${projectId}`);
    this.server
      .to(`project:${projectId}`)
      .emit(WebSocketEvent.FORM_DELETED, payload);
  }
}
