import { RedisIoAdapter } from './redis-io.adapter';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { IoAdapter } from '@nestjs/platform-socket.io';

jest.mock('@socket.io/redis-adapter');
jest.mock('redis');

describe('RedisIoAdapter', () => {
  let adapter: RedisIoAdapter;
  let app: jest.Mocked<INestApplication>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    app = {
      get: jest.fn(),
    } as unknown as jest.Mocked<INestApplication>;

    configService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'REDIS_HOST') return 'localhost';
        if (key === 'REDIS_PORT') return 6379;
        if (key === 'FRONTEND_URL') return 'http://localhost:3000';
        return defaultValue;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    adapter = new RedisIoAdapter(app, configService);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('connectToRedis', () => {
    it('should create and connect redis clients', async () => {
      const pubClient = { connect: jest.fn(), duplicate: jest.fn() };
      const subClient = { connect: jest.fn() };
      (createClient as jest.Mock).mockReturnValue(pubClient);
      pubClient.duplicate.mockReturnValue(subClient);

      await adapter.connectToRedis();

      expect(createClient).toHaveBeenCalled();
      expect(pubClient.connect).toHaveBeenCalled();
      expect(subClient.connect).toHaveBeenCalled();
      expect(createAdapter).toHaveBeenCalledWith(pubClient, subClient);
    });

    it('should throw error if redis connection fails', async () => {
      const pubClient = { 
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')), 
        duplicate: jest.fn().mockReturnValue({ connect: jest.fn() })
      };
      (createClient as jest.Mock).mockReturnValue(pubClient);

      await expect(adapter.connectToRedis()).rejects.toThrow('Connection failed');
    });
  });

  describe('createIOServer', () => {
    let server: any;

    beforeEach(async () => {
      // Setup redis connection first
      const pubClient = { connect: jest.fn(), duplicate: jest.fn() };
      const subClient = { connect: jest.fn() };
      (createClient as jest.Mock).mockReturnValue(pubClient);
      pubClient.duplicate.mockReturnValue(subClient);
      await adapter.connectToRedis();

      server = {
        use: jest.fn(),
        adapter: jest.fn(),
      };
      jest.spyOn(IoAdapter.prototype, 'createIOServer').mockReturnValue(server);
    });

    it('should create a Socket.IO server with CORS enabled', () => {
      const result = adapter.createIOServer(3000);

      expect(IoAdapter.prototype.createIOServer).toHaveBeenCalledWith(
        3000,
        expect.objectContaining({
          cors: expect.objectContaining({
            origin: true,
            methods: ['GET', 'POST'],
            credentials: true,
          }),
        })
      );
      expect(result).toBe(server);
    });

    it('should apply the redis adapter', () => {
      adapter.createIOServer(3000);
      expect(server.adapter).toHaveBeenCalled();
    });
  });
});