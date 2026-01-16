
// src/gateway/events.gateway.ts
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
import { Server, Socket } from 'socket.io';
import { Logger, Inject, UseGuards, UsePipes, ValidationPipe, forwardRef } from '@nestjs/common';
import { RealtimeSessionService } from '../realtime-session/realtime-session.service';
import { type Redis } from 'ioredis';
import { REDIS_SUBSCRIBER_CLIENT } from '../redis/redis.module';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  VisitorIdentifiedEvent,
  VisitorMessageReceivedEvent,
} from '../inbox/events';
import { Conversation, Visitor } from '../database/entities';
import { MessageStatus, WidgetMessageDto, WebSocketEvent, NavigationEntry, VisitorSessionMetadata } from '@live-chat/shared-types';
import { ProjectService } from '../projects/project.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import { ConversationPersistenceService } from '../inbox/services/persistence/conversation.persistence.service';
import { EntityManager } from 'typeorm';
import { 
  IdentifyPayload, 
  SendMessagePayload, 
  VisitorTypingPayload, 
  UpdateContextPayload, 
  JoinRoomPayload,
  AgentTypingPayload,
  VisitorTypingBroadcastPayload,
  VisitorContextUpdatedPayload,
  ConversationUpdatedPayload,
  VisitorStatusChangedPayload // ADDED
} from '@live-chat/shared-types';

import { VisitorsService } from '../visitors/visitors.service'; // ADDED

const NEW_MESSAGE_CHANNEL = 'new_message_channel';

const MAX_URL_HISTORY_LENGTH = 10; // Defined in design

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
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly conversationPersistenceService: ConversationPersistenceService,
    private readonly entityManager: EntityManager,
    @Inject(forwardRef(() => VisitorsService)) private readonly visitorsService: VisitorsService // ADDED with forwardRef to avoid circular dependency if VisitorsService uses Gateway
  ) {}

  public emitToProject(projectId: number, event: string, payload: any) {
    this.logger.log(`Emitting ${event} to project:${projectId}`);
    this.server.to(`project:${projectId}`).emit(event, payload);
  }

  public emitConversationUpdated(projectId: number, payload: ConversationUpdatedPayload) {
    this.logger.log(`Emitting conversationUpdated to project:${projectId}`);
    this.server.to(`project:${projectId}`).emit(WebSocketEvent.CONVERSATION_UPDATED, payload);
  }

  public emitConversationDeleted(projectId: number, conversationId: string) {
    this.logger.log(`Emitting conversationDeleted to project:${projectId}`);
    this.server.to(`project:${projectId}`).emit(WebSocketEvent.CONVERSATION_DELETED, { conversationId });
  }

  /**
   * Emits a VISITOR_STATUS_CHANGED event to all clients in the project room.
   * @param projectId The ID of the project.
   * @param visitorUid The UID of the visitor whose status changed.
   * @param isOnline The new online status of the visitor.
   */
  public emitVisitorStatusChanged(projectId: number, visitorUid: string, isOnline: boolean) {
    this.logger.log(`Emitting VISITOR_STATUS_CHANGED for visitorUid:${visitorUid} (isOnline: ${isOnline}) to project:${projectId}`);
    const payload: VisitorStatusChangedPayload = { visitorUid, projectId, isOnline };
    this.server.to(`project:${projectId}`).emit(WebSocketEvent.VISITOR_STATUS_CHANGED, payload);
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    const origin = client.handshake.headers.origin;
    const projectId = client.handshake.query.projectId;
    const authToken = client.handshake.auth?.token;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // 1. Agent Authentication (JWT)
    if (authToken) {
      try {
        const payload = this.jwtService.verify(authToken, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });
        
        const user = await this.userService.findOneById(payload.sub);
        if (!user) {
          this.logger.warn(`Connection rejected: User ${payload.sub} not found.`);
          client.disconnect(true);
          return;
        }

        // Check token revocation
        const tokensValidFromSec = Math.floor(user.tokensValidFrom.getTime() / 1000);
        if (payload.iat < tokensValidFromSec) {
          this.logger.warn(`Connection rejected: Token revoked for user ${user.email}`);
          client.disconnect(true);
          return;
        }

        // Attach user to socket data for subsequent events
        client.data.user = { id: user.id, email: user.email };
        this.logger.log(`Agent authenticated: ${user.email}`);
        return; // Authenticated agent, skip widget checks
      } catch (error: any) {
        this.logger.warn(`Connection rejected: Invalid JWT. ${error.message}`);
        client.disconnect(true);
        return;
      }
    }

    // 2. Widget/Visitor Connection Checks
    // Allow main frontend app without further checks (e.g. for dashboard access without auth yet)
    if (origin === frontendUrl) {
      return;
    }

    if (projectId && typeof projectId === 'string') {
      const project = await this.projectService.findByProjectId(+projectId);
      if (!project) {
        this.logger.warn(`Connection rejected: Project ${projectId} not found.`);
        client.disconnect(true);
        return;
      }

      if (
        !project.whitelistedDomains ||
        project.whitelistedDomains.length === 0
      ) {
        this.logger.warn(
          `Project ${projectId} has no whitelisted domains configured. WS connection denied for origin ${origin}.`
        );
        client.disconnect(true);
        return;
      }

      if (origin) {
        try {
          const originUrl = new URL(origin);
          const originDomain = originUrl.hostname;

          if (!project.whitelistedDomains.includes(originDomain)) {
            this.logger.warn(
              `Connection rejected: Origin ${origin} not whitelisted for project ${projectId}`
            );
            client.disconnect(true);
            return;
          }
        } catch (error) {
          this.logger.warn(`Connection rejected: Invalid Origin header ${origin}`);
          client.disconnect(true);
          return;
        }
      } else {
        // No origin header provided for a widget connection
        this.logger.warn(
          `Connection rejected: Missing Origin header for project ${projectId}`
        );
        client.disconnect(true);
        return;
      }
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    if (client.data.visitorUid && client.data.projectId) {
      this.realtimeSessionService.deleteVisitorSession(client.data.visitorUid, client.id);
      // Emit visitor offline status change
      this.emitVisitorStatusChanged(client.data.projectId, client.data.visitorUid, false);
      
      // Update lastSeenAt
      this.visitorsService.updateLastSeenAtByUid(client.data.visitorUid).catch(err => 
        this.logger.error(`Failed to update lastSeenAt for visitorUid ${client.data.visitorUid}`, err)
      );
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
    visitorUid: string
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

    let messagesForFrontend: WidgetMessageDto[] = [];

    // Handle lazy conversation creation: conversation may be null for new visitors
    if (conversation) {
      socket.data.conversationId = conversation.id;
      
      if (conversation.messages && conversation.messages.length > 0) {
        messagesForFrontend = conversation.messages.map((msg) => ({
          id: msg.id,
          content: msg.content || '',
          sender: {
            type: msg.fromCustomer ? 'visitor' : 'agent',
            name: msg.senderId,
          },
          status: msg.status as MessageStatus,
          timestamp: typeof msg.createdAt === 'string' ? msg.createdAt : msg.createdAt.toISOString(),
        }));
        this.logger.log(
          `Loaded ${messagesForFrontend.length} messages for conversationId ${conversation.id}`
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
      messages: messagesForFrontend,
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

    // Update lastSeenAt
    this.visitorsService.updateLastSeenAtByUid(payload.visitorUid).catch(err => 
      this.logger.error(`Failed to update lastSeenAt for visitorUid ${payload.visitorUid}`, err)
    );
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
      this.server.to(`project:${projectId}`).emit(WebSocketEvent.VISITOR_TYPING, broadcastPayload);
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

    // Handle lazy conversation creation: conversationId might be missing if
    // the conversation was created on first message after the socket connected.
    // Look it up by visitorUid and cache it on the socket for future calls.
    if (!conversationId) {
      this.logger.debug(
        `conversationId missing on socket ${client.id}, looking up by visitorUid: ${visitorUid}`
      );
      
      const conversation = await this.entityManager.getRepository(Conversation).findOne({
        where: { visitor: { visitorUid } },
        select: ['id'],
      });
      
      if (conversation) {
        conversationId = conversation.id;
        client.data.conversationId = conversationId; // Cache for future calls
        this.logger.debug(
          `Found and cached conversationId ${conversationId} for socket ${client.id}`
        );
      } else {
        this.logger.debug(
          `No conversation found for visitorUid ${visitorUid}, skipping updateContext`
        );
        return;
      }
    }

    // Store currentUrl in Redis (existing logic)
    await this.realtimeSessionService.setVisitorCurrentUrl(
      visitorUid,
      payload.currentUrl
    );

    // Update conversation metadata with new URL
    try {
      const conversation = await this.entityManager.getRepository(Conversation).findOne({
        where: { id: conversationId as string }, // conversationId from client.data is string
      });

      if (conversation) {
        // Ensure metadata structure exists
        if (!conversation.metadata) {
          conversation.metadata = {
            referrer: null, // Should be set on first message, but fallback
            landingPage: payload.currentUrl, // Fallback if metadata was missing
            urlHistory: [],
          };
        }

        // Create new navigation entry
        const newEntry: NavigationEntry = {
          url: payload.currentUrl,
          title: payload.currentUrl, // Frontend should ideally send the title
          timestamp: new Date().toISOString(),
        };

        // Add to history and maintain FIFO limit
        conversation.metadata.urlHistory.push(newEntry);
        if (conversation.metadata.urlHistory.length > MAX_URL_HISTORY_LENGTH) {
          conversation.metadata.urlHistory.shift(); // Remove oldest entry
        }

        await this.entityManager.getRepository(Conversation).save(conversation);

        // Emit conversationUpdated event to agents for real-time visualization
        this.emitConversationUpdated(conversation.projectId, {
          conversationId: conversation.id,
          fields: {
            metadata: conversation.metadata, // Send updated metadata
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Error updating conversation metadata for conversationId ${conversationId}:`,
        error
      );
    }

    // Broadcast to agents (existing logic)
    this.logger.log(`Emitting visitorContextUpdated to project ${projectId}`);
    const broadcastPayload: VisitorContextUpdatedPayload = {
      conversationId,
      currentUrl: payload.currentUrl,
    };
    this.server.to(`project:${projectId}`).emit(WebSocketEvent.VISITOR_CONTEXT_UPDATED, broadcastPayload);
  }

  @SubscribeMessage(WebSocketEvent.JOIN_PROJECT_ROOM)
  async handleJoinProjectRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload
  ): Promise<{ status: string; roomName: string }> {
    // Security Check: Ensure user is authenticated
    if (!client.data.user) {
      throw new WsException('Unauthorized: You must be logged in to join a project room.');
    }

    // Security Check: Ensure user is a member of the project
    try {
      await this.projectService.validateProjectMembership(payload.projectId, client.data.user.id);
    } catch (error) {
      this.logger.warn(`User ${client.data.user.id} attempted to join unauthorized project ${payload.projectId}`);
      throw new WsException('Forbidden: You are not a member of this project.');
    }

    const roomName = `project:${payload.projectId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} (User: ${client.data.user.email}) joined room: ${roomName}`);
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
}
