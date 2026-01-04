
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
import {
  RegisterDto,
  ResendVerificationDto,
} from '@live-chat/shared-dtos';
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
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    this.logger.log(`🔵 [Register] Starting registration for email: ${registerDto.email}`);

    return await this.entityManager.transaction(async (entityManager) => {
      const existingUser = await this.userService.findOneByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('Email này đã được sử dụng.');
      }

      const passwordHash = await bcrypt.hash(registerDto.password, BCRYPT_SALT_ROUNDS);

      const newUser = await entityManager.save(User, {
        email: registerDto.email,
        passwordHash,
        fullName: registerDto.fullName,
        isEmailVerified: false,
      });

      this.logger.log(`✅ [Register] User created with ID: ${newUser.id}`);

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenKey = `verification-token:${verificationToken}`;
      await this.cacheManager.set(tokenKey, newUser.id, 900000); // 15 minutes

      await this.mailService.sendUserConfirmation(newUser, verificationToken);

      if (registerDto.invitationToken) {
        try {
          const invitationKey = `pending-invitation:${newUser.id}`;
          await this.cacheManager.set(invitationKey, registerDto.invitationToken, 604800000);
        } catch (error) {
          this.logger.error(`❌ [Register] Failed to store invitation token`, error);
        }
      }

      return {
        message: 'Đăng ký thành công, vui lòng kiểm tra email để kích hoạt tài khoản.',
      };
    });
  }

  async verifyEmail(token: string): Promise<{ message: string; invitationToken?: string }> {
    const tokenKey = `verification-token:${token}`;
    const userId = await this.cacheManager.get<string>(tokenKey);

    if (!userId) {
      throw new NotFoundException('Token xác thực không hợp lệ hoặc đã hết hạn.');
    }

    await this.userService.markEmailAsVerified(userId);
    await this.cacheManager.del(tokenKey);

    const invitationKey = `pending-invitation:${userId}`;
    const invitationToken = await this.cacheManager.get<string>(invitationKey);

    if (invitationToken) {
      return {
        message: 'Xác thực email thành công.',
        invitationToken,
      };
    }

    return { message: 'Xác thực email thành công.' };
  }

  async resendVerificationEmail(resendVerificationDto: ResendVerificationDto): Promise<{ message: string }> {
    const user = await this.userService.findOneByEmail(resendVerificationDto.email);

    if (!user) {
      return {
        message: 'Nếu tài khoản của bạn tồn tại, một email xác thực đã được gửi đi.',
      };
    }

    if (user.isEmailVerified) {
      throw new ConflictException('Email này đã được xác thực.');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenKey = `verification-token:${verificationToken}`;
    await this.cacheManager.set(tokenKey, user.id, 900000);

    await this.mailService.sendUserConfirmation(user, verificationToken);

    return {
      message: 'Một email xác thực mới đã được gửi. Vui lòng kiểm tra hộp thư của bạn.',
    };
  }
}
