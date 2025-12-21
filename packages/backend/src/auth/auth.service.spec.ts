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

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let cacheManager: jest.Mocked<Cache>;
  let mailService: jest.Mocked<MailService>;
  let entityManager: jest.Mocked<EntityManager>;

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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    cacheManager = module.get(CACHE_MANAGER);
    mailService = module.get(MailService);
    entityManager = module.get(EntityManager);
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

    it('should throw NotFoundException and log error for invalid token', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      cacheManager.get.mockResolvedValue(null);

      await expect(service.verifyEmail('token')).rejects.toThrow(
        NotFoundException
      );
      expect(errorSpy).toHaveBeenCalledWith(
        '❌ [VerifyEmail] Token not found or expired: token'
      );
    });
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      const user = { passwordHash: 'hashed', status: UserStatus.ACTIVE } as User;
      userService.findOneByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('email', 'password');

      expect(result).toEqual(user);
    });

    it('should throw ForbiddenException for suspended user', async () => {
      const user = {
        passwordHash: 'hashed',
        status: UserStatus.SUSPENDED,
      } as User;
      userService.findOneByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.validateUser('email', 'password')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  // ... other tests
});
