import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RefreshToken, User } from '@social-commerce/shared';
import { EncryptionService } from '../common/services/encryption.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, RefreshToken])],
  providers: [UserService, EncryptionService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
