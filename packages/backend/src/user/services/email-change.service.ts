
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
        'Bạn cần đặt mật khẩu trước khi có thể thay đổi email.'
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
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng.');
    }

    if (user.email === newEmail) {
      this.logger.warn(
        `[requestEmailChange] New email same as current for user: ${userId}`
      );
      throw new BadRequestException('Email mới phải khác với email hiện tại.');
    }

    const isEmailTaken = await this.userRepository.findOne({
      where: { email: newEmail },
    });
    if (isEmailTaken) {
      this.logger.warn(
        `[requestEmailChange] Email ${newEmail} is already taken`
      );
      throw new BadRequestException('Email này đã được sử dụng.');
    }

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
        'Không thể gửi email xác nhận. Vui lòng thử lại sau.'
      );
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
      throw new BadRequestException('Token không hợp lệ hoặc đã được sử dụng.');
    }

    if (new Date() > request.expiresAt) {
      this.logger.warn(
        `[verifyEmailChange] Token expired for user: ${request.userId}`
      );
      throw new BadRequestException(
        'Token đã hết hạn. Vui lòng yêu cầu thay đổi email mới.'
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
        'Email này đã được sử dụng bởi người khác.'
      );
    }

    await this.entityManager.transaction(async (entityManager) => {
      const user = await entityManager.findOne(User, {
        where: { id: request.userId },
        relations: ['identities'],
      });

      if (!user) {
        throw new BadRequestException('Người dùng không tồn tại.');
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
        'Email đã được thay đổi thành công. Vui lòng đăng nhập lại bằng email mới.',
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
        'Không tìm thấy yêu cầu thay đổi email đang chờ xử lý.'
      );
    }

    request.isCancelled = true;
    await this.emailChangeRequestRepository.save(request);

    const tokenKey = `email-change:${request.token}`;
    await this.cacheManager.del(tokenKey);

    return {
      message: 'Yêu cầu thay đổi email đã được hủy.',
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
