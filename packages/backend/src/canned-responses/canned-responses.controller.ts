import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CannedResponsesService } from './canned-responses.service';
import { CreateCannedResponseDto, UpdateCannedResponseDto } from '@live-chat/shared-dtos';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { ProjectRole, AuditAction } from '@live-chat/shared-types';
import { Auditable } from '../audit-logs/auditable.decorator';

@Controller('projects/:projectId/canned-responses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CannedResponsesController {
  constructor(private readonly cannedResponsesService: CannedResponsesService) {}

  @Auditable({ action: AuditAction.CREATE, entity: 'CannedResponse' })
  @Post()
  @Roles(ProjectRole.MANAGER)
  create(@Param('projectId', ParseIntPipe) projectId: number, @Body() createDto: CreateCannedResponseDto) {
    return this.cannedResponsesService.create(projectId, createDto);
  }

  @Get()
  @Roles(ProjectRole.AGENT)
  findAll(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.cannedResponsesService.findAll(projectId);
  }

  @Auditable({ action: AuditAction.UPDATE, entity: 'CannedResponse' })
  @Patch(':id')
  @Roles(ProjectRole.MANAGER)
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id') id: string,
    @Body() updateDto: UpdateCannedResponseDto,
  ) {
    return this.cannedResponsesService.update(id, projectId, updateDto);
  }

  @Auditable({ action: AuditAction.DELETE, entity: 'CannedResponse' })
  @Delete(':id')
  @Roles(ProjectRole.MANAGER)
  remove(@Param('projectId', ParseIntPipe) projectId: number, @Param('id') id: string) {
    return this.cannedResponsesService.remove(id, projectId);
  }
}
