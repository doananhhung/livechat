import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
  Delete,
  Query,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  WidgetSettingsDto,
  CreateInvitationDto,
  AcceptInvitationDto,
} from '@live-chat/shared-dtos';
import { User } from '../database/entities';
import { ProjectRole, AuditAction } from '@live-chat/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { InvitationService } from './invitation.service';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { Auditable } from '../audit-logs/auditable.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly invitationService: InvitationService
  ) {}

  @Auditable({ action: AuditAction.CREATE, entity: 'Project' })
  @Post()
  create(
    @Body() createProjectDto: CreateProjectDto,
    @GetCurrentUser() user: User
  ) {
    return this.projectService.create(createProjectDto, user.id);
  }

  @Get()
  findAll(@GetCurrentUser() user: User) {
    return this.projectService.findAllForUser(user.id);
  }

  @Auditable({ action: AuditAction.UPDATE, entity: 'Project' })
  @Roles(ProjectRole.MANAGER)
  @Patch(':projectId')
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() updateProjectDto: UpdateProjectDto,
    @GetCurrentUser() user: User
  ) {
    return this.projectService.update(projectId, updateProjectDto, user.id);
  }

  @Roles(ProjectRole.MANAGER)
  @Patch(':projectId/widget-settings')
  updateWidgetSettings(
    @Param('projectId', ParseIntPipe) projectId: number,
    @GetCurrentUser() user: User,
    @Body() widgetSettingsDto: WidgetSettingsDto
  ) {
    return this.projectService.updateWidgetSettings(
      projectId,
      user.id,
      widgetSettingsDto
    );
  }

  // Invitation endpoints
  @Auditable({ action: AuditAction.CREATE, entity: 'Invitation' })
  @Roles(ProjectRole.MANAGER)
  // @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 invitations per minute - DISABLED FOR TESTING
  @Post(':projectId/invitations')
  createInvitation(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createInvitationDto: CreateInvitationDto,
    @GetCurrentUser() user: User
  ) {
    return this.invitationService.createInvitation(
      { ...createInvitationDto, projectId },
      user.id
    );
  }

  @Roles(ProjectRole.MANAGER)
  @Get(':projectId/invitations')
  getProjectInvitations(
    @Param('projectId', ParseIntPipe) projectId: number,
    @GetCurrentUser() user: User
  ) {
    return this.invitationService.getProjectInvitations(projectId, user.id);
  }

  @Auditable({ action: AuditAction.DELETE, entity: 'Invitation' })
  @Roles(ProjectRole.MANAGER)
  @Delete(':projectId/invitations/:invitationId')
  cancelInvitation(
    @Param('projectId', ParseIntPipe) projectId: number, // This is for the guard
    @Param('invitationId') invitationId: string,
    @GetCurrentUser() user: User
  ) {
    return this.invitationService.cancelInvitation(invitationId, user.id);
  }

  @Post('invitations/accept')
  acceptInvitation(
    @Query('token') token: string,
    @GetCurrentUser() user: User
  ) {
    return this.invitationService.acceptInvitation(token, user.id);
  }

  // Public endpoint to get invitation details (for registration page)
  @Public()
  @Get('invitations/details')
  getInvitationDetails(@Query('token') token: string) {
    return this.invitationService.getInvitationByToken(token);
  }

  // Project Members Management
  @Roles(ProjectRole.MANAGER)
  @Get(':projectId/members')
  getProjectMembers(
    @Param('projectId', ParseIntPipe) projectId: number,
    @GetCurrentUser() user: User
  ) {
    return this.projectService.getProjectMembers(projectId, user.id);
  }

  @Auditable({ action: AuditAction.UPDATE, entity: 'ProjectMember' })
  @Roles(ProjectRole.MANAGER)
  @Patch(':projectId/members/:userId/role')
  updateMemberRole(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId') userId: string,
    @Body('role') role: ProjectRole,
    @GetCurrentUser() currentUser: User
  ) {
    return this.projectService.updateMemberRole(
      projectId,
      userId,
      role,
      currentUser.id
    );
  }

  @Auditable({ action: AuditAction.DELETE, entity: 'ProjectMember' })
  @Roles(ProjectRole.MANAGER)
  @Delete(':projectId/members/:userId')
  removeMember(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId') userId: string,
    @GetCurrentUser() currentUser: User
  ) {
    return this.projectService.removeMember(projectId, userId, currentUser.id);
  }
}
