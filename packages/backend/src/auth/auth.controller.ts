
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
  Res,
  UnauthorizedException,
  Req,
  Query,
} from '@nestjs/common';
import {
  ChangePasswordDto,
  SetPasswordDto,
  ExchangeCodeDto,
  RegisterDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  LoginDto,
} from '@live-chat/shared-dtos';
import { User } from '../database/entities';
import { AuditAction } from '@live-chat/shared-types';
import { Auditable } from '../audit-logs/auditable.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { type Response } from 'express';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegistrationService } from './services/registration.service';
import { LoginService } from './services/login.service';
import { PasswordService } from './services/password.service';
import { OAuthService } from './services/oauth.service';
import { TokenService } from './services/token.service';
import { EmailChangeService } from '../users/services/email-change.service';
import { UserService } from '../users/user.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly refreshTokenExpiresIn: number;

  constructor(
    private readonly registrationService: RegistrationService,
    private readonly loginService: LoginService,
    private readonly passwordService: PasswordService,
    private readonly oauthService: OAuthService,
    private readonly tokenService: TokenService,
    private readonly emailChangeService: EmailChangeService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    const refreshTokenExpiresInString = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN'
    ) as string;
    this.refreshTokenExpiresIn = parseInt(
      refreshTokenExpiresInString.slice(0, -1),
      10
    );
  }

  @Auditable({ action: AuditAction.CREATE, entity: 'User' })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 409, description: 'Email already in use.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.registrationService.register(registerDto);
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email with token' })
  @ApiResponse({ status: 200, description: 'Email successfully verified.' })
  @ApiResponse({ status: 404, description: 'Invalid or expired token.' })
  async verifyEmail(@Query('token') token: string) {
    return this.registrationService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiResponse({ status: 200, description: 'Verification email sent.' })
  @ApiResponse({ status: 409, description: 'Email already verified.' })
  async resendVerificationEmail(
    @Body() resendVerificationDto: ResendVerificationDto
  ) {
    return this.registrationService.resendVerificationEmail(resendVerificationDto);
  }

  @Auditable({ action: AuditAction.LOGIN, entity: 'User' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (wrong credentials or 2FA required).' })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., suspended account).' })
  async login(
    @Request()
    req: { user: User; ip: string; headers: { 'user-agent': string } },
    @Res({ passthrough: true }) response: Response,
    @Body() loginDto: LoginDto
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const user = req.user as User;

    const result = await this.loginService.login(user, ipAddress, userAgent);

    if (result.status === '2fa_required') {
      response.cookie('2fa_partial_token', result.partialToken, {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') === 'production',
        sameSite:
          this.configService.get('NODE_ENV') === 'production' ? 'none' : 'lax',
        expires: new Date(Date.now() + 5 * 60 * 1000),
      });

      throw new UnauthorizedException({
        message: '2FA required',
        errorCode: '2FA_REQUIRED',
      });
    }

    const { tokens, user: userResult } = result;
    const { passwordHash, ...safeUser } = userResult;

    response.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(
        Date.now() + this.refreshTokenExpiresIn * 24 * 60 * 60 * 1000
      ),
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        ...safeUser,
        hasPassword: !!passwordHash,
      },
    };
  }

  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Access token successfully refreshed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid or expired refresh token).' })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., user not active, token revoked).' })
  async refreshTokens(
    @Request() req,
    @Res({ passthrough: true }) response: Response
  ) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;
    const tokens = await this.tokenService.refreshUserTokens(userId, refreshToken);

    response.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(
        Date.now() + this.refreshTokenExpiresIn * 24 * 60 * 60 * 1000
      ),
    });

    return { accessToken: tokens.accessToken };
  }

  @Auditable({ action: AuditAction.UPDATE, entity: 'UserCredentials' })
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password successfully changed.' })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., current password missing).' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid access token).' })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., incorrect current password).' })
  async changePassword(
    @Request() req,
    @Body() body: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.passwordService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword
    );
    
    // Re-login to get new tokens after password change (which invalidates old ones)
    const user = await this.userService.findOneById(req.user.id);
    const result = await this.loginService.login(
      user,
      req.ip,
      req.headers['user-agent'] || ''
    );

    if (result.status === '2fa_required') {
       // This edge case is rare for password change flow, but handled for type safety
       throw new UnauthorizedException('2FA required');
    }

    response.cookie('refresh_token', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(
        Date.now() + this.refreshTokenExpiresIn * 24 * 60 * 60 * 1000
      ),
    });

    const message = body.currentPassword
      ? 'Mật khẩu đã được thay đổi thành công.'
      : 'Mật khẩu đã được đặt thành công.';

    return {
      message,
      accessToken: result.tokens.accessToken,
    };
  }

  @Auditable({ action: AuditAction.UPDATE, entity: 'UserCredentials' })
  @UseGuards(JwtAuthGuard)
  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set password for a user (e.g., OAuth users)' })
  @ApiResponse({ status: 200, description: 'Password successfully set.' })
  @ApiResponse({ status: 400, description: 'Bad Request (user already has a password).' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid access token).' })
  async setPassword(
    @Request() req,
    @Body() body: SetPasswordDto,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.passwordService.setPassword(req.user.id, body.newPassword);
    
    const user = await this.userService.findOneById(req.user.id);
    const result = await this.loginService.login(
      user,
      req.ip,
      req.headers['user-agent'] || ''
    );

    if (result.status === '2fa_required') {
       throw new UnauthorizedException('2FA required');
    }

    response.cookie('refresh_token', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(
        Date.now() + this.refreshTokenExpiresIn * 24 * 60 * 60 * 1000
      ),
    });
    return {
      message: 'Mật khẩu đã được đặt thành công.',
      accessToken: result.tokens.accessToken,
    };
  }

  @Auditable({ action: AuditAction.LOGOUT, entity: 'User' })
  @UseGuards(RefreshTokenGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out the current user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid refresh token).' })
  async logout(@Request() req, @Res({ passthrough: true }) response: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (refreshToken) {
      await this.tokenService.revokeRefreshToken(req.user.sub, refreshToken);
    }
    response.clearCookie('refresh_token');
    response.clearCookie('2fa_secret');
    response.clearCookie('2fa_partial_token');
    return { message: 'Đăng xuất thành công.' };
  }

  @Auditable({ action: AuditAction.LOGOUT, entity: 'User' })
  @UseGuards(RefreshTokenGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out user from all devices' })
  @ApiResponse({ status: 200, description: 'User successfully logged out from all devices.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid refresh token).' })
  async logoutAll(
    @Request() req,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.tokenService.removeAllRefreshTokensForUser(req.user.sub);
    await this.tokenService.invalidateAllTokens(req.user.sub);
    response.clearCookie('refresh_token');
    response.clearCookie('2fa_secret');
    response.clearCookie('2fa_partial_token');
    return { message: 'Đã đăng xuất khỏi tất cả các thiết bị.' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google for authentication.' })
  async googleAuth() {
    return HttpStatus.OK;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend after Google authentication.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (Google authentication failed).' })
  async googleAuthRedirect(@Request() req, @Res() res: Response) {
    const user = req.user as User;
    if (!user) {
      throw new UnauthorizedException('Could not authenticate with Google.');
    }

    if (user.isTwoFactorAuthenticationEnabled) {
      const { accessToken } = await this.tokenService.generate2FAPartialToken(
        user.id
      );
      res.cookie('2fa_partial_token', accessToken, {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') === 'production',
        sameSite:
          this.configService.get('NODE_ENV') === 'production' ? 'none' : 'lax',
        expires: new Date(Date.now() + 5 * 60 * 1000),
      });
      const twoFactorUrl = this.configService.get<string>('FRONTEND_2FA_URL');
      if (!twoFactorUrl) {
        throw new Error('Missing FRONTEND_2FA_URL environment variable.');
      }
      return res.redirect(twoFactorUrl);
    } else {
      const code = await this.oauthService.generateOneTimeCode(user.id);
      const frontendCallbackUrl = this.configService.get<string>(
        'FRONTEND_AUTH_CALLBACK_URL'
      );
      if (!frontendCallbackUrl) {
        throw new Error(
          'Missing FRONTEND_AUTH_CALLBACK_URL environment variable.'
        );
      }
      const redirectUrl = `${frontendCallbackUrl}?code=${code}`;
      return res.redirect(redirectUrl);
    }
  }

  @Post('exchange-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange one-time code for tokens' })
  @ApiResponse({ status: 200, description: 'Code successfully exchanged for tokens.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid or expired code).' })
  async exchangeCode(
    @Body() exchangeCodeDto: ExchangeCodeDto,
    @Res({ passthrough: true }) response: Response,
    @Request() req: { ip: string; headers: { 'user-agent': string } }
  ) {
    const result = await this.loginService.exchangeCodeForTokens(
        exchangeCodeDto.code,
        req.ip,
        req.headers['user-agent']
      );

    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(
        Date.now() + this.refreshTokenExpiresIn * 24 * 60 * 60 * 1000
      ),
    });

    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate forgot password process' })
  @ApiResponse({ status: 200, description: 'Password reset email sent (if user exists).' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.passwordService.forgotPassword(forgotPasswordDto.email);
  }

  @Auditable({ action: AuditAction.UPDATE, entity: 'UserCredentials' })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password with token' })
  @ApiResponse({ status: 200, description: 'Password successfully reset.' })
  @ApiResponse({ status: 400, description: 'Bad Request (invalid or expired token).' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.passwordService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('link-google')
  @ApiOperation({ summary: 'Initiate Google account linking' })
  @ApiResponse({ status: 200, description: 'Redirect URL for Google OAuth provided.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid access token).' })
  async linkGoogleInit(@Req() req) {
    const stateToken = await this.oauthService.generateOneTimeCode(req.user.id);
    const apiBaseUrl = this.configService.get('API_BASE_URL');
    const googleAuthUrl = `${apiBaseUrl}/auth/link-google/redirect?state=${stateToken}`;
    return { redirectUrl: googleAuthUrl };
  }

  @Get('link-google/redirect')
  @UseGuards(AuthGuard('google-link'))
  @ApiOperation({ summary: 'Google OAuth redirect for account linking' })
  @ApiResponse({ status: 302, description: 'Redirects to Google for authentication.' })
  async linkGoogleRedirect(@Req() req, @Query('state') state: string) {
    return HttpStatus.OK;
  }

  @Get('link-google/callback')
  @UseGuards(AuthGuard('google-link'))
  @ApiOperation({ summary: 'Google OAuth callback for account linking' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend after account linking.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid state token).' })
  @ApiResponse({ status: 400, description: 'Bad Request (email mismatch).' })
  @ApiResponse({ status: 409, description: 'Conflict (account already linked).' })
  async linkGoogleCallback(@Req() req, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    try {
      const googleProfile = req.user as any;
      const state = googleProfile.state;

      if (!state) {
        throw new UnauthorizedException('Missing state parameter.');
      }

      const key = `one-time-code:${state}`;
      const userId = await this.cacheManager.get<string>(key);

      if (!userId) {
        throw new UnauthorizedException('Invalid or expired state token.');
      }

      await this.cacheManager.del(key);

      await this.oauthService.linkGoogleAccount(userId, {
        provider: googleProfile.provider,
        providerId: googleProfile.providerId,
        email: googleProfile.email,
        name: googleProfile.name,
        avatarUrl: googleProfile.avatarUrl,
      });

      return res.redirect(`${frontendUrl}/settings/account?linkSuccess=true`);
    } catch (error) {
      const errorMessage = encodeURIComponent(
        error instanceof Error
          ? error.message
          : 'Có lỗi xảy ra khi liên kết tài khoản.'
      );
      return res.redirect(
        `${frontendUrl}/settings/account?linkError=${errorMessage}`
      );
    }
  }

  @Auditable({ action: AuditAction.DELETE, entity: 'OAuthLink' })
  @UseGuards(JwtAuthGuard)
  @Post('unlink-oauth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlink an OAuth account (e.g., Google)' })
  @ApiResponse({ status: 200, description: 'OAuth account successfully unlinked.' })
  @ApiResponse({ status: 400, description: 'Bad Request (cannot unlink last login method).' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid access token).' })
  @ApiResponse({ status: 404, description: 'Not Found (provider not linked).' })
  async unlinkOAuthAccount(@Req() req, @Body() body: { provider: string }) {
    return this.oauthService.unlinkOAuthAccount(req.user.id, body.provider);
  }

  @UseGuards(JwtAuthGuard)
  @Get('linked-accounts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get linked OAuth accounts' })
  @ApiResponse({ status: 200, description: 'List of linked OAuth accounts.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid access token).' })
  async getLinkedAccounts(@Req() req) {
    return this.oauthService.getLinkedAccounts(req.user.id);
  }

  @Get('verify-email-change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email change with token' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend after email change verification.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (token not provided).' })
  async verifyEmailChange(@Query('token') token: string, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    try {
      if (!token) {
        throw new UnauthorizedException('Token không được cung cấp.');
      }

      const result = await this.emailChangeService.verifyEmailChange(token);

      return res.redirect(
        `${frontendUrl}/login?emailChanged=true&newEmail=${encodeURIComponent(result.newEmail)}`
      );
    } catch (error) {
      const errorMessage = encodeURIComponent(
        error instanceof Error
          ? error.message
          : 'Có lỗi xảy ra khi xác nhận thay đổi email.'
      );
      return res.redirect(
        `${frontendUrl}/settings/security?emailChangeError=${errorMessage}`
      );
    }
  }
}
