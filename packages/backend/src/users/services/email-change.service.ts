
import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, MoreThan } from 'typeorm';
import { User, EmailChangeRequest, UserIdentity, RefreshToken } from '../../database/entities';
import { MailService } from '../../mail/mail.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user.service';

@Injectable()
export class EmailChangeService {
  private readonly logger = new Logger(EmailChangeService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EmailChangeRequest)
    private readonly emailChangeRequestRepository: Repository<EmailChangeRequest>,
    private readonly entityManager: EntityManager,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly mailService: MailService,
    private readonly userService: UserService,
  ) {}

  /**
   * Request email change - creates a verification token and sends emails
   */
  async requestEmailChange(
    userId: string,
    newEmail: string,
    currentPassword: string
  ): Promise<{ message: string; newEmail: string; warning?: string }> {
    this.logger.log(
      `[requestEmailChange] Starting email change request for user: ${userId} to new email: ${newEmail}`
    );
    const user = await this.userService.findOneById(userId);

    if (!user.passwordHash) {
      this.logger.warn(
        `[requestEmailChange] User ${userId} has no password set`
      );
      throw new BadRequestException(
        'You must set a password before you can change your email.'
      );
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      this.logger.warn(
        `[requestEmailChange] Invalid password for user: ${userId}`
      );
      throw new UnauthorizedException('Current password is incorrect.');
    }

    if (user.email === newEmail) {
      this.logger.warn(
        `[requestEmailChange] New email same as current for user: ${userId}`
      );
      throw new BadRequestException('New email must be different from current email.');
    }

    const isEmailTaken = await this.userRepository.findOne({
      where: { email: newEmail },
    });
    if (isEmailTaken) {
      this.logger.warn(
        `[requestEmailChange] Email ${newEmail} is already taken`
      );
      throw new BadRequestException('This email is already in use.');
    }

    const userWithIdentities = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['identities'],
    });

    const hasLinkedOAuth =
      userWithIdentities?.identities &&
      userWithIdentities.identities.length > 0;
    const oauthWarning = hasLinkedOAuth
      ? 'Note: All linked accounts (Google, etc.) will be unlinked after email change because the email no longer matches.'
      : undefined;

    const existingRequest = await this.emailChangeRequestRepository.findOne({
      where: {
        userId,
        isVerified: false,
        isCancelled: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (existingRequest) {
      this.logger.warn(
        `[requestEmailChange] Found existing pending request for user: ${userId}`
      );
      throw new BadRequestException(
        'You already have a pending email change request. Please check your email or cancel the old request.'
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.entityManager.transaction(async (entityManager) => {
      const emailChangeRequest = entityManager.create(EmailChangeRequest, {
        userId,
        oldEmail: user.email,
        newEmail,
        token,
        expiresAt,
      });
      await entityManager.save(emailChangeRequest);
    });

    const tokenKey = `email-change:${token}`;
    const tokenData = {
      userId,
      newEmail,
      oldEmail: user.email,
    };
    await this.cacheManager.set(
      tokenKey,
      JSON.stringify(tokenData),
      24 * 60 * 60 * 1000
    );

    try {
      await this.mailService.sendEmailChangeVerification(user, newEmail, token);
      await this.mailService.sendEmailChangeNotification(user, newEmail);
    } catch (error) {
      this.logger.error(
        `[requestEmailChange] Failed to send emails for user: ${userId}`,
        error
      );
      throw new BadRequestException(
        'Could not send verification email. Please try again later.'
      );
    }

    return {
      message:
        'Email change request sent. Please check your new email to confirm.',
      newEmail,
      warning: oauthWarning,
    };
  }

  /**
   * Verify email change using token
   */
  async verifyEmailChange(
    token: string
  ): Promise<{ message: string; newEmail: string }> {
    this.logger.log(`[verifyEmailChange] Verifying token: ${token}`);
    const request = await this.emailChangeRequestRepository.findOne({
      where: {
        token,
        isVerified: false,
        isCancelled: false,
      },
      relations: ['user'],
    });

    if (!request) {
      this.logger.warn(`[verifyEmailChange] Invalid or used token: ${token}`);
      throw new BadRequestException('Invalid or used token.');
    }

    if (new Date() > request.expiresAt) {
      this.logger.warn(
        `[verifyEmailChange] Token expired for user: ${request.userId}`
      );
      throw new BadRequestException(
        'Token has expired. Please request a new email change.'
      );
    }

    const isEmailTaken = await this.userRepository.findOne({
      where: { email: request.newEmail },
    });
    if (isEmailTaken) {
      this.logger.warn(
        `[verifyEmailChange] Email ${request.newEmail} is now taken by another user`
      );
      throw new BadRequestException(
        'This email is already in use by another user.'
      );
    }

    await this.entityManager.transaction(async (entityManager) => {
      const user = await entityManager.findOne(User, {
        where: { id: request.userId },
        relations: ['identities'],
      });

      if (!user) {
        throw new BadRequestException('User not found.');
      }

      const hasLinkedOAuth = user.identities && user.identities.length > 0;

      user.email = request.newEmail;
      await entityManager.save(user);

      request.isVerified = true;
      await entityManager.save(request);

      if (hasLinkedOAuth) {
        await entityManager.delete(UserIdentity, { userId: user.id });
      }

      // Invalidate all refresh tokens
      await entityManager.delete(RefreshToken, { userId: user.id });

      // Invalidate all access tokens
      user.tokensValidFrom = new Date();
      await entityManager.save(user);
    });

    const tokenKey = `email-change:${token}`;
    await this.cacheManager.del(tokenKey);

    try {
      await this.mailService.sendEmailChangeConfirmation(
        request.user,
        request.oldEmail,
        request.newEmail,
        request.user.fullName
      );
    } catch (error) {
      this.logger.error(
        `[verifyEmailChange] Failed to send confirmation email, but email change was successful`,
        error
      );
    }

    return {
      message:
        'Email changed successfully. Please log in again with your new email.',
      newEmail: request.newEmail,
    };
  }

  /**
   * Cancel email change request
   */
  async cancelEmailChange(userId: string): Promise<{ message: string }> {
    const request = await this.emailChangeRequestRepository.findOne({
      where: {
        userId,
        isVerified: false,
        isCancelled: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!request) {
      throw new BadRequestException(
        'No pending email change request found.'
      );
    }

    request.isCancelled = true;
    await this.emailChangeRequestRepository.save(request);

    const tokenKey = `email-change:${request.token}`;
    await this.cacheManager.del(tokenKey);

    return {
      message: 'Email change request cancelled.',
    };
  }

  async getPendingEmailChange(
    userId: string
  ): Promise<EmailChangeRequest | null> {
    return this.emailChangeRequestRepository.findOne({
      where: {
        userId,
        isVerified: false,
        isCancelled: false,
        expiresAt: MoreThan(new Date()),
      },
    });
  }
}
