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
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, UseGuards } from '@nestjs/common';
import { RealtimeSessionService } from '../realtime-session/realtime-session.service';
import { type Redis } from 'ioredis';
import { REDIS_SUBSCRIBER_CLIENT } from '../redis/redis.module';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  VisitorIdentifiedEvent,
  VisitorMessageReceivedEvent,
} from '../inbox/events';
import { Conversation, Visitor } from '@live-chat/shared';

const NEW_MESSAGE_CHANNEL = 'new_message_channel';

type MessageStatus = 'sending' | 'sent' | 'failed';

type MessageSender = {
  type: 'visitor' | 'agent';
  name?: string;
};

type MessageFrontend = {
  id: string | number;
  content: string;
  sender: MessageSender;
  status: MessageStatus;
  timestamp: string;
};

@UseGuards(WsJwtAuthGuard)
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
    private readonly eventEmitter: EventEmitter2
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    if (client.data.visitorUid) {
      this.realtimeSessionService.deleteVisitorSession(client.data.visitorUid);
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
          args,
        });
      });
      next();
    });
  }

  public prepareSocketForVisitor(
    socketId: string,
    visitor: Visitor,
    conversation: Conversation,
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

    let messagesForFrontend: MessageFrontend[] = [];

    if (conversation && conversation.messages) {
      messagesForFrontend = conversation.messages.map((msg) => ({
        id: msg.id,
        content: msg.content || '',
        sender: {
          type: msg.fromCustomer ? 'visitor' : 'agent',
          name: msg.senderId,
        },
        status: msg.status as MessageStatus,
        timestamp: msg.createdAt.toISOString(),
      }));
    } else {
      this.logger.log(
        `No messages found for conversationId ${conversation.id}`
      );
      this.logger.log(`messages: ${JSON.stringify(conversation.messages)}`);
    }

    this.logger.log(`Emitting conversationHistory to ${socket.id}`);
    socket.data.conversationId = conversation.id;
    socket.emit('conversationHistory', {
      messages: messagesForFrontend,
    });
  }

  @SubscribeMessage('identify')
  async handleIdentify(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { projectId: number; visitorUid: string }
  ): Promise<void> {
    this.logger.debug(
      `Identify event from client ${client.id} for visitorUid: ${payload.visitorUid} in projectId: ${payload.projectId}`
    );

    const event = new VisitorIdentifiedEvent();
    event.projectId = payload.projectId;
    event.visitorUid = payload.visitorUid;
    event.socketId = client.id;
    this.eventEmitter.emit('visitor.identified', event);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { content: string; tempId: string },
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
    this.eventEmitter.emit('visitor.message.received', event);
  }

  @SubscribeMessage('visitorIsTyping')
  handleVisitorTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { isTyping: boolean }
  ): void {
    const { projectId, conversationId } = client.data;
    if (projectId) {
      this.logger.log(`Emitting visitorIsTyping to project ${projectId}`);
      this.server.to(`project:${projectId}`).emit('visitorIsTyping', {
        conversationId,
        isTyping: payload.isTyping,
      });
    }
  }

  @SubscribeMessage('updateContext')
  async handleUpdateContext(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { currentUrl: string }
  ): Promise<void> {
    const { projectId, conversationId, visitorUid } = client.data;

    let missingData = false;
    if (!projectId) {
      this.logger.warn(
        `Missing projectId for socket ${client.id} in handleUpdateContext`
      );
      missingData = true;
    }
    if (!conversationId) {
      this.logger.warn(
        `Missing conversationId for socket ${client.id} in handleUpdateContext`
      );
      missingData = true;
    }
    if (!visitorUid) {
      this.logger.warn(
        `Missing visitorUid for socket ${client.id} in handleUpdateContext`
      );
      missingData = true;
    }

    if (missingData) {
      return;
    }

    // Store currentUrl in Redis
    await this.realtimeSessionService.setVisitorCurrentUrl(
      visitorUid,
      payload.currentUrl
    );

    // Broadcast to agents
    this.logger.log(`Emitting visitorContextUpdated to project ${projectId}`);
    this.server.to(`project:${projectId}`).emit('visitorContextUpdated', {
      conversationId,
      currentUrl: payload.currentUrl,
    });
  }

  @SubscribeMessage('joinProjectRoom')
  handleJoinProjectRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { projectId: number }
  ): { status: string; roomName: string } {
    const roomName = `project:${payload.projectId}`;
    client.join(roomName);
    this.logger.log(`Client with ${client.id} joined room: ${roomName}`);
    return { status: 'ok', roomName };
  }

  @SubscribeMessage('leaveProjectRoom')
  handleLeaveProjectRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { projectId: number }
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
    this.server.to(visitorSocketId).emit('agentIsTyping', {
      agentName,
      isTyping,
    });
  }

  public sendReplyToVisitor(visitorSocketId: string, message: any) {
    this.logger.log(`Emitting agentReplied to ${visitorSocketId}`);
    this.server.to(visitorSocketId).emit('agentReplied', message);
  }

  public visitorMessageSent(visitorSocketId: string, data: any) {
    try {
      this.logger.log(`Emitting messageSent to ${visitorSocketId}`);
      this.server.to(visitorSocketId).emit('messageSent', data);
    } catch (error) {
      this.logger.log(error);
    }
  }
}
