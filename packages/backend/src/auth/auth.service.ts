
import {
  Injectable,
  ConflictException,
  Inject,
  NotFoundException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  RegisterDto,
  ResendVerificationDto,
} from '@live-chat/shared-dtos';
import { User } from '../database/entities';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';
import { MailService } from '../mail/mail.service';
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';
import { OAuthService } from './services/oauth.service';

export type LoginResult = 
  | { status: 'success'; tokens: { accessToken: string; refreshToken: string }; user: User }
  | { status: '2fa_required'; partialToken: string };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly entityManager: EntityManager,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly oauthService: OAuthService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    this.logger.log(`🔵 [Register] Starting registration for email: ${registerDto.email}`);

    return await this.entityManager.transaction(async (entityManager) => {
      const existingUser = await this.userService.findOneByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('Email này đã được sử dụng.');
      }

      const passwordHash = await bcrypt.hash(registerDto.password, 12);

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

  async login(user: User, ipAddress?: string, userAgent?: string): Promise<LoginResult> {
    if (user.isTwoFactorAuthenticationEnabled) {
      const { accessToken } = await this.tokenService.generate2FAPartialToken(user.id);
      return { status: '2fa_required', partialToken: accessToken };
    }

    const tokens = await this.tokenService.generateTokens(user.id, user.email);
    const liveTime = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '30d';
    const refreshTokenExpiresIn = parseInt(liveTime.slice(0, -1), 10) || 30;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshTokenExpiresIn);

    await this.tokenService.setCurrentRefreshToken({
      refreshToken: tokens.refreshToken,
      userId: user.id,
      expiresAt,
      ipAddress,
      userAgent,
    });

    await this.userService.updateLastLogin(user.id);

    return { status: 'success', tokens, user };
  }

  /**
   * Login after 2FA verification - skips 2FA check since user already verified.
   */
  async loginAfter2FA(user: User, ipAddress?: string, userAgent?: string) {
    const tokens = await this.tokenService.generateTokens(user.id, user.email);
    const liveTime = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '30d';
    const refreshTokenExpiresIn = parseInt(liveTime.slice(0, -1), 10) || 30;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshTokenExpiresIn);

    await this.tokenService.setCurrentRefreshToken({
      refreshToken: tokens.refreshToken,
      userId: user.id,
      expiresAt,
      ipAddress,
      userAgent,
    });

    await this.userService.updateLastLogin(user.id);
    
    const { passwordHash, ...safeUser } = user;
    return { 
      accessToken: tokens.accessToken, 
      refreshToken: tokens.refreshToken, 
      user: { ...safeUser, hasPassword: !!passwordHash }
    };
  }

  async exchangeCodeForTokens(code: string, ip: string, userAgent: string) {
    const userId = await this.oauthService.validateOneTimeCode(code);
    const user = await this.userService.findOneById(userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const loginResult = await this.login(user, ip, userAgent);
    
    if (loginResult.status === '2fa_required') {
      // Should not happen in current flow as OAuth usually bypasses 2FA or handles it differently,
      // but if we enforce 2FA on OAuth users, we need to handle it.
      // For now, assuming OAuth users are verified.
      // However, if 2FA is enabled, we must respect it.
      throw new UnauthorizedException({
        message: '2FA required',
        errorCode: '2FA_REQUIRED',
        partialToken: loginResult.partialToken
      });
    }

    return {
      accessToken: loginResult.tokens.accessToken,
      refreshToken: loginResult.tokens.refreshToken,
      user: {
        ...user,
        hasPassword: !!user.passwordHash
      }
    };
  }

  // Facade methods delegating to specific services
  async validateUser(email: string, pass: string) {
    return this.passwordService.validateUser(email, pass);
  }

  async changePassword(userId: string, current: string | undefined, newPass: string) {
    return this.passwordService.changePassword(userId, current, newPass);
  }

  async setPassword(userId: string, newPass: string) {
    return this.passwordService.setPassword(userId, newPass);
  }

  async forgotPassword(email: string) {
    return this.passwordService.forgotPassword(email);
  }

  async resetPassword(token: string, newPass: string) {
    return this.passwordService.resetPassword(token, newPass);
  }

  async validateOAuthUser(profile: any) {
    return this.oauthService.validateOAuthUser(profile);
  }

  async generateOneTimeCode(userId: string) {
    return this.oauthService.generateOneTimeCode(userId);
  }

  async linkGoogleAccount(userId: string, profile: any) {
    const result = await this.oauthService.linkGoogleAccount(userId, profile);
    const { passwordHash, ...userResult } = result.user;
    return {
      message: result.message,
      user: { ...userResult, hasPassword: !!passwordHash }
    };
  }

  async unlinkOAuthAccount(userId: string, provider: string) {
    return this.oauthService.unlinkOAuthAccount(userId, provider);
  }

  async getLinkedAccounts(userId: string) {
    return this.oauthService.getLinkedAccounts(userId);
  }

  async logout(userId: string, refreshToken: string) {
    return this.tokenService.revokeRefreshToken(userId, refreshToken);
  }

  async logoutAll(userId: string) {
    await this.tokenService.removeAllRefreshTokensForUser(userId);
    await this.tokenService.invalidateAllTokens(userId);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    return this.tokenService.refreshUserTokens(userId, refreshToken);
  }

  async verifyEmailChange(token: string) {
    return this.userService.verifyEmailChange(token);
  }

  // Helper for 2FA controller
  async generate2FAPartialToken(userId: string) {
    return this.tokenService.generate2FAPartialToken(userId);
  }

  // Helper to get user by ID (used by controllers after password change)
  async findUserById(userId: string) {
    return this.userService.findOneById(userId);
  }
}
