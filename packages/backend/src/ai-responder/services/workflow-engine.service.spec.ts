import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowEngineService, WorkflowContext, WorkflowStepResult } from './workflow-engine.service';
import { AiToolExecutor } from './ai-tool.executor';
import { WorkflowDefinition } from '@live-chat/shared-types';

describe('WorkflowEngineService', () => {
  let service: WorkflowEngineService;
  let toolExecutorMock: jest.Mocked<AiToolExecutor>;

  beforeEach(async () => {
    toolExecutorMock = {
      executeTool: jest.fn(),
      getTools: jest.fn().mockReturnValue([
        {
          type: 'function',
          function: {
            name: 'add_visitor_note',
            description: 'Adds an internal note about the visitor for agents to see.',
            parameters: {
              type: 'object',
              properties: {
                content: { type: 'string', description: 'The content of the note.' },
              },
              required: ['content'],
            },
          },
        },
      ]),
      getRoutingTool: jest.fn().mockReturnValue({
        type: 'function',
        function: {
          name: 'route_decision',
          description: 'Decide which path to take',
          parameters: { type: 'object', properties: { path: { type: 'string', enum: ['yes', 'no'] } }, required: ['path'] },
        },
      }),
      getSwitchTool: jest.fn().mockReturnValue({
        type: 'function',
        function: {
          name: 'switch_decision',
          description: 'Choose which case to route to',
          parameters: { type: 'object', properties: { case: { type: 'string' } }, required: ['case'] },
        },
      }),
    } as unknown as jest.Mocked<AiToolExecutor>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowEngineService,
        { provide: AiToolExecutor, useValue: toolExecutorMock },
      ],
    }).compile();

    service = module.get<WorkflowEngineService>(WorkflowEngineService);
  });

  describe('handleActionNode (LLM-driven)', () => {
    it('should return routing context for Action node without executing tool', async () => {
      const workflow: WorkflowDefinition = {
        nodes: [
          { id: 'start-1', type: 'start', position: { x: 0, y: 0 }, data: {} },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 0, y: 100 },
            data: { toolName: 'add_visitor_note' },
          },
          { id: 'llm-1', type: 'llm', position: { x: 0, y: 200 }, data: { prompt: 'Hello' } },
        ],
        edges: [
          { id: 'e1', source: 'start-1', target: 'action-1' },
          { id: 'e2', source: 'action-1', target: 'llm-1' },
        ],
      };

      const context: WorkflowContext = {
        projectId: 1,
        visitorId: 1,
        conversationId: '123',
        currentNodeId: 'action-1',
        workflow,
        history: [],
      };

      const result: WorkflowStepResult = await service.executeStep(context);

      // Assert: requiresRouting should be true (LLM-driven)
      expect(result.requiresRouting).toBe(true);

      // Assert: routingPrompt should contain instructions to use the tool
      expect(result.routingPrompt).toBeDefined();
      expect(result.routingPrompt).toContain('add_visitor_note');

      // Assert: tools should contain the specific tool definition
      expect(result.tools).toBeDefined();
      expect(result.tools!.length).toBeGreaterThan(0);
      expect(result.tools![0].function.name).toBe('add_visitor_note');

      // Assert: NO tool execution occurred (side effect check)
      expect(toolExecutorMock.executeTool).not.toHaveBeenCalled();
    });
  });
});
