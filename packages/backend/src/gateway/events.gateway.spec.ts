import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from './events.gateway';
import { RealtimeSessionService } from '../realtime-session/realtime-session.service';
import { REDIS_SUBSCRIBER_CLIENT } from '../redis/redis.module';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { ProjectService } from '../projects/project.service';
import { WsAuthService } from './services/ws-auth.service';
import { UpdateContextRequestEvent } from '../inbox/events';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import { ActionsService } from '../actions/actions.service';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let realtimeSessionService: jest.Mocked<RealtimeSessionService>;
  let redisSubscriber: jest.Mocked<any>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let server: jest.Mocked<Server>;
  let client: jest.Mocked<Socket>;
  let wsAuthService: jest.Mocked<WsAuthService>;
  let actionsService: jest.Mocked<ActionsService>;

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
          provide: ProjectService,
          useValue: {
            findByProjectId: jest.fn(),
            validateProjectMembership: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: WsAuthService,
          useValue: {
            validateConnection: jest.fn(),
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
        {
          provide: 'JwtService', // Token injection might be string or class
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
        {
          provide: ActionsService,
          useValue: {
            submitFormAsVisitor: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
    realtimeSessionService = module.get(RealtimeSessionService);
    redisSubscriber = module.get(REDIS_SUBSCRIBER_CLIENT);
    eventEmitter = module.get(EventEmitter2);
    wsAuthService = module.get(WsAuthService);
    actionsService = module.get(ActionsService);

    server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      use: jest.fn(),
      sockets: { sockets: new Map() },
    } as unknown as jest.Mocked<Server>;
    // @ts-ignore
    server.sockets.sockets.get = jest.fn();

    client = {
      id: 'socket-id',
      data: {},
      join: jest.fn(),
      leave: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as jest.Mocked<Socket>;

    gateway.server = server;
    jest.spyOn(gateway, 'emitVisitorStatusChanged');
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should disconnect if validation fails', async () => {
      wsAuthService.validateConnection.mockResolvedValue({
        valid: false,
        error: 'Invalid',
      });
      await gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalledWith(true);
    });

    it('should set user data if validation succeeds with user', async () => {
      wsAuthService.validateConnection.mockResolvedValue({
        valid: true,
        user: { id: 'user-1', email: 'test@test.com' },
      });
      await gateway.handleConnection(client);
      expect(client.data.user).toEqual({
        id: 'user-1',
        email: 'test@test.com',
      });
    });
  });

  describe('handleDisconnect', () => {
    it('should delete visitor session on disconnect and emit events', () => {
      client.data.visitorUid = 'visitor-123';
      client.data.projectId = 1;
      client.data.conversationId = 'conv-1';
      gateway.handleDisconnect(client);

      expect(realtimeSessionService.deleteVisitorSession).toHaveBeenCalledWith(
        'visitor-123',
        'socket-id'
      );
      expect(gateway.emitVisitorStatusChanged).toHaveBeenCalledWith(
        1,
        'visitor-123',
        false
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'visitor.disconnected',
        expect.objectContaining({
          projectId: 1,
          visitorUid: 'visitor-123',
          conversationId: 'conv-1',
        })
      );
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
    it('should emit visitor.identified, emit status changed, and emit visitor.connected', async () => {
      const payload = { projectId: 1, visitorUid: 'visitor-123' };
      await gateway.handleIdentify(client, payload);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'visitor.identified',
        expect.objectContaining(payload)
      );
      expect(gateway.emitVisitorStatusChanged).toHaveBeenCalledWith(
        1,
        'visitor-123',
        true
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'visitor.connected',
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
    it('should emit update.context.request', async () => {
      client.data.projectId = 1;
      client.data.conversationId = 2;
      client.data.visitorUid = 'visitor-123';
      const payload = { currentUrl: 'https://new-url.com' };
      await gateway.handleUpdateContext(client, payload);

      // Should NOT call Redis directly anymore
      expect(
        realtimeSessionService.setVisitorCurrentUrl
      ).not.toHaveBeenCalled();

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'update.context.request',
        expect.any(UpdateContextRequestEvent)
      );
    });
  });

  describe('handleJoinProjectRoom', () => {
    it('should make the client join the project room', async () => {
      client.data.user = { id: 'user-1', email: 'test@test.com' };
      await gateway.handleJoinProjectRoom(client, { projectId: 1 });
      expect(client.join).toHaveBeenCalledWith('project:1');
    });
  });

  describe('handleLeaveProjectRoom', () => {
    it('should make the client leave the project room', () => {
      gateway.handleLeaveProjectRoom(client, { projectId: 1 });
      expect(client.leave).toHaveBeenCalledWith('project:1');
    });
  });

  // ==================== FORM EVENT TESTS ====================

  describe('handleVisitorFillingForm', () => {
    it('should broadcast visitorFillingForm to project room', () => {
      client.data.projectId = 1;
      client.data.conversationId = 'conv-1';

      gateway.handleVisitorFillingForm(client, {
        conversationId: 'conv-1',
        isFilling: true,
      });

      expect(server.to).toHaveBeenCalledWith('project:1');
      expect(server.emit).toHaveBeenCalledWith('visitorFillingForm', {
        conversationId: 'conv-1',
        isFilling: true,
      });
    });
  });

  describe('emitFormRequestSent', () => {
    it('should emit formRequestSent to visitor socket', () => {
      const payload = { conversationId: 'conv-1', message: { id: 'msg-1' } };

      gateway.emitFormRequestSent('visitor-socket-id', payload as any);

      expect(server.to).toHaveBeenCalledWith('visitor-socket-id');
      expect(server.emit).toHaveBeenCalledWith('formRequestSent', payload);
    });
  });

  describe('emitFormSubmitted', () => {
    it('should emit formSubmitted to both project room and visitor socket', () => {
      const payload = {
        conversationId: 'conv-1',
        submission: { id: 'sub-1' },
        message: { id: 'msg-1' },
      };

      gateway.emitFormSubmitted(1, 'visitor-socket-id', payload as any);

      // Emitted to project room
      expect(server.to).toHaveBeenCalledWith('project:1');
      expect(server.emit).toHaveBeenCalledWith('formSubmitted', payload);

      // Also emitted to visitor
      expect(server.to).toHaveBeenCalledWith('visitor-socket-id');
    });

    it('should emit formSubmitted only to project room if no visitor socket', () => {
      const payload = {
        conversationId: 'conv-1',
        submission: { id: 'sub-1' },
        message: { id: 'msg-1' },
      };

      gateway.emitFormSubmitted(1, null, payload as any);

      expect(server.to).toHaveBeenCalledWith('project:1');
      expect(server.emit).toHaveBeenCalledWith('formSubmitted', payload);
    });
  });

  describe('emitFormUpdated', () => {
    it('should emit formUpdated to project room', () => {
      const payload = { conversationId: 'conv-1', submissionId: 'sub-1' };

      gateway.emitFormUpdated(1, payload as any);

      expect(server.to).toHaveBeenCalledWith('project:1');
      expect(server.emit).toHaveBeenCalledWith('formUpdated', payload);
    });
  });

  describe('emitFormDeleted', () => {
    it('should emit formDeleted to project room', () => {
      const payload = { conversationId: 'conv-1', submissionId: 'sub-1' };

      gateway.emitFormDeleted(1, payload as any);

      expect(server.to).toHaveBeenCalledWith('project:1');
      expect(server.emit).toHaveBeenCalledWith('formDeleted', payload);
    });
  });

  describe('handleSubmitForm', () => {
    it('should return error if visitorId is missing', async () => {
      client.data = { conversationId: 1, projectId: 1 }; // Missing visitorId

      const result = await gateway.handleSubmitForm(client, {
        formRequestMessageId: 'msg-1',
        data: { field1: 'value1' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Session not ready');
    });

    it('should return error if conversationId is missing', async () => {
      client.data = { visitorId: 1, projectId: 1 }; // Missing conversationId

      const result = await gateway.handleSubmitForm(client, {
        formRequestMessageId: 'msg-1',
        data: { field1: 'value1' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Session not ready');
    });

    it('should call actionsService and emit FORM_SUBMITTED on success', async () => {
      client.data = { visitorId: 1, conversationId: 2, projectId: 3 };
      client.emit = jest.fn();

      actionsService.submitFormAsVisitor.mockResolvedValue({
        submission: { id: 'sub-1' } as any,
        message: {
          id: 123,
          content: 'Form submitted',
          senderId: 1,
          conversationId: 2,
          fromCustomer: true,
          status: 'sent',
          createdAt: new Date(),
          contentType: 'text',
          metadata: {},
        } as any,
      });

      const result = await gateway.handleSubmitForm(client, {
        formRequestMessageId: 'msg-1',
        data: { field1: 'value1' },
      });

      expect(result.success).toBe(true);
      expect(actionsService.submitFormAsVisitor).toHaveBeenCalledWith(
        '2', // conversationId as string
        1, // visitorId
        {
          formRequestMessageId: 'msg-1',
          data: { field1: 'value1' },
        }
      );
      expect(server.to).toHaveBeenCalledWith('project:3');
      expect(client.emit).toHaveBeenCalledWith(
        'formSubmitted',
        expect.any(Object)
      );
    });

    it('should return error when actionsService throws', async () => {
      client.data = { visitorId: 1, conversationId: 2, projectId: 3 };

      actionsService.submitFormAsVisitor.mockRejectedValue(
        new Error('Form already submitted')
      );

      const result = await gateway.handleSubmitForm(client, {
        formRequestMessageId: 'msg-1',
        data: { field1: 'value1' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Form already submitted');
    });
  });
});
