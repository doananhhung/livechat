import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { PasswordService } from '../services/password.service';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { User } from '../../database/entities';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let passwordService: jest.Mocked<PasswordService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: PasswordService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    passwordService = module.get(PasswordService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object if validation is successful', async () => {
      const user = { isEmailVerified: true } as User;
      passwordService.validateUser.mockResolvedValue(user);

      const result = await strategy.validate('test@example.com', 'password');

      expect(passwordService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password'
      );
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException if validation fails', async () => {
      passwordService.validateUser.mockResolvedValue(null);

      await expect(
        strategy.validate('test@example.com', 'password')
      ).rejects.toThrow(new UnauthorizedException('Incorrect email or password.'));
    });

    it('should throw ForbiddenException if email is not verified', async () => {
      const user = { isEmailVerified: false } as User;
      passwordService.validateUser.mockResolvedValue(user);

      await expect(
        strategy.validate('test@example.com', 'password')
      ).rejects.toThrow(
        new ForbiddenException(
          'Please verify your email before logging in.'
        )
      );
    });
  });
});