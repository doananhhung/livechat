
import {
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import { User, UserIdentity } from '../../database/entities';
import { UserService } from '../../user/user.service';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly entityManager: EntityManager,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly userService: UserService,
  ) {}

  async validateOAuthUser(profile: {
    provider: string;
    providerId: string;
    email: string;
    name: string;
    avatarUrl: string;
  }): Promise<User> {
    return this.entityManager.transaction(async (entityManager) => {
      const existingIdentity = await entityManager.findOne(UserIdentity, {
        where: { provider: profile.provider, providerId: profile.providerId },
        relations: ['user'],
      });

      if (existingIdentity) {
        const user = existingIdentity.user;
        if (!user.isEmailVerified) {
          user.isEmailVerified = true;
          await entityManager.save(user);
        }
        return user;
      }

      let user = await entityManager.findOne(User, {
        where: { email: profile.email },
      });

      if (user) {
        let needsUpdate = false;
        if (!user.avatarUrl && profile.avatarUrl) {
          user.avatarUrl = profile.avatarUrl;
          needsUpdate = true;
        }
        if ((!user.fullName || user.fullName.trim() === '') && profile.name) {
          user.fullName = profile.name;
          needsUpdate = true;
        }
        if (!user.isEmailVerified) {
          user.isEmailVerified = true;
          needsUpdate = true;
        }
        if (needsUpdate) {
          await entityManager.save(user);
        }
      } else {
        user = entityManager.create(User, {
          email: profile.email,
          fullName: profile.name,
          avatarUrl: profile.avatarUrl,
          isEmailVerified: true,
        });
        await entityManager.save(user);
      }

      const newIdentity = entityManager.create(UserIdentity, {
        provider: profile.provider,
        providerId: profile.providerId,
        user: user,
      });
      await entityManager.save(newIdentity);

      return user;
    });
  }

  async generateOneTimeCode(userId: string): Promise<string> {
    const code = crypto.randomBytes(32).toString('hex');
    const key = `one-time-code:${code}`;
    const fiveMinutesInMs = 5 * 60 * 1000;
    await this.cacheManager.set(key, userId, fiveMinutesInMs);
    return code;
  }

  async validateOneTimeCode(code: string): Promise<string> {
    const key = `one-time-code:${code}`;
    const userId = await this.cacheManager.get<string>(key);

    if (!userId) {
      throw new UnauthorizedException(`No user found with key ${key}, invalid or expired code.`);
    }

    await this.cacheManager.del(key);
    return userId;
  }

  async linkGoogleAccount(
    userId: string,
    profile: {
      provider: string;
      providerId: string;
      email: string;
      name: string;
      avatarUrl: string;
    },
  ): Promise<{ message: string; user: User }> {
    this.logger.log(`🔵 [LinkGoogleAccount] User ${userId} is linking Google account: ${profile.email}`);

    return this.entityManager.transaction(async (entityManager) => {
      const user = await this.userService.findOneById(userId);
      if (!user) {
        throw new UnauthorizedException('Người dùng không tồn tại.');
      }

      const existingIdentity = await entityManager.findOne(UserIdentity, {
        where: { provider: profile.provider, providerId: profile.providerId },
        relations: ['user'],
      });

      if (existingIdentity) {
        if (existingIdentity.user.id === userId) {
          throw new ConflictException('Tài khoản Google này đã được liên kết với tài khoản của bạn.');
        } else {
          throw new ConflictException('Tài khoản Google này đã được liên kết với một tài khoản khác.');
        }
      }

      if (user.email !== profile.email) {
        this.logger.warn(`⚠️ [LinkGoogleAccount] Email mismatch: user email ${user.email} vs Google email ${profile.email}`);
        throw new BadRequestException('Email của tài khoản Google không khớp với email tài khoản hiện tại.');
      }

      const newIdentity = entityManager.create(UserIdentity, {
        provider: profile.provider,
        providerId: profile.providerId,
        user: user,
      });
      await entityManager.save(newIdentity);

      let needsUpdate = false;
      if (!user.avatarUrl && profile.avatarUrl) {
        user.avatarUrl = profile.avatarUrl;
        needsUpdate = true;
      }
      if ((!user.fullName || user.fullName.trim() === '') && profile.name) {
        user.fullName = profile.name;
        needsUpdate = true;
      }
      if (needsUpdate) {
        await entityManager.save(user);
      }

      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        await entityManager.save(user);
      }

      return {
        message: 'Liên kết tài khoản Google thành công.',
        user,
      };
    });
  }

  async unlinkOAuthAccount(userId: string, provider: string): Promise<{ message: string }> {
    return this.entityManager.transaction(async (entityManager) => {
      const user = await this.userService.findOneById(userId);
      if (!user) {
        throw new UnauthorizedException('Người dùng không tồn tại.');
      }

      if (!user.passwordHash) {
        throw new BadRequestException(
          'Bạn cần đặt mật khẩu trước khi hủy liên kết tài khoản Google. Điều này đảm bảo bạn vẫn có thể đăng nhập vào tài khoản.',
        );
      }

      const identity = await entityManager.findOne(UserIdentity, {
        where: { userId, provider },
      });

      if (!identity) {
        throw new NotFoundException(`Không tìm thấy tài khoản ${provider} được liên kết.`);
      }

      await entityManager.remove(identity);
      return { message: `Đã hủy liên kết tài khoản ${provider} thành công.` };
    });
  }

  async getLinkedAccounts(userId: string): Promise<UserIdentity[]> {
    return this.entityManager.find(UserIdentity, {
      where: { userId },
    });
  }
}
