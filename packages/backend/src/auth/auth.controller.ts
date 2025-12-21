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
  ForgotPasswordDto,
  ResetPasswordDto,
  LoginDto, // <-- ADDED for Swagger @ApiBody
} from '@live-chat/shared-dtos';
import { User } from '../database/entities';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { type Response } from 'express';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'; // <-- ADDED for Swagger

/**
 * Controller for handling all authentication-related HTTP requests.
 * Provides endpoints for user registration, login, password management,
 * email verification, and Google OAuth flows.
 */
@ApiTags('Auth') // <-- ADDED for Swagger
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

  /**
   * Registers a new user.
   *
   * @param registerDto - The registration data (email, password, fullName, invitationToken).
   * @returns A success message upon successful registration.
   * @status 201 - Created.
   * @throws ConflictException - If the email is already in use.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 201, description: 'User successfully registered.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 409, description: 'Email already in use.' }) // <-- ADDED for Swagger
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Verifies a user's email address using a token received via email.
   *
   * @param token - The verification token from the query parameters.
   * @returns A success message upon successful email verification.
   * @status 200 - OK.
   * @throws NotFoundException - If the token is invalid or expired.
   */
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email with token' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'Email successfully verified.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 404, description: 'Invalid or expired token.' }) // <-- ADDED for Swagger
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  /**
   * Resends the email verification link to a user.
   *
   * @param resendVerificationDto - The email address to resend verification to.
   * @returns A success message indicating the email has been sent.
   * @status 200 - OK.
   * @throws ConflictException - If the email is already verified.
   */
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification link' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'Verification email sent.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 409, description: 'Email already verified.' }) // <-- ADDED for Swagger
  async resendVerificationEmail(
    @Body() resendVerificationDto: ResendVerificationDto
  ) {
    return this.authService.resendVerificationEmail(resendVerificationDto);
  }

  /**
   * Logs in a user with email and password.
   * Sets a secure, HttpOnly refresh token cookie and returns an access token.
   * Handles 2FA-enabled accounts by returning a partial token and requiring 2FA authentication.
   *
   * @param req - The request object containing user information (populated by LocalAuthGuard).
   * @param response - The response object to set cookies.
   * @param loginDto - The login credentials (email, password).
   * @returns An object containing the access token and user details, or throws UnauthorizedException for 2FA.
   * @status 200 - OK.
   * @status 401 - Unauthorized (e.g., wrong credentials, 2FA required).
   * @status 403 - Forbidden (e.g., suspended account, unverified email).
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'User successfully logged in.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (wrong credentials or 2FA required).' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., suspended account).' }) // <-- ADDED for Swagger
  async login(
    @Request()
    req: { user: User; ip: string; headers: { 'user-agent': string } },
    @Res({ passthrough: true }) response: Response,
    @Body() loginDto: LoginDto // <-- ADDED for Swagger
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
   * Refreshes the user's access token using a valid refresh token stored in an HttpOnly cookie.
   * Issues a new access token and a new refresh token (rotated).
   *
   * @param req - The request object containing user information (populated by RefreshTokenGuard).
   * @param response - The response object to set cookies.
   * @returns An object containing the new access token.
   * @status 200 - OK.
   * @status 401 - Unauthorized (e.g., invalid or expired refresh token).
   * @status 403 - Forbidden (e.g., user not active, token revoked).
   */
  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'Access token successfully refreshed.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid or expired refresh token).' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., user not active, token revoked).' }) // <-- ADDED for Swagger
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

  /**
   * Allows an authenticated user to change their password.
   * Requires the current password for verification if one is set.
   * Logs out all sessions after a successful password change for security.
   *
   * @param req - The request object containing user information (populated by JwtAuthGuard).
   * @param body - The ChangePasswordDto containing current and new passwords.
   * @param response - The response object to set cookies.
   * @returns An object containing a success message and a new access token.
   * @status 200 - OK.
   * @status 400 - Bad Request (e.g., current password required but not provided).
   * @status 401 - Unauthorized (e.g., invalid access token).
   * @status 403 - Forbidden (e.g., incorrect current password).
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'Password successfully changed.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., current password missing).' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid access token).' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., incorrect current password).' }) // <-- ADDED for Swagger
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

  /**
   * Allows an authenticated user to set a password for their account if they don't already have one.
   * This is typically used for users who initially registered via OAuth and want to add an email/password login.
   * Logs out all sessions after a successful password set for security.
   *
   * @param req - The request object containing user information (populated by JwtAuthGuard).
   * @param body - The SetPasswordDto containing the new password.
   * @param response - The response object to set cookies.
   * @returns An object containing a success message and a new access token.
   * @status 200 - OK.
   * @status 400 - Bad Request (e.g., user already has a password).
   * @status 401 - Unauthorized (e.g., invalid access token).
   */
  @UseGuards(JwtAuthGuard)
  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set password for a user (e.g., OAuth users)' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'Password successfully set.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 400, description: 'Bad Request (user already has a password).' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid access token).' }) // <-- ADDED for Swagger
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

  /**
   * Logs out the current user by invalidating their refresh token.
   * Clears relevant authentication cookies.
   *
   * @param req - The request object containing user information and cookies.
   * @param response - The response object to clear cookies.
   * @returns A success message upon successful logout.
   * @status 200 - OK.
   * @status 401 - Unauthorized (e.g., invalid refresh token).
   */
  @UseGuards(RefreshTokenGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out the current user' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'User successfully logged out.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid refresh token).' }) // <-- ADDED for Swagger
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

  /**
   * Logs out the current user from all active sessions by invalidating all their refresh tokens.
   * Clears relevant authentication cookies.
   *
   * @param req - The request object containing user information.
   * @param response - The response object to clear cookies.
   * @returns A success message upon successful logout from all devices.
   * @status 200 - OK.
   * @status 401 - Unauthorized (e.g., invalid refresh token).
   */
  @UseGuards(RefreshTokenGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out user from all devices' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'User successfully logged out from all devices.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid refresh token).' }) // <-- ADDED for Swagger
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

  /**
   * Initiates the Google OAuth login flow.
   * Redirects the user to Google's authentication page.
   *
   * @returns HTTP Status OK (redirection handled by Passport.js).
   * @status 200 - OK (redirect).
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 302, description: 'Redirects to Google for authentication.' }) // <-- ADDED for Swagger
  async googleAuth() {
    return HttpStatus.OK;
  }

  /**
   * Callback endpoint for Google OAuth login.
   * Processes the Google authentication response, handles 2FA if enabled,
   * and redirects the user to the appropriate frontend URL.
   *
   * @param req - The request object containing user information from Google OAuth.
   * @param res - The response object to set cookies and perform redirects.
   * @returns Redirects to frontend URL.
   * @status 302 - Redirect.
   * @throws UnauthorizedException - If Google authentication fails.
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 302, description: 'Redirects to frontend after Google authentication.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (Google authentication failed).' }) // <-- ADDED for Swagger
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

  /**
   * Exchanges a one-time code (received from OAuth callback) for full access and refresh tokens.
   * Sets a secure, HttpOnly refresh token cookie.
   *
   * @param exchangeCodeDto - The ExchangeCodeDto containing the one-time code.
   * @param response - The response object to set cookies.
   * @param req - The request object containing client IP and user agent.
   * @returns An object containing the access token and user details.
   * @status 200 - OK.
   * @status 401 - Unauthorized (e.g., invalid or expired code).
   */
  @Post('exchange-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange one-time code for tokens' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'Code successfully exchanged for tokens.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid or expired code).' }) // <-- ADDED for Swagger
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

  /**
   * Initiates the forgot password process by sending a reset email.
   *
   * @param forgotPasswordDto - The ForgotPasswordDto containing the user's email.
   * @returns A success message.
   * @status 200 - OK.
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate forgot password process' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'Password reset email sent (if user exists).' }) // <-- ADDED for Swagger
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  /**
   * Resets the user's password using a valid reset token.
   *
   * @param resetPasswordDto - The ResetPasswordDto containing the token and new password.
   * @returns A success message upon successful password reset.
   * @status 200 - OK.
   * @status 400 - Bad Request (e.g., invalid or expired token).
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password with token' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'Password successfully reset.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 400, description: 'Bad Request (invalid or expired token).' }) // <-- ADDED for Swagger
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword
    );
  }

  /**
   * Initiates the Google account linking process for an authenticated user.
   * Returns a redirect URL to Google's OAuth page.
   *
   * @param req - The request object containing user information (populated by JwtAuthGuard).
   * @returns An object containing the redirect URL.
   * @status 200 - OK.
   * @status 401 - Unauthorized (e.g., invalid access token).
   */
  @UseGuards(JwtAuthGuard)
  @Get('link-google')
  @ApiOperation({ summary: 'Initiate Google account linking' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'Redirect URL for Google OAuth provided.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid access token).' }) // <-- ADDED for Swagger
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
   * Google OAuth redirect endpoint for account linking.
   * This endpoint handles the redirection to Google's authentication page.
   *
   * @param req - The request object.
   * @param state - The state token from query parameters.
   * @returns HTTP Status OK (redirection handled by Passport.js).
   * @status 302 - Redirects to Google for authentication.
   */
  @Get('link-google/redirect')
  @UseGuards(AuthGuard('google-link'))
  @ApiOperation({ summary: 'Google OAuth redirect for account linking' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 302, description: 'Redirects to Google for authentication.' }) // <-- ADDED for Swagger
  async linkGoogleRedirect(@Req() req, @Query('state') state: string) {
    // The guard will automatically redirect to Google OAuth
    // The state parameter will be preserved by Passport
    return HttpStatus.OK;
  }

  /**
   * Callback endpoint for Google account linking.
   * Processes the OAuth callback and links the Google account to the authenticated user.
   *
   * @param req - The request object containing Google profile and state.
   * @param res - The response object to perform redirects.
   * @returns Redirects to the frontend with success or error messages.
   * @status 302 - Redirect.
   * @throws UnauthorizedException - If state token is missing, invalid, or expired.
   * @throws BadRequestException - If Google email does not match user's email.
   * @throws ConflictException - If Google account is already linked.
   */
  @Get('link-google/callback')
  @UseGuards(AuthGuard('google-link'))
  @ApiOperation({ summary: 'Google OAuth callback for account linking' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 302, description: 'Redirects to frontend after account linking.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid state token).' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 400, description: 'Bad Request (email mismatch).' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 409, description: 'Conflict (account already linked).' }) // <-- ADDED for Swagger
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
   * Unlinks an OAuth account (e.g., Google) from the authenticated user's profile.
   *
   * @param req - The request object containing user information (populated by JwtAuthGuard).
   * @param body - The body containing the provider to unlink (e.g., { provider: 'google' }).
   * @returns A success message upon successful unlinking.
   * @status 200 - OK.
   * @status 400 - Bad Request (e.g., trying to unlink last login method without password).
   * @status 401 - Unauthorized (e.g., invalid access token).
   * @status 404 - Not Found (e.g., provider not linked).
   */
  @UseGuards(JwtAuthGuard)
  @Post('unlink-oauth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlink an OAuth account (e.g., Google)' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'OAuth account successfully unlinked.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 400, description: 'Bad Request (cannot unlink last login method).' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid access token).' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 404, description: 'Not Found (provider not linked).' }) // <-- ADDED for Swagger
  async unlinkOAuthAccount(@Req() req, @Body() body: { provider: string }) {
    return this.authService.unlinkOAuthAccount(req.user.id, body.provider);
  }

  /**
   * Retrieves a list of all OAuth accounts linked to the authenticated user's profile.
   *
   * @param req - The request object containing user information (populated by JwtAuthGuard).
   * @returns An array of UserIdentity objects representing linked accounts.
   * @status 200 - OK.
   * @status 401 - Unauthorized (e.g., invalid access token).
   */
  @UseGuards(JwtAuthGuard)
  @Get('linked-accounts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get linked OAuth accounts' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'List of linked OAuth accounts.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid access token).' }) // <-- ADDED for Swagger
  async getLinkedAccounts(@Req() req) {
    return this.authService.getLinkedAccounts(req.user.id);
  }

  /**
   * Verifies an email change request using a token received via email.
   *
   * @param token - The verification token from the query parameters.
   * @param res - The response object to perform redirects.
   * @returns Redirects to the frontend with success or error messages.
   * @status 302 - Redirect.
   * @throws UnauthorizedException - If the token is not provided.
   */
  @Get('verify-email-change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email change with token' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 302, description: 'Redirects to frontend after email change verification.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (token not provided).' }) // <-- ADDED for Swagger
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
