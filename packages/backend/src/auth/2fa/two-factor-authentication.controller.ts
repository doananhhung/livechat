import {
  Controller,
  Post,
  UseGuards,
  Req,
  Res,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { TwoFactorAuthenticationService } from './two-factor-authentication.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.interface';
import { UserService } from '../../user/user.service';
import { TurnOn2faDto } from '@live-chat/shared';
import { AuthService } from '../auth.service';
import { EncryptionService } from '../../common/services/encryption.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { TwoFactorRequest } from '../../common/types/two-factor-request.interface';
import { type Response } from 'express';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'; // <-- ADDED for Swagger

/**
 * Controller for handling two-factor authentication (2FA) related HTTP requests.
 * Provides endpoints for generating 2FA setup, turning 2FA on/off, and authenticating with 2FA.
 */
@ApiTags('2FA') // <-- ADDED for Swagger
@Controller('2fa')
export class TwoFactorAuthenticationController {
  constructor(
    private readonly twoFactorAuthService: TwoFactorAuthenticationService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Generates a 2FA secret and a QR code Data URL for the authenticated user.
   * The temporary secret is stored in an HttpOnly cookie.
   *
   * @param req - The authenticated request object.
   * @param res - The response object to set the 2FA secret cookie.
   * @returns An object containing the QR code Data URL.
   * @status 200 - OK.
   * @throws UnauthorizedException - If the user is not authenticated.
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate 2FA secret and QR code' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'QR code Data URL generated successfully.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized.' }) // <-- ADDED for Swagger
  async generate(@Req() req: AuthenticatedRequest, @Res() res) {
    const { user } = req;
    const { secret, otpAuthUrl } = await this.twoFactorAuthService.generateSecret(user as any);

    // Store the temporary secret in an HttpOnly cookie to be verified later
    res.cookie('2fa_secret', this.encryptionService.encrypt(secret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite:
        this.configService.get('NODE_ENV') === 'production' ? 'none' : 'lax',
      expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes validity
    });

    const qrCodeDataURL = await this.twoFactorAuthService.generateQrCodeDataURL(otpAuthUrl);
    return res.json({ qrCodeDataURL });
  }

  /**
   * Turns on two-factor authentication for the authenticated user.
   * Verifies the provided 2FA code against the temporary secret stored in the cookie.
   *
   * @param req - The authenticated request object.
   * @param body - The TurnOn2faDto containing the 2FA code.
   * @param res - The response object to clear the 2FA secret cookie.
   * @returns A success message and recovery codes.
   * @status 200 - OK.
   * @throws BadRequestException - If the 2FA secret cookie is not found.
   * @throws UnauthorizedException - If the 2FA code is wrong.
   */
  @Post('turn-on')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Turn on 2FA for the authenticated user' }) // <-- ADDED for Swagger
  @ApiBody({ type: TurnOn2faDto }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: '2FA enabled successfully.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 400, description: 'Bad Request (2FA secret cookie not found).' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (wrong authentication code).' }) // <-- ADDED for Swagger
  async turnOn(
    @Req() req: AuthenticatedRequest,
    @Body() body: TurnOn2faDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const temporarySecretEncrypted = req.cookies['2fa_secret'];
    if (!temporarySecretEncrypted) {
      throw new BadRequestException(
        '2FA secret cookie not found. Please start over.'
      );
    }
    const temporarySecret = this.encryptionService.decrypt(
      temporarySecretEncrypted
    );

    const isCodeValid = this.twoFactorAuthService.isCodeValid(
      body.code,
      temporarySecret
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    const { user, recoveryCodes } = await this.userService.turnOnTwoFactorAuthentication(
      req.user.id,
      temporarySecret
    );

    res.clearCookie('2fa_secret');

    return {
      message: 'Two-factor authentication has been enabled successfully.',
      recoveryCodes,
    };
  }

  /**
   * Authenticates a user with a 2FA code after a partial login.
   * Issues full access and refresh tokens upon successful 2FA verification.
   *
   * @param req - The request object containing partial user information (from 2FA partial guard).
   * @param body - The TurnOn2faDto containing the 2FA code.
   * @param res - The response object to set cookies and return tokens.
   * @returns An object containing the access token and user details.
   * @status 200 - OK.
   * @throws UnauthorizedException - If the user is not found or the 2FA code is wrong.
   * @throws ForbiddenException - If 2FA is not enabled for the account.
   */
  @Post('authenticate')
  @UseGuards(AuthGuard('2fa-partial'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with 2FA code' }) // <-- ADDED for Swagger
  @ApiBody({ type: TurnOn2faDto }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: 'User successfully authenticated with 2FA.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (user not found or wrong code).' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 403, description: 'Forbidden (2FA not enabled).' }) // <-- ADDED for Swagger
  async authenticate(
    @Req() req: TwoFactorRequest,
    @Body() body: TurnOn2faDto,
    @Res() res
  ) {
    console.log('Request user:', req.user);
    console.log('Using user ID:', req.user.sub);

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'] || 'unknown';

    const user = await this.userService.findOneById(req.user.sub);

    if (!user) {
      console.error('User not found for ID:', req.user.sub);
      throw new UnauthorizedException('User not found');
    }

    console.log('Found user:', user);

    if (!user.isTwoFactorAuthenticationEnabled) {
      throw new ForbiddenException('2FA is not enabled for this account.');
    }

    const decryptedSecret = this.encryptionService.decrypt(
      user.twoFactorAuthenticationSecret as string
    );
    const isCodeValid = this.twoFactorAuthService.isCodeValid(
      body.code,
      decryptedSecret
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    const data = await this.authService.loginAndReturnTokens(
      user,
      ipAddress,
      userAgent
    );
    const { accessToken, refreshToken, user: userResult } = data;

    const refreshTokenExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN'
    ) as string;
    const refreshTokenExpiryDays = parseInt(
      refreshTokenExpiresIn.slice(0, -1),
      10
    );
    // Set the refresh token in an HttpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(
        Date.now() + refreshTokenExpiryDays * 24 * 60 * 60 * 1000
      ),
    });

    // Clear the temporary cookies
    res.clearCookie('2fa_partial_token');
    res.clearCookie('2fa_secret');

    console.log('User fully authenticated with 2FA:', userResult.email);

    // Return full tokens, setting the refresh token in the cookie
    res.json({ accessToken, user: userResult });
  }

  /**
   * Turns off two-factor authentication for the authenticated user.
   * Requires the user to provide a valid 2FA code for verification.
   *
   * @param req - The authenticated request object.
   * @param body - The TurnOn2faDto containing the 2FA code.
   * @returns A success message.
   * @status 200 - OK.
   * @throws ForbiddenException - If 2FA is not enabled for the account.
   * @throws UnauthorizedException - If the 2FA code is wrong.
   */
  @Post('turn-off')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Turn off 2FA for the authenticated user' }) // <-- ADDED for Swagger
  @ApiBody({ type: TurnOn2faDto }) // <-- ADDED for Swagger
  @ApiResponse({ status: 200, description: '2FA disabled successfully.' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 403, description: 'Forbidden (2FA not enabled).' }) // <-- ADDED for Swagger
  @ApiResponse({ status: 401, description: 'Unauthorized (wrong authentication code).' }) // <-- ADDED for Swagger
  async turnOff(
    @Req() req: AuthenticatedRequest,
    @Body() body: TurnOn2faDto // Reuse the DTO that has the 'code' field
  ) {
    const user = await this.userService.findOneById(req.user.id);

    if (!user.isTwoFactorAuthenticationEnabled) {
      throw new ForbiddenException('2FA is not enabled for this account.');
    }

    const decryptedSecret = this.encryptionService.decrypt(
      user.twoFactorAuthenticationSecret as string
    );

    const isCodeValid = this.twoFactorAuthService.isCodeValid(
      body.code,
      decryptedSecret
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    await this.userService.turnOffTwoFactorAuthentication(req.user.id);

    return { message: 'Two-factor authentication has been disabled.' };
  }
}

