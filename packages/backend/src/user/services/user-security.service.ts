
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { User, TwoFactorRecoveryCode } from '../../database/entities';
import { EncryptionService } from '../../common/services/encryption.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UserSecurityService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly encryptionService: EncryptionService,
  ) {}

  async turnOnTwoFactorAuthentication(
    userId: string,
    secret: string
  ): Promise<{ user: User; recoveryCodes: string[] }> {
    return this.entityManager.transaction(async (manager) => {
      const encryptedSecret = this.encryptionService.encrypt(secret);

      await manager.update(User, userId, {
        isTwoFactorAuthenticationEnabled: true,
        twoFactorAuthenticationSecret: encryptedSecret,
      });

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

      await manager.delete(TwoFactorRecoveryCode, { userId });
      await manager.save(TwoFactorRecoveryCode, hashedCodes);

      const updatedUser = await manager.findOneBy(User, { id: userId });
      if (!updatedUser) {
        throw new Error(`User with ID ${userId} not found`);
      }

      return { user: updatedUser, recoveryCodes: plaintextRecoveryCodes };
    });
  }

  async turnOffTwoFactorAuthentication(userId: string): Promise<User> {
    return this.entityManager.transaction(async (manager) => {
      await manager.update(User, userId, {
        isTwoFactorAuthenticationEnabled: false,
        twoFactorAuthenticationSecret: null,
      });

      await manager.delete(TwoFactorRecoveryCode, { userId });

      const user = await manager.findOneBy(User, { id: userId });
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      return user;
    });
  }
}
