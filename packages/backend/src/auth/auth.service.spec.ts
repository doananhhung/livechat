import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, RefreshToken } from '../database/entities';
import { UserStatus } from '@live-chat/shared-types';
import { EntityManager } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';
import { OAuthService } from './services/oauth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let cacheManager: jest.Mocked<Cache>;
  let mailService: jest.Mocked<MailService>;
  let entityManager: jest.Mocked<EntityManager>;
  let tokenService: jest.Mocked<TokenService>;
  let passwordService: jest.Mocked<PasswordService>;
  let oauthService: jest.Mocked<OAuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findOneByEmail: jest.fn(),
            markEmailAsVerified: jest.fn(),
            activate: jest.fn(),
            findOneById: jest.fn(),
            setCurrentRefreshToken: jest.fn(),
            updateLastLogin: jest.fn(),
            removeAllRefreshTokensForUser: jest.fn(),
            invalidateAllTokens: jest.fn(),
            verifyRefreshToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: EntityManager,
          useValue: {
            transaction: jest.fn().mockImplementation((cb) => cb(entityManager)),
            save: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
        },
        {
          provide: MailService,
          useValue: { sendUserConfirmation: jest.fn() },
        },
        {
          provide: TokenService,
          useValue: {
            generateTokens: jest.fn(),
            generate2FAPartialToken: jest.fn(),
            setCurrentRefreshToken: jest.fn(),
            revokeRefreshToken: jest.fn(),
            removeAllRefreshTokensForUser: jest.fn(),
            invalidateAllTokens: jest.fn(),
            refreshUserTokens: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            validateUser: jest.fn(),
            changePassword: jest.fn(),
            setPassword: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
        {
          provide: OAuthService,
          useValue: {
            validateOneTimeCode: jest.fn(),
            generateOneTimeCode: jest.fn(),
            linkOAuthAccount: jest.fn(),
            unlinkOAuthAccount: jest.fn(),
            getLinkedAccounts: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    cacheManager = module.get(CACHE_MANAGER);
    mailService = module.get(MailService);
    entityManager = module.get(EntityManager);
    tokenService = module.get(TokenService);
    passwordService = module.get(PasswordService);
    oauthService = module.get(OAuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password',
        fullName: 'Test User',
      };
      userService.findOneByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      entityManager.save.mockResolvedValue(new User());

      const result = await service.register(registerDto);

      expect(result.message).toContain('Đăng ký thành công');
      expect(mailService.sendUserConfirmation).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password',
        fullName: 'Test User',
      };
      userService.findOneByEmail.mockResolvedValue(new User());

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      cacheManager.get.mockResolvedValue('userId');

      const result = await service.verifyEmail('token');

      expect(userService.markEmailAsVerified).toHaveBeenCalledWith('userId');
      expect(cacheManager.del).toHaveBeenCalledWith('verification-token:token');
      expect(result.message).toContain('Xác thực email thành công');
    });

    it('should throw NotFoundException for invalid token', async () => {
      cacheManager.get.mockResolvedValue(null);

      await expect(service.verifyEmail('token')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      const user = { passwordHash: 'hashed', status: UserStatus.ACTIVE } as User;
      passwordService.validateUser.mockResolvedValue(user);

      const result = await service.validateUser('email', 'password');

      expect(passwordService.validateUser).toHaveBeenCalledWith('email', 'password');
      expect(result).toEqual(user);
    });

    it('should throw ForbiddenException for suspended user', async () => {
      passwordService.validateUser.mockRejectedValue(new ForbiddenException('User is suspended'));

      await expect(service.validateUser('email', 'password')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  // ... other tests
});
