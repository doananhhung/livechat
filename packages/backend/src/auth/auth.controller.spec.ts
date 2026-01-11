import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
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
import { RegistrationService } from './services/registration.service';
import { LoginService } from './services/login.service';
import { PasswordService } from './services/password.service';
import { OAuthService } from './services/oauth.service';
import { TokenService } from './services/token.service';
import { EmailChangeService } from '../users/services/email-change.service';
import { UserService } from '../users/user.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('AuthController', () => {
  let controller: AuthController;
  let registrationService: jest.Mocked<RegistrationService>;
  let loginService: jest.Mocked<LoginService>;
  let passwordService: jest.Mocked<PasswordService>;
  let oauthService: jest.Mocked<OAuthService>;
  let tokenService: jest.Mocked<TokenService>;
  let emailChangeService: jest.Mocked<EmailChangeService>;
  let userService: jest.Mocked<UserService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: RegistrationService,
          useValue: {
            register: jest.fn(),
            verifyEmail: jest.fn(),
            resendVerificationEmail: jest.fn(),
          },
        },
        {
          provide: LoginService,
          useValue: {
            login: jest.fn(),
            loginAfter2FA: jest.fn(),
            exchangeCodeForTokens: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            changePassword: jest.fn(),
            setPassword: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
        {
          provide: OAuthService,
          useValue: {
            generateOneTimeCode: jest.fn(),
            linkGoogleAccount: jest.fn(),
            unlinkOAuthAccount: jest.fn(),
            getLinkedAccounts: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generate2FAPartialToken: jest.fn(),
            refreshUserTokens: jest.fn(),
            revokeRefreshToken: jest.fn(),
            removeAllRefreshTokensForUser: jest.fn(),
            invalidateAllTokens: jest.fn(),
          },
        },
        {
          provide: EmailChangeService,
          useValue: {
            verifyEmailChange: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findOneById: jest.fn(),
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
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    registrationService = module.get(RegistrationService);
    loginService = module.get(LoginService);
    passwordService = module.get(PasswordService);
    oauthService = module.get(OAuthService);
    tokenService = module.get(TokenService);
    emailChangeService = module.get(EmailChangeService);
    userService = module.get(UserService);
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
      registrationService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto);

      expect(registrationService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('verifyEmail', () => {
    it('should verify an email', async () => {
      const token = 'verification-token';
      await controller.verifyEmail(token);
      expect(registrationService.verifyEmail).toHaveBeenCalledWith(token);
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend the verification email', async () => {
      const resendDto: ResendVerificationDto = { email: 'test@example.com' };
      await controller.resendVerificationEmail(resendDto);
      expect(registrationService.resendVerificationEmail).toHaveBeenCalledWith(
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
      loginService.login.mockResolvedValue(loginResult);

      const result = await controller.login(req, res, { email: 'e', password: 'p' });

      expect(loginService.login).toHaveBeenCalledWith(
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
      loginService.login.mockResolvedValue(loginResult);

      await expect(controller.login(twoFaReq, res, { email: 'e', password: 'p' })).rejects.toThrow(
        new UnauthorizedException({
          message: '2FA required',
          errorCode: '2FA_REQUIRED',
        })
      );

      expect(loginService.login).toHaveBeenCalledWith(
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
      tokenService.refreshUserTokens.mockResolvedValue(tokens);

      const result = await controller.refreshTokens(req, res);

      expect(tokenService.refreshUserTokens).toHaveBeenCalledWith(
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
      userService.findOneById.mockResolvedValue(user);
      loginService.login.mockResolvedValue(loginResult);

      const result = await controller.changePassword(req, body, res);

      expect(passwordService.changePassword).toHaveBeenCalledWith(
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

      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith('1', 'some-token');
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(res.clearCookie).toHaveBeenCalledWith('2fa_secret');
      expect(res.clearCookie).toHaveBeenCalledWith('2fa_partial_token');
      expect(result.message).toBe('Logout successful.');
    });
  });

  describe('logoutAll', () => {
    it('should logout from all devices', async () => {
      const req = { user: { sub: '1' } };
      const res = { clearCookie: jest.fn() } as unknown as Response;

      const result = await controller.logoutAll(req, res);

      expect(tokenService.removeAllRefreshTokensForUser).toHaveBeenCalledWith('1');
      expect(tokenService.invalidateAllTokens).toHaveBeenCalledWith('1');
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(res.clearCookie).toHaveBeenCalledWith('2fa_secret');
      expect(res.clearCookie).toHaveBeenCalledWith('2fa_partial_token');
      expect(result.message).toBe('Logged out from all devices.');
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
      tokenService.generate2FAPartialToken.mockResolvedValue(partialToken);

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
      oauthService.generateOneTimeCode.mockResolvedValue(code);

      await controller.googleAuthRedirect(req, res);

      expect(oauthService.generateOneTimeCode).toHaveBeenCalledWith(
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
      loginService.exchangeCodeForTokens.mockResolvedValue(tokens);

      const result = await controller.exchangeCode(exchangeCodeDto, res, req);

      expect(loginService.exchangeCodeForTokens).toHaveBeenCalledWith(
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
