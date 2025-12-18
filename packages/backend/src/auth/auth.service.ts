import {
  Injectable,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
  Inject,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  RegisterDto,
  ResendVerificationDto,
  User,
  UserStatus,
  RefreshToken,
  UserIdentity,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '@live-chat/shared';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly entityManager: EntityManager,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly mailService: MailService
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    this.logger.log(
      `🔵 [Register] Starting registration for email: ${registerDto.email}`
    );
    this.logger.log(
      `🔵 [Register] Has invitation token: ${!!registerDto.invitationToken}`
    );
    if (registerDto.invitationToken) {
      this.logger.log(
        `🔵 [Register] Invitation token: ${registerDto.invitationToken}`
      );
    }

    return await this.entityManager.transaction(async (entityManager) => {
      const existingUser = await this.userService.findOneByEmail(
        registerDto.email
      );
      if (existingUser) {
        throw new ConflictException('Email này đã được sử dụng.');
      }

      const passwordHash = await bcrypt.hash(registerDto.password, 12);

      const newUser = await entityManager.save(User, {
        email: registerDto.email,
        passwordHash,
        fullName: registerDto.fullName,
        isEmailVerified: false, // Explicitly set to false
      });

      this.logger.log(`✅ [Register] User created with ID: ${newUser.id}`);

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenKey = `verification-token:${verificationToken}`;
      await this.cacheManager.set(tokenKey, newUser.id, 900000); // 15 minutes

      this.logger.log(`✅ [Register] Verification token stored in Redis`);

      await this.mailService.sendUserConfirmation(newUser, verificationToken);

      // Handle invitation token if provided
      if (registerDto.invitationToken) {
        try {
          // Store invitation token for later acceptance (after email verification)
          const invitationKey = `pending-invitation:${newUser.id}`;
          await this.cacheManager.set(
            invitationKey,
            registerDto.invitationToken,
            604800000 // 7 days in milliseconds
          );
          this.logger.log(
            `✅ [Register] Stored invitation token for user ${newUser.id}: ${registerDto.invitationToken}`
          );
        } catch (error) {
          this.logger.error(
            `❌ [Register] Failed to store invitation token for user ${newUser.id}`,
            error
          );
          // Don't fail registration if invitation storage fails
        }
      } else {
        this.logger.log(
          `ℹ️ [Register] No invitation token provided for user ${newUser.id}`
        );
      }

      return {
        message:
          'Đăng ký thành công, vui lòng kiểm tra email để kích hoạt tài khoản.',
      };
    });
  }

  async verifyEmail(
    token: string
  ): Promise<{ message: string; invitationToken?: string }> {
    this.logger.log(
      `🔵 [VerifyEmail] Starting email verification with token: ${token}`
    );

    const tokenKey = `verification-token:${token}`;
    const userId = await this.cacheManager.get<string>(tokenKey);

    if (!userId) {
      this.logger.error(
        `❌ [VerifyEmail] Token not found or expired: ${token}`
      );
      throw new NotFoundException(
        'Token xác thực không hợp lệ hoặc đã hết hạn.'
      );
    }

    this.logger.log(`✅ [VerifyEmail] Found userId from token: ${userId}`);

    await this.userService.markEmailAsVerified(userId);
    await this.cacheManager.del(tokenKey);

    this.logger.log(`✅ [VerifyEmail] Email verified for user: ${userId}`);

    // Check if there's a pending invitation for this user
    const invitationKey = `pending-invitation:${userId}`;
    const invitationToken = await this.cacheManager.get<string>(invitationKey);

    if (invitationToken) {
      this.logger.log(
        `🎉 [VerifyEmail] User ${userId} has a pending invitation token: ${invitationToken}. Returning it in response.`
      );
      // Return the invitation token so the frontend can redirect the user
      return {
        message: 'Xác thực email thành công.',
        invitationToken,
      };
    }

    this.logger.log(
      `ℹ️ [VerifyEmail] No pending invitation found for user: ${userId}`
    );
    return { message: 'Xác thực email thành công.' };
  }

  async resendVerificationEmail(
    resendVerificationDto: ResendVerificationDto
  ): Promise<{ message: string }> {
    const user = await this.userService.findOneByEmail(
      resendVerificationDto.email
    );

    if (!user) {
      // To prevent email enumeration, we send a generic success message even if the user doesn't exist.
      return {
        message:
          'Nếu tài khoản của bạn tồn tại, một email xác thực đã được gửi đi.',
      };
    }

    if (user.isEmailVerified) {
      throw new ConflictException('Email này đã được xác thực.');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenKey = `verification-token:${verificationToken}`;
    await this.cacheManager.set(tokenKey, user.id, 900000); // 15 minutes

    await this.mailService.sendUserConfirmation(user, verificationToken);

    return {
      message:
        'Một email xác thực mới đã được gửi. Vui lòng kiểm tra hộp thư của bạn.',
    };
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      throw new ForbiddenException('Email hoặc mật khẩu không đúng.');
    }

    if (user && (await bcrypt.compare(pass, user.passwordHash as string))) {
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

  async changePassword(
    userId: string,
    currentPassword: string | undefined,
    newPassword: string
  ): Promise<void> {
    return await this.entityManager.transaction(async (entityManager) => {
      const user = await this.userService.findOneById(userId);
      if (!user) {
        throw new UnauthorizedException('Người dùng không tồn tại.');
      }

      // If user has a password, require current password verification
      if (user.passwordHash) {
        if (!currentPassword) {
          throw new BadRequestException({
            message: 'Mật khẩu hiện tại là bắt buộc khi bạn đã có mật khẩu.',
            errorCode: 'CURRENT_PASSWORD_REQUIRED',
          });
        }

        const isPasswordValid = await bcrypt.compare(
          currentPassword,
          user.passwordHash
        );
        if (!isPasswordValid) {
          throw new ForbiddenException({
            message: 'Mật khẩu hiện tại không đúng.',
            errorCode: 'WRONG_PASSWORD',
          });
        }
      }
      // If user doesn't have a password (OAuth account), they can set one without current password
      else {
        this.logger.log(
          `User ${userId} is setting password for the first time (OAuth account)`
        );
      }

      const newHashedPassword = await bcrypt.hash(newPassword, 12);
      user.passwordHash = newHashedPassword;
      await entityManager.save(user);

      await this.logoutAll(userId);
    });
  }

  async setPassword(userId: string, newPassword: string): Promise<void> {
    return await this.entityManager.transaction(async (entityManager) => {
      const user = await this.userService.findOneById(userId);
      if (!user) {
        throw new UnauthorizedException('Người dùng không tồn tại.');
      }

      // Only allow setting password if user doesn't have one
      if (user.passwordHash) {
        throw new BadRequestException({
          message:
            'Bạn đã có mật khẩu. Vui lòng sử dụng chức năng đổi mật khẩu.',
          errorCode: 'PASSWORD_ALREADY_EXISTS',
        });
      }

      const newHashedPassword = await bcrypt.hash(newPassword, 12);
      user.passwordHash = newHashedPassword;
      await entityManager.save(user);

      this.logger.log(`User ${userId} has set their password successfully`);
    });
  }

  /**
   * Log in a user by generating access and refresh tokens.
   * The refresh token is stored in the database and the access token is returned to the client.
   * @param user the user entity
   * @param ipAddress the IP address of the user (optional)
   * @param userAgent the user agent string of the user's device (optional)
   * @returns Promise<{ accessToken: string, refreshToken: string, user: User }> the generated tokens and user info
   */
  async loginAndReturnTokens(
    user: User,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Omit<User, 'passwordHash'> & { hasPassword: boolean };
  }> {
    const tokens = await this._generateTokens(user.id, user.email);

    const liveTime =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '30d';
    const refreshTokenExpiresIn = parseInt(liveTime.slice(0, -1), 30);

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshTokenExpiresIn);

    // Use UserService method to set refresh token
    await this.userService.setCurrentRefreshToken({
      refreshToken: tokens.refreshToken,
      userId: user.id,
      expiresAt,
      ipAddress,
      userAgent,
    });

    await this.userService.updateLastLogin(user.id);
    const { passwordHash, ...userResult } = user;

    return {
      ...tokens,
      user: {
        ...userResult,
        hasPassword: !!passwordHash, // Add hasPassword field to indicate if user has a password
      },
    };
  }

  async generate2FAPartialToken(userId: string) {
    const payload = {
      sub: userId,
      isTwoFactorAuthenticated: false,
      is2FA: true, // A flag to identify this as a 2FA-required token
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('TWO_FACTOR_AUTH_JWT_SECRET'),
      expiresIn: this.configService.get<string>(
        'TWO_FACTOR_AUTH_JWT_EXPIRES_IN'
      ),
    });
    return { accessToken };
  }

  async logout(userId: string, rawRefreshToken: string): Promise<void> {
    const userTokens = await this.entityManager.find(RefreshToken, {
      where: { userId },
    });

    console.log('User tokens:', userTokens);

    if (!userTokens || userTokens.length === 0) {
      return;
    }

    for (const token of userTokens) {
      console.log('Checking token:', token);
      const isMatch = await bcrypt.compare(rawRefreshToken, token.hashedToken);
      if (isMatch) {
        await this.entityManager.delete(RefreshToken, token.id);
        break;
      }
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.userService.removeAllRefreshTokensForUser(userId);
    await this.userService.invalidateAllTokens(userId);
  }

  /**
   * Refresh access tokens of user determined by userId, using a valid refresh token.
   * remove old refresh token and add a new one to the database.
   *
   * @param userId the unique identifier of the user
   * @param refreshToken the refresh token to verify
   * @returns Promise<{ accessToken: string, refreshToken: string }> new access and refresh tokens
   */
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userService.findOneById(userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Access Denied');
    }

    try {
      // Verify the refresh token using the injected UserService instance
      const isValidToken = await this.userService.verifyRefreshToken(
        refreshToken,
        userId
      );

      // If token is not valid (doesn't exist), it's a security risk.
      // Log out all sessions.
      if (!isValidToken) {
        await this.logoutAll(userId);
        throw new ForbiddenException('Access Denied');
      }
    } catch (error) {
      // If the error is due to an expired token, re-throw it so the user
      // gets a clear message to log in again.
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(
          'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.'
        );
      }
      // For any other unexpected errors, re-throw them.
      throw error;
    }

    // If we reach here, the token was valid. Proceed with rotation.
    const tokens = await this._generateTokens(userId, user.email);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Set the new refresh token (this will remove the old one)
    await this.userService.setCurrentRefreshToken({
      refreshToken: tokens.refreshToken,
      userId,
      expiresAt,
      expiredRefreshToken: refreshToken,
    });

    return tokens;
  }

  private async _generateTokens(userId: string, email: string) {
    const accessTokenPayload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      // Generate Access Token
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      }),
      // Generate Refresh Token (also JWT)
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  /**
   * Validates a user from an OAuth provider.
   * 1. Finds an existing identity.
   * 2. If not found, tries to link to an existing user by email.
   * 3. If no user found, creates a new user and identity.
   */
  async validateOAuthUser(profile: {
    provider: string;
    providerId: string;
    email: string;
    name: string;
    avatarUrl: string;
  }): Promise<User> {
    // Wrap all logic in a transaction to ensure data integrity
    return this.entityManager.transaction(async (entityManager) => {
      const existingIdentity = await entityManager.findOne(UserIdentity, {
        where: { provider: profile.provider, providerId: profile.providerId },
        relations: ['user'],
      });

      // 1. User already exists with this provider
      if (existingIdentity) {
        const user = existingIdentity.user;
        // Ensure email is marked as verified since OAuth provider has verified it
        if (!user.isEmailVerified) {
          user.isEmailVerified = true;
          await entityManager.save(user);
        }
        return user;
      }

      // 2. Link with an existing account with the same email
      let user = await entityManager.findOne(User, {
        where: { email: profile.email },
      });

      if (user) {
        // Update user information from Google profile if not already set
        // and mark email as verified since Google has already verified it
        let needsUpdate = false;

        // Update avatar if not set
        if (!user.avatarUrl && profile.avatarUrl) {
          user.avatarUrl = profile.avatarUrl;
          needsUpdate = true;
        }

        // Update full name if not set or is empty
        if ((!user.fullName || user.fullName.trim() === '') && profile.name) {
          user.fullName = profile.name;
          needsUpdate = true;
        }

        // Mark email as verified
        if (!user.isEmailVerified) {
          user.isEmailVerified = true;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await entityManager.save(user);
        }
      } else {
        // 3. Create a completely new user with verified email
        // since Google has already verified this email
        user = entityManager.create(User, {
          email: profile.email,
          fullName: profile.name,
          avatarUrl: profile.avatarUrl,
          isEmailVerified: true, // Email is already verified by Google
        });
        await entityManager.save(user);
      }

      // Create new identity for the user
      const newIdentity = entityManager.create(UserIdentity, {
        provider: profile.provider,
        providerId: profile.providerId,
        user: user, // Directly assign the User object
      });
      await entityManager.save(newIdentity);

      return user;
    });
  }

  async generateOneTimeCode(userId: string): Promise<string> {
    const code = crypto.randomBytes(32).toString('hex');
    const key = `one-time-code:${code}`;
    const fiveMinutesInMs = 5 * 60 * 1000;

    // Store key-value in Redis with an expiration time (TTL) of 5 minutes
    await this.cacheManager.set(key, userId, fiveMinutesInMs);
    console.log('Storing one-time code in Redis with key:', key);

    const userid = await this.cacheManager.get<string>(key);
    console.log('Retrieved userId from Redis for key:', key, 'userId:', userid);
    return code;
  }

  // [B] Modify exchangeCodeForTokens function
  async exchangeCodeForTokens(
    code: string,
    ip: string,
    userAgent: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Omit<User, 'passwordHash'>;
  }> {
    const key = `one-time-code:${code}`;

    // 1. Get userId from Redis by key
    const userId = await this.cacheManager.get<string>(key);

    // 2. Validate the code
    if (!userId) {
      throw new UnauthorizedException(
        `No user found with key ${key}, invalid or expired code.`
      );
    }
    console.log('One-time code valid for userId:', userId);
    // 3. Invalidate the code immediately by deleting it from Redis
    await this.cacheManager.del(key);

    // 4. Get user information and create tokens (this logic remains the same)
    const user = await this.userService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    return await this.loginAndReturnTokens(user, ip, userAgent);
  }

  /**
   * Handle forgot password request.
   * Sends a password reset email with a token.
   * @param email the email address of the user
   * @returns Promise<{ message: string; isOAuthUser?: boolean }> success message and OAuth status
   */
  async forgotPassword(
    email: string
  ): Promise<{ message: string; isOAuthUser?: boolean }> {
    this.logger.log(`🔵 [ForgotPassword] Request for email: ${email}`);

    const user = await this.userService.findOneByEmail(email);

    // To prevent email enumeration, we always return the same success message
    // regardless of whether the user exists or not
    if (!user) {
      this.logger.log(`ℹ️ [ForgotPassword] User not found for email: ${email}`);
      return {
        message:
          'Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
      };
    }

    // Check if user has a password (OAuth users might not have one)
    if (!user.passwordHash) {
      this.logger.log(
        `⚠️ [ForgotPassword] User ${user.id} has no password (OAuth account)`
      );
      return {
        message:
          'Tài khoản này được đăng nhập bằng Google. Vui lòng sử dụng nút "Đăng nhập bằng Google" để truy cập.',
        isOAuthUser: true,
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenKey = `reset-password-token:${resetToken}`;
    await this.cacheManager.set(tokenKey, user.id, 900000); // 15 minutes

    this.logger.log(
      `✅ [ForgotPassword] Reset token stored in Redis for user: ${user.id}`
    );

    // Send reset email
    await this.mailService.sendPasswordResetEmail(user, resetToken);

    this.logger.log(`✅ [ForgotPassword] Reset email sent to: ${user.email}`);

    return {
      message:
        'Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
    };
  }

  /**
   * Reset password using a valid reset token.
   * @param token the reset token from email
   * @param newPassword the new password
   * @returns Promise<{ message: string }> success message
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    this.logger.log(`🔵 [ResetPassword] Attempting to reset password`);

    const tokenKey = `reset-password-token:${token}`;
    const userId = await this.cacheManager.get<string>(tokenKey);

    if (!userId) {
      this.logger.error(`❌ [ResetPassword] Token not found or expired`);
      throw new BadRequestException(
        'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'
      );
    }

    this.logger.log(`✅ [ResetPassword] Found userId from token: ${userId}`);

    return await this.entityManager.transaction(async (entityManager) => {
      const user = await this.userService.findOneById(userId);
      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại.');
      }

      // Hash new password
      const newHashedPassword = await bcrypt.hash(newPassword, 12);
      user.passwordHash = newHashedPassword;
      await entityManager.save(user);

      this.logger.log(
        `✅ [ResetPassword] Password updated for user: ${userId}`
      );

      // Delete the reset token (one-time use)
      await this.cacheManager.del(tokenKey);

      this.logger.log(`✅ [ResetPassword] Reset token deleted`);

      // Logout all sessions for security
      await this.logoutAll(userId);

      this.logger.log(
        `✅ [ResetPassword] All sessions logged out for user: ${userId}`
      );

      return {
        message:
          'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập với mật khẩu mới.',
      };
    });
  }

  /**
   * Link a Google account to an existing user account.
   * This is used when a logged-in user wants to connect their Google account.
   * @param userId the ID of the currently logged-in user
   * @param profile the Google OAuth profile
   * @returns Promise<{ message: string; user: User }> success message and updated user info
   */
  async linkGoogleAccount(
    userId: string,
    profile: {
      provider: string;
      providerId: string;
      email: string;
      name: string;
      avatarUrl: string;
    }
  ): Promise<{
    message: string;
    user: Omit<User, 'passwordHash'> & { hasPassword: boolean };
  }> {
    this.logger.log(
      `🔵 [LinkGoogleAccount] User ${userId} is linking Google account: ${profile.email}`
    );

    return this.entityManager.transaction(async (entityManager) => {
      // 1. Get the current user
      const user = await this.userService.findOneById(userId);
      if (!user) {
        throw new UnauthorizedException('Người dùng không tồn tại.');
      }

      // 2. Check if this Google account is already linked to another user
      const existingIdentity = await entityManager.findOne(UserIdentity, {
        where: { provider: profile.provider, providerId: profile.providerId },
        relations: ['user'],
      });

      if (existingIdentity) {
        if (existingIdentity.user.id === userId) {
          // Already linked to this user
          throw new ConflictException(
            'Tài khoản Google này đã được liên kết với tài khoản của bạn.'
          );
        } else {
          // Linked to a different user
          throw new ConflictException(
            'Tài khoản Google này đã được liên kết với một tài khoản khác.'
          );
        }
      }

      // 3. Check if the email matches (optional security check)
      if (user.email !== profile.email) {
        this.logger.warn(
          `⚠️ [LinkGoogleAccount] Email mismatch: user email ${user.email} vs Google email ${profile.email}`
        );
        throw new BadRequestException(
          'Email của tài khoản Google không khớp với email tài khoản hiện tại.'
        );
      }

      // 4. Create new identity for the user
      const newIdentity = entityManager.create(UserIdentity, {
        provider: profile.provider,
        providerId: profile.providerId,
        user: user,
      });
      await entityManager.save(newIdentity);

      this.logger.log(
        `✅ [LinkGoogleAccount] Successfully linked Google account for user ${userId}`
      );

      // 5. Update user information from Google profile if not already set
      let needsUpdate = false;

      // Update avatar if not set
      if (!user.avatarUrl && profile.avatarUrl) {
        user.avatarUrl = profile.avatarUrl;
        needsUpdate = true;
      }

      // Update full name if not set or is empty
      if ((!user.fullName || user.fullName.trim() === '') && profile.name) {
        user.fullName = profile.name;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await entityManager.save(user);
      }

      // 6. Mark email as verified since Google has verified it
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        await entityManager.save(user);
      }

      const { passwordHash, ...userResult } = user;

      return {
        message: 'Liên kết tài khoản Google thành công.',
        user: {
          ...userResult,
          hasPassword: !!passwordHash,
        },
      };
    });
  }

  /**
   * Unlink a Google account from a user.
   * @param userId the ID of the user
   * @param provider the OAuth provider (e.g., 'google')
   * @returns Promise<{ message: string }> success message
   */
  async unlinkOAuthAccount(
    userId: string,
    provider: string
  ): Promise<{ message: string }> {
    this.logger.log(
      `🔵 [UnlinkOAuthAccount] User ${userId} is unlinking ${provider} account`
    );

    return this.entityManager.transaction(async (entityManager) => {
      const user = await this.userService.findOneById(userId);
      if (!user) {
        throw new UnauthorizedException('Người dùng không tồn tại.');
      }

      // Check if user has a password, if not, they can't unlink their only auth method
      if (!user.passwordHash) {
        throw new BadRequestException(
          'Bạn cần đặt mật khẩu trước khi hủy liên kết tài khoản Google. Điều này đảm bảo bạn vẫn có thể đăng nhập vào tài khoản.'
        );
      }

      const identity = await entityManager.findOne(UserIdentity, {
        where: { userId, provider },
      });

      if (!identity) {
        throw new NotFoundException(
          `Không tìm thấy tài khoản ${provider} được liên kết.`
        );
      }

      await entityManager.remove(identity);

      this.logger.log(
        `✅ [UnlinkOAuthAccount] Successfully unlinked ${provider} account for user ${userId}`
      );

      return {
        message: `Đã hủy liên kết tài khoản ${provider} thành công.`,
      };
    });
  }

  /**
   * Get linked OAuth accounts for a user.
   * @param userId the ID of the user
   * @returns Promise<UserIdentity[]> list of linked OAuth accounts
   */
  async getLinkedAccounts(userId: string): Promise<UserIdentity[]> {
    return this.entityManager.find(UserIdentity, {
      where: { userId },
    });
  }

  /**
   * Proxy method to verify email change
   * @param token Verification token
   * @returns Result from UserService
   */
  async verifyEmailChange(
    token: string
  ): Promise<{ message: string; newEmail: string }> {
    return this.userService.verifyEmailChange(token);
  }
}
