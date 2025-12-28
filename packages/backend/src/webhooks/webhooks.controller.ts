import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { ProjectRole } from '@live-chat/shared-types';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';

@Controller('projects/:projectId/webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @Roles(ProjectRole.MANAGER)
  async create(
    @Param('projectId') projectId: number,
    @Body() dto: CreateSubscriptionDto
  ) {
    return this.webhooksService.create(projectId, dto);
  }

  @Get()
  @Roles(ProjectRole.MANAGER)
  async findAll(@Param('projectId') projectId: number) {
    return this.webhooksService.findAll(projectId);
  }

  @Delete(':id')
  @Roles(ProjectRole.MANAGER)
  async delete(@Param('projectId') projectId: number, @Param('id') id: string) {
    return this.webhooksService.delete(id, projectId);
  }
}
