import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import * as crypto from 'crypto';
import {
  CreateInvitationDto,
  InvitationResponseDto,
} from '@live-chat/shared-dtos';
import { Invitation, Project, User, ProjectMember } from '../database/entities';
import { InvitationStatus, ProjectRole } from '@live-chat/shared-types';
import { MailService } from '../mail/mail.service';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly mailService: MailService
  ) {}

  /**
   * Helper to map Invitation entity to InvitationResponseDto
   */
  private mapToResponseDto(invitation: Invitation): InvitationResponseDto {
    return {
      id: invitation.id,
      email: invitation.email,
      projectId: invitation.projectId,
      inviterId: invitation.inviterId,
      status: invitation.status,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      projectName: invitation.project?.name,
      inviterName: invitation.inviter?.fullName,
    };
  }

  /**
   * Creates an invitation and sends an email to the invitee
   */
  async createInvitation(
    createInvitationDto: CreateInvitationDto,
    inviterId: string
  ): Promise<InvitationResponseDto> {
    const { email, projectId, role = ProjectRole.AGENT } = createInvitationDto;

    // 1. Verify that the inviter is a MANAGER of the project
    const inviterMembership = await this.entityManager.findOne(ProjectMember, {
      where: { projectId, userId: inviterId },
      relations: ['user'], // Load user to get name for DTO if needed immediately
    });

    if (!inviterMembership || inviterMembership.role !== ProjectRole.MANAGER) {
      throw new ForbiddenException(
        'Only managers can invite members to this project.'
      );
    }

    // 2. Check if project exists
    const project = await this.entityManager.findOne(Project, {
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    // 3. Check if the user is already a member
    const existingUser = await this.entityManager.findOne(User, {
      where: { email },
    });

    if (existingUser) {
      const existingMembership = await this.entityManager.findOne(
        ProjectMember,
        {
          where: { projectId, userId: existingUser.id },
        }
      );

      if (existingMembership) {
        throw new ConflictException(
          'This user is already a member of the project.'
        );
      }
    }

    // 4. Check if there's a pending invitation for this email and project
    const existingInvitation = await this.entityManager.findOne(Invitation, {
      where: {
        email,
        projectId,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new ConflictException(
        'A pending invitation already exists for this email.'
      );
    }

    // 5. Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');

    // 6. Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 7. Create and save the invitation
    const invitation = this.entityManager.create(Invitation, {
      email,
      projectId,
      inviterId,
      role,
      token,
      status: InvitationStatus.PENDING,
      expiresAt,
    });

    const savedInvitation = await this.entityManager.save(invitation);

    // 8. Send the invitation email
    await this.mailService.sendInvitationEmail(
      savedInvitation,
      project,
      existingUser ?? undefined
    );

    // Load relations for response
    const result = await this.entityManager.findOne(Invitation, {
      where: { id: savedInvitation.id },
      relations: ['project', 'inviter'],
    });

    return this.mapToResponseDto(result!);
  }

  /**
   * Accepts an invitation and adds the user to the project
   * This can be called after a user registers (for new users) or directly (for existing users)
   */
  async acceptInvitation(token: string, userId: string): Promise<void> {
    this.logger.log(`🔵 [AcceptInvitation] Starting acceptance process`);
    this.logger.log(`🔵 [AcceptInvitation] Token: ${token}`);
    this.logger.log(`🔵 [AcceptInvitation] UserId: ${userId}`);

    // 1. Find the invitation by token
    const invitation = await this.entityManager.findOne(Invitation, {
      where: { token },
    });

    if (!invitation) {
      this.logger.error(
        `❌ [AcceptInvitation] Invitation not found for token: ${token}`
      );
      throw new NotFoundException('Invitation not found.');
    }

    this.logger.log(`✅ [AcceptInvitation] Found invitation:`, {
      id: invitation.id,
      email: invitation.email,
      projectId: invitation.projectId,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    });

    // 2. Check if invitation is still pending
    if (invitation.status !== InvitationStatus.PENDING) {
      this.logger.error(
        `❌ [AcceptInvitation] Invitation status is not PENDING: ${invitation.status}`
      );
      throw new BadRequestException('This invitation has already been used.');
    }

    // 3. Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      this.logger.error(
        `❌ [AcceptInvitation] Invitation has expired: ${invitation.expiresAt}`
      );
      // Mark as expired
      invitation.status = InvitationStatus.EXPIRED;
      await this.entityManager.save(invitation);
      throw new BadRequestException('This invitation has expired.');
    }

    // 4. Get the user's email
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
    });

    if (!user) {
      this.logger.error(`❌ [AcceptInvitation] User not found: ${userId}`);
      throw new NotFoundException('User not found.');
    }

    this.logger.log(`✅ [AcceptInvitation] Found user: ${user.email}`);

    // 5. Verify the invitation is for this user's email
    if (user.email !== invitation.email) {
      this.logger.error(
        `❌ [AcceptInvitation] Email mismatch: user.email=${user.email}, invitation.email=${invitation.email}`
      );
      throw new ForbiddenException(
        'This invitation was sent to a different email address.'
      );
    }

    this.logger.log(`✅ [AcceptInvitation] Email match verified`);

    // 6. Check if user is already a member
    const existingMembership = await this.entityManager.findOne(ProjectMember, {
      where: { projectId: invitation.projectId, userId },
    });

    if (existingMembership) {
      this.logger.warn(
        `⚠️ [AcceptInvitation] User is already a member of project ${invitation.projectId}`
      );
      // Mark invitation as accepted anyway
      invitation.status = InvitationStatus.ACCEPTED;
      await this.entityManager.save(invitation);
      throw new ConflictException('You are already a member of this project.');
    }

    this.logger.log(
      `✅ [AcceptInvitation] User is not yet a member, proceeding to add...`
    );

    // 7. Add user to project with the specified role
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      const membership = transactionalEntityManager.create(ProjectMember, {
        projectId: invitation.projectId,
        userId,
        role: invitation.role as ProjectRole,
      });

      this.logger.log(`🔵 [AcceptInvitation] Creating membership:`, {
        projectId: invitation.projectId,
        userId,
        role: invitation.role,
      });

      await transactionalEntityManager.save(membership);

      this.logger.log(`✅ [AcceptInvitation] Membership saved successfully`);

      // Mark invitation as accepted
      invitation.status = InvitationStatus.ACCEPTED;
      await transactionalEntityManager.save(invitation);

      this.logger.log(`✅ [AcceptInvitation] Invitation marked as ACCEPTED`);
    });

    this.logger.log(`🎉 [AcceptInvitation] Process completed successfully!`);
  }

  /**
   * Gets invitation details by token (for registration page to pre-fill email)
   */
  async getInvitationByToken(token: string): Promise<InvitationResponseDto> {
    const invitation = await this.entityManager.findOne(Invitation, {
      where: { token },
      relations: ['project', 'inviter'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found.');
    }

    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('This invitation has expired.');
    }

    // Check if invitation is still pending
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation has already been used.');
    }

    return this.mapToResponseDto(invitation);
  }

  /**
   * Gets all pending invitations for a project (manager only)
   */
  async getProjectInvitations(
    projectId: number,
    userId: string
  ): Promise<InvitationResponseDto[]> {
    // Verify that the user is a MANAGER of the project
    const membership = await this.entityManager.findOne(ProjectMember, {
      where: { projectId, userId },
    });

    if (!membership || membership.role !== ProjectRole.MANAGER) {
      throw new ForbiddenException(
        'Only managers can view project invitations.'
      );
    }

    const invitations = await this.entityManager.find(Invitation, {
      where: { projectId },
      relations: ['inviter'],
      order: { createdAt: 'DESC' },
    });

    return invitations.map((inv) => this.mapToResponseDto(inv));
  }

  /**
   * Cancels/deletes a pending invitation (manager only)
   */
  async cancelInvitation(invitationId: string, userId: string): Promise<void> {
    const invitation = await this.entityManager.findOne(Invitation, {
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found.');
    }

    // Verify that the user is a MANAGER of the project
    const membership = await this.entityManager.findOne(ProjectMember, {
      where: { projectId: invitation.projectId, userId },
    });

    if (!membership || membership.role !== ProjectRole.MANAGER) {
      throw new ForbiddenException('Only managers can cancel invitations.');
    }

    await this.entityManager.remove(invitation);
  }
}
