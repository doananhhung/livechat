import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { VisitorIdentifiedEvent, VisitorMessageReceivedEvent } from './events';
import { ConversationService } from './services/conversation.service';
import { VisitorService } from './services/visitor.service';
import { RealtimeSessionService } from '../realtime-session/realtime-session.service';
import { BullMqProducerService } from '../event-producer/bullmq-producer.service';
import { EventsGateway } from '../gateway/events.gateway';
import { EntityManager } from 'typeorm';
import { WorkerEventTypes } from '@live-chat/shared-types';

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

        let conversation =
          await this.conversationService.getOrCreateHistoryByVisitorId(
            payload.projectId,
            visitor.id,
            manager
          );
        return { visitor, conversation };
      }
    );

    this.eventsGateway.prepareSocketForVisitor(
      payload.socketId,
      visitor,
      conversation,
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
      this.logger.log(messageData);
      const data = JSON.parse(messageData);
      const { message, tempId, visitorUid } = data;
      this.logger.log(
        `Received new message from Redis channel: ${JSON.stringify(message)}`
      );

      const visitorSocketId =
        await this.realtimeSessionService.getVisitorSession(visitorUid);
      const messageForFrontend = {
        id: message.id,
        content: message.content,
        sender: message.fromCustomer ? 'visitor' : 'agent',
        status: message.status,
        timestamp: message.createdAt,
      };

      this.logger.debug(
        `message for frontend: ${JSON.stringify(messageForFrontend)}`
      );
      if (visitorSocketId)
        this.eventsGateway.server
          .to(visitorSocketId)
          .emit('messageSent', { tempId, finalMessage: messageForFrontend });

      const conversation = await this.conversationService.findById(
        message.conversationId
      );

      if (conversation && conversation.projectId) {
        const projectId = conversation.projectId;
        const roomName = `project:${projectId}`;

        this.eventsGateway.server.to(roomName).emit('newMessage', message);

        this.logger.log(`Emitted 'newMessage' to room: ${roomName}`);
      }
    } catch (error) {
      this.logger.error('Error processing message from Redis:', error);
    }
  }
}
