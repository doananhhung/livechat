
import { Injectable, Logger, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, LessThan } from 'typeorm';
import { RefreshToken, User } from '../../database/entities';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../../common/constants/crypto.constants';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserStatus } from '@live-chat/shared-types';
import { UserService } from '../../user/user.service';

interface SetRefreshTokenOptions {
  refreshToken: string;
  userId: string;
  expiresAt: Date;
  expiredRefreshToken?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly userService: UserService,
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * Generates a new pair of access and refresh tokens.
   */
  async generateTokens(userId: string, email: string) {
    const accessTokenPayload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  /**
   * Generates a partial JWT token for 2FA authentication flow.
   */
  async generate2FAPartialToken(userId: string) {
    const payload = {
      sub: userId,
      isTwoFactorAuthenticated: false,
      is2FA: true,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('TWO_FACTOR_AUTH_JWT_SECRET'),
      expiresIn: this.configService.get<string>('TWO_FACTOR_AUTH_JWT_EXPIRES_IN'),
    });
    return { accessToken };
  }

  /**
   * Verifies if a refresh token is valid for a user.
   */
  async verifyRefreshToken(refreshToken: string, userId: string): Promise<boolean> {
    this.logger.debug(`[verifyRefreshToken] Starting verification for userId: ${userId}`);
    this.logger.debug(`[verifyRefreshToken] Token (first 20 chars): ${refreshToken.substring(0, 20)}...`);
    
    const storedTokens = await this.refreshTokenRepository.find({
      where: { userId },
    });

    this.logger.debug(`[verifyRefreshToken] Found ${storedTokens?.length || 0} tokens in DB for userId: ${userId}`);

    if (!storedTokens || storedTokens.length === 0) {
      this.logger.warn(`[verifyRefreshToken] No tokens found in DB for userId: ${userId}`);
      return false;
    }

    let matchingToken: RefreshToken | undefined;

    for (let i = 0; i < storedTokens.length; i++) {
      const storedToken = storedTokens[i];
      this.logger.debug(`[verifyRefreshToken] Comparing with token ${i + 1}/${storedTokens.length} (id: ${storedToken.id})`);
      const isMatch = await bcrypt.compare(refreshToken, storedToken.hashedToken);
      this.logger.debug(`[verifyRefreshToken] Token ${i + 1} match result: ${isMatch}`);
      if (isMatch) {
        matchingToken = storedToken;
        break;
      }
    }

    if (matchingToken) {
      this.logger.debug(`[verifyRefreshToken] Found matching token (id: ${matchingToken.id}), checking expiration`);
      if (matchingToken.expiresAt < new Date()) {
        this.logger.warn(`[verifyRefreshToken] Token expired at ${matchingToken.expiresAt}`);
        await this.refreshTokenRepository.delete(matchingToken.id);
        throw new UnauthorizedException('Refresh token has expired');
      }
      this.logger.debug(`[verifyRefreshToken] Token is valid and not expired`);
      return true;
    }

    this.logger.warn(`[verifyRefreshToken] No matching token found after comparing all ${storedTokens.length} tokens`);
    return false;
  }

  /**
   * Stores a new refresh token in the database, enforcing session limits.
   */
  async setCurrentRefreshToken(options: SetRefreshTokenOptions): Promise<void> {
    const { refreshToken, userId, expiresAt, expiredRefreshToken, ipAddress, userAgent } = options;

    return this.entityManager.transaction(async (entityManager) => {
      const sessionLimit = parseInt(this.configService.get<string>('SESSION_LIMIT') as string) || 5;

      const userTokens = await entityManager.find(RefreshToken, {
        where: { userId },
        order: { createdAt: 'ASC' },
      });

      if (userTokens.length >= sessionLimit) {
        const tokensToRemove = userTokens.slice(0, userTokens.length - sessionLimit + 1);
        await entityManager.remove(tokensToRemove);
        this.logger.log(`[SessionLimit] Removed ${tokensToRemove.length} oldest session(s) for user ${userId}`);
      }

      const hashedToken = await bcrypt.hash(refreshToken, BCRYPT_SALT_ROUNDS);
      let finalIpAddress = ipAddress;
      let finalUserAgent = userAgent;

      if (expiredRefreshToken) {
        const oldToken = await this.findRefreshTokenByValue(userId, expiredRefreshToken, entityManager);
        if (oldToken) {
          finalIpAddress = ipAddress || oldToken.ipAddress;
          finalUserAgent = userAgent || oldToken.userAgent;
          
          // Grace Period Implementation:
          // Instead of deleting the old token immediately, we set its expiration to 20 seconds from now.
          // This allows concurrent requests (e.g., from multiple tabs or network retries) to still verify
          // against this token before it disappears, preventing "infinite logout" loops.
          oldToken.expiresAt = new Date(Date.now() + 20 * 1000);
          await entityManager.save(oldToken);
        }
      }

      const newRefreshToken = entityManager.create(RefreshToken, {
        hashedToken,
        userId,
        expiresAt,
        ipAddress: finalIpAddress,
        userAgent: finalUserAgent,
      });

      await entityManager.save(newRefreshToken);
    });
  }

  private async findRefreshTokenByValue(
    userId: string,
    refreshToken: string,
    entityManager: EntityManager,
  ): Promise<RefreshToken | null> {
    const userTokens = await entityManager.find(RefreshToken, { where: { userId } });
    for (const token of userTokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.hashedToken);
      if (isMatch) {
        return token;
      }
    }
    return null;
  }

  /**
   * Revokes a specific refresh token.
   */
  async revokeRefreshToken(userId: string, rawRefreshToken: string): Promise<void> {
    const userTokens = await this.refreshTokenRepository.find({ where: { userId } });
    for (const token of userTokens) {
      const isMatch = await bcrypt.compare(rawRefreshToken, token.hashedToken);
      if (isMatch) {
        await this.refreshTokenRepository.delete(token.id);
      }
    }
  }

  /**
   * Revokes all refresh tokens for a user.
   */
  async removeAllRefreshTokensForUser(userId: string): Promise<void> {
    await this.refreshTokenRepository.delete({ userId });
  }

  /**
   * Invalidates all tokens (Access & Refresh) by updating the user's `tokensValidFrom` timestamp.
   */
  async invalidateAllTokens(userId: string): Promise<void> {
    await this.entityManager.update(User, userId, { tokensValidFrom: new Date() });
  }

  /**
   * Refreshes access and refresh tokens.
   */
  async refreshUserTokens(userId: string, refreshToken: string) {
    const user = await this.userService.findOneById(userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Access Denied');
    }

    try {
      const isValidToken = await this.verifyRefreshToken(refreshToken, userId);
      if (!isValidToken) {
        // Security risk: Invalid token presented. Log out all sessions.
        await this.removeAllRefreshTokensForUser(userId);
        await this.invalidateAllTokens(userId);
        throw new UnauthorizedException('Access Denied');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
      }
      throw error;
    }

    const tokens = await this.generateTokens(userId, user.email);
    const liveTime = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '30d';
    const refreshTokenExpiresIn = parseInt(liveTime.slice(0, -1), 10) || 30;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshTokenExpiresIn);

    await this.setCurrentRefreshToken({
      refreshToken: tokens.refreshToken,
      userId,
      expiresAt,
      expiredRefreshToken: refreshToken,
    });

    return tokens;
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleExpiredTokensCleanup() {
    this.logger.log('[Cron] Running scheduled task to clean up expired refresh tokens...');
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    if (result.affected && result.affected > 0) {
      this.logger.log(`[Cron] Successfully deleted ${result.affected} expired refresh tokens.`);
    }
  }
}
