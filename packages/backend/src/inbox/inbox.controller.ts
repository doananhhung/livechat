import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import {
  AgentTypingDto,
  ListConversationsDto,
  ListMessagesDto,
  ProjectRole,
  SendReplyDto,
  UpdateConversationDto,
  User,
} from '@social-commerce/shared';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';

@Controller('inbox')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ProjectRole.AGENT) // All users with AGENT or MANAGER project role can access
export class InboxController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService
  ) {}

  @Get('conversations')
  listConversations(
    @GetCurrentUser() user: User,
    @Query() query: ListConversationsDto
  ) {
    return this.conversationService.listByProject(user, query);
  }

  @Post('conversations/:id/messages')
  sendReply(
    @GetCurrentUser() user: User,
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() body: SendReplyDto
  ) {
    return this.messageService.sendAgentReply(user, conversationId, body.text);
  }

  @Patch('conversations/:id')
  updateConversation(
    @GetCurrentUser() user: User,
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() body: UpdateConversationDto
  ) {
    const userId = user.id;
    if (body.status) {
      return this.conversationService.updateStatus(
        userId,
        conversationId,
        body.status
      );
    }
    if (body.read === true) {
      return this.conversationService.markAsRead(userId, conversationId);
    }
  }

  @Get('conversations/:id/messages')
  listMessages(
    @GetCurrentUser() user: User,
    @Param('id', ParseIntPipe) conversationId: number,
    @Query() query: ListMessagesDto
  ) {
    return this.messageService.listByConversation(user, conversationId, query);
  }
  @Post('conversations/:id/typing')
  @HttpCode(204) // No Content
  async handleAgentTyping(
    @GetCurrentUser() user: User,
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() body: AgentTypingDto
  ) {
    await this.conversationService.handleAgentTyping(
      user,
      conversationId,
      body.isTyping
    );
  }
}
