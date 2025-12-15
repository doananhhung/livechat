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
  Invitation,
  InvitationStatus,
  CreateInvitationDto,
  ProjectMember,
  Role,
  Project,
  User,
} from '@social-commerce/shared';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly mailService: MailService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Creates an invitation and sends an email to the invitee
   */
  async createInvitation(
    createInvitationDto: CreateInvitationDto,
    inviterId: string
  ): Promise<Invitation> {
    const { email, projectId, role = Role.AGENT } = createInvitationDto;

    // 1. Verify that the inviter is a MANAGER of the project
    const inviterMembership = await this.entityManager.findOne(ProjectMember, {
      where: { projectId, userId: inviterId },
    });

    if (!inviterMembership || inviterMembership.role !== Role.MANAGER) {
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
    await this.sendInvitationEmail(
      savedInvitation,
      project,
      existingUser ?? undefined
    );

    return savedInvitation;
  }

  /**
   * Sends the invitation email
   */
  private async sendInvitationEmail(
    invitation: Invitation,
    project: Project,
    existingUser?: User
  ): Promise<void> {
    // Check if user already exists to determine which link to send
    const isNewUser = !existingUser;

    let invitationUrl: string;
    let actionText: string;
    let instructionText: string;

    if (isNewUser) {
      // User doesn't exist - send registration link with token
      invitationUrl = `${this.configService.get<string>('FRONTEND_URL')}/register?invitation_token=${invitation.token}`;
      actionText = 'Đăng ký và tham gia';
      instructionText =
        'Bạn cần đăng ký tài khoản để tham gia dự án này. Nhấp vào liên kết bên dưới để đăng ký:';
      this.logger.log(
        `Sending NEW USER invitation to ${invitation.email} - Link: ${invitationUrl}`
      );
    } else {
      // User exists - send accept invitation link
      invitationUrl = `${this.configService.get<string>('FRONTEND_URL')}/accept-invitation?token=${invitation.token}`;
      actionText = 'Chấp nhận lời mời';
      instructionText = 'Nhấp vào liên kết bên dưới để chấp nhận lời mời:';
      this.logger.log(
        `Sending EXISTING USER invitation to ${invitation.email} (userId: ${existingUser.id}) - Link: ${invitationUrl}`
      );
    }

    const subject = `Lời mời tham gia dự án "${project.name}" với vai trò ${invitation.role === Role.AGENT ? 'Agent' : invitation.role}`;
    const html = `
      <p>Xin chào,</p>
      <p>Bạn đã được mời tham gia dự án <strong>${project.name}</strong> với vai trò <strong>${invitation.role === Role.AGENT ? 'Agent' : invitation.role}</strong>.</p>
      <p>${instructionText}</p>
      <a href="${invitationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: white; text-decoration: none; border-radius: 5px;">${actionText}</a>
      <p>Hoặc sao chép và dán liên kết sau vào trình duyệt:</p>
      <p>${invitationUrl}</p>
      <p>Lời mời này sẽ hết hạn sau 7 ngày.</p>
      <p>Nếu bạn không muốn tham gia dự án này, vui lòng bỏ qua email này.</p>
      <p>Trân trọng,<br>Đội ngũ Social Commerce</p>
    `;

    await this.mailService.sendMail(invitation.email, subject, html);
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
        role: invitation.role as Role,
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
  async getInvitationByToken(token: string): Promise<any> {
    const invitation = await this.entityManager.findOne(Invitation, {
      where: { token },
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

    // Load project details
    const project = await this.entityManager.findOne(Project, {
      where: { id: invitation.projectId },
    });

    return {
      ...invitation,
      project,
    };
  }

  /**
   * Gets all pending invitations for a project (manager only)
   */
  async getProjectInvitations(
    projectId: number,
    userId: string
  ): Promise<Invitation[]> {
    // Verify that the user is a MANAGER of the project
    const membership = await this.entityManager.findOne(ProjectMember, {
      where: { projectId, userId },
    });

    if (!membership || membership.role !== Role.MANAGER) {
      throw new ForbiddenException(
        'Only managers can view project invitations.'
      );
    }

    return this.entityManager.find(Invitation, {
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
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

    if (!membership || membership.role !== Role.MANAGER) {
      throw new ForbiddenException('Only managers can cancel invitations.');
    }

    await this.entityManager.remove(invitation);
  }
}
