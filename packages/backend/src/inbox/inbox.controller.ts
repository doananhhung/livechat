import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { VisitorService } from './services/visitor.service';
import {
  AgentTypingDto,
  ConversationListResponseDto,
  ListConversationsDto,
  ListMessagesDto,
  SendReplyDto,
  UpdateConversationDto,
} from '@live-chat/shared-dtos';
import { User } from '../database/entities';
import { ProjectRole, AuditAction } from '@live-chat/shared-types';
import { Auditable } from '../audit-logs/auditable.decorator';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';

@Controller('projects/:projectId/inbox')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ProjectRole.AGENT) // All users with AGENT or MANAGER project role can access
export class InboxController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly visitorService: VisitorService
  ) {}

  @Get('conversations')
  async listConversations(
    @GetCurrentUser() user: User,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() query: ListConversationsDto
  ): Promise<ConversationListResponseDto> {
    const result = await this.conversationService.listByProject(user, projectId, query);
    return result;
  }

  @Post('conversations/:id/messages')
  sendReply(
    @GetCurrentUser() user: User,
    @Param('id') conversationId: string,
    @Body() body: SendReplyDto
  ) {
    return this.messageService.sendAgentReply(user, conversationId, body.text);
  }

  @Auditable({ action: AuditAction.UPDATE, entity: 'Conversation' })
  @Patch('conversations/:id')
  async updateConversation(
    @GetCurrentUser() user: User,
    @Param('id') conversationId: string,
    @Body() body: UpdateConversationDto
  ) {
    const userId = user.id;
    if (body.status) {
      return await this.conversationService.updateStatus(
        userId,
        conversationId,
        body.status
      );
    }
    if (body.read === true) {
      return await this.conversationService.markAsRead(userId, conversationId);
    }
    // If neither status nor read is provided, return the conversation as is
    throw new Error('Either status or read must be provided');
  }

  @Get('conversations/:id/messages')
  listMessages(
    @GetCurrentUser() user: User,
    @Param('id') conversationId: string,
    @Query() query: ListMessagesDto
  ) {
    return this.messageService.listByConversation(user, conversationId, query);
  }
  @Post('conversations/:id/typing')
  @HttpCode(204) // No Content
  async handleAgentTyping(
    @GetCurrentUser() user: User,
    @Param('id') conversationId: string,
    @Body() body: AgentTypingDto
  ) {
    await this.conversationService.handleAgentTyping(
      user,
      conversationId,
      body.isTyping
    );
  }

  @Get('visitors/:id')
  async getVisitor(
    @GetCurrentUser() user: User,
    @Param('id', ParseIntPipe) visitorId: number
  ) {
    return this.visitorService.getVisitorById(visitorId);
  }

  @Auditable({ action: AuditAction.DELETE, entity: 'Conversation' })
  @Delete('conversations/:id')
  @Roles(ProjectRole.MANAGER) // Only managers can delete conversations
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConversation(
    @GetCurrentUser() user: User,
    @Param('id') conversationId: string,
  ) {
    await this.conversationService.deleteConversation(user.id, conversationId);
  }
}
