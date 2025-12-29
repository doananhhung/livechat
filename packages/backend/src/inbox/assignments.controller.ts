import { Controller, Post, Delete, Param, Body, UseGuards, Req, HttpCode } from '@nestjs/common';
import { ConversationService } from './services/conversation.service';
import { AssignConversationDto } from './dto/assign-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';

@Controller('conversations/:id/assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @HttpCode(200)
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignConversationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.conversationService.assign(req.user.id, id, dto.assigneeId);
  }

  @Delete()
  @HttpCode(200)
  async unassign(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.conversationService.unassign(req.user.id, id);
  }
}
