import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { User } from '../../database/entities';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object if validation is successful', async () => {
      const user = { isEmailVerified: true } as User;
      authService.validateUser.mockResolvedValue(user);

      const result = await strategy.validate('test@example.com', 'password');

      expect(authService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password'
      );
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException if validation fails', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(
        strategy.validate('test@example.com', 'password')
      ).rejects.toThrow(new UnauthorizedException('Email hoặc mật khẩu không chính xác.'));
    });

    it('should throw ForbiddenException if email is not verified', async () => {
      const user = { isEmailVerified: false } as User;
      authService.validateUser.mockResolvedValue(user);

      await expect(
        strategy.validate('test@example.com', 'password')
      ).rejects.toThrow(
        new ForbiddenException(
          'Vui lòng xác thực email của bạn trước khi đăng nhập.'
        )
      );
    });
  });
});