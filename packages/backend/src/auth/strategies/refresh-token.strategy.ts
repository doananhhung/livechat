import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../users/user.service';

/**
 * Passport strategy for validating refresh tokens.
 * This strategy extracts the refresh token from an HttpOnly cookie named 'refresh_token'.
 * It verifies the token's signature and expiration, and then validates the associated user.
 * It also checks if the token has been revoked by comparing its 'issued at' (iat) timestamp
 * with the user's `tokensValidFrom` timestamp.
 */
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh' // named this strategy as 'jwt-refresh'
) {
  private readonly logger = new Logger(RefreshTokenStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly userService: UserService
  ) {
    const refreshSecret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error(
        'JWT_REFRESH_SECRET is not defined in environment variables'
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const data = request.cookies['refresh_token'];
          if (!data) {
            return null;
          }
          return data;
        },
      ]),
      secretOrKey: refreshSecret,
      // pass request obj to the validate method
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any): Promise<any> {
    const userId = payload.sub;
    if (!userId) {
      this.logger.error(
        `❌ [RefreshTokenStrategy] Invalid token payload: missing user ID (sub)`
      );
      throw new Error('Invalid token payload: missing user ID (sub)');
    }

    // Check if userId looks like a valid UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      this.logger.error(
        `❌ [RefreshTokenStrategy] Invalid UUID format for userId: "${userId}"`
      );
      this.logger.error(
        `❌ [RefreshTokenStrategy] UUID length: ${userId.length}, expected: 36`
      );
      throw new UnauthorizedException('Invalid user ID format in token');
    }

    const user = await this.userService.findOneById(userId);

    if (!user) {
      this.logger.error(
        `❌ [RefreshTokenStrategy] User not found for ID: ${userId}`
      );
      throw new UnauthorizedException('User not found');
    }

    const tokensValidFromSec = Math.floor(
      user.tokensValidFrom.getTime() / 1000
    );

    if (payload.iat < tokensValidFromSec) {
      this.logger.error(
        `❌ [RefreshTokenStrategy] Token has been revoked. iat (${payload.iat}) < tokensValidFrom (${tokensValidFromSec})`
      );
      throw new UnauthorizedException('Token has been revoked.');
    }
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      this.logger.error(
        `❌ [RefreshTokenStrategy] No refresh token found in cookies`
      );
      throw new UnauthorizedException('No refresh token provided');
    }

    // Attach both payload and refresh token to request.user
    return { ...payload, refreshToken };
  }
}
