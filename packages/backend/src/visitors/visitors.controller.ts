import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { ProjectRole, AuditAction } from '@live-chat/shared-types'; // Import AuditAction
import { Visitor } from '../database/entities/visitor.entity';
import { Auditable } from '../audit-logs/auditable.decorator'; // Import Auditable

@ApiTags('visitors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('/projects/:projectId/visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Patch(':visitorId')
  @Roles(ProjectRole.AGENT, ProjectRole.MANAGER)
  @Auditable({
    action: AuditAction.UPDATE, // Use generic UPDATE action
    entity: 'Visitor',
    entityIdExtractor: (data: unknown) => (data as Visitor).id.toString(), // Extract visitorId from the returned visitor
    metadataExtractor: (req: any) => ({
      visitorId: req.params.visitorId,
      newDisplayName: req.body.displayName,
    }),
  })
  @ApiOperation({ summary: 'Update a visitor\'s display name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The visitor display name has been successfully updated.',
    type: Visitor,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Visitor not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or display name is invalid.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  async updateDisplayName(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('visitorId', ParseIntPipe) visitorId: number,
    @Body() updateVisitorDto: UpdateVisitorDto,
  ): Promise<Visitor> {
    return this.visitorsService.updateDisplayName(
      projectId,
      visitorId,
      updateVisitorDto,
    );
  }
}
