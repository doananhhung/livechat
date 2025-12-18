import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeSessionService } from './realtime-session.service';
import { REDIS_PUBLISHER_CLIENT } from '../redis/redis.module';
import { type RedisClientType } from 'redis';

describe('RealtimeSessionService', () => {
  let service: RealtimeSessionService;
  let redisClient: jest.Mocked<RedisClientType>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeSessionService,
        {
          provide: REDIS_PUBLISHER_CLIENT,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
            expire: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RealtimeSessionService>(RealtimeSessionService);
    redisClient = module.get(REDIS_PUBLISHER_CLIENT);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setVisitorSession', () => {
    it('should set a visitor session in Redis with a 3-day expiry', async () => {
      const visitorUid = 'visitor-123';
      const socketId = 'socket-abc';
      await service.setVisitorSession(visitorUid, socketId);

      const expectedKey = `session:visitor:${visitorUid}`;
      expect(redisClient.set).toHaveBeenCalledWith(expectedKey, socketId);
      expect(redisClient.expire).toHaveBeenCalledWith(expectedKey, 3 * 24 * 60 * 60);
    });
  });

  describe('getVisitorSession', () => {
    it('should get a visitor session from Redis', async () => {
      const visitorUid = 'visitor-123';
      const expectedKey = `session:visitor:${visitorUid}`;
      redisClient.get.mockResolvedValue('socket-abc');

      const result = await service.getVisitorSession(visitorUid);

      expect(redisClient.get).toHaveBeenCalledWith(expectedKey);
      expect(result).toBe('socket-abc');
    });
  });

  describe('deleteVisitorSession', () => {
    it('should delete a visitor session from Redis', async () => {
      const visitorUid = 'visitor-123';
      const expectedKey = `session:visitor:${visitorUid}`;
      await service.deleteVisitorSession(visitorUid);

      expect(redisClient.del).toHaveBeenCalledWith(expectedKey);
    });
  });

  describe('setVisitorCurrentUrl', () => {
    it('should set the current URL for a visitor with a 3-day expiry', async () => {
      const visitorUid = 'visitor-123';
      const currentUrl = 'https://example.com';
      await service.setVisitorCurrentUrl(visitorUid, currentUrl);

      const expectedKey = `session:visitor:${visitorUid}:currentUrl`;
      expect(redisClient.set).toHaveBeenCalledWith(expectedKey, currentUrl);
      expect(redisClient.expire).toHaveBeenCalledWith(expectedKey, 3 * 24 * 60 * 60);
    });
  });

  describe('getVisitorCurrentUrl', () => {
    it('should get the current URL for a visitor from Redis', async () => {
      const visitorUid = 'visitor-123';
      const expectedKey = `session:visitor:${visitorUid}:currentUrl`;
      redisClient.get.mockResolvedValue('https://example.com');

      const result = await service.getVisitorCurrentUrl(visitorUid);

      expect(redisClient.get).toHaveBeenCalledWith(expectedKey);
      expect(result).toBe('https://example.com');
    });
  });
});
