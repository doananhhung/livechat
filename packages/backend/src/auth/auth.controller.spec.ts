import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import {
  ChangePasswordDto,
  ExchangeCodeDto,
  RegisterDto,
  ResendVerificationDto,
} from '@live-chat/shared-dtos';
import { User } from '../database/entities';
import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            verifyEmail: jest.fn(),
            resendVerificationEmail: jest.fn(),
            login: jest.fn(),
            loginAfter2FA: jest.fn(),
            generate2FAPartialToken: jest.fn(),
            refreshTokens: jest.fn(),
            changePassword: jest.fn(),
            logout: jest.fn(),
            logoutAll: jest.fn(),
            generateOneTimeCode: jest.fn(),
            exchangeCodeForTokens: jest.fn(),
            findUserById: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_REFRESH_EXPIRES_IN') {
                return '30d';
              }
              if (key === 'FRONTEND_2FA_URL') {
                return 'http://localhost:3000/2fa';
              }
              if (key === 'FRONTEND_AUTH_CALLBACK_URL') {
                return 'http://localhost:3000/auth/callback';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password',
        fullName: 'Test User',
      };
      const expectedResponse = { message: 'User registered successfully' };
      authService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('verifyEmail', () => {
    it('should verify an email', async () => {
      const token = 'verification-token';
      await controller.verifyEmail(token);
      expect(authService.verifyEmail).toHaveBeenCalledWith(token);
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend the verification email', async () => {
      const resendDto: ResendVerificationDto = { email: 'test@example.com' };
      await controller.resendVerificationEmail(resendDto);
      expect(authService.resendVerificationEmail).toHaveBeenCalledWith(
        resendDto
      );
    });
  });

  describe('login', () => {
    const user = {
      id: '1',
      isTwoFactorAuthenticationEnabled: false,
    } as User;
    const req = {
      user,
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest' },
    };
    const res = {
      cookie: jest.fn(),
      json: jest.fn(),
    } as unknown as Response;

    it('should login a user without 2FA', async () => {
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      const loginResult = {
        status: 'success' as const,
        tokens,
        user: { ...user, passwordHash: 'hashed' },
      };
      authService.login.mockResolvedValue(loginResult);

      const result = await controller.login(req, res, { email: 'e', password: 'p' });

      expect(authService.login).toHaveBeenCalledWith(
        req.user,
        req.ip,
        req.headers['user-agent']
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        tokens.refreshToken,
        expect.any(Object)
      );
      expect(result).toEqual({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: expect.objectContaining({ hasPassword: true }),
      });
    });

    it('should handle 2FA login', async () => {
      const twoFaReq = {
        ...req,
        user: { ...req.user, isTwoFactorAuthenticationEnabled: true },
      };
      const loginResult = {
        status: '2fa_required' as const,
        partialToken: 'partial-token',
      };
      authService.login.mockResolvedValue(loginResult);

      await expect(controller.login(twoFaReq, res, { email: 'e', password: 'p' })).rejects.toThrow(
        new UnauthorizedException({
          message: '2FA required',
          errorCode: '2FA_REQUIRED',
        })
      );

      expect(authService.login).toHaveBeenCalledWith(
        twoFaReq.user,
        twoFaReq.ip,
        twoFaReq.headers['user-agent']
      );
      expect(res.cookie).toHaveBeenCalledWith(
        '2fa_partial_token',
        loginResult.partialToken,
        expect.any(Object)
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens', async () => {
      const req = { user: { sub: '1', refreshToken: 'old-refresh-token' } };
      const res = { cookie: jest.fn() } as unknown as Response;
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      authService.refreshTokens.mockResolvedValue(tokens);

      const result = await controller.refreshTokens(req, res);

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        req.user.sub,
        req.user.refreshToken
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        tokens.refreshToken,
        expect.any(Object)
      );
      expect(result).toEqual({ accessToken: tokens.accessToken });
    });
  });

  describe('changePassword', () => {
    it('should change user password and return new tokens', async () => {
      const user = { id: '1' } as User;
      const req = {
        user,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };
      const body: ChangePasswordDto = {
        currentPassword: 'old-pw',
        newPassword: 'new-pw',
      };
      const res = { cookie: jest.fn() } as unknown as Response;
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      const loginResult = {
        status: 'success' as const,
        tokens,
        user: { ...user, passwordHash: 'hashed' },
      };
      authService.findUserById.mockResolvedValue(user);
      authService.login.mockResolvedValue(loginResult);

      const result = await controller.changePassword(req, body, res);

      expect(authService.changePassword).toHaveBeenCalledWith(
        req.user.id,
        body.currentPassword,
        body.newPassword
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        tokens.refreshToken,
        expect.any(Object)
      );
      expect(result.accessToken).toBe(tokens.accessToken);
    });
  });

  describe('logout', () => {
    it('should logout a user', async () => {
      const req = {
        user: { sub: '1' },
        cookies: { refresh_token: 'some-token' },
      };
      const res = { clearCookie: jest.fn() } as unknown as Response;

      const result = await controller.logout(req, res);

      expect(authService.logout).toHaveBeenCalledWith('1', 'some-token');
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(res.clearCookie).toHaveBeenCalledWith('2fa_secret');
      expect(res.clearCookie).toHaveBeenCalledWith('2fa_partial_token');
      expect(result.message).toBe('Đăng xuất thành công.');
    });
  });

  describe('logoutAll', () => {
    it('should logout from all devices', async () => {
      const req = { user: { sub: '1' } };
      const res = { clearCookie: jest.fn() } as unknown as Response;

      const result = await controller.logoutAll(req, res);

      expect(authService.logoutAll).toHaveBeenCalledWith('1');
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(res.clearCookie).toHaveBeenCalledWith('2fa_secret');
      expect(res.clearCookie).toHaveBeenCalledWith('2fa_partial_token');
      expect(result.message).toBe('Đã đăng xuất khỏi tất cả các thiết bị.');
    });
  });

  describe('googleAuth', () => {
    it('should return OK', async () => {
      expect(await controller.googleAuth()).toBe(HttpStatus.OK);
    });
  });

  describe('googleAuthRedirect', () => {
    const res = {
      cookie: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response;

    it('should redirect to 2FA page if enabled', async () => {
      const req = {
        user: { id: '1', isTwoFactorAuthenticationEnabled: true } as User,
      };
      const partialToken = { accessToken: 'partial-token' };
      authService.generate2FAPartialToken.mockResolvedValue(partialToken);

      await controller.googleAuthRedirect(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        '2fa_partial_token',
        partialToken.accessToken,
        expect.any(Object)
      );
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/2fa');
    });

    it('should redirect to callback with code if 2FA is disabled', async () => {
      const req = {
        user: { id: '1', isTwoFactorAuthenticationEnabled: false } as User,
      };
      const code = 'one-time-code';
      authService.generateOneTimeCode.mockResolvedValue(code);

      await controller.googleAuthRedirect(req, res);

      expect(authService.generateOneTimeCode).toHaveBeenCalledWith(
        req.user.id
      );
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback?code=one-time-code'
      );
    });
  });

  describe('exchangeCode', () => {
    it('should exchange a code for tokens', async () => {
      const exchangeCodeDto: ExchangeCodeDto = { code: 'some-code' };
      const req = { ip: '127.0.0.1', headers: { 'user-agent': 'jest' } };
      const res = { cookie: jest.fn() } as unknown as Response;
      const user = new User();
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { ...user, hasPassword: false },
      };
      authService.exchangeCodeForTokens.mockResolvedValue(tokens);

      const result = await controller.exchangeCode(exchangeCodeDto, res, req);

      expect(authService.exchangeCodeForTokens).toHaveBeenCalledWith(
        exchangeCodeDto.code,
        req.ip,
        req.headers['user-agent']
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        tokens.refreshToken,
        expect.any(Object)
      );
      expect(result).toEqual({ accessToken: tokens.accessToken, user: tokens.user });
    });
  });
});
