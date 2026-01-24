import {
  LLMProvider,
  ChatMessage,
  ToolDefinition,
  LLMResponse,
  ToolCall,
} from '../interfaces/llm-provider.interface';
import { Injectable, Logger } from '@nestjs/common';
import {
  AiToolName,
  ConversationStatus,
  SYSTEM_USER_ID,
} from '@live-chat/shared-types';
import { ConversationService } from '../../inbox/services/conversation.service';
import { ActionsService } from '../../actions/actions.service';
import { VisitorNotesService } from '../../visitor-notes/visitor-notes.service';

const ADD_NOTE_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: AiToolName.ADD_VISITOR_NOTE,
    description: 'Adds an internal note about the visitor for agents to see.',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content of the note.',
        },
      },
      required: ['content'],
    },
  },
};

const CHANGE_STATUS_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: AiToolName.CHANGE_STATUS,
    description: 'Updates the status of the conversation.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: [
            ConversationStatus.OPEN,
            ConversationStatus.PENDING,
            ConversationStatus.SOLVED,
          ],
          description: 'The new status for the conversation.',
        },
      },
      required: ['status'],
    },
  },
};

const SEND_FORM_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: AiToolName.SEND_FORM,
    description: 'Sends a form request to the visitor.',
    parameters: {
      type: 'object',
      properties: {
        templateId: {
          type: 'number',
          description: 'The ID of the form template to send.',
        },
      },
      required: ['templateId'],
    },
  },
};

const ROUTE_DECISION_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: AiToolName.ROUTE_DECISION,
    description:
      'Decide which path to take in the workflow based on the routing prompt',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          enum: ['yes', 'no'],
          description:
            'The path to take: "yes" for the positive/affirmative path, "no" for the negative/alternative path',
        },
      },
      required: ['path'],
    },
  },
};

@Injectable()
export class AiToolExecutor {
  private readonly logger = new Logger(AiToolExecutor.name);

  constructor(
    private readonly conversationService: ConversationService,
    private readonly actionsService: ActionsService,
    private readonly visitorNotesService: VisitorNotesService
  ) {}

  getTools(): ToolDefinition[] {
    return [ADD_NOTE_TOOL, CHANGE_STATUS_TOOL, SEND_FORM_TOOL];
  }

  getRoutingTool(): ToolDefinition {
    return ROUTE_DECISION_TOOL;
  }

  async executeTool(
    toolCall: ToolCall,
    context: {
      projectId: number;
      visitorId: number;
      conversationId: string;
      userId: string; // AI acting as system/user
    }
  ): Promise<string> {
    try {
      const args = JSON.parse(toolCall.function.arguments);
      const name = toolCall.function.name;

      this.logger.log(
        `Executing tool [${name}] for conversation ${context.conversationId}`
      );

      switch (name) {
        case AiToolName.ADD_VISITOR_NOTE:
          await this.visitorNotesService.create(
            context.projectId,
            context.visitorId,
            null, // System author
            { content: args.content }
          );
          return 'Note added successfully.';

        case AiToolName.CHANGE_STATUS:
          // Uses SYSTEM_USER_ID which bypasses project membership check
          await this.conversationService.updateStatus(
            SYSTEM_USER_ID,
            context.conversationId,
            args.status
          );
          return `Status changed to ${args.status}.`;

        case AiToolName.SEND_FORM:
          await this.actionsService.sendFormRequest(
            context.conversationId,
            { templateId: args.templateId },
            { id: SYSTEM_USER_ID, role: 'admin' } as any // System user for AI action
          );
          return `Form request ${args.templateId} sent.`;

        default:
          return `Error: Tool ${name} not found.`;
      }
    } catch (error) {
      this.logger.error(
        `Failed to execute tool ${toolCall.function.name}`,
        error
      );
      return `Error executing tool: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}
