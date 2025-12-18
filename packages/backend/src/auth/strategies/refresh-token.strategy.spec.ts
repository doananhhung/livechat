import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenStrategy } from './refresh-token.strategy';
import { UserService } from '../../user/user.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, Logger } from '@nestjs/common';
import { User } from '@live-chat/shared';
import { Request } from 'express';

describe('RefreshTokenStrategy', () => {
  let strategy: RefreshTokenStrategy;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenStrategy,
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

    strategy = module.get<RefreshTokenStrategy>(RefreshTokenStrategy);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const validUUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    it('should return payload with refresh token on successful validation', async () => {
      const user = {
        id: validUUID,
        tokensValidFrom: new Date(Date.now() - 10000),
      } as User;
      const req = {
        cookies: { refresh_token: 'test-refresh-token' },
      } as unknown as Request;
      const payload = { sub: validUUID, iat: Math.floor(Date.now() / 1000) };
      userService.findOneById.mockResolvedValue(user);

      const result = await strategy.validate(req, payload);

      expect(result).toEqual({ ...payload, refreshToken: 'test-refresh-token' });
    });

    it('should throw an error if payload has no user ID', async () => {
      const req = {} as Request;
      const payload = { iat: Math.floor(Date.now() / 1000) }; // No sub

      await expect(strategy.validate(req, payload)).rejects.toThrow(
        'Invalid token payload: missing user ID (sub)'
      );
    });

    it('should throw UnauthorizedException for invalid UUID format', async () => {
      const req = {} as Request;
      const payload = { sub: 'invalid-uuid', iat: Math.floor(Date.now() / 1000) };

      await expect(strategy.validate(req, payload)).rejects.toThrow(
        new UnauthorizedException('Invalid user ID format in token')
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const req = {
        cookies: { refresh_token: 'test-refresh-token' },
      } as unknown as Request;
      const payload = { sub: validUUID, iat: Math.floor(Date.now() / 1000) };
      userService.findOneById.mockResolvedValue(undefined as any);

      await expect(strategy.validate(req, payload)).rejects.toThrow(
        new UnauthorizedException('User not found')
      );
    });

    it('should throw UnauthorizedException if token is revoked', async () => {
      const user = {
        id: validUUID,
        tokensValidFrom: new Date(Date.now() + 10000),
      } as User;
      const req = {
        cookies: { refresh_token: 'test-refresh-token' },
      } as unknown as Request;
      const payload = { sub: validUUID, iat: Math.floor(Date.now() / 1000) };
      userService.findOneById.mockResolvedValue(user);

      await expect(strategy.validate(req, payload)).rejects.toThrow(
        new UnauthorizedException('Token has been revoked.')
      );
    });

    it('should throw UnauthorizedException and log error if refresh token is missing', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      const user = {
        id: validUUID,
        tokensValidFrom: new Date(Date.now() - 10000),
      } as User;
      const req = { cookies: {} } as unknown as Request; // No refresh_token
      const payload = { sub: validUUID, iat: Math.floor(Date.now() / 1000) };
      userService.findOneById.mockResolvedValue(user);

      await expect(strategy.validate(req, payload)).rejects.toThrow(
        new UnauthorizedException('No refresh token provided')
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('No refresh token found in cookies')
      );
    });
  });
});