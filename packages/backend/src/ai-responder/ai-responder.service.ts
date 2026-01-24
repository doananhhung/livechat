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
    private readonly workflowEngine: WorkflowEngineService
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

    if (!project || !project.aiResponderEnabled) {
      return false;
    }

    const agentCount = await this.eventsGateway.getOnlineAgentCount(projectId);
    this.logger.debug(`Project ${projectId} agent count: ${agentCount}`);

    return agentCount === 0;
  }

  @OnEvent('visitor.message.received')
  async handleVisitorMessage(payload: VisitorMessageReceivedEvent) {
    this.logger.log(
      `Checking AI response for visitor ${payload.visitorUid} in project ${payload.projectId}`
    );

    try {
      // 0. Check Visitor Preference (Opt-out)
      // If aiEnabled is strictly false, skip. Undefined implies true/default.
      if (payload.sessionMetadata?.aiEnabled === false) {
        this.logger.debug(
          `AI skipped for visitor ${payload.visitorUid} (opted out).`
        );
        return;
      }

      // 1. Check if AI should be active
      const isActive = await this.isAiActive(payload.projectId);
      if (!isActive) {
        this.logger.debug(
          `AI not active for project ${payload.projectId}. Skipping.`
        );
        return;
      }

      // 2. Fetch project for prompt
      const project = await this.projectRepository.findOneBy({
        id: payload.projectId,
      });
      if (!project) return;

      // 3. Wait a bit to simulate processing/prevent race conditions with the message being saved
      // Ideally we would listen to 'message.created' but 'visitor.message.received' is upstream.
      // We need to fetch the conversation context.

      // Let's look up the conversation by visitorUid
      const conversation = await this.conversationRepository.findOne({
        where: {
          visitor: { visitorUid: payload.visitorUid },
          project: { id: payload.projectId },
        },
        relations: ['visitor'],
      });

      if (!conversation) {
        this.logger.warn(
          `No conversation found for visitor ${payload.visitorUid} when trying to reply with AI.`
        );
        return;
      }

      // 4. Fetch recent history
      const history = await this.messageRepository.find({
        where: { conversationId: Number(conversation.id) },
        order: { createdAt: 'DESC' },
        take: 10,
      });

      // 5. Format messages for LLM
      const messages: ChatMessage[] = history.reverse().map((msg) => ({
        role: msg.fromCustomer ? 'user' : 'assistant',
        content: msg.content || '',
      }));

      // Append the new message if it wasn't in DB yet
      const lastMsg = messages[messages.length - 1];
      if (!lastMsg || lastMsg.content !== payload.content) {
        messages.push({ role: 'user', content: payload.content });
      }

      // -- WORKFLOW LOGIC START --
      let systemPrompt =
        project.aiResponderPrompt || 'You are a helpful assistant.';
      let tools: ToolDefinition[] | undefined = undefined;
      let workflowCtx: WorkflowContext | null = null;
      let isConditionRouting = false;
      let conditionNode: { id: string; type: string; data: unknown } | null =
        null;

      if (project.aiMode === 'orchestrator' && project.aiConfig) {
        // Load Workflow
        const workflow = project.aiConfig as WorkflowDefinition;
        const metadata =
          (conversation.metadata as VisitorSessionMetadata) || {};

        // Determine Current Node
        let currentNodeId = metadata.workflowState?.currentNodeId ?? null;

        if (!currentNodeId) {
          // Find start node and execute to get first real node
          const startNode = workflow.nodes.find((n) => n.type === 'start');
          if (startNode) {
            const startCtx: WorkflowContext = {
              projectId: project.id,
              visitorId: conversation.visitor.id,
              conversationId: String(conversation.id),
              currentNodeId: startNode.id,
              workflow: workflow,
              history: messages,
            };
            const startResult = await this.workflowEngine.executeStep(startCtx);
            currentNodeId = startResult.nextNodeId;
          }
        }

        // Auto-execute Action nodes until we hit LLM or Condition
        let currentNode = currentNodeId
          ? workflow.nodes.find((n) => n.id === currentNodeId)
          : null;

        while (currentNode && currentNode.type === 'action') {
          this.logger.debug(
            `[Workflow] Auto-executing action node: ${currentNode.id}`
          );
          const actionCtx: WorkflowContext = {
            projectId: project.id,
            visitorId: conversation.visitor.id,
            conversationId: String(conversation.id),
            currentNodeId: currentNode.id,
            workflow: workflow,
            history: messages,
          };
          const actionResult = await this.workflowEngine.executeStep(actionCtx);
          currentNodeId = actionResult.nextNodeId;
          currentNode = currentNodeId
            ? workflow.nodes.find((n) => n.id === currentNodeId)
            : null;
        }

        if (currentNodeId && currentNode) {
          // Check if this is a Condition (Router) node
          if (currentNode.type === 'condition') {
            isConditionRouting = true;
            conditionNode = currentNode;

            // Get routing prompt from node data or use default
            const routingPrompt =
              (currentNode.data?.prompt as string) ||
              'Based on the conversation, decide which path to take. Use the route_decision tool with path "yes" or "no".';
            systemPrompt = routingPrompt;
            tools = [this.aiToolExecutor.getRoutingTool()];

            this.logger.debug(
              `[Workflow] Condition node ${currentNode.id} - using route_decision tool`
            );
          } else {
            // LLM node - get normal context
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
          }

          // Store context for later state persistence
          workflowCtx = {
            projectId: project.id,
            visitorId: conversation.visitor.id,
            conversationId: String(conversation.id),
            currentNodeId: currentNodeId,
            workflow: workflow,
            history: messages,
          };
        } else {
          // Fallback if workflow invalid
          tools = this.aiToolExecutor.getTools();
        }
      } else {
        // Fallback to simple Orchestrator mode (all tools) if config is missing but mode is set
        if (project.aiMode === 'orchestrator') {
          tools = this.aiToolExecutor.getTools();
        }
      }
      // -- WORKFLOW LOGIC END --

      // 6. Generate Response Loop
      this.logger.log(
        `Generating AI response for project ${payload.projectId}`
      );

      let aiResponseText: string | null = null;
      let turns = 0;
      const MAX_TURNS = 3;
      let routeDecisionMade: string | null = null;

      while (turns < MAX_TURNS) {
        turns++;
        const aiResponse = await this.llmProviderManager.generateResponse(
          messages,
          systemPrompt,
          tools
        );

        this.logger.debug(`AI response payload: ${JSON.stringify(aiResponse)}`);

        // If simple text response, we are done
        if (!aiResponse.toolCalls || aiResponse.toolCalls.length === 0) {
          aiResponseText = aiResponse.content;
          break;
        }

        // Handle Tool Calls
        messages.push({
          role: 'assistant',
          content: aiResponse.content || null,
          tool_calls: aiResponse.toolCalls,
        });

        for (const toolCall of aiResponse.toolCalls) {
          // Special handling for route_decision tool
          if (toolCall.function.name === 'route_decision') {
            const args = JSON.parse(toolCall.function.arguments) as {
              path: 'yes' | 'no';
            };
            routeDecisionMade = args.path;
            this.logger.debug(`[Workflow] Route decision: ${args.path}`);

            // Push a tool response to satisfy the API
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: `Routing to path: ${args.path}`,
            });
            continue;
          }

          // Normal tool execution
          const result = await this.aiToolExecutor.executeTool(toolCall, {
            projectId: payload.projectId,
            visitorId: conversation.visitor.id,
            conversationId: String(conversation.id),
            userId: 'AI_SYSTEM',
          });

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: result,
          });
        }

        // If route decision was made, break out of loop
        if (routeDecisionMade) {
          break;
        }
        // Loop continues to send tool results back to LLM
      }

      // Handle routing decisions (no message to send, just advance workflow)
      if (
        isConditionRouting &&
        routeDecisionMade &&
        workflowCtx &&
        conditionNode
      ) {
        const workflow = workflowCtx.workflow;
        const nextNodeId = this.workflowEngine.processRouteDecision(
          conditionNode as Parameters<
            typeof this.workflowEngine.processRouteDecision
          >[0],
          workflow,
          routeDecisionMade as 'yes' | 'no'
        );

        const currentMetadata =
          (conversation.metadata as VisitorSessionMetadata) || {};
        conversation.metadata = {
          ...currentMetadata,
          workflowState: {
            currentNodeId: nextNodeId,
          },
        };

        await this.conversationRepository.save(conversation);

        this.logger.debug(`[Workflow] Condition routed to: ${nextNodeId}`);

        // Re-invoke handler to process the next node immediately
        // This allows chaining through multiple nodes in one turn
        return this.handleVisitorMessage(payload);
      }

      if (!aiResponseText) {
        this.logger.warn(
          'AI generated empty response after max turns. Skipping message creation.'
        );
        return;
      }

      // 7. Save AI Message
      const aiMessage = this.messageRepository.create({
        conversationId: Number(conversation.id),
        content: aiResponseText,
        senderId: 'AI_BOT',
        recipientId: conversation.visitor.visitorUid,
        fromCustomer: false,
        status: MessageStatus.SENT,
        createdAt: new Date(),
      });

      const savedMessage = await this.messageRepository.save(aiMessage);

      // 8. Update Conversation Last Message & Workflow State
      conversation.lastMessageSnippet = aiResponseText;
      conversation.lastMessageTimestamp = savedMessage.createdAt;

      // Advance workflow state if in orchestrator mode
      if (workflowCtx) {
        const stepResult = await this.workflowEngine.executeStep(workflowCtx);
        const currentMetadata =
          (conversation.metadata as VisitorSessionMetadata) || {};
        conversation.metadata = {
          ...currentMetadata,
          workflowState: {
            currentNodeId: stepResult.nextNodeId,
          },
        };

        if (stepResult.nextNodeId === null) {
          this.logger.log(
            `[Workflow] Workflow completed for conversation ${conversation.id}. Will restart on next message.`
          );
        } else {
          this.logger.debug(
            `[Workflow] Advanced to node: ${stepResult.nextNodeId}`
          );
        }
      }

      await this.conversationRepository.save(conversation);

      // 9. Resolve socket ID and Emit Event
      const visitorSocketId =
        await this.realtimeSessionService.getVisitorSession(
          conversation.visitor.visitorUid
        );

      const eventPayload = {
        visitorSocketId,
        message: savedMessage,
        projectId: payload.projectId,
      };

      this.eventEmitter.emit('agent.message.sent', eventPayload);

      this.logger.log(`AI Response sent: ${savedMessage.id}`);
    } catch (error) {
      this.logger.error('Error in handleVisitorMessage:', error);
    }
  }
}
