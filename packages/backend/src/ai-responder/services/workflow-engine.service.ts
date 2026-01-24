import { Injectable, Logger } from '@nestjs/common';
import {
  WorkflowDefinition,
  WorkflowNode,
} from '@live-chat/shared-types';
import { ToolDefinition, ToolCall } from '../interfaces/llm-provider.interface';
import { AiToolExecutor } from './ai-tool.executor';

export interface WorkflowContext {
  projectId: number;
  visitorId: number;
  conversationId: string;
  currentNodeId: string;
  workflow: WorkflowDefinition;
  history: any[]; // Chat history for LLM context
}

export interface WorkflowStepResult {
  nextNodeId: string | null;
  output: string | null; // Text response to user
  toolCalls?: ToolCall[]; // Tools to be executed by the main loop
}

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(private readonly toolExecutor: AiToolExecutor) {}

  /**
   * Executes the logic for the current node and determines the next step.
   * This is a simplified state machine execution.
   */
  async executeStep(
    context: WorkflowContext,
    userInput?: string
  ): Promise<WorkflowStepResult> {
    const { workflow, currentNodeId } = context;
    const node = workflow.nodes.find((n) => n.id === currentNodeId);

    if (!node) {
      this.logger.error(`Node ${currentNodeId} not found in workflow.`);
      return { nextNodeId: null, output: null };
    }

    this.logger.log(`Executing Workflow Node: ${node.type} (${node.id})`);

    switch (node.type) {
      case 'start':
        this.logger.debug(`[Workflow] Start node ${node.id} triggered`);
        return this.handleStartNode(node, workflow);

      case 'action':
        this.logger.debug(`[Workflow] Action node ${node.id} executing tool: ${node.data.toolName}`);
        return this.handleActionNode(node, workflow, context);

      case 'condition': // Router
        this.logger.debug(`[Workflow] Condition node ${node.id} waiting for AI decision`);
        // For router nodes, we usually need LLM to decide path.
        // We return a special flag or handle it by returning tool definition for router?
        // Simpler for MVP: Router node implies we ask LLM "Which path?".
        // But here we want the Engine to drive.
        // If it's a router, we might need to return a "System Prompt" update to the caller
        // so the caller (AiResponderService) can ask the LLM.
        // BUT, AiResponderService expects a result.
        // Let's assume Router Node has a "systemPrompt" in data.
        return {
          nextNodeId: currentNodeId, // Stay here until LLM decides?
          // Actually, if we are in 'orchestrator' mode, the LLM loop handles the decision.
          // The Workflow Engine helps construct the prompt.
          output: null,
        };

      default:
        return { nextNodeId: null, output: null };
    }
  }

  private getNextNodeId(
    currentNode: WorkflowNode,
    workflow: WorkflowDefinition,
    handle?: string
  ): string | null {
    const edge = workflow.edges.find(
      (e) => e.source === currentNode.id && (!handle || e.label === handle) // Simplified handle logic
    );
    return edge ? edge.target : null;
  }

  private handleStartNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition
  ): WorkflowStepResult {
    // Start node usually just moves to the next one immediately.
    const nextId = this.getNextNodeId(node, workflow);
    return { nextNodeId: nextId, output: null };
  }

  private async handleActionNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition,
    context: WorkflowContext
  ): Promise<WorkflowStepResult> {
    // Action node executes a tool immediately.
    const toolName = node.data.toolName;
    const toolArgs = node.data.toolArgs || {};

    if (toolName) {
      // Execute the tool directly via ToolExecutor
      // We construct a fake ToolCall for the executor
      const toolCall: ToolCall = {
        id: `auto-${Date.now()}`,
        type: 'function',
        function: {
          name: toolName,
          arguments: JSON.stringify(toolArgs),
        },
      };

      try {
        await this.toolExecutor.executeTool(toolCall, {
          projectId: context.projectId,
          visitorId: context.visitorId,
          conversationId: context.conversationId,
          userId: 'AI_WORKFLOW',
        });
      } catch (e) {
        this.logger.error(`Workflow Action Failed: ${e}`);
      }
    }

    const nextId = this.getNextNodeId(node, workflow);
    return { nextNodeId: nextId, output: null };
  }

  /**
   * Retrieves the specific System Prompt and Tools allowed for the current node.
   */
  getNodeContext(
    node: WorkflowNode,
    workflow: WorkflowDefinition,
    context?: {
      visitor?: any;
      conversation?: any;
      project?: any;
    }
  ): {
    systemPrompt: string;
    tools: ToolDefinition[];
  } {
    // Default fallback
    let systemPrompt = 'You are a helpful assistant.';
    let tools: ToolDefinition[] = [];

    if (node.data?.prompt) {
      systemPrompt = this.replaceVariables(node.data.prompt, context);
    }

    // If node allows tools, add them.
    if (node.type === 'condition' || node.type === 'trigger' || node.type === 'llm') {
       tools = this.toolExecutor.getTools();
    }

    // Append Global Tools
    if (workflow.globalTools && workflow.globalTools.length > 0) {
      const allTools = this.toolExecutor.getTools();
      const globalToolDefs = allTools.filter(t => workflow.globalTools!.includes(t.function.name));
      
      // Merge unique tools
      const existingNames = new Set(tools.map(t => t.function.name));
      for (const tool of globalToolDefs) {
        if (!existingNames.has(tool.function.name)) {
          tools.push(tool);
        }
      }
    }

    return { systemPrompt, tools };
  }

  private replaceVariables(text: string, context?: any): string {
    if (!context) return text;

    return text.replace(/{{([^}]+)}}/g, (match, key) => {
      const parts = key.trim().split('.');
      let value = context;
      
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          return match; // Key not found, return original placeholder
        }
      }

      return value !== undefined && value !== null ? String(value) : '';
    });
  }
}
