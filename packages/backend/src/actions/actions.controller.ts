import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ActionsService } from "./actions.service";
import {
  CreateActionTemplateDto,
  UpdateActionTemplateDto,
  CreateActionSubmissionDto,
  SendFormRequestDto,
  UpdateSubmissionDto,
} from "@live-chat/shared-dtos";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller()
@UseGuards(JwtAuthGuard)
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  // ==================== ACTION TEMPLATES (Manager) ====================

  @Post("projects/:projectId/action-templates")
  createTemplate(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Body() dto: CreateActionTemplateDto,
    @Request() req
  ) {
    return this.actionsService.createTemplate(projectId, dto, req.user);
  }

  @Get("projects/:projectId/action-templates")
  getTemplates(@Param("projectId", ParseIntPipe) projectId: number) {
    return this.actionsService.getTemplates(projectId);
  }

  @Get("projects/:projectId/action-templates/:templateId")
  getTemplate(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("templateId", ParseIntPipe) templateId: number
  ) {
    return this.actionsService.getTemplate(projectId, templateId);
  }

  @Put("projects/:projectId/action-templates/:templateId")
  updateTemplate(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("templateId", ParseIntPipe) templateId: number,
    @Body() dto: UpdateActionTemplateDto,
    @Request() req
  ) {
    return this.actionsService.updateTemplate(projectId, templateId, dto, req.user);
  }

  @Delete("projects/:projectId/action-templates/:templateId")
  deleteTemplate(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("templateId", ParseIntPipe) templateId: number,
    @Request() req
  ) {
    return this.actionsService.deleteTemplate(projectId, templateId, req.user);
  }

  @Patch("projects/:projectId/action-templates/:templateId/toggle")
  toggleTemplate(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("templateId", ParseIntPipe) templateId: number,
    @Request() req
  ) {
    return this.actionsService.toggleTemplate(projectId, templateId, req.user);
  }

  // ==================== ACTION SUBMISSIONS (Agent) ====================

  @Post("conversations/:conversationId/actions")
  createSubmission(
    @Param("conversationId") conversationId: string,
    @Body() dto: CreateActionSubmissionDto,
    @Request() req
  ) {
    return this.actionsService.createSubmission(conversationId, dto, req.user);
  }

  @Get("conversations/:conversationId/actions")
  getSubmissions(@Param("conversationId") conversationId: string) {
    return this.actionsService.getSubmissions(conversationId);
  }

  // ==================== FORM REQUESTS (Agent → Visitor) ====================

  /**
   * Agent sends a form to visitor in chat.
   * Creates a form_request message with template snapshot.
   */
  @Post("conversations/:conversationId/form-request")
  sendFormRequest(
    @Param("conversationId") conversationId: string,
    @Body() dto: SendFormRequestDto,
    @Request() req
  ) {
    return this.actionsService.sendFormRequest(conversationId, dto, req.user);
  }

  // ==================== SUBMISSION MANAGEMENT ====================

  /**
   * Update a submission's data.
   * Only the creator can update their own submission.
   */
  @Put("submissions/:submissionId")
  updateSubmission(
    @Param("submissionId") submissionId: string,
    @Body() dto: UpdateSubmissionDto,
    @Request() req
  ) {
    return this.actionsService.updateSubmission(submissionId, dto.data, req.user.id);
  }

  /**
   * Delete a submission.
   * Agents with project access can delete any submission.
   */
  @Delete("submissions/:submissionId")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSubmission(
    @Param("submissionId") submissionId: string,
    @Request() req
  ) {
    return this.actionsService.deleteSubmission(submissionId, req.user.id);
  }
}


