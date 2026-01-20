import {
  Injectable,
  ConflictException,
  Inject,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { UserService } from '../../users/user.service';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../../common/constants/crypto.constants';
import * as crypto from 'crypto';
import { RegisterDto, ResendVerificationDto } from '@live-chat/shared-dtos';
import { User } from '../../database/entities';
import { EntityManager } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    private readonly userService: UserService,
    private readonly entityManager: EntityManager,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly mailService: MailService
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    this.logger.log(
      `🔵 [Register] Starting registration for email: ${registerDto.email}`
    );

    return await this.entityManager.transaction(async (entityManager) => {
      const existingUser = await this.userService.findOneByEmail(
        registerDto.email
      );
      if (existingUser) {
        throw new ConflictException('This email is already in use.');
      }

      const passwordHash = await bcrypt.hash(
        registerDto.password,
        BCRYPT_SALT_ROUNDS
      );

      const newUser = await entityManager.save(User, {
        email: registerDto.email,
        passwordHash,
        fullName: registerDto.fullName,
        isEmailVerified: false,
      });

      this.logger.log(
        `✅ [Register] User created with ID: ${(newUser as any).id}`
      );

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenKey = `verification-token:${verificationToken}`;
      await this.cacheManager.set(tokenKey, (newUser as any).id, 900000); // 15 minutes

      await this.mailService.sendUserConfirmation(
        newUser as any,
        verificationToken
      );

      if (registerDto.invitationToken) {
        try {
          const invitationKey = `pending-invitation:${(newUser as any).id}`;
          await this.cacheManager.set(
            invitationKey,
            registerDto.invitationToken,
            604800000
          );
        } catch (error) {
          this.logger.error(
            `❌ [Register] Failed to store invitation token`,
            error
          );
        }
      }

      return {
        message:
          'Registration successful. Please check your email to activate your account.',
      };
    });
  }

  async verifyEmail(
    token: string
  ): Promise<{ message: string; invitationToken?: string }> {
    const tokenKey = `verification-token:${token}`;
    const userId = await this.cacheManager.get<string>(tokenKey);

    if (!userId) {
      throw new NotFoundException('Invalid or expired verification token.');
    }

    await this.userService.markEmailAsVerified(userId);
    await this.cacheManager.del(tokenKey);

    const invitationKey = `pending-invitation:${userId}`;
    const invitationToken = await this.cacheManager.get<string>(invitationKey);

    if (invitationToken) {
      return {
        message: 'Email verification successful.',
        invitationToken,
      };
    }

    return { message: 'Email verification successful.' };
  }

  async resendVerificationEmail(
    resendVerificationDto: ResendVerificationDto
  ): Promise<{ message: string }> {
    const user = await this.userService.findOneByEmail(
      resendVerificationDto.email
    );

    if (!user) {
      return {
        message: 'If your account exists, a verification email has been sent.',
      };
    }

    if (user.isEmailVerified) {
      throw new ConflictException('This email has already been verified.');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenKey = `verification-token:${verificationToken}`;
    await this.cacheManager.set(tokenKey, user.id, 900000);

    await this.mailService.sendUserConfirmation(user, verificationToken);

    return {
      message:
        'A new verification email has been sent. Please check your inbox.',
    };
  }
}
