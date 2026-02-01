import { Test, TestingModule } from '@nestjs/testing';
import { AiResponderService } from './ai-responder.service';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { LLMProviderManager } from './services/llm-provider.manager';
import { ProjectService } from '../projects/project.service';
import { EventsGateway } from '../gateway/events.gateway';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Conversation, Message, Project } from '../database/entities';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RealtimeSessionService } from '../realtime-session/realtime-session.service';
import { AiToolExecutor } from './services/ai-tool.executor';
import { VisitorLockService } from './services/visitor-lock.service';
import {
  VisitorMessageReceivedEvent,
  AiProcessMessageEvent, // Import added
} from '../inbox/events';

describe('AiResponderService', () => {
  let service: AiResponderService;
  let workflowEngine: jest.Mocked<WorkflowEngineService>;
  let llmProviderManager: jest.Mocked<LLMProviderManager>;
  let projectService: jest.Mocked<ProjectService>;
  let conversationRepo: any;
  let messageRepo: any;

  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        AiResponderService,
        {
          provide: WorkflowEngineService,
          useValue: {
            executeStep: jest.fn(),
            getNodeContext: jest.fn(),
            processRouteDecision: jest.fn().mockReturnValue('next-node'),
            processSwitchDecision: jest.fn().mockReturnValue('next-node'),
          },
        },
        {
          provide: LLMProviderManager,
          useValue: {
            generateResponse: jest.fn().mockResolvedValue({
              responseText: 'Mock Response',
              toolCalls: [],
            }),
          },
        },
        {
          provide: ProjectService,
          useValue: {
            findByProjectId: jest.fn(),
          },
        },
        {
          provide: EventsGateway,
          useValue: {
            server: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) },
            getOnlineAgentCount: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: getRepositoryToken(Conversation),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Message),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn().mockImplementation((entity: any) => entity),
          },
        },
        {
          provide: getRepositoryToken(Project),
          useValue: {
             findOne: jest.fn(),
             findOneBy: jest.fn(), // Added
          },
        },
        {
            provide: EventEmitter2,
            useValue: {
                emit: jest.fn(),
            },
        },
        {
            provide: RealtimeSessionService,
            useValue: {
                getOnlineAgentsCount: jest.fn().mockResolvedValue(0),
            },
        },
        {
            provide: AiToolExecutor,
            useValue: {
                getTools: jest.fn().mockReturnValue([]),
            },
        },
        {
            provide: VisitorLockService,
            useValue: {
                acquireLock: jest.fn().mockResolvedValue(true),
                releaseLock: jest.fn(),
            },
        },
      ],
    }).compile();

    service = moduleRef.get<AiResponderService>(AiResponderService);
    workflowEngine = moduleRef.get(WorkflowEngineService);
    llmProviderManager = moduleRef.get(LLMProviderManager);
    projectService = moduleRef.get(ProjectService);
    conversationRepo = moduleRef.get(getRepositoryToken(Conversation));
    messageRepo = moduleRef.get(getRepositoryToken(Message));
  });

  describe('Interface Consistency Check', () => {
    it('should delegate to workflow engine and use returned routing context', async () => {
      // Mock Data
      const projectId = 1;
      const visitorUid = 'vis-100';
      const conversationId = '123';
      
      const mockProject = {
          id: projectId,
          aiMode: 'orchestrator',
          aiConfig: {
              enabled: true,
              nodes: [{ id: 'some-node', type: 'condition', data: {} }],
              edges: [],
              language: 'en',
          },
      } as any;

      const mockConversation = {
          id: conversationId,
          visitor: { visitorUid },
          metadata: { workflowState: { currentNodeId: 'some-node' } },
      } as any;

      // Setup Mocks
      projectService.findByProjectId.mockResolvedValue(mockProject);
      const projectRepo = moduleRef.get(getRepositoryToken(Project));
      (projectRepo.findOneBy as jest.Mock).mockResolvedValue(mockProject);
      
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      messageRepo.find.mockResolvedValue([]);

      // Mock Engine Response (The Interface Contract)
      const mockRoutingPrompt = "MOCKED_PROMPT_FROM_ENGINE";
      const mockTools = [{ type: 'function', function: { name: "MOCKED_TOOL" } }];
      
      workflowEngine.executeStep.mockResolvedValue({
          requiresRouting: true,
          routingPrompt: mockRoutingPrompt,
          tools: mockTools as any,
          nextNodeId: null,
          output: null,
      });

      // Execute Public Method
      const event: AiProcessMessageEvent = {
          projectId,
          visitorUid,
          conversationId,
      };

      await service.handleVisitorMessage(event);

      // Assertions
      expect(workflowEngine.executeStep).toHaveBeenCalled();
      
      // Verify LLM was called with data FROM the engine
      expect(llmProviderManager.generateResponse).toHaveBeenCalledWith(
          expect.anything(), // messages
          mockRoutingPrompt, // systemPrompt matches engine
          mockTools // tools matches engine
      );
    });
  });

  describe('DB Optimization Check', () => {
    it('should perform at most one conversation metadata update per finalization', async () => {
      // Mock Data
      const projectId = 1;
      const visitorUid = 'vis-200';
      const conversationId = '200'; // Changed to string

      const mockProject = {
        id: projectId,
        aiMode: 'orchestrator',
        aiConfig: {
          enabled: true,
          nodes: [{ id: 'llm-node', type: 'llm', data: { prompt: 'Test' } }],
          edges: [],
          language: 'en',
        },
      } as any;

      const mockConversation = {
        id: conversationId,
        visitor: { id: 1, visitorUid },
        metadata: { workflowState: { currentNodeId: 'llm-node' } },
      } as any;

      // Setup Mocks
      projectService.findByProjectId.mockResolvedValue(mockProject);
      const projectRepo = moduleRef.get(getRepositoryToken(Project));
      (projectRepo.findOneBy as jest.Mock).mockResolvedValue(mockProject);

      conversationRepo.findOne.mockResolvedValue(mockConversation);
      messageRepo.find.mockResolvedValue([]);
      messageRepo.save.mockImplementation((msg: any) => Promise.resolve({ ...msg, id: 999, createdAt: new Date() }));

      // Mock engine for LLM node (no routing)
      workflowEngine.executeStep.mockResolvedValue({
        requiresRouting: false,
        nextNodeId: null,
        output: null,
      });
      workflowEngine.getNodeContext.mockReturnValue({
        systemPrompt: 'You are helpful.',
        tools: [],
      });

      // Mock LLM to return text response (no tool calls)
      llmProviderManager.generateResponse.mockResolvedValue({
        content: 'Hello, how can I help?',
        toolCalls: [],
      });

      // Mock RealtimeSessionService
      const realtimeService = moduleRef.get(RealtimeSessionService);
      (realtimeService as any).getVisitorSession = jest.fn().mockResolvedValue('socket-123');
      
      // Mock Lock Service
      const lockService = moduleRef.get(VisitorLockService);
      (lockService.acquireLock as jest.Mock).mockResolvedValue('lock-1');

      // Reset update spy
      conversationRepo.update.mockClear();

      // Execute
      const event: AiProcessMessageEvent = {
        projectId,
        visitorUid,
        conversationId,
      };

      await service.handleVisitorMessage(event);

      // Assertions: At most 1 update call
      expect(conversationRepo.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('Condition Node Logic', () => {
    it('should only use the last message for condition node evaluation', async () => {
      // Setup Mock Data
      const projectId = 1;
      const visitorUid = 'vis-cond';
      const conversationId = 'cond-1';

      const mockProject = {
        id: projectId,
        aiMode: 'orchestrator',
        aiConfig: {
          enabled: true,
          nodes: [{ id: 'cond-node', type: 'condition', data: { prompt: 'Routing?' } }],
        },
      } as any;

      const mockConversation = {
        id: conversationId,
        visitor: { id: 3, visitorUid },
        metadata: { workflowState: { currentNodeId: 'cond-node' } },
      } as any;

      // Mock Repos
      projectService.findByProjectId.mockResolvedValue(mockProject);
      (moduleRef.get(getRepositoryToken(Project)).findOneBy as jest.Mock).mockResolvedValue(mockProject);
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      
      // Mock History: 3 messages, "first", "second", "last"
      messageRepo.find.mockResolvedValue([
        { content: 'first', fromCustomer: true, createdAt: new Date('2023-01-01') },
        { content: 'second', fromCustomer: true, createdAt: new Date('2023-01-02') },
        { content: 'last', fromCustomer: true, createdAt: new Date('2023-01-03') },
      ] as any);
      
      // Mock Engine for Condition Node
      workflowEngine.executeStep.mockResolvedValue({
        requiresRouting: true,
        routingPrompt: 'Routing?',
        tools: [{ type: 'function', function: { name: 'route_decision' } }] as any,
        nextNodeId: null,
        output: null,
      });

      // Mock LLM: Return tool call once, then plain text to stop recursion
      llmProviderManager.generateResponse
        .mockResolvedValueOnce({
          content: 'routing decision needed',
          toolCalls: [
            {
              id: 'call_1',
              type: 'function',
              function: { name: 'route_decision', arguments: '{"path":"yes"}' },
            },
          ],
        })
        .mockResolvedValue({
          content: 'OK',
          toolCalls: [],
        });

      // Mock other services
      (moduleRef.get(RealtimeSessionService) as any).getVisitorSession = jest
        .fn()
        .mockResolvedValue('socket-cond');
      (moduleRef.get(VisitorLockService).acquireLock as jest.Mock).mockResolvedValue(
        'lock-cond'
      );

      // Execute
      await service.handleVisitorMessage({
        projectId,
        visitorUid,
        conversationId,
      });


      // Verification
      // The CRITICAL check: Did generateResponse receive ONLY the last message?
      expect(llmProviderManager.generateResponse).toHaveBeenCalledWith(
        expect.arrayContaining([
            expect.objectContaining({ content: 'last' })
        ]), 
        expect.anything(),
        expect.anything()
      );

      // Verify length is exactly 1
      const calls = llmProviderManager.generateResponse.mock.calls;
      const lastCallArgs = calls[calls.length - 1]; // [messages, prompt, tools]
      const messagesArg = lastCallArgs[0] as any[];
      expect(messagesArg).toHaveLength(1);
      expect(messagesArg[0].content).toBe('last');
    });
  });
});
