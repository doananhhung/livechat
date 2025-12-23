
// src/projects/public-project.controller.ts
import {
  Controller,
  Get,
  Param,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { type Request } from 'express';

@Controller('public/projects')
export class PublicProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get(':id/settings')
  async getWidgetSettings(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request
  ) {
    const origin = req.headers.origin;
    return this.projectService.getWidgetSettings(id, origin);
  }
}
