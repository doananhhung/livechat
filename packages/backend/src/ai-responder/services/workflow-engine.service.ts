import { Injectable, Logger } from '@nestjs/common';
import { WorkflowDefinition, WorkflowNode } from '@live-chat/shared-types';
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
  requiresRouting?: boolean; // If true, caller must ask LLM for route decision
  routingPrompt?: string; // Prompt for the routing decision
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
        this.logger.debug(
          `[Workflow] Action node ${node.id} executing tool: ${node.data.toolName}`
        );
        return this.handleActionNode(node, workflow, context);

      case 'condition': // Router
        this.logger.debug(
          `[Workflow] Condition node ${node.id} requires routing decision`
        );
        return this.handleConditionNode(node, context);

      case 'llm':
        this.logger.debug(
          `[Workflow] LLM node ${node.id} - context provided, advancing to next node`
        );
        return {
          nextNodeId: this.getNextNodeId(node, workflow),
          output: null, // LLM response is handled by AiResponderService
        };

      default:
        return { nextNodeId: null, output: null };
    }
  }

  private getNextNodeId(
    currentNode: WorkflowNode,
    workflow: WorkflowDefinition,
    handleSuffix?: string
  ): string | null {
    const sourceHandle = handleSuffix
      ? `${currentNode.id}-${handleSuffix}`
      : undefined;
    const edge = workflow.edges.find(
      (e) =>
        e.source === currentNode.id &&
        (!sourceHandle || e.sourceHandle === sourceHandle)
    );
    return edge ? edge.target : null;
  }

  private handleConditionNode(
    node: WorkflowNode,
    context: WorkflowContext
  ): WorkflowStepResult {
    const routingPrompt =
      (node.data.prompt as string) ||
      'Based on the conversation, decide which path to take. Use the route_decision tool with path "yes" or "no".';

    return {
      nextNodeId: null, // Will be determined after LLM makes decision
      output: null,
      requiresRouting: true,
      routingPrompt,
    };
  }

  /**
   * Process the route decision from the LLM and return the next node ID.
   * Called by AiResponderService after LLM calls route_decision tool.
   */
  processRouteDecision(
    node: WorkflowNode,
    workflow: WorkflowDefinition,
    decision: 'yes' | 'no'
  ): string | null {
    this.logger.debug(
      `[Workflow] Processing route decision: ${decision} for node ${node.id}`
    );

    const nextNodeId = this.getNextNodeId(node, workflow, decision);

    if (!nextNodeId) {
      this.logger.warn(
        `[Workflow] No edge found for decision "${decision}" from node ${node.id}`
      );
      // Fallback: try to find any edge from this node
      const fallbackEdge = workflow.edges.find((e) => e.source === node.id);
      return fallbackEdge ? fallbackEdge.target : null;
    }

    return nextNodeId;
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
    const toolName = node.data.toolName as string | undefined;
    const toolArgs = (node.data.toolArgs as Record<string, unknown>) || {};

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
      visitor?: unknown;
      conversation?: unknown;
      project?: unknown;
    }
  ): {
    systemPrompt: string;
    tools: ToolDefinition[];
  } {
    // Default fallback
    let systemPrompt = 'You are a helpful assistant.';
    let tools: ToolDefinition[] = [];

    if (node.data?.prompt) {
      systemPrompt = this.replaceVariables(node.data.prompt as string, context);
    }

    // If node allows tools, add them.
    if (node.type === 'condition' || node.type === 'llm') {
      tools = this.toolExecutor.getTools();
    }

    // Append Global Tools with instructions
    if (workflow.globalTools && workflow.globalTools.length > 0) {
      const allTools = this.toolExecutor.getTools();
      const globalToolInstructions: string[] = [];

      // Handle new GlobalToolConfig[] format
      for (const globalToolConfig of workflow.globalTools) {
        // Check if it's the new format (object with enabled/instruction)
        if (
          typeof globalToolConfig === 'object' &&
          'name' in globalToolConfig
        ) {
          if (!globalToolConfig.enabled) continue;

          const toolDef = allTools.find(
            (t) => t.function.name === globalToolConfig.name
          );
          if (toolDef) {
            // Check if tool is already in the list
            const existingNames = new Set(tools.map((t) => t.function.name));
            if (!existingNames.has(toolDef.function.name)) {
              tools.push(toolDef);
            }

            // Collect instruction for system prompt
            if (globalToolConfig.instruction) {
              globalToolInstructions.push(
                `- ${toolDef.function.name}: ${globalToolConfig.instruction}`
              );
            }
          }
        } else if (typeof globalToolConfig === 'string') {
          // Backward compatibility: old string[] format
          const toolDef = allTools.find(
            (t) => t.function.name === globalToolConfig
          );
          if (toolDef) {
            const existingNames = new Set(tools.map((t) => t.function.name));
            if (!existingNames.has(toolDef.function.name)) {
              tools.push(toolDef);
            }
          }
        }
      }

      // Append global tool instructions to system prompt
      if (globalToolInstructions.length > 0) {
        systemPrompt +=
          '\n\nGlobal Tool Usage Guidelines:\n' +
          globalToolInstructions.join('\n');
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
