import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { VisitorNotesService } from './visitor-notes.service';
import { CreateVisitorNoteDto, UpdateVisitorNoteDto } from '@live-chat/shared-dtos';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { ProjectRole } from '@live-chat/shared-types';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { User } from '../database/entities';

@Controller('projects/:projectId/visitors/:visitorId/notes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitorNotesController {
  constructor(private readonly notesService: VisitorNotesService) {}

  @Post()
  @Roles(ProjectRole.AGENT)
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('visitorId', ParseIntPipe) visitorId: number,
    @Body() dto: CreateVisitorNoteDto,
    @GetCurrentUser() user: User
  ) {
    return this.notesService.create(projectId, visitorId, user.id, dto);
  }

  @Get()
  @Roles(ProjectRole.AGENT)
  findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('visitorId', ParseIntPipe) visitorId: number
  ) {
    return this.notesService.findAll(projectId, visitorId);
  }

  @Patch(':id')
  @Roles(ProjectRole.AGENT)
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id') id: string,
    @Body() dto: UpdateVisitorNoteDto,
  ) {
    return this.notesService.update(id, projectId, dto);
  }

  @Delete(':id')
  @Roles(ProjectRole.AGENT)
  remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id') id: string
  ) {
    return this.notesService.remove(id, projectId);
  }
}
