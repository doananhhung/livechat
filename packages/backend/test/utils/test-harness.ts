import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { EventConsumerModule } from '../../src/event-consumer/event-consumer.module';
import { MailService } from '../../src/mail/mail.service';
import { ScreenshotService } from '../../src/screenshot/screenshot.service';
import { DataSource, EntityManager } from 'typeorm';
import { User } from '../../src/database/entities';
import cookieParser from 'cookie-parser';
import {
  REDIS_PUBLISHER_CLIENT,
  REDIS_SUBSCRIBER_CLIENT,
} from '../../src/redis/redis.module';
import Redis from 'ioredis';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

export class MailServiceMock {
  public sentEmails: any[] = [];

  async sendMail(to: string, subject: string, html: string) {
    this.sentEmails.push({ to, subject, html });
  }

  async sendUserConfirmation(user: User, token: string) {
    this.sentEmails.push({ type: 'CONFIRMATION', to: user.email, token });
  }

  async sendInvitationEmail(invitation: any, project: any, existingUser?: any) {
    this.sentEmails.push({
      type: 'INVITATION',
      to: invitation.email,
      token: invitation.token,
    });
  }

  async sendPasswordResetEmail(user: User, token: string) {
    this.sentEmails.push({ type: 'PASSWORD_RESET', to: user.email, token });
  }

  async sendEmailChangeVerification(
    user: User,
    newEmail: string,
    token: string
  ) {
    this.sentEmails.push({ type: 'EMAIL_CHANGE', to: newEmail, token });
  }

  async sendEmailChangeNotification(user: User, newEmail: string) {}
  async sendEmailChangeConfirmation(
    oldEmail: string,
    newEmail: string,
    userName: string
  ) {}

  getLastEmail() {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  findEmailByType(type: string) {
    return this.sentEmails.filter((e) => e.type === type).pop();
  }

  clear() {
    this.sentEmails = [];
  }
}

export class ScreenshotServiceMock {
  async getScreenshot(url: string): Promise<Buffer> {
    return Buffer.from('mock-screenshot-buffer');
  }
}

/**
 * In-memory cache implementation for testing without Redis dependency.
 * Prevents cache-manager-redis-store from blocking test initialization.
 */
export class MemoryCacheMock {
  private store = new Map<
    string,
    { value: any; ttl: number; createdAt: number }
  >();

  async get<T>(key: string): Promise<T | undefined> {
    const item = this.store.get(key);
    if (!item) return undefined;
    if (item.ttl > 0 && Date.now() - item.createdAt > item.ttl) {
      this.store.delete(key);
      return undefined;
    }
    return item.value as T;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.store.set(key, { value, ttl: ttl || 0, createdAt: Date.now() });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async reset(): Promise<void> {
    this.store.clear();
  }
}

export class TestHarness {
  public app: INestApplication;
  public workerApp: INestApplication;
  public mailService: MailServiceMock;
  public dataSource: DataSource;
  public entityManager: EntityManager; // Add entityManager directly

  async bootstrap() {
    this.mailService = new MailServiceMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(this.mailService)
      .overrideProvider(ScreenshotService)
      .useClass(ScreenshotServiceMock)
      // Use memory cache instead of redis-store to prevent blocking
      .overrideProvider(CACHE_MANAGER)
      .useClass(MemoryCacheMock)
      .compile();

    this.app = moduleFixture.createNestApplication();

    // Replicate main.ts configuration
    this.app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );
    this.app.use(cookieParser());

    await this.app.init();
    this.dataSource = this.app.get(DataSource);
    this.entityManager = this.dataSource.manager; // Initialize entityManager
  }

  /**
   * Bootstrap app with EventProcessor (worker) in the same process.
   * Uses E2ETestModule which combines AppModule with EventProcessor sharing BullMQ connection.
   * Use this for tests that require producer/consumer integration.
   */
  async bootstrapWithWorker() {
    // Lazy import to avoid circular dependency
    const { E2ETestModule } = await import('./e2e-test.module');

    this.mailService = new MailServiceMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [E2ETestModule],
    })
      .overrideProvider(MailService)
      .useValue(this.mailService)
      .overrideProvider(ScreenshotService)
      .useClass(ScreenshotServiceMock)
      .overrideProvider(CACHE_MANAGER)
      .useClass(MemoryCacheMock)
      .compile();

    this.app = moduleFixture.createNestApplication();

    this.app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );
    this.app.use(cookieParser());

    await this.app.init();
    this.dataSource = this.app.get(DataSource);
    this.entityManager = this.dataSource.manager; // Initialize entityManager
  }

  async bootstrapWorker() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [EventConsumerModule],
    }).compile();

    this.workerApp = moduleFixture.createNestApplication();
    await this.workerApp.init();
  }

  async cleanDatabase() {
    if (!this.dataSource || !this.dataSource.isInitialized) return;

    const entities = this.dataSource.entityMetadatas;
    const tableNames = entities
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');

    if (tableNames.length > 0) {
      await this.dataSource.query(
        `TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`
      );
    }
  }

  async teardown() {
    if (this.app) {
      // Close Redis clients explicitly
      try {
        const redisPublisher = this.app.get<Redis>(REDIS_PUBLISHER_CLIENT);
        const redisSubscriber = this.app.get<Redis>(REDIS_SUBSCRIBER_CLIENT);
        await redisPublisher?.quit();
        await redisSubscriber?.quit();
      } catch {
        // Redis clients may not be available in all test configurations
      }

      // Close BullMQ queue connections
      try {
        const queue = this.app.get<Queue>(
          getQueueToken('live-chat-events-queue')
        );
        await queue?.close();
      } catch {
        // Queue may not be registered in all test configurations
      }

      await this.app.close();
    }
    if (this.workerApp) await this.workerApp.close();
  }
}
