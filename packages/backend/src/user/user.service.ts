import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import {
  CreateUserDto,
  EmailChangeRequest,
  RefreshToken,
  TwoFactorRecoveryCode,
  UpdateUserDto,
  User,
  UserIdentity,
  UserStatus,
} from '@live-chat/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, MoreThan, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { EncryptionService } from '../common/services/encryption.service';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

interface SetRefreshTokenOptions {
  refreshToken: string;
  userId: string;
  expiresAt: Date;
  expiredRefreshToken?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(EmailChangeRequest)
    private readonly emailChangeRequestRepository: Repository<EmailChangeRequest>,
    private readonly entityManager: EntityManager,
    private readonly encryptionService: EncryptionService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly mailService: MailService,
    private readonly configService: ConfigService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleExpiredTokensCleanup() {
    this.logger.log(
      '[Cron] Running scheduled task to clean up expired refresh tokens...'
    );

    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    if (result.affected && result.affected > 0) {
      this.logger.log(
        `[Cron] Successfully deleted ${result.affected} expired refresh tokens.`
      );
    } else {
      this.logger.log('[Cron] No expired refresh tokens found to delete.');
    }
  }

  /**
   * Create a new user and save it to the database.
   *
   * @param createUserDto user data to create a new user, including email and password_hash
   * @returns Promise<User> newly created user entity
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.entityManager.transaction(async (entityManager) => {
      const newUser = this.userRepository.create(createUserDto);
      return await entityManager.save(newUser);
    });
  }

  /**
   * Find a user by their ID.
   *
   * @param id the unique identifier of the user
   * @returns Promise<User> the user entity if found, otherwise throws an error
   */
  async findOneById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Find a user by their email.
   *
   * @param email the email address of the user
   * @returns Promise<User> the user entity if found, otherwise return null
   */
  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  /**
   * Request email change - creates a verification token and sends emails
   * @param userId User ID requesting the change
   * @param newEmail New email address
   * @param currentPassword Current password for verification
   * @returns Promise<{ message: string; newEmail: string }>
   */
  async requestEmailChange(
    userId: string,
    newEmail: string,
    currentPassword: string
  ): Promise<{ message: string; newEmail: string; warning?: string }> {
    this.logger.log(
      `[requestEmailChange] Starting email change request for user: ${userId} to new email: ${newEmail}`
    );
    const user = await this.findOneById(userId);

    // 1. Validate user has password (OAuth users must set password first)
    if (!user.passwordHash) {
      this.logger.warn(
        `[requestEmailChange] User ${userId} has no password set`
      );
      throw new BadRequestException(
        'Bạn cần đặt mật khẩu trước khi có thể thay đổi email.'
      );
    }

    // 2. Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      this.logger.warn(
        `[requestEmailChange] Invalid password for user: ${userId}`
      );
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng.');
    }

    // 3. Validate new email
    if (user.email === newEmail) {
      this.logger.warn(
        `[requestEmailChange] New email same as current for user: ${userId}`
      );
      throw new BadRequestException('Email mới phải khác với email hiện tại.');
    }

    // Check if email is already taken
    const isEmailTaken = await this.userRepository.findOne({
      where: { email: newEmail },
    });
    if (isEmailTaken) {
      this.logger.warn(
        `[requestEmailChange] Email ${newEmail} is already taken`
      );
      throw new BadRequestException('Email này đã được sử dụng.');
    }

    // 4. Check if user has linked OAuth accounts - warn them
    const userWithIdentities = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['identities'],
    });

    const hasLinkedOAuth =
      userWithIdentities?.identities &&
      userWithIdentities.identities.length > 0;
    const oauthWarning = hasLinkedOAuth
      ? 'Lưu ý: Tất cả tài khoản liên kết (Google, v.v.) sẽ bị hủy liên kết sau khi thay đổi email vì email không còn khớp.'
      : undefined;

    // 5. Check for existing pending request
    this.logger.log(
      `[requestEmailChange] Checking for existing pending request for user: ${userId}`
    );
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
        'Bạn đã có một yêu cầu thay đổi email đang chờ xử lý. Vui lòng kiểm tra email hoặc hủy yêu cầu cũ.'
      );
    }

    // 6. Create verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expire after 24 hours

    // 7. Save request to database
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

    // 8. Store token info in Redis for quick verification
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
    ); // 24 hours in ms

    // 9. Send emails
    this.logger.log(
      `[requestEmailChange] Sending verification email to new address: ${newEmail}`
    );
    try {
      // Send verification email to new address
      await this.mailService.sendEmailChangeVerification(user, newEmail, token);

      // Send notification email to old address
      await this.mailService.sendEmailChangeNotification(user, newEmail);

      this.logger.log(
        `[requestEmailChange] Emails sent successfully for user: ${userId}`
      );
    } catch (error) {
      this.logger.error(
        `[requestEmailChange] Failed to send emails for user: ${userId}`,
        error
      );
      throw new BadRequestException(
        'Không thể gửi email xác nhận. Vui lòng thử lại sau.'
      );
    }

    console.log('📧 Email change requested:');
    console.log(`   User: ${user.email} (${userId})`);
    console.log(`   New email: ${newEmail}`);
    console.log(`   Verification token: ${token}`);
    console.log(
      `   Verification URL: ${process.env.FRONTEND_URL}/verify-email-change?token=${token}`
    );
    if (oauthWarning) {
      console.log(`   ⚠️  ${oauthWarning}`);
    }

    return {
      message:
        'Yêu cầu thay đổi email đã được gửi. Vui lòng kiểm tra email mới để xác nhận.',
      newEmail,
      warning: oauthWarning,
    };
  }

  /**
   * Verify email change using token
   * @param token Verification token from email
   * @returns Promise<{ message: string; newEmail: string }>
   */
  async verifyEmailChange(
    token: string
  ): Promise<{ message: string; newEmail: string }> {
    this.logger.log(`[verifyEmailChange] Verifying token: ${token}`);
    // 1. Find the request
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
      throw new BadRequestException('Token không hợp lệ hoặc đã được sử dụng.');
    }

    this.logger.log(
      `[verifyEmailChange] Found request for user: ${request.userId}`
    );

    // 2. Check if expired
    if (new Date() > request.expiresAt) {
      this.logger.warn(
        `[verifyEmailChange] Token expired for user: ${request.userId}`
      );
      throw new BadRequestException(
        'Token đã hết hạn. Vui lòng yêu cầu thay đổi email mới.'
      );
    }

    // 3. Check if new email is still available
    const isEmailTaken = await this.userRepository.findOne({
      where: { email: request.newEmail },
    });
    if (isEmailTaken) {
      this.logger.warn(
        `[verifyEmailChange] Email ${request.newEmail} is now taken by another user`
      );
      throw new BadRequestException(
        'Email này đã được sử dụng bởi người khác.'
      );
    }

    // 4. Update user email and mark request as verified
    this.logger.log(
      `[verifyEmailChange] Updating email from ${request.oldEmail} to ${request.newEmail} for user: ${request.userId}`
    );

    let hadLinkedOAuth = false;
    let oauthAccountCount = 0;

    await this.entityManager.transaction(async (entityManager) => {
      // Load user with relations to check for identities
      const user = await entityManager.findOne(User, {
        where: { id: request.userId },
        relations: ['identities'],
      });

      if (!user) {
        throw new BadRequestException('Người dùng không tồn tại.');
      }

      // Check if user has linked OAuth accounts
      const hasLinkedOAuth = user.identities && user.identities.length > 0;
      hadLinkedOAuth = hasLinkedOAuth;
      oauthAccountCount = user.identities?.length || 0;

      user.email = request.newEmail;
      await entityManager.save(user);

      request.isVerified = true;
      await entityManager.save(request);

      // If user has linked OAuth accounts, unlink them because email no longer matches
      if (hasLinkedOAuth) {
        await entityManager.delete(UserIdentity, { userId: user.id });
        console.log(
          `⚠️  Unlinked ${oauthAccountCount} OAuth account(s) due to email change`
        );
      }

      // Invalidate all refresh tokens to log out all devices
      await entityManager.delete(RefreshToken, { userId: user.id });

      // Invalidate all access tokens by updating tokensValidFrom
      // This ensures that even if access tokens haven't expired yet, they will be rejected
      user.tokensValidFrom = new Date();
      await entityManager.save(user);
    });

    // 5. Clear Redis cache
    const tokenKey = `email-change:${token}`;
    await this.cacheManager.del(tokenKey);

    // 6. Send confirmation email to old address
    this.logger.log(
      `[verifyEmailChange] Sending confirmation email to old address: ${request.oldEmail}`
    );
    try {
      await this.mailService.sendEmailChangeConfirmation(
        request.oldEmail,
        request.newEmail,
        request.user.fullName
      );
      this.logger.log(
        `[verifyEmailChange] Confirmation email sent successfully`
      );
    } catch (error) {
      this.logger.error(
        `[verifyEmailChange] Failed to send confirmation email, but email change was successful`,
        error
      );
      // Don't throw error - email change was successful even if confirmation email fails
    }

    console.log('✅ Email change verified:');
    console.log(`   User ID: ${request.userId}`);
    console.log(`   Old email: ${request.oldEmail}`);
    console.log(`   New email: ${request.newEmail}`);
    console.log(`   All sessions invalidated: YES`);
    console.log(
      `   OAuth accounts unlinked: ${hadLinkedOAuth ? `YES (${oauthAccountCount})` : 'NO'}`
    );

    return {
      message:
        'Email đã được thay đổi thành công. Vui lòng đăng nhập lại bằng email mới.',
      newEmail: request.newEmail,
    };
  }

  /**
   * Cancel email change request
   * @param userId User ID
   * @returns Promise<{ message: string }>
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
        'Không tìm thấy yêu cầu thay đổi email đang chờ xử lý.'
      );
    }

    request.isCancelled = true;
    await this.emailChangeRequestRepository.save(request);

    // Clear Redis cache
    const tokenKey = `email-change:${request.token}`;
    await this.cacheManager.del(tokenKey);

    return {
      message: 'Yêu cầu thay đổi email đã được hủy.',
    };
  }

  /**
   * Get pending email change request for a user
   * @param userId User ID
   * @returns Promise<EmailChangeRequest | null>
   */
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

  /**
   * Update a user's profile with the provided data.
   *
   * @param id the unique identifier of the user
   * @param updateUserDto data to update the user's profile, including fullName, avatarUrl, and timezone
   * @returns Promise<User> the updated user entity
   */
  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.entityManager.transaction(async (entityManager) => {
      const user = await this.userRepository.preload({
        id,
        ...updateUserDto,
      });
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
      return entityManager.save(user);
    });
  }

  /**     * Update the last login timestamp for a user.
   *
   * @param id the unique identifier of the user
   * @returns Promise<void> resolves when the update is complete
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  /**
   * Activate a user by setting their status to ACTIVE.
   *
   * @param id the unique identifier of the user
   * @returns Promise<User> the updated user entity with status set to ACTIVE
   */
  async activate(id: string): Promise<User> {
    const user = await this.findOneById(id);
    user.status = UserStatus.ACTIVE;
    return this.userRepository.save(user);
  }

  async markEmailAsVerified(userId: string): Promise<User> {
    const user = await this.findOneById(userId);
    user.isEmailVerified = true;
    return this.userRepository.save(user);
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findOneById(id);
    user.status = UserStatus.INACTIVE;
    return this.userRepository.save(user);
  }

  /**
   * Set the current refresh token for a user.
   * add new refresh token to the database and remove the old one if provided.
  @param options - The options for setting the refresh token.
  @param options.refreshToken - The refresh token to set.
  @param options.userId - The unique identifier of the user.
  @param options.expiresAt - The expiration date of the refresh token.
  @param [options.expiredRefreshToken] - The previous refresh token to remove (optional).
  @param [options.ipAddress] - The IP address of the user (optional).
  @param [options.userAgent - The user agent of the user (optional).
  @returns Promise<void> resolves when the refresh token is set
  */
  async setCurrentRefreshToken(options: SetRefreshTokenOptions): Promise<void> {
    const {
      refreshToken,
      userId,
      expiresAt,
      expiredRefreshToken,
      ipAddress,
      userAgent,
    } = options;

    return this.entityManager.transaction(async (entityManager) => {
      // Enforce session limit
      const sessionLimit =
        parseInt(this.configService.get<string>('SESSION_LIMIT') as string) ||
        5;

      const userTokens = await entityManager.find(RefreshToken, {
        where: { userId },
        order: { createdAt: 'ASC' },
      });

      if (userTokens.length >= sessionLimit) {
        const tokensToRemove = userTokens.slice(
          0,
          userTokens.length - sessionLimit + 1
        );
        await entityManager.remove(tokensToRemove);
        this.logger.log(
          `[SessionLimit] Removed ${tokensToRemove.length} oldest session(s) for user ${userId}`
        );
      }

      const hashedToken = await bcrypt.hash(refreshToken, 12);
      let finalIpAddress = ipAddress;
      let finalUserAgent = userAgent;

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      if (expiredRefreshToken) {
        const oldToken = await this.findRefreshTokenByValue(
          userId,
          expiredRefreshToken,
          entityManager
        );

        if (oldToken) {
          finalIpAddress = ipAddress || oldToken.ipAddress;
          finalUserAgent = userAgent || oldToken.userAgent;
          await entityManager.remove(oldToken);
        }
      }

      if (finalIpAddress && finalUserAgent) {
        await entityManager.delete(RefreshToken, {
          userId,
          ipAddress: finalIpAddress,
          userAgent: finalUserAgent,
        });
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
    entityManager: EntityManager
  ): Promise<RefreshToken | null> {
    const userTokens = await entityManager.find(RefreshToken, {
      where: { userId },
    });

    for (const token of userTokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.hashedToken);
      if (isMatch) {
        return token;
      }
    }

    return null;
  }

  /**
   * Remove the refresh token for a user.
   *
   * @param userId the unique identifier of the user
   * @returns Promise<void> resolves when the update is complete
   */
  async removeAllRefreshTokensForUser(userId: string): Promise<void> {
    this.entityManager.transaction(async (entityManager) => {
      await entityManager.delete(RefreshToken, { userId });
    });
  }

  async invalidateAllTokens(userId: string): Promise<void> {
    this.entityManager.transaction(async (entityManager) => {
      await entityManager.update(User, userId, { tokensValidFrom: new Date() });
    });
  }

  /**
   * Verify if a refresh token is valid for a user.
   *
   * @param refreshToken the refresh token to verify
   * @param userId the unique identifier of the user
   * @returns Promise<boolean> true if the token is valid, false otherwise
   */
  async verifyRefreshToken(
    refreshToken: string,
    userId: string
  ): Promise<boolean> {
    const storedTokens = await this.refreshTokenRepository.find({
      where: { userId },
    });

    // If no tokens exist for the user, it's clearly invalid.
    if (!storedTokens || storedTokens.length === 0) {
      return false;
    }

    let matchingToken: RefreshToken | undefined;

    // Find a matching token first
    for (const storedToken of storedTokens) {
      const isMatch = await bcrypt.compare(
        refreshToken,
        storedToken.hashedToken
      );
      if (isMatch) {
        matchingToken = storedToken;
        break;
      }
    }

    // If a match was found, check its expiration
    if (matchingToken) {
      if (matchingToken.expiresAt < new Date()) {
        // Token is expired, remove it from DB and throw a specific error
        await this.refreshTokenRepository.delete(matchingToken.id);
        throw new UnauthorizedException('Refresh token has expired');
      }
      // Token is valid and not expired, return true
      return true;
    }

    return false;
  }

  async turnOnTwoFactorAuthentication(
    userId: string,
    secret: string
  ): Promise<{ user: User; recoveryCodes: string[] }> {
    return this.entityManager.transaction(async (manager) => {
      // 1. Encrypt the secret for storage
      const encryptedSecret = this.encryptionService.encrypt(secret);

      // 2. Update the user record
      await manager.update(User, userId, {
        isTwoFactorAuthenticationEnabled: true,
        twoFactorAuthenticationSecret: encryptedSecret,
      });

      // 3. Generate and hash recovery codes
      const plaintextRecoveryCodes = Array.from({ length: 10 }, () =>
        crypto.randomBytes(8).toString('hex')
      );

      const hashedCodes = await Promise.all(
        plaintextRecoveryCodes.map(async (code) => ({
          userId,
          hashedCode: await bcrypt.hash(code, 12),
          isUsed: false,
        }))
      );

      // 4. Clear old codes and save new ones
      await manager.delete(TwoFactorRecoveryCode, { userId });
      await manager.save(TwoFactorRecoveryCode, hashedCodes);

      const updatedUser = await manager.findOneBy(User, { id: userId });
      if (!updatedUser) {
        throw new Error(`User with ID ${userId} not found`);
      }

      return { user: updatedUser, recoveryCodes: plaintextRecoveryCodes };
    });
  }

  /**
   * Disables 2FA for a user and removes all associated data.
   * @param userId The ID of the user.
   * @returns The updated user.
   */
  async turnOffTwoFactorAuthentication(userId: string): Promise<User> {
    return this.entityManager.transaction(async (manager) => {
      // 1. Clear 2FA data from the user record
      await manager.update(User, userId, {
        isTwoFactorAuthenticationEnabled: false,
        twoFactorAuthenticationSecret: null,
      });

      // 2. Delete all recovery codes for the user
      await manager.delete(TwoFactorRecoveryCode, { userId });

      const user = await manager.findOneBy(User, { id: userId });
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      return user;
    });
  }
}
