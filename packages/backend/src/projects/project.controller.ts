import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import {
  CreateProjectDto,
  Role,
  UpdateProjectDto,
  User,
  WidgetSettingsDto,
} from '@social-commerce/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MANAGER)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

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

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
    @GetCurrentUser() user: User
  ) {
    return this.projectService.update(id, updateProjectDto, user.id);
  }

  @Patch(':id/widget-settings')
  updateWidgetSettings(
    @Param('id', ParseIntPipe) id: number,
    @GetCurrentUser() user: User,
    @Body() widgetSettingsDto: WidgetSettingsDto
  ) {
    return this.projectService.updateWidgetSettings(
      id,
      user.id,
      widgetSettingsDto
    );
  }
}
