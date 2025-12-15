import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

/**
 * This Guard will automatically activate JwtStrategy.
 * When applied to a route, it will check the existence and validity of the JWT
 * in the Authorization header of the request.
 * If the token is valid, it will attach the authenticated payload to request.user.
 * If the token does not exist or is invalid, it will automatically throw an UnauthorizedException (401 error).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

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
