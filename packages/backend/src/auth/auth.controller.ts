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
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  SetPasswordDto,
  ExchangeCodeDto,
  RegisterDto,
  ResendVerificationDto,
  User,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '@live-chat/shared';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { type Response } from 'express';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  private readonly refreshTokenExpiresIn: number;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {
    const refreshTokenExpiresInString = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN'
    ) as string;
    this.refreshTokenExpiresIn = parseInt(
      refreshTokenExpiresInString.slice(0, -1),
      10
    );
  }

  // @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 request per 60 seconds - DISABLED FOR TESTING
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 requests per 5 minutes - DISABLED FOR TESTING
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationEmail(
    @Body() resendVerificationDto: ResendVerificationDto
  ) {
    return this.authService.resendVerificationEmail(resendVerificationDto);
  }

  /**
   * Log in a user and set refresh token in HTTP-only cookie.
   * The access token is returned in the response body.
   * @param req the request object containing user information
   * @param response the response object to set cookies
   * @returns Promise<{ accessToken: string }> the access token
   * add refresh_token into cookies
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Request()
    req: { user: User; ip: string; headers: { 'user-agent': string } },
    @Res({ passthrough: true }) response: Response
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const user = req.user as User;

    if (!user.isTwoFactorAuthenticationEnabled) {
      const { refreshToken, ...responsePayload } =
        await this.authService.loginAndReturnTokens(user, ipAddress, userAgent);

      response.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: new Date(
          Date.now() + this.refreshTokenExpiresIn * 24 * 60 * 60 * 1000
        ),
      });
      response.json(responsePayload);
    } else {
      const { accessToken } = await this.authService.generate2FAPartialToken(
        user.id
      );
      console.log('Generated 2FA partial token:', accessToken);
      response.cookie('2fa_partial_token', accessToken, {
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
  }

  /**
   * Refresh access tokens using a valid refresh token.
   *
   * @param req the request object containing user information
   * @param response the response object to set cookies
   * @returns Promise<{ accessToken: string }> new access token
   * add refresh_token into cookies
   */
  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Request() req,
    @Res({ passthrough: true }) response: Response
  ) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;
    const tokens = await this.authService.refreshTokens(userId, refreshToken);

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

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body() body: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.authService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword
    );
    const tokens = await this.authService.loginAndReturnTokens(
      req.user,
      req.ip,
      req.headers['user-agent'] || ''
    );
    response.cookie('refresh_token', tokens.refreshToken, {
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
      accessToken: tokens.accessToken,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  async setPassword(
    @Request() req,
    @Body() body: SetPasswordDto,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.authService.setPassword(req.user.id, body.newPassword);
    const tokens = await this.authService.loginAndReturnTokens(
      req.user,
      req.ip,
      req.headers['user-agent'] || ''
    );
    response.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(
        Date.now() + this.refreshTokenExpiresIn * 24 * 60 * 60 * 1000
      ),
    });
    return {
      message: 'Mật khẩu đã được đặt thành công.',
      accessToken: tokens.accessToken,
    };
  }

  @UseGuards(RefreshTokenGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req, @Res({ passthrough: true }) response: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (refreshToken) {
      await this.authService.logout(req.user.sub, refreshToken);
    }
    response.clearCookie('refresh_token');
    response.clearCookie('2fa_secret');
    response.clearCookie('2fa_partial_token');
    return { message: 'Đăng xuất thành công.' };
  }

  @UseGuards(RefreshTokenGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @Request() req,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.authService.logoutAll(req.user.sub);
    response.clearCookie('refresh_token');
    response.clearCookie('2fa_secret');
    response.clearCookie('2fa_partial_token');
    return { message: 'Đã đăng xuất khỏi tất cả các thiết bị.' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    return HttpStatus.OK;
  }

  /**
   * Callback for Google login
   * @param req the request object containing user information
   * @param response the response object to set cookies or redirect
   * @returns Promise<void>
   * Handles both 2FA and non-2FA login flows
   * If 2FA is enabled, sets a short-lived 2fa_partial_token cookie and redirects to FRONTEND_2FA_URL
   * If 2FA is not enabled, generates a one-time code and redirects to FRONTEND_AUTH_CALLBACK_URL with the code as a query parameter
   */

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Request() req, @Res() res: Response) {
    const user = req.user as User;
    if (!user) {
      throw new UnauthorizedException('Could not authenticate with Google.');
    }

    if (user.isTwoFactorAuthenticationEnabled) {
      const { accessToken } = await this.authService.generate2FAPartialToken(
        user.id
      );
      res.cookie('2fa_partial_token', accessToken, {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') === 'production',
        sameSite:
          this.configService.get('NODE_ENV') === 'production' ? 'none' : 'lax',
        expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      });
      const twoFactorUrl = this.configService.get<string>('FRONTEND_2FA_URL');
      if (!twoFactorUrl) {
        throw new Error('Missing FRONTEND_2FA_URL environment variable.');
      }
      return res.redirect(twoFactorUrl);
    }
    // Logic for non-2FA
    else {
      const code = await this.authService.generateOneTimeCode(user.id);
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
  async exchangeCode(
    @Body() exchangeCodeDto: ExchangeCodeDto,
    @Res({ passthrough: true }) response: Response,
    @Request() req: { ip: string; headers: { 'user-agent': string } }
  ) {
    const { refreshToken, accessToken, user } =
      await this.authService.exchangeCodeForTokens(
        exchangeCodeDto.code,
        req.ip,
        req.headers['user-agent']
      );

    console.log('Exchanging code for tokens, user:', user);
    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(
        Date.now() + this.refreshTokenExpiresIn * 24 * 60 * 60 * 1000
      ),
    });

    return { accessToken, user };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword
    );
  }

  /**
   * Initiate Google account linking for an authenticated user
   * This endpoint requires the user to be authenticated
   */
  @UseGuards(JwtAuthGuard)
  @Get('link-google')
  async linkGoogleInit(@Req() req) {
    // Store user ID in a one-time state token
    const stateToken = await this.authService.generateOneTimeCode(req.user.id);

    // Build Google OAuth URL with state parameter
    // The state will be appended to the redirect URL
    const apiBaseUrl = this.configService.get('API_BASE_URL');
    const googleAuthUrl = `${apiBaseUrl}/auth/link-google/redirect?state=${stateToken}`;
    return { redirectUrl: googleAuthUrl };
  }

  /**
   * Google OAuth redirect for linking accounts
   * This will redirect to Google's OAuth page with the state parameter
   */
  @Get('link-google/redirect')
  @UseGuards(AuthGuard('google-link'))
  async linkGoogleRedirect(@Req() req, @Query('state') state: string) {
    // The guard will automatically redirect to Google OAuth
    // The state parameter will be preserved by Passport
    return HttpStatus.OK;
  }

  /**
   * Callback for Google account linking
   * This processes the OAuth callback and links the Google account
   */
  @Get('link-google/callback')
  @UseGuards(AuthGuard('google-link'))
  async linkGoogleCallback(@Req() req, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    try {
      // Get the Google profile from the request (populated by GoogleLinkStrategy)
      const googleProfile = req.user as any;
      const state = googleProfile.state;

      if (!state) {
        throw new UnauthorizedException('Missing state parameter.');
      }

      // Get the user ID from the state token
      const key = `one-time-code:${state}`;
      const userId = await this.authService['cacheManager'].get<string>(key);

      if (!userId) {
        throw new UnauthorizedException('Invalid or expired state token.');
      }

      // Delete the state token
      await this.authService['cacheManager'].del(key);

      // Link the accounts
      await this.authService.linkGoogleAccount(userId, {
        provider: googleProfile.provider,
        providerId: googleProfile.providerId,
        email: googleProfile.email,
        name: googleProfile.name,
        avatarUrl: googleProfile.avatarUrl,
      });

      // Redirect to frontend with success message
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

  /**
   * Unlink an OAuth account (e.g., Google)
   */
  @UseGuards(JwtAuthGuard)
  @Post('unlink-oauth')
  @HttpCode(HttpStatus.OK)
  async unlinkOAuthAccount(@Req() req, @Body() body: { provider: string }) {
    return this.authService.unlinkOAuthAccount(req.user.id, body.provider);
  }

  /**
   * Get list of linked OAuth accounts
   */
  @UseGuards(JwtAuthGuard)
  @Get('linked-accounts')
  @HttpCode(HttpStatus.OK)
  async getLinkedAccounts(@Req() req) {
    return this.authService.getLinkedAccounts(req.user.id);
  }

  /**
   * Verify email change using token from email
   * Public endpoint - no authentication required
   */
  @Get('verify-email-change')
  @HttpCode(HttpStatus.OK)
  async verifyEmailChange(@Query('token') token: string, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    try {
      if (!token) {
        throw new UnauthorizedException('Token không được cung cấp.');
      }

      const result = await this.authService.verifyEmailChange(token);

      // Redirect to frontend with success message
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
