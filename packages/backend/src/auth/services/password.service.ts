
import {
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { MailService } from '../../mail/mail.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
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
      throw new ForbiddenException('Email hoặc mật khẩu không đúng.');
    }

    if (user && user.passwordHash && (await bcrypt.compare(pass, user.passwordHash))) {
      if (user.status === UserStatus.SUSPENDED) {
        throw new ForbiddenException('Tài khoản của bạn đã bị đình chỉ.');
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
        throw new UnauthorizedException('Người dùng không tồn tại.');
      }

      if (user.passwordHash) {
        if (!currentPassword) {
          throw new BadRequestException({
            message: 'Mật khẩu hiện tại là bắt buộc khi bạn đã có mật khẩu.',
            errorCode: 'CURRENT_PASSWORD_REQUIRED',
          });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
          throw new ForbiddenException({
            message: 'Mật khẩu hiện tại không đúng.',
            errorCode: 'WRONG_PASSWORD',
          });
        }
      } else {
        this.logger.log(`User ${userId} is setting password for the first time (OAuth account)`);
      }

      const newHashedPassword = await bcrypt.hash(newPassword, 12);
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
        throw new UnauthorizedException('Người dùng không tồn tại.');
      }

      if (user.passwordHash) {
        throw new BadRequestException({
          message: 'Bạn đã có mật khẩu. Vui lòng sử dụng chức năng đổi mật khẩu.',
          errorCode: 'PASSWORD_ALREADY_EXISTS',
        });
      }

      const newHashedPassword = await bcrypt.hash(newPassword, 12);
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
        message: 'Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
      };
    }

    if (!user.passwordHash) {
      this.logger.log(`⚠️ [ForgotPassword] User ${user.id} has no password (OAuth account)`);
      return {
        message: 'Tài khoản này được đăng nhập bằng Google. Vui lòng sử dụng nút "Đăng nhập bằng Google" để truy cập.',
        isOAuthUser: true,
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenKey = `reset-password-token:${resetToken}`;
    await this.cacheManager.set(tokenKey, user.id, 900000); // 15 minutes

    await this.mailService.sendPasswordResetEmail(user, resetToken);
    this.logger.log(`✅ [ForgotPassword] Reset email sent to: ${user.email}`);

    return {
      message: 'Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    this.logger.log(`�� [ResetPassword] Attempting to reset password`);

    const tokenKey = `reset-password-token:${token}`;
    const userId = await this.cacheManager.get<string>(tokenKey);

    if (!userId) {
      this.logger.error(`❌ [ResetPassword] Token not found or expired`);
      throw new BadRequestException('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    }

    return await this.entityManager.transaction(async (entityManager) => {
      const user = await this.userService.findOneById(userId);
      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại.');
      }

      const newHashedPassword = await bcrypt.hash(newPassword, 12);
      user.passwordHash = newHashedPassword;
      await entityManager.save(user);

      await this.cacheManager.del(tokenKey);
      
      // Logout all sessions
      await this.tokenService.removeAllRefreshTokensForUser(userId);
      await this.tokenService.invalidateAllTokens(userId);

      this.logger.log(`✅ [ResetPassword] Password updated and sessions logged out for user: ${userId}`);

      return {
        message: 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập với mật khẩu mới.',
      };
    });
  }
}
