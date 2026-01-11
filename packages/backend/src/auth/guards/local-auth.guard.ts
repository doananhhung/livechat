import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * This guard automatically activates the LocalStrategy.
 * When applied to a route, it will execute the authentication logic of passport-local.
 * If authentication is successful, it will attach the user object to the request (req.user).
 * If authentication fails, it will automatically throw an UnauthorizedException (401 error).
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
