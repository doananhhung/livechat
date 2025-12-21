import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard for authenticating requests using a refresh token.
 * This guard activates the 'jwt-refresh' Passport strategy.
 * It expects a refresh token to be present in the request (e.g., in cookies).
 * If the token is valid, it attaches the authenticated user payload to `req.user`.
 * If authentication fails (e.g., missing, invalid, or expired token), it throws an `UnauthorizedException`.
 */
@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err, user, info) {
    // If there's an error or user does not exist, throw UnauthorizedException
    if (err || !user) {
      throw new UnauthorizedException({
        message: info?.message || 'Unauthorized',
        error: 'Unauthorized',
        statusCode: 401,
        errorCode: 'TOKEN_INVALID',
      });
    }
    return user;
  }
}