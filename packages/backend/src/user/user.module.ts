import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { EmailChangeRequest, RefreshToken, User } from '../database/entities';
import { EncryptionService } from '../common/services/encryption.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, EmailChangeRequest]),
    CacheModule.register(),
    MailModule,
  ],
  providers: [UserService, EncryptionService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
