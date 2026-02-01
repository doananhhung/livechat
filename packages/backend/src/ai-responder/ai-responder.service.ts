import { Injectable, Logger } from '@nestjs/common';
import { EventsGateway } from '../gateway/events.gateway';
import { ProjectService } from '../projects/project.service';
import { OnEvent } from '@nestjs/event-emitter';
import { VisitorMessageReceivedEvent } from '../inbox/events';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, Message, Project } from '../database/entities';
import { MessageStatus } from '@live-chat/shared-types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RealtimeSessionService } from '../realtime-session/realtime-session.service';
import { AiProcessMessageEvent } from '../inbox/events';
import { LLMProviderManager } from './services/llm-provider.manager';
import {
  ChatMessage,
  ToolDefinition,
} from './interfaces/llm-provider.interface';
import { AiToolExecutor } from './services/ai-tool.executor';
import {
  WorkflowEngineService,
  WorkflowContext,
} from './services/workflow-engine.service';
import { VisitorLockService } from './services/visitor-lock.service';
import {
  WorkflowDefinition,
  VisitorSessionMetadata,
} from '@live-chat/shared-types';

@Injectable()
export class AiResponderService {
  private readonly logger = new Logger(AiResponderService.name);

  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly projectService: ProjectService,
    private readonly llmProviderManager: LLMProviderManager,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly eventEmitter: EventEmitter2,
    private readonly realtimeSessionService: RealtimeSessionService,
    private readonly aiToolExecutor: AiToolExecutor,
    private readonly workflowEngine: WorkflowEngineService,
    private readonly visitorLockService: VisitorLockService
  ) {}

  /**
   * Determines if the AI responder should be active for a given project.
   * AI is active if:
   * 1. It is enabled in the project settings.
   * 2. There are no human agents online.
   * @param projectId The ID of the project.
   */
  async isAiActive(projectId: number): Promise<boolean> {
    const project = await this.projectService.findByProjectId(projectId);

    if (!project) return false;

    // Phase 3 Migration: Check aiConfig first, fallback to legacy
    const aiConfig = project.aiConfig as Record<string, any> | null;
    const isEnabled = aiConfig?.enabled ?? project.aiResponderEnabled;

    if (!isEnabled) {
      return false;
    }

    const agentCount = await this.eventsGateway.getOnlineAgentCount(projectId);
    this.logger.debug(`Project ${projectId} agent count: ${agentCount}`);

    return agentCount === 0;
  }

  @OnEvent('ai.process.message')
  async handleVisitorMessage(payload: AiProcessMessageEvent) {
    this.logger.log(
      `Checking AI response for conversation ${payload.conversationId} in project ${payload.projectId}`
    );

    // Acquire lock to prevent concurrent processing for the same visitor
    const lockId = await this.visitorLockService.acquireLock(
      payload.visitorUid
    );
    if (!lockId) {
      this.logger.warn(
        `Message processing skipped, lock held for visitor ${payload.visitorUid}`
      );
      return;
    }

    try {
      await this._processMessage(payload);
    } finally {
      // Always release the lock
      await this.visitorLockService.releaseLock(payload.visitorUid, lockId);
    }
  }

  /**
   * Internal message processing logic.
   * Separated to allow recursive calls (e.g., for condition node routing)
   * while holding the single lock from the entry point.
   */
  private async _processMessage(payload: AiProcessMessageEvent) {
    try {
      // 1. Validation & Data Loading
      const ctx = await this._loadExecutionContext(payload);
      if (!ctx) return;
      const { project, conversation, messages } = ctx;

      // 2. Workflow Setup (State Machine & Action Nodes)
      const wfState = await this._prepareWorkflow(
        project,
        conversation,
        messages
      );
      if (!wfState) return; // Should not happen typically, but safe guard

      // 3. LLM Generation Loop
      const genResult = await this._generateLlmResponse(
        payload.projectId,
        conversation,
        wfState.workflowCtx?.history || messages,
        wfState.systemPrompt,
        wfState.tools
      );

      // 4. Handle Routing (Recursion)
      if (genResult.routingDecision && wfState.routingNode) {
        await this._handleRoutingDecision(
          payload,
          conversation,
          wfState.workflowCtx!,
          wfState.routingNode,
          genResult.routingDecision
        );
        return;
      }

      const responseText = genResult.responseText;
      if (!responseText) {
        this.logger.warn(
          'AI generated empty response after max turns. Skipping message creation.'
        );
        return;
      }

      // 5. Finalize (Save, Advance Workflow, Emit)
      await this._finalizeResponse(
        payload,
        conversation,
        responseText,
        wfState.workflowCtx
      );
    } catch (error) {
      this.logger.error('Error in _processMessage:', error);
    }
  }

  // --- Helper Methods ---

  private async _loadExecutionContext(payload: AiProcessMessageEvent) {
    this.logger.debug(
      `Loading execution context for project: ${payload.projectId}`
    );

    // 1. Check if AI active
    const isActive = await this.isAiActive(payload.projectId);
    if (!isActive) {
      this.logger.debug(
        `AI not active for project ${payload.projectId}. Skipping.`
      );
      return null;
    }

    // 2. Fetch Project
    const project = await this.projectRepository.findOneBy({
      id: payload.projectId,
    });
    if (!project) return null;

    // 3. Fetch Conversation (Direct via ID)
    const conversation = await this.conversationRepository.findOne({
      where: {
        id: payload.conversationId,
      },
      relations: ['visitor', 'messages'],
    });

    if (!conversation) {
      this.logger.warn(
        `No conversation found for id ${payload.conversationId} during AI processing.`
      );
      return null;
    }

    // 0. Check Visitor Preference (using loaded conversation metadata)
    const metadata = conversation.metadata as VisitorSessionMetadata;
    if (metadata?.aiEnabled === false) {
      this.logger.debug(
        `AI skipped for visitor ${payload.visitorUid} (opted out).`
      );
      return null;
    }

    // 4. Fetch History (using loaded messages relation or separate query)
    // Using simple query for consistency with previous logic
    const history = await this.messageRepository.find({
      where: { conversationId: Number(conversation.id) },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // 5. Format Messages
    const messages: ChatMessage[] = history.reverse().map((msg) => ({
      role: msg.fromCustomer ? 'user' : 'assistant',
      content: msg.content || '',
    }));

    return { project, conversation, messages };
  }

  private async _prepareWorkflow(
    project: Project,
    conversation: Conversation,
    messages: ChatMessage[]
  ) {
    const aiConfig = project.aiConfig as Record<string, any> | null;
    // TODO: We need a global system prompt always enabled
    let systemPrompt =
      aiConfig?.prompt ||
      project.aiResponderPrompt ||
      'You are a helpful assistant.';
    let tools: ToolDefinition[] | undefined = undefined;
    let workflowCtx: WorkflowContext | null = null;
    let routingNode: {
      type: 'condition' | 'switch' | 'action';
      node: any;
    } | null = null;

    if (project.aiMode === 'orchestrator' && project.aiConfig) {
      const workflow = project.aiConfig as WorkflowDefinition;
      const metadata = (conversation.metadata as VisitorSessionMetadata) || {};

      let currentNodeId = metadata.workflowState?.currentNodeId ?? null;

      // Initialize Start Node if needed
      if (!currentNodeId) {
        const startNode = workflow.nodes.find((n) => n.type === 'start');
        if (startNode) {
          // Start node: check if we should auto-advance
          const startCtx: WorkflowContext = {
            projectId: project.id,
            visitorId: conversation.visitor.id,
            conversationId: String(conversation.id),
            currentNodeId: startNode.id,
            workflow: workflow,
            history: messages,
          };
          // Execute start node to see where it goes
          const startResult = await this.workflowEngine.executeStep(startCtx);
          if (startResult.nextNodeId) {
            currentNodeId = startResult.nextNodeId;
          } else {
            currentNodeId = startNode.id;
          }
        }
      }

      if (currentNodeId) {
        workflowCtx = {
          projectId: project.id,
          visitorId: conversation.visitor.id,
          conversationId: String(conversation.id),
          currentNodeId: currentNodeId,
          workflow: workflow,
          history: messages,
        };

        // Delegate execution logic to the engine
        this.logger.debug('Calling executeStep');
        const stepResult = await this.workflowEngine.executeStep(workflowCtx);
        const currentNode = workflow.nodes.find((n) => n.id === currentNodeId);

        // Special Handling for Condition Nodes: Only see last message to avoid sticky history
        if (currentNode?.type === 'condition') {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage) {
             workflowCtx.history = [lastMessage];
          }
        }

        if (stepResult.requiresLlmDecision && currentNode) {
          // Engine indicates LLM Routing is needed (Condition, Switch, Action)
          systemPrompt = stepResult.routingPrompt!;
          tools = stepResult.tools;

          // Type narrowing for legacy downstream compatibility
          if (
            currentNode.type === 'condition' ||
            currentNode.type === 'switch' ||
            currentNode.type === 'action'
          ) {
            routingNode = { type: currentNode.type, node: currentNode };
          }
        } else if (currentNode?.type === 'llm') {
          // Standard LLM Generation Node
          const context = this.workflowEngine.getNodeContext(
            currentNode,
            workflow,
            {
              visitor: conversation.visitor,
              conversation: conversation,
              project: project,
            }
          );
          systemPrompt = context.systemPrompt;
          tools = context.tools;
        } else {
           // Fallback or End of Workflow (no routing, not LLM)
           // e.g. Start node that didn't move?, or unknown type
           tools = this.aiToolExecutor.getTools();
        }
      }
    } else {
      // Simple Mode
      if (project.aiMode === 'orchestrator') {
        tools = this.aiToolExecutor.getTools();
      }
    }

    return { systemPrompt, tools, workflowCtx, routingNode };
  }

  private async _generateLlmResponse(
    projectId: number,
    conversation: Conversation,
    messages: ChatMessage[],
    systemPrompt: string,
    tools?: ToolDefinition[]
  ) {
    this.logger.log(`Generating AI response for project ${projectId}`);

    let routeDecisionMade: string | null = null;
    let switchDecisionMade: string | null = null;
    let responseText: string | null = null;
    let actionExecuted = false;

    const aiResponse = await this.llmProviderManager.generateResponse(
      messages,
      systemPrompt,
      tools
    );

    this.logger.debug(`AI response payload: ${JSON.stringify(aiResponse)}`);

    if (!aiResponse.toolCalls || aiResponse.toolCalls.length === 0) {
      responseText = aiResponse.content;
    } else {
      // Handle Tool Calls (single pass)
      for (const toolCall of aiResponse.toolCalls) {
        // Condition Routing
        if (toolCall.function.name === 'route_decision') {
          const args = JSON.parse(toolCall.function.arguments);
          routeDecisionMade = args.path;
          this.logger.debug(`[Workflow] Route decision: ${args.path}`);
          continue;
        }

        // Switch Routing
        if (toolCall.function.name === 'switch_decision') {
          const args = JSON.parse(toolCall.function.arguments);
          switchDecisionMade = args.case;
          this.logger.debug(`[Workflow] Switch decision: ${args.case}`);
          continue;
        }

        // Execute Standard Tool (Action node)
        await this.aiToolExecutor.executeTool(toolCall, {
          projectId: projectId,
          visitorId: conversation.visitor.id,
          conversationId: String(conversation.id),
          userId: 'AI_SYSTEM',
        });
        actionExecuted = true;
      }
    }

    return {
      responseText,
      routingDecision: routeDecisionMade
        ? { type: 'condition' as const, decision: routeDecisionMade }
        : switchDecisionMade
          ? { type: 'switch' as const, decision: switchDecisionMade }
          : actionExecuted
            ? { type: 'action' as const, decision: 'done' }
            : null,
    };
  }

  private async _handleRoutingDecision(
    payload: AiProcessMessageEvent,
    conversation: Conversation,
    workflowCtx: WorkflowContext,
    routingNode: { type: 'condition' | 'switch' | 'action'; node: any },
    decision: { type: 'condition' | 'switch' | 'action'; decision: string }
  ) {
    let nextNodeId: string | null = null;
    const workflow = workflowCtx.workflow;

    if (routingNode.type === 'condition' && decision.type === 'condition') {
      nextNodeId = this.workflowEngine.processRouteDecision(
        routingNode.node,
        workflow,
        decision.decision as 'yes' | 'no'
      );
      this.logger.debug(`[Workflow] Condition routed to: ${nextNodeId}`);
    } else if (routingNode.type === 'switch' && decision.type === 'switch') {
      nextNodeId = this.workflowEngine.processSwitchDecision(
        routingNode.node,
        workflow,
        decision.decision
      );
      this.logger.debug(`[Workflow] Switch routed to: ${nextNodeId}`);
    } else if (routingNode.type === 'action') {
        // Action is complete, just find default edge
        const edge = workflow.edges.find(e => e.source === routingNode.node.id);
        nextNodeId = edge ? edge.target : null;
        this.logger.debug(`[Workflow] Action '${routingNode.node.id}' completed, moving to: ${nextNodeId}`);
    } else {
        this.logger.error('[Workflow] Mismatch in routing node/decision types');
        return;
    }

    // Update Metadata
    const mergedMetadata = {
      ...(conversation.metadata as any || {}),
      workflowState: { currentNodeId: nextNodeId },
    };
    await this.conversationRepository.update(
      { id: conversation.id },
      { metadata: mergedMetadata }
    );

    // Recursively process next node
    return this._processMessage(payload);
  }

  private async _finalizeResponse(
    payload: AiProcessMessageEvent,
    conversation: Conversation,
    responseText: string,
    workflowCtx: WorkflowContext | null
  ) {
    // 1. Save Message
    const aiMessage = this.messageRepository.create({
      conversationId: Number(conversation.id),
      content: responseText,
      senderId: 'AI_BOT',
      recipientId: conversation.visitor.visitorUid,
      fromCustomer: false,
      status: MessageStatus.SENT,
      createdAt: new Date(),
    });

    const savedMessage = await this.messageRepository.save(aiMessage);

    // 2. Advance Workflow State
    let nextNodeId: string | null = null;
    if (workflowCtx) {
        this.logger.debug('Calling executeStep');
      const stepResult = await this.workflowEngine.executeStep(workflowCtx);
      nextNodeId = stepResult.nextNodeId;

      if (nextNodeId === null) {
        this.logger.log(
          `[Workflow] Completed for conversation ${conversation.id}. Will restart on next message.`
        );
      } else {
        this.logger.debug(`[Workflow] Advanced to node: ${nextNodeId}`);
      }
    }

    // 3. Update Conversation Checks
    // Fetch fresh just in case, though usually update is safe if we merge
    const freshConversation = await this.conversationRepository.findOne({
      where: { id: conversation.id },
      select: ['metadata'],
    });

    const mergedMetadata = {
      ...(freshConversation?.metadata || {}),
      ...(workflowCtx
        ? { workflowState: { currentNodeId: nextNodeId } }
        : {}),
    };

    await this.conversationRepository.update(
      { id: conversation.id },
      {
        lastMessageSnippet: responseText,
        lastMessageTimestamp: savedMessage.createdAt,
        metadata: mergedMetadata,
      }
    );

    // 4. Emit Event
    const visitorSocketId = await this.realtimeSessionService.getVisitorSession(
      conversation.visitor.visitorUid
    );

    this.eventEmitter.emit('agent.message.sent', {
      visitorSocketId,
      message: savedMessage,
      projectId: payload.projectId,
    });

    this.logger.log(`AI Response sent: ${savedMessage.id}`);
  }
}
