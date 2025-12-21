
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';
import { INestApplication, Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor!: ReturnType<typeof createAdapter>;

  constructor(
    private readonly app: INestApplication,
    private readonly configService: ConfigService
  ) {
    super(app);
    this.logger.log('RedisIoAdapter constructor invoked.');
  }

  async connectToRedis(): Promise<void> {
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisUrl = `redis://${redisHost}:${redisPort}`;

    this.logger.log(`Attempting to connect to Redis at ${redisUrl}...`);

    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    try {
      await Promise.all([pubClient.connect(), subClient.connect()]);
      this.logger.log('Successfully connected to Redis.');
      this.adapterConstructor = createAdapter(pubClient, subClient);
    } catch (err) {
      this.logger.error('Failed to connect to Redis:', err);
      throw err;
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    this.logger.log('createIOServer method invoked.');
    const server: Server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    this.logger.log(`Socket.IO server created with path: /socket.io/`);

    server.adapter(this.adapterConstructor);

    this.logger.log(
      'Socket.IO server created with Redis adapter.'
    );
    return server;
  }
}
