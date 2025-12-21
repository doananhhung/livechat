import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '../../database/entities';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    // Configuration for Passport-local.
    // By default, it will look for 'username' and 'password' fields in the request body.
    // Here, we explicitly specify that our username field is 'email'.
    super({ usernameField: 'email' });
  }

  /**
   * Passport will automatically call this validate function when LocalAuthGuard is activated.
   * @param email Value from the 'email' field in the request body.
   * @param password Value from the 'password' field in the request body.
   * @returns User object if authentication is successful.
   * @throws UnauthorizedException if authentication fails.
   */
  async validate(email: string, password: string): Promise<User> {
    // Delegate email and password checking to AuthService.
    const user = await this.authService.validateUser(email, password);

    // If AuthService returns null, it means the information is invalid.
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    // Check if the user's email is verified.
    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Vui lòng xác thực email của bạn trước khi đăng nhập.'
      );
    }

    // If authentication is successful, return the entire user object.
    // Passport will automatically attach this object to request.user.
    return user;
  }
}
