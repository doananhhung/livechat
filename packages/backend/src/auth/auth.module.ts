
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthController } from './auth.controller';
import { UserModule } from '../users/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { RefreshToken, TwoFactorRecoveryCode } from '../database/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TwoFactorAuthenticationController } from './2fa/two-factor-authentication.controller';
import { TwoFactorAuthenticationService } from './2fa/two-factor-authentication.service';
import { EncryptionService } from '../common/services/encryption.service';
import { TwoFactorAuthenticationStrategy } from './strategies/2fa-partial-token.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleLinkStrategy } from './strategies/google-link.strategy';
import { MailModule } from '../mail/mail.module';
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';
import { OAuthService } from './services/oauth.service';
import { RegistrationService } from './services/registration.service';
import { LoginService } from './services/login.service';

@Module({
  imports: [
    CacheModule.register(),
    TypeOrmModule.forFeature([RefreshToken, TwoFactorRecoveryCode]),
    UserModule,
    PassportModule,
    ConfigModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController, TwoFactorAuthenticationController],
  providers: [
    RegistrationService,
    LoginService,
    TokenService,
    PasswordService,
    OAuthService,
    TwoFactorAuthenticationService,
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy,
    GoogleLinkStrategy,
    TwoFactorAuthenticationStrategy,
    RefreshTokenStrategy,
    EncryptionService,
    ConfigService,
  ],
  exports: [JwtModule, TokenService, RegistrationService, LoginService],
})
export class AuthModule {}
