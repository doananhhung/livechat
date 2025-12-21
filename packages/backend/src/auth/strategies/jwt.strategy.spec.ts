import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { UserService } from '../../user/user.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { GlobalRole } from '@live-chat/shared-types';
import { User } from '../../database/entities';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserService,
          useValue: {
            findOneById: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object if validation is successful', async () => {
      const user = {
        id: 'userId',
        email: 'test@example.com',
        role: GlobalRole.USER,
        tokensValidFrom: new Date(Date.now() - 10000),
      } as User;
      const payload = {
        sub: 'userId',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
      };
      userService.findOneById.mockResolvedValue(user);

      const result = await strategy.validate(payload);

      expect(result).toEqual({ id: user.id, email: user.email, role: user.role });
    });

    it('should throw UnauthorizedException for invalid payload', async () => {
      await expect(strategy.validate(null as any)).rejects.toThrow(
        new UnauthorizedException('Invalid token payload.')
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const payload = {
        sub: 'userId',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
      };
      userService.findOneById.mockResolvedValue(undefined as any);

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('User not found.')
      );
    });

    it('should throw UnauthorizedException if token is revoked', async () => {
      const user = {
        id: 'userId',
        email: 'test@example.com',
        tokensValidFrom: new Date(Date.now() + 10000),
      } as User;
      const payload = {
        sub: 'userId',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
      };
      userService.findOneById.mockResolvedValue(user);

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Token has been revoked.')
      );
    });
  });
});