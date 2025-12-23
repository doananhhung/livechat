
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../../database/entities';
import { TokenService } from './token.service';
import { UserService } from '../../user/user.service';
import { OAuthService } from './oauth.service';

export type LoginResult = 
  | { status: 'success'; tokens: { accessToken: string; refreshToken: string }; user: User }
  | { status: '2fa_required'; partialToken: string };

@Injectable()
export class LoginService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {}

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
}
