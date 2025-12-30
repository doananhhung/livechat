import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ListAuditLogsDto } from '@live-chat/shared-dtos';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { ProjectRole } from '@live-chat/shared-types';

@Controller('projects/:projectId/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(ProjectRole.MANAGER)
  async findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() query: ListAuditLogsDto,
  ) {
    return this.auditService.findAll(projectId, query);
  }
}
