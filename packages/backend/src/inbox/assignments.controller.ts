import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ConversationService } from './services/conversation.service';
import { AssignConversationDto } from '@live-chat/shared-dtos';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { ProjectRole, AuditAction } from '@live-chat/shared-types';
import { Auditable } from '../audit-logs/auditable.decorator';

@Controller('projects/:projectId/inbox/conversations/:id/assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly conversationService: ConversationService) {}

  @Auditable({ action: AuditAction.UPDATE, entity: 'ConversationAssignment' })
  @Post()
  @Roles(ProjectRole.AGENT)
  @HttpCode(200)
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignConversationDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.conversationService.assign(req.user.id, id, dto.assigneeId);
  }

  @Auditable({ action: AuditAction.UPDATE, entity: 'ConversationAssignment' })
  @Delete()
  @Roles(ProjectRole.AGENT)
  @HttpCode(200)
  async unassign(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.conversationService.unassign(req.user.id, id);
  }
}
