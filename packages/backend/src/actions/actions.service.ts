import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  GoneException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ActionTemplate } from "./entities/action-template.entity";
import { ActionSubmission } from "./entities/action-submission.entity";
import {
  CreateActionTemplateDto,
  UpdateActionTemplateDto,
  CreateActionSubmissionDto,
  SendFormRequestDto,
  SubmitFormAsVisitorDto,
} from "@live-chat/shared-dtos";
import { validateActionData } from "./utils/action-validator";
import { ProjectService } from "../projects/project.service";
import { Conversation } from "../database/entities/conversation.entity";
import { User } from "../database/entities/user.entity";
import { Visitor } from "../database/entities/visitor.entity";
import { Message } from "../database/entities/message.entity";
import {
  ProjectRole,
  MessageContentType,
  MessageStatus,
  FormRequestMetadata,
  FormSubmissionMetadata,
} from "@live-chat/shared-types";

@Injectable()
export class ActionsService {
  constructor(
    @InjectRepository(ActionTemplate)
    private templatesRepository: Repository<ActionTemplate>,
    @InjectRepository(ActionSubmission)
    private submissionsRepository: Repository<ActionSubmission>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Visitor)
    private visitorRepository: Repository<Visitor>,
    private projectService: ProjectService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  // ==================== TEMPLATE MANAGEMENT (Manager) ====================

  /**
   * Verify user has MANAGER role for the project.
   * Throws ForbiddenException if not.
   */
  private async requireManagerRole(userId: string, projectId: number): Promise<void> {
    const hasPermission = await this.projectService.hasProjectRole(
      userId,
      projectId,
      ProjectRole.MANAGER
    );
    if (!hasPermission) {
      throw new ForbiddenException("Only managers can manage action templates");
    }
  }

  /**
   * Create a new action template.
   * Requires MANAGER role.
   */
  async createTemplate(
    projectId: number,
    dto: CreateActionTemplateDto,
    user: User
  ): Promise<ActionTemplate> {
    await this.requireManagerRole(user.id, projectId);

    const template = this.templatesRepository.create({
      projectId,
      ...dto,
    });
    return this.templatesRepository.save(template);
  }

  /**
   * Get all action templates for a project.
   * Returns only non-deleted templates.
   */
  async getTemplates(projectId: number): Promise<ActionTemplate[]> {
    return this.templatesRepository.find({
      where: { projectId },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Get a single action template by ID.
   * Throws NotFoundException if not found.
   */
  async getTemplate(projectId: number, templateId: number): Promise<ActionTemplate> {
    const template = await this.templatesRepository.findOne({
      where: { id: templateId, projectId },
    });

    if (!template) {
      throw new NotFoundException("Action template not found");
    }

    return template;
  }

  /**
   * Update an action template.
   * Requires MANAGER role.
   */
  async updateTemplate(
    projectId: number,
    templateId: number,
    dto: UpdateActionTemplateDto,
    user: User
  ): Promise<ActionTemplate> {
    await this.requireManagerRole(user.id, projectId);

    const template = await this.getTemplate(projectId, templateId);

    // Update only provided fields
    if (dto.name !== undefined) {
      template.name = dto.name;
    }
    if (dto.description !== undefined) {
      template.description = dto.description;
    }
    if (dto.definition !== undefined) {
      template.definition = dto.definition;
    }
    if (dto.isEnabled !== undefined) {
      template.isEnabled = dto.isEnabled;
    }

    return this.templatesRepository.save(template);
  }

  /**
   * Soft-delete an action template.
   * Requires MANAGER role.
   */
  async deleteTemplate(
    projectId: number,
    templateId: number,
    user: User
  ): Promise<void> {
    await this.requireManagerRole(user.id, projectId);

    const template = await this.getTemplate(projectId, templateId);

    // Soft delete using TypeORM's softRemove
    await this.templatesRepository.softRemove(template);
  }

  /**
   * Toggle a template's enabled status.
   * Requires MANAGER role.
   */
  async toggleTemplate(
    projectId: number,
    templateId: number,
    user: User
  ): Promise<ActionTemplate> {
    await this.requireManagerRole(user.id, projectId);

    const template = await this.getTemplate(projectId, templateId);
    template.isEnabled = !template.isEnabled;

    return this.templatesRepository.save(template);
  }

  // ==================== ACTION SUBMISSIONS (Agent) ====================

  /**
   * Create a new action submission.
   * Validates data against template definition.
   */
  async createSubmission(
    conversationId: string,
    dto: CreateActionSubmissionDto,
    user: User
  ): Promise<ActionSubmission> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    // Permission Check: AGENT or MANAGER (must be project member)
    const hasAccess = await this.projectService.isProjectMember(
      user.id,
      Number(conversation.projectId)
    );
    if (!hasAccess) {
      throw new ForbiddenException("You do not have access to this project");
    }

    const template = await this.templatesRepository.findOne({
      where: { id: dto.templateId, projectId: Number(conversation.projectId) },
    });

    if (!template) {
      throw new NotFoundException("Action Template not found");
    }

    if (!template.isEnabled) {
      throw new BadRequestException("This action template is disabled");
    }

    if (!validateActionData(template.definition, dto.data)) {
      throw new BadRequestException("Data does not match template definition");
    }

    const submission = this.submissionsRepository.create({
      templateId: dto.templateId,
      conversationId,
      creatorId: user.id,
      visitorId: null,
      data: dto.data,
    });

    return this.submissionsRepository.save(submission);
  }

  /**
   * Get all submissions for a conversation.
   */
  async getSubmissions(conversationId: string): Promise<ActionSubmission[]> {
    return this.submissionsRepository.find({
      where: { conversationId },
      relations: ["template", "creator", "visitor"],
      order: { createdAt: "DESC" },
    });
  }

  // ==================== FORM REQUEST/SUBMISSION (Chat Forms) ====================

  /**
   * Check if there is a pending (unanswered) form request for a conversation.
   * Invariant INV-5: Only ONE active form request per conversation.
   */
  async hasPendingFormRequest(conversationId: string): Promise<boolean> {
    const pendingMessage = await this.messageRepository.findOne({
      where: {
        conversationId: Number(conversationId),
        contentType: MessageContentType.FORM_REQUEST,
      },
      order: { createdAt: "DESC" },
    });

    if (!pendingMessage) {
      return false;
    }

    // Check if this form request has a corresponding submission
    const submission = await this.submissionsRepository.findOne({
      where: { formRequestMessageId: pendingMessage.id },
    });

    return submission === null;
  }

  /**
   * Agent sends a form to visitor in chat.
   * Creates a form_request message with template snapshot.
   * 
   * Invariants enforced:
   * - INV-1: Template must exist and be enabled
   * - INV-5: No pending form request allowed
   */
  async sendFormRequest(
    conversationId: string,
    dto: SendFormRequestDto,
    user: User
  ): Promise<Message> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ["visitor"],
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    // Permission Check
    const hasAccess = await this.projectService.isProjectMember(
      user.id,
      Number(conversation.projectId)
    );
    if (!hasAccess) {
      throw new ForbiddenException("You do not have access to this project");
    }

    // INV-1: Template must exist and be enabled
    const template = await this.templatesRepository.findOne({
      where: { id: dto.templateId, projectId: Number(conversation.projectId) },
    });

    if (!template) {
      throw new NotFoundException("Action template not found");
    }

    if (!template.isEnabled) {
      throw new BadRequestException("This action template is disabled");
    }

    // INV-5: Only one active form request per conversation
    const hasPending = await this.hasPendingFormRequest(conversationId);
    if (hasPending) {
      throw new ConflictException("A form request is already pending for this conversation");
    }

    // Create form request metadata (snapshot)
    const metadata: FormRequestMetadata = {
      templateId: template.id,
      templateName: template.name,
      templateDescription: template.description,
      definition: template.definition,
      expiresAt: dto.expiresAt,
    };

    // Create message
    const message = this.messageRepository.create({
      conversationId: Number(conversationId),
      content: `Form request: ${template.name}`,
      contentType: MessageContentType.FORM_REQUEST,
      metadata: metadata as unknown as Record<string, unknown>,
      senderId: user.id,
      recipientId: conversation.visitor?.visitorUid ?? conversationId,
      fromCustomer: false,
      status: MessageStatus.SENT,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Emit event for real-time delivery
    this.eventEmitter.emit('form.request.sent', {
      message: savedMessage,
      conversationId: Number(conversationId),
      projectId: Number(conversation.projectId),
      visitorUid: conversation.visitor?.visitorUid,
    });

    return savedMessage;
  }

  /**
   * Get the pending form request message for a conversation.
   */
  async getFormRequestMessage(formRequestMessageId: string): Promise<Message | null> {
    return this.messageRepository.findOne({
      where: { id: formRequestMessageId },
    });
  }

  /**
   * Visitor submits a filled form.
   * Creates ActionSubmission with visitorId and a form_submission message.
   * 
   * Invariants enforced:
   * - INV-2: Visitor must have an active form request
   * - INV-3: Data must pass validation
   * - INV-4: Submission links to form request message
   */
  async submitFormAsVisitor(
    conversationId: string,
    visitorId: number,
    dto: SubmitFormAsVisitorDto
  ): Promise<{ submission: ActionSubmission; message: Message }> {
    // Verify conversation exists
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    // INV-2: Verify form request exists
    const formRequestMessage = await this.getFormRequestMessage(dto.formRequestMessageId);
    if (!formRequestMessage) {
      throw new BadRequestException("Form request not found");
    }

    if (formRequestMessage.contentType !== MessageContentType.FORM_REQUEST) {
      throw new BadRequestException("Invalid form request message");
    }

    // Check if already submitted
    const existingSubmission = await this.submissionsRepository.findOne({
      where: { formRequestMessageId: dto.formRequestMessageId },
    });

    if (existingSubmission) {
      throw new BadRequestException("This form has already been submitted");
    }

    // Extract metadata and validate expiration
    const metadata = formRequestMessage.metadata as unknown as FormRequestMetadata;
    if (metadata.expiresAt) {
      const expiresAt = new Date(metadata.expiresAt);
      if (expiresAt < new Date()) {
        throw new GoneException("This form request has expired");
      }
    }

    // INV-3: Validate data against template definition
    if (!validateActionData(metadata.definition, dto.data as Record<string, unknown>)) {
      throw new BadRequestException("Data does not match form definition");
    }

    // Fetch template for ID reference
    const template = await this.templatesRepository.findOne({
      where: { id: metadata.templateId },
    });

    if (!template) {
      throw new NotFoundException("Action template no longer exists");
    }

    // INV-4: Create submission linked to form request
    const submission = this.submissionsRepository.create({
      templateId: metadata.templateId,
      conversationId,
      creatorId: null,
      visitorId,
      formRequestMessageId: dto.formRequestMessageId,
      data: dto.data,
    });

    const savedSubmission = await this.submissionsRepository.save(submission);

    // Create form_submission message
    const submissionMetadata: FormSubmissionMetadata = {
      formRequestMessageId: dto.formRequestMessageId,
      submissionId: savedSubmission.id,
      templateName: metadata.templateName,
      data: dto.data,
    };

    // Get visitor for sender info
    const visitor = await this.visitorRepository.findOne({
      where: { id: visitorId },
    });

    const submissionMessage = this.messageRepository.create({
      conversationId: Number(conversationId),
      content: `Form submitted: ${metadata.templateName}`,
      contentType: MessageContentType.FORM_SUBMISSION,
      metadata: submissionMetadata as unknown as Record<string, unknown>,
      senderId: visitor?.visitorUid ?? String(visitorId),
      recipientId: formRequestMessage.senderId,
      fromCustomer: true,
      status: MessageStatus.SENT,
    });

    const savedMessage = await this.messageRepository.save(submissionMessage);

    return { submission: savedSubmission, message: savedMessage };
  }

  // ==================== SUBMISSION MANAGEMENT (Update/Delete) ====================

  /**
   * Update an existing submission's data.
   * Only the creator (agent or visitor) can update their own submission.
   */
  async updateSubmission(
    submissionId: string,
    data: Record<string, unknown>,
    userId?: string,
    visitorId?: number
  ): Promise<ActionSubmission> {
    const submission = await this.submissionsRepository.findOne({
      where: { id: submissionId },
      relations: ["template"],
    });

    if (!submission) {
      throw new NotFoundException("Submission not found");
    }

    // Permission check: Either creator (agent) or visitor must match
    const isOwner =
      (userId && submission.creatorId === userId) ||
      (visitorId && submission.visitorId === visitorId);

    if (!isOwner) {
      throw new ForbiddenException("You can only update your own submissions");
    }

    // Validate the new data against template definition
    if (!submission.template) {
      throw new NotFoundException("Template not found for validation");
    }

    if (!validateActionData(submission.template.definition, data)) {
      throw new BadRequestException("Data does not match template definition");
    }

    submission.data = data;
    return this.submissionsRepository.save(submission);
  }

  /**
   * Delete a submission.
   * Agents with project access can delete any submission.
   * Visitors can only delete their own submissions.
   */
  async deleteSubmission(
    submissionId: string,
    userId?: string,
    visitorId?: number
  ): Promise<void> {
    const submission = await this.submissionsRepository.findOne({
      where: { id: submissionId },
      relations: ["conversation"],
    });

    if (!submission) {
      throw new NotFoundException("Submission not found");
    }

    // If user is an agent, check project membership
    if (userId) {
      const conversation = await this.conversationRepository.findOne({
        where: { id: submission.conversationId },
      });

      if (!conversation) {
        throw new NotFoundException("Conversation not found");
      }

      const hasAccess = await this.projectService.isProjectMember(
        userId,
        Number(conversation.projectId)
      );

      if (!hasAccess) {
        throw new ForbiddenException("You do not have access to this project");
      }
    } else if (visitorId) {
      // Visitor can only delete their own submission
      if (submission.visitorId !== visitorId) {
        throw new ForbiddenException("You can only delete your own submissions");
      }
    } else {
      throw new ForbiddenException("Authentication required");
    }

    await this.submissionsRepository.remove(submission);
  }
}

