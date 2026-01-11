
import {
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../../users/user.service';
import { MailService } from '../../mail/mail.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../../common/constants/crypto.constants';
import * as crypto from 'crypto';
import { User } from '../../database/entities';
import { UserStatus } from '@live-chat/shared-types';
import { TokenService } from './token.service';

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly entityManager: EntityManager,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      throw new ForbiddenException('Invalid email or password.');
    }

    if (user && user.passwordHash && (await bcrypt.compare(pass, user.passwordHash))) {
      if (user.status === UserStatus.SUSPENDED) {
        throw new ForbiddenException('Your account has been suspended.');
      }

      if (user.status === UserStatus.INACTIVE) {
        return this.userService.activate(user.id);
      }

      return user;
    }
    return null;
  }

  async changePassword(userId: string, currentPassword: string | undefined, newPassword: string): Promise<void> {
    return await this.entityManager.transaction(async (entityManager) => {
      const user = await this.userService.findOneById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found.');
      }

      if (user.passwordHash) {
        if (!currentPassword) {
          throw new BadRequestException({
            message: 'Current password is required when you already have a password.',
            errorCode: 'CURRENT_PASSWORD_REQUIRED',
          });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
          throw new ForbiddenException({
            message: 'Current password is incorrect.',
            errorCode: 'WRONG_PASSWORD',
          });
        }
      } else {
        this.logger.log(`User ${userId} is setting password for the first time (OAuth account)`);
      }

      const newHashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
      user.passwordHash = newHashedPassword;
      await entityManager.save(user);

      // Logout all sessions
      await this.tokenService.removeAllRefreshTokensForUser(userId);
      await this.tokenService.invalidateAllTokens(userId);
    });
  }

  async setPassword(userId: string, newPassword: string): Promise<void> {
    return await this.entityManager.transaction(async (entityManager) => {
      const user = await this.userService.findOneById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found.');
      }

      if (user.passwordHash) {
        throw new BadRequestException({
          message: 'You already have a password. Please use the change password function.',
          errorCode: 'PASSWORD_ALREADY_EXISTS',
        });
      }

      const newHashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
      user.passwordHash = newHashedPassword;
      await entityManager.save(user);

      this.logger.log(`User ${userId} has set their password successfully`);
    });
  }

  async forgotPassword(email: string): Promise<{ message: string; isOAuthUser?: boolean }> {
    this.logger.log(`🔵 [ForgotPassword] Request for email: ${email}`);
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      this.logger.log(`ℹ️ [ForgotPassword] User not found for email: ${email}`);
      return {
        message: 'If your email exists in our system, you will receive password reset instructions.',
      };
    }

    if (!user.passwordHash) {
      this.logger.log(`⚠️ [ForgotPassword] User ${user.id} has no password (OAuth account)`);
      return {
        message: 'This account uses Google Login. Please use the "Login with Google" button.',
        isOAuthUser: true,
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenKey = `reset-password-token:${resetToken}`;
    await this.cacheManager.set(tokenKey, user.id, 900000); // 15 minutes

    await this.mailService.sendPasswordResetEmail(user, resetToken);
    this.logger.log(`✅ [ForgotPassword] Reset email sent to: ${user.email}`);

    return {
      message: 'If your email exists in our system, you will receive password reset instructions.',
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    this.logger.log(`�� [ResetPassword] Attempting to reset password`);

    const tokenKey = `reset-password-token:${token}`;
    const userId = await this.cacheManager.get<string>(tokenKey);

    if (!userId) {
      this.logger.error(`❌ [ResetPassword] Token not found or expired`);
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    return await this.entityManager.transaction(async (entityManager) => {
      const user = await this.userService.findOneById(userId);
      if (!user) {
        throw new NotFoundException('User not found.');
      }

      const newHashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
      user.passwordHash = newHashedPassword;
      await entityManager.save(user);

      await this.cacheManager.del(tokenKey);
      
      // Logout all sessions
      await this.tokenService.removeAllRefreshTokensForUser(userId);
      await this.tokenService.invalidateAllTokens(userId);

      this.logger.log(`✅ [ResetPassword] Password updated and sessions logged out for user: ${userId}`);

      return {
        message: 'Password reset successfully. Please login with your new password.',
      };
    });
  }
}
