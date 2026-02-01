import { Injectable, Logger } from '@nestjs/common';
import {
  WorkflowDefinition,
  WorkflowNode,
  AiConfig,
} from '@live-chat/shared-types';
import { ToolDefinition, ToolCall } from '../interfaces/llm-provider.interface';
import { AiToolExecutor } from './ai-tool.executor';
import {
  WorkflowNodeSchema,
  ValidatedWorkflowNode,
  SwitchData,
} from '../schemas/workflow.schemas';

export interface WorkflowContext {
  projectId: number;
  visitorId: number;
  conversationId: string;
  currentNodeId: string;
  workflow: WorkflowDefinition;
  history: any[]; // Chat history for LLM context
  globalSystemPrompt?: string; // Global instructions to prepend to all routing prompts
}

export interface WorkflowStepResult {
  nextNodeId: string | null;
  output: string | null; // Text response to user
  toolCalls?: ToolCall[]; // Tools to be executed by the main loop
  requiresLlmDecision?: boolean; // If true, caller must ask LLM for route decision
  routingPrompt?: string; // Prompt for the routing decision
  tools?: ToolDefinition[]; // Tool definitions allowed for this step
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
  ): Promise<WorkflowStepResult> {
    const { workflow, currentNodeId } = context;
    const node = workflow.nodes.find((n) => n.id === currentNodeId);

    if (!node) {
      this.logger.error(`Node ${currentNodeId} not found in workflow.`);
      return { nextNodeId: null, output: null };
    }

    // Validate Node Schema
    const validationResult = WorkflowNodeSchema.safeParse(node);
    if (!validationResult.success) {
      this.logger.error(
        `Workflow Validation Failed for Node ${node.id}: ${validationResult.error}`
      );
      throw new Error(
        `Invalid configuration for node ${node.id}: ${validationResult.error.issues.map((i) => i.message).join(', ')}`
      );
    }

    // Use the validated data
    const validatedNode = validationResult.data;

    switch (validatedNode.type) {
      case 'start':
        this.logger.debug(
          `[Workflow] Start node ${validatedNode.id} triggered`
        );
        return this.handleStartNode(validatedNode, workflow);

      case 'action':
        this.logger.debug(
          `[Workflow] Action node ${validatedNode.id} executing tool: ${validatedNode.data.toolName}`
        );
        return await this.handleActionNode(validatedNode, workflow, context);

      case 'condition': // Router
        this.logger.debug(
          `[Workflow] Condition node ${validatedNode.id} requires routing decision`
        );
        return this.handleConditionNode(validatedNode, context);

      case 'llm':
        this.logger.debug(
          `[Workflow] LLM node ${validatedNode.id} - context provided, advancing to next node`
        );
        return {
          nextNodeId: this.getNextNodeId(validatedNode, workflow),
          output: null, // LLM response is handled by AiResponderService
        };

      case 'switch':
        this.logger.debug(
          `[Workflow] Switch node ${validatedNode.id} requires routing decision`
        );
        return this.handleSwitchNode(validatedNode, context);

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
    node: ValidatedWorkflowNode,
    context: WorkflowContext
  ): WorkflowStepResult {
    const aiConfig = context.workflow as AiConfig;
    const isVi = aiConfig.language === 'vi';
    const defaultPrompt = isVi
      ? 'Dựa vào cuộc trò chuyện, hãy quyết định hướng đi tiếp theo. Sử dụng công cụ route_decision với path là "yes" hoặc "no".'
      : 'Based on the conversation, decide which path to take. Use the route_decision tool with path "yes" or "no".';

    const basePrompt =
      (node.type === 'condition' && node.data.prompt) || defaultPrompt;

    const routingPrompt = context.globalSystemPrompt
      ? `${context.globalSystemPrompt}\n\n${basePrompt}`
      : basePrompt;

    return {
      nextNodeId: null, // Will be determined after LLM makes decision
      output: null,
      requiresLlmDecision: true,
      routingPrompt,
      tools: [this.toolExecutor.getRoutingTool()],
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

    const nextNodeId = this.getNextNodeId(
      node,
      workflow,
      encodeURIComponent(decision)
    );

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

  /**
   * Process the switch decision from the LLM and return the next node ID.
   * Called by AiResponderService after LLM calls switch_decision tool.
   */
  processSwitchDecision(
    node: WorkflowNode,
    workflow: WorkflowDefinition,
    caseName: string
  ): string | null {
    this.logger.debug(
      `[Workflow] Processing switch decision: ${caseName} for node ${node.id}`
    );

    // Try to find edge with matching case handle
    const nextNodeId = this.getNextNodeId(
      node,
      workflow,
      encodeURIComponent(caseName)
    );

    if (nextNodeId) {
      return nextNodeId;
    }

    // Fallback to default
    const defaultNodeId = this.getNextNodeId(node, workflow, 'default');
    if (defaultNodeId) {
      this.logger.debug(
        `[Workflow] Case "${caseName}" not found, using default`
      );
      return defaultNodeId;
    }

    // Last resort: find any edge from this node
    this.logger.warn(
      `[Workflow] No edge found for case "${caseName}" or default from node ${node.id}`
    );
    const fallbackEdge = workflow.edges.find((e) => e.source === node.id);
    return fallbackEdge ? fallbackEdge.target : null;
  }

  private handleStartNode(
    node: ValidatedWorkflowNode,
    workflow: WorkflowDefinition
  ): WorkflowStepResult {
    // Start node usually just moves to the next one immediately.
    const nextId = this.getNextNodeId(node, workflow);
    return { nextNodeId: nextId, output: null };
  }

  private handleSwitchNode(
    node: ValidatedWorkflowNode,
    context: WorkflowContext
  ): WorkflowStepResult {
    if (node.type !== 'switch') {
      throw new Error('handleSwitchNode called with non-switch node');
    }

    const data = node.data as SwitchData;
    const caseList = data.cases
      .map((c) => `- "${c.route}": ${c.when}`)
      .join('\n');
    const aiConfig = context.workflow as AiConfig;
    const isVi = aiConfig.language === 'vi';

    const defaultCaseInfo = isVi
      ? '\n- "default": Nếu không có điều kiện nào ở trên phù hợp'
      : '\n- "default": If none of the above conditions match';

    const defaultPrompt = isVi
      ? `Chọn trường hợp phù hợp dựa trên cuộc trò chuyện.\n\nCác trường hợp có sẵn:\n${caseList}${defaultCaseInfo}\n\nSử dụng công cụ switch_decision với tên trường hợp.`
      : `Choose the appropriate case based on the conversation.\n\nAvailable cases:\n${caseList}${defaultCaseInfo}\n\nUse the switch_decision tool with the case name.`;

    const basePrompt = data.prompt
      ? `${data.prompt}\n\n${isVi ? 'Các trường hợp có sẵn:' : 'Available cases:'}\n${caseList}${defaultCaseInfo}`
      : defaultPrompt;

    const routingPrompt = context.globalSystemPrompt
      ? `${context.globalSystemPrompt}\n\n${basePrompt}`
      : basePrompt;

    const caseNames = data.cases.map((c) => c.route);
    return {
      nextNodeId: null,
      output: null,
      requiresLlmDecision: true,
      routingPrompt,
      tools: [this.toolExecutor.getSwitchTool(caseNames)],
    };
  }

  private async handleActionNode(
    node: ValidatedWorkflowNode,
    workflow: WorkflowDefinition,
    context: WorkflowContext
  ): Promise<WorkflowStepResult> {
    // Action nodes are now LLM-driven OR Static.
    // If toolArgs.content is present => Static Execution.
    // Else => LLM Decision required (with prompt injection).

    if (node.type !== 'action') {
      return { nextNodeId: null, output: null };
    }

    const toolName = node.data.toolName;
    if (!toolName) {
      this.logger.warn(`Action node ${node.id} has no toolName defined.`);
      return {
        nextNodeId: this.getNextNodeId(node, workflow),
        output: null,
      };
    }

    // --- STATIC MODE CHECK ---
    const toolArgs = node.data.toolArgs || {};
    // Check if 'content' argument is provided (scoping to add_visitor_note pattern for now)
    const staticContent = toolArgs.content;
    const hasStaticContent =
      typeof staticContent === 'string' && staticContent.trim().length > 0;

    if (hasStaticContent) {
      this.logger.log(
        `[Workflow] Action node ${node.id} executing STATICALLY for tool: ${toolName}`
      );
      try {
        await this.toolExecutor.executeTool(
          {
            id: `static-${node.id}`,
            type: 'function',
            function: {
              name: toolName,
              arguments: JSON.stringify(toolArgs),
            },
          },
          {
            projectId: context.projectId,
            visitorId: context.visitorId,
            conversationId: context.conversationId,
            userId: 'SYSTEM',
          }
        );
      } catch (err) {
        this.logger.error(
          `[Workflow] Static tool execution failed for node ${node.id}: ${err}`
        );
        // Continue flow even if tool fails? Or halt?
        // Standard behavior: execution failure might not stop flow unless critical.
        // We log and proceed.
      }

      return {
        nextNodeId: this.getNextNodeId(node, workflow),
        output: null,
        requiresLlmDecision: false,
      };
    }

    // --- LLM MODE ---
    // Get the tool definition
    const allTools = this.toolExecutor.getTools();
    const toolDef = allTools.find((t) => t.function.name === toolName);
    if (!toolDef) {
      this.logger.warn(
        `Tool '${toolName}' not found for action node ${node.id}.`
      );
      return {
        nextNodeId: this.getNextNodeId(node, workflow),
        output: null,
      };
    }

    // Build routing prompt
    const aiConfig = context.workflow as AiConfig;
    const isVi = aiConfig.language === 'vi';
    const userPrompt = node.data.prompt;

    // Inject User Instruction into Tool Description
    let finalToolDef = toolDef;
    if (userPrompt) {
      // Clone to avoid mutating singleton
      finalToolDef = JSON.parse(JSON.stringify(toolDef));
      if (finalToolDef?.function) {
        finalToolDef.function.description = `${toolDef.function.description}\n\nIMPORTANT CONTEXT/INSTRUCTION: ${userPrompt}`;
      }
    }

    const basePrompt = isVi
      ? `Bạn PHẢI sử dụng công cụ "${toolName}" để thực hiện hành động này. Hãy xác định các tham số phù hợp dựa trên ngữ cảnh cuộc trò chuyện.`
      : `You MUST use the tool "${toolName}" to perform this action. Determine the appropriate arguments based on the conversation context.`;

    const baseRoutingPrompt = userPrompt
      ? `${basePrompt}\n\nUSER INSTRUCTION: ${userPrompt}`
      : basePrompt;

    const routingPrompt = context.globalSystemPrompt
      ? `${context.globalSystemPrompt}\n\n${baseRoutingPrompt}`
      : baseRoutingPrompt;

    return {
      nextNodeId: null, // Will be determined after tool execution
      output: null,
      requiresLlmDecision: true,
      routingPrompt,
      tools: [finalToolDef],
    };
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

    // Inject Language Instruction
    const aiConfig = workflow as AiConfig;
    if (aiConfig.language === 'vi') {
      systemPrompt += '\n\nBẠN PHẢI TRẢ LỜI VÀ SUY LUẬN BẰNG TIẾNG VIỆT.';
    } else if (aiConfig.language === 'en') {
      systemPrompt += '\n\nYou must reply and reason in English.';
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
