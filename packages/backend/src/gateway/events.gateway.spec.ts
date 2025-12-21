import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from './events.gateway';
import { RealtimeSessionService } from '../realtime-session/realtime-session.service';
import { REDIS_SUBSCRIBER_CLIENT } from '../redis/redis.module';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let realtimeSessionService: jest.Mocked<RealtimeSessionService>;
  let redisSubscriber: jest.Mocked<any>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let server: jest.Mocked<Server>;
  let client: jest.Mocked<Socket>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        {
          provide: RealtimeSessionService,
          useValue: {
            deleteVisitorSession: jest.fn(),
            setVisitorCurrentUrl: jest.fn(),
          },
        },
        {
          provide: REDIS_SUBSCRIBER_CLIENT,
          useValue: {
            subscribe: jest.fn(),
            on: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findOneById: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
    realtimeSessionService = module.get(RealtimeSessionService);
    redisSubscriber = module.get(REDIS_SUBSCRIBER_CLIENT);
    eventEmitter = module.get(EventEmitter2);

    server = { to: jest.fn().mockReturnThis(), emit: jest.fn(), use: jest.fn() } as unknown as jest.Mocked<Server>;
    client = {
      id: 'socket-id',
      data: {},
      join: jest.fn(),
      leave: jest.fn(),
    } as unknown as jest.Mocked<Socket>;

    gateway.server = server;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleDisconnect', () => {
    it('should delete visitor session on disconnect', () => {
      client.data.visitorUid = 'visitor-123';
      gateway.handleDisconnect(client);
      expect(
        realtimeSessionService.deleteVisitorSession
      ).toHaveBeenCalledWith('visitor-123');
    });
  });

  describe('afterInit', () => {
    it('should subscribe to the new message channel', () => {
      gateway.afterInit(server);
      expect(redisSubscriber.subscribe).toHaveBeenCalledWith(
        'new_message_channel',
        expect.any(Function)
      );
    });
  });

  describe('handleIdentify', () => {
    it('should emit a visitor.identified event', async () => {
      const payload = { projectId: 1, visitorUid: 'visitor-123' };
      await gateway.handleIdentify(client, payload);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'visitor.identified',
        expect.objectContaining(payload)
      );
    });
  });

  describe('handleSendMessage', () => {
    it('should emit a visitor.message.received event', async () => {
      client.data.visitorUid = 'visitor-123';
      client.data.projectId = 1;
      const payload = { content: 'Hello', tempId: 'temp-id' };
      await gateway.handleSendMessage(payload, client);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'visitor.message.received',
        expect.objectContaining({
          ...payload,
          visitorUid: 'visitor-123',
          projectId: 1,
        })
      );
    });
  });

  describe('handleVisitorTyping', () => {
    it('should emit visitorIsTyping to the project room', () => {
      client.data.projectId = 1;
      client.data.conversationId = 2;
      gateway.handleVisitorTyping(client, { isTyping: true });
      expect(server.to).toHaveBeenCalledWith('project:1');
      expect(server.emit).toHaveBeenCalledWith('visitorIsTyping', {
        conversationId: 2,
        isTyping: true,
      });
    });
  });

  describe('handleUpdateContext', () => {
    it('should set current URL and emit visitorContextUpdated', async () => {
      client.data.projectId = 1;
      client.data.conversationId = 2;
      client.data.visitorUid = 'visitor-123';
      const payload = { currentUrl: 'https://new-url.com' };
      await gateway.handleUpdateContext(client, payload);

      expect(realtimeSessionService.setVisitorCurrentUrl).toHaveBeenCalledWith(
        'visitor-123',
        'https://new-url.com'
      );
      expect(server.to).toHaveBeenCalledWith('project:1');
      expect(server.emit).toHaveBeenCalledWith('visitorContextUpdated', {
        conversationId: 2,
        currentUrl: 'https://new-url.com',
      });
    });
  });

  describe('handleJoinProjectRoom', () => {
    it('should make the client join the project room', () => {
      gateway.handleJoinProjectRoom(client, { projectId: 1 });
      expect(client.join).toHaveBeenCalledWith('project:1');
    });
  });

  describe('handleLeaveProjectRoom', () => {
    it('should make the client leave the project room', () => {
      gateway.handleLeaveProjectRoom(client, { projectId: 1 });
      expect(client.leave).toHaveBeenCalledWith('project:1');
    });
  });
});