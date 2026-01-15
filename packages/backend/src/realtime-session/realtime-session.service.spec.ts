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
            exists: jest.fn(), // ADDED
            mget: jest.fn(), // ADDED
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
    it('should delete a visitor session from Redis if socketId matches', async () => {
      const visitorUid = 'visitor-123';
      const socketId = 'socket-abc';
      const expectedKey = `session:visitor:${visitorUid}`;
      redisClient.get.mockResolvedValue(socketId);
      
      await service.deleteVisitorSession(visitorUid, socketId);

      expect(redisClient.get).toHaveBeenCalledWith(expectedKey);
      expect(redisClient.del).toHaveBeenCalledWith(expectedKey);
    });

    it('should NOT delete a visitor session if socketId does not match', async () => {
      const visitorUid = 'visitor-123';
      const oldSocketId = 'socket-abc';
      const newSocketId = 'socket-xyz';
      const expectedKey = `session:visitor:${visitorUid}`;
      redisClient.get.mockResolvedValue(newSocketId);
      
      await service.deleteVisitorSession(visitorUid, oldSocketId);

      expect(redisClient.get).toHaveBeenCalledWith(expectedKey);
      expect(redisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('isVisitorOnline', () => {
    it('should return true if session exists in Redis', async () => {
      const visitorUid = 'visitor-123';
      redisClient.exists.mockResolvedValue(1);

      const result = await service.isVisitorOnline(visitorUid);
      expect(redisClient.exists).toHaveBeenCalledWith(`session:visitor:${visitorUid}`);
      expect(result).toBe(true);
    });

    it('should return false if session does not exist in Redis', async () => {
      const visitorUid = 'visitor-123';
      redisClient.exists.mockResolvedValue(0);

      const result = await service.isVisitorOnline(visitorUid);
      expect(result).toBe(false);
    });

    it('should return false if Redis throws an error', async () => {
      const visitorUid = 'visitor-123';
      redisClient.exists.mockRejectedValue(new Error('Redis connection failed'));

      const result = await service.isVisitorOnline(visitorUid);
      expect(result).toBe(false); // Updated expectation
    });
  });

  describe('getManyVisitorOnlineStatus', () => {
    it('should return correct map of online statuses', async () => {
      const visitorUids = ['v1', 'v2', 'v3'];
      const keys = visitorUids.map(uid => `session:visitor:${uid}`);
      // mget returns array of values or nulls
      (redisClient as any).mget.mockResolvedValue(['socket-1', null, 'socket-3']);

      const result = await service.getManyVisitorOnlineStatus(visitorUids);

      expect((redisClient as any).mget).toHaveBeenCalledWith(keys);
      expect(result.get('v1')).toBe(true);
      expect(result.get('v2')).toBe(false);
      expect(result.get('v3')).toBe(true);
    });

    it('should return empty map for empty input', async () => {
      const result = await service.getManyVisitorOnlineStatus([]);
      expect((redisClient as any).mget).not.toHaveBeenCalled();
      expect(result.size).toBe(0);
    });

    it('should return empty map if Redis throws error', async () => {
      const visitorUids = ['v1'];
      (redisClient as any).mget.mockRejectedValue(new Error('Redis error'));

      const result = await service.getManyVisitorOnlineStatus(visitorUids);
      expect(result.size).toBe(0);
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
