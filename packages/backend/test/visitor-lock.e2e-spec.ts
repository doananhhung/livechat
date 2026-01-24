import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { VisitorLockService } from '../src/ai-responder/services/visitor-lock.service';
import { REDIS_PUBLISHER_CLIENT } from '../src/redis/redis.module';

/**
 * Integration tests for VisitorLockService.
 * Requires a running Redis instance.
 */
describe('VisitorLockService (E2E)', () => {
  let lockService: VisitorLockService;
  let redis: Redis;
  let moduleRef: TestingModule;

  /** Unique prefix for test keys to avoid conflicts */
  const TEST_VISITOR_PREFIX = 'test-visitor-';
  /** Track visitors locked during tests for cleanup */
  const lockedVisitors: { visitorUid: string; lockId: string }[] = [];

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [
        VisitorLockService,
        {
          provide: REDIS_PUBLISHER_CLIENT,
          useFactory: (configService: ConfigService) => {
            return new Redis({
              host: configService.get<string>('REDIS_HOST', 'localhost'),
              port: configService.get<number>('REDIS_PORT', 6379),
            });
          },
          inject: [ConfigService],
        },
      ],
    }).compile();

    lockService = moduleRef.get<VisitorLockService>(VisitorLockService);
    redis = moduleRef.get<Redis>(REDIS_PUBLISHER_CLIENT);
  });

  afterAll(async () => {
    // Clean up any remaining test locks
    for (const { visitorUid, lockId } of lockedVisitors) {
      await lockService.releaseLock(visitorUid, lockId);
    }
    await redis.quit();
    await moduleRef.close();
  });

  afterEach(async () => {
    // Clean up locks created during each test
    for (const { visitorUid, lockId } of lockedVisitors) {
      await lockService.releaseLock(visitorUid, lockId);
    }
    lockedVisitors.length = 0;
  });

  const trackLock = (visitorUid: string, lockId: string) => {
    lockedVisitors.push({ visitorUid, lockId });
  };

  describe('acquireLock', () => {
    it('should return lockId on successful acquisition', async () => {
      const visitorUid = `${TEST_VISITOR_PREFIX}acquire-success`;

      const lockId = await lockService.acquireLock(visitorUid);

      expect(lockId).toBeDefined();
      expect(typeof lockId).toBe('string');
      expect(lockId).toHaveLength(36); // UUID format
      trackLock(visitorUid, lockId!);
    });

    it('should return null when lock is already held', async () => {
      const visitorUid = `${TEST_VISITOR_PREFIX}acquire-conflict`;

      // First acquisition should succeed
      const lockId1 = await lockService.acquireLock(visitorUid);
      expect(lockId1).toBeDefined();
      trackLock(visitorUid, lockId1!);

      // Second acquisition should fail
      const lockId2 = await lockService.acquireLock(visitorUid);
      expect(lockId2).toBeNull();
    });

    it('should allow re-acquisition after release', async () => {
      const visitorUid = `${TEST_VISITOR_PREFIX}reacquire`;

      // First acquisition
      const lockId1 = await lockService.acquireLock(visitorUid);
      expect(lockId1).toBeDefined();

      // Release
      const released = await lockService.releaseLock(visitorUid, lockId1!);
      expect(released).toBe(true);

      // Second acquisition should succeed
      const lockId2 = await lockService.acquireLock(visitorUid);
      expect(lockId2).toBeDefined();
      expect(lockId2).not.toBe(lockId1);
      trackLock(visitorUid, lockId2!);
    });
  });

  describe('releaseLock', () => {
    it('should return true when lockId matches', async () => {
      const visitorUid = `${TEST_VISITOR_PREFIX}release-success`;

      const lockId = await lockService.acquireLock(visitorUid);
      expect(lockId).toBeDefined();

      const released = await lockService.releaseLock(visitorUid, lockId!);
      expect(released).toBe(true);
    });

    it('should return false when lockId does not match', async () => {
      const visitorUid = `${TEST_VISITOR_PREFIX}release-mismatch`;

      const lockId = await lockService.acquireLock(visitorUid);
      expect(lockId).toBeDefined();
      trackLock(visitorUid, lockId!);

      // Try to release with wrong lockId
      const released = await lockService.releaseLock(
        visitorUid,
        'wrong-lock-id'
      );
      expect(released).toBe(false);
    });

    it('should return false when lock does not exist', async () => {
      const visitorUid = `${TEST_VISITOR_PREFIX}release-nonexistent`;

      const released = await lockService.releaseLock(
        visitorUid,
        'some-lock-id'
      );
      expect(released).toBe(false);
    });
  });

  describe('lock TTL', () => {
    it('should auto-expire after TTL', async () => {
      const visitorUid = `${TEST_VISITOR_PREFIX}ttl-expire`;
      const shortTtl = 1; // 1 second

      const lockId = await lockService.acquireLock(visitorUid, shortTtl);
      expect(lockId).toBeDefined();

      // Lock should be held
      const lockId2 = await lockService.acquireLock(visitorUid);
      expect(lockId2).toBeNull();

      // Wait for TTL to expire (plus buffer)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Lock should now be available
      const lockId3 = await lockService.acquireLock(visitorUid);
      expect(lockId3).toBeDefined();
      trackLock(visitorUid, lockId3!);
    });
  });

  describe('concurrent access', () => {
    it('should only allow one lock at a time under concurrent requests', async () => {
      const visitorUid = `${TEST_VISITOR_PREFIX}concurrent`;

      // Simulate 5 concurrent lock attempts
      const results = await Promise.all([
        lockService.acquireLock(visitorUid),
        lockService.acquireLock(visitorUid),
        lockService.acquireLock(visitorUid),
        lockService.acquireLock(visitorUid),
        lockService.acquireLock(visitorUid),
      ]);

      // Exactly one should succeed
      const successfulLocks = results.filter((r) => r !== null);
      expect(successfulLocks).toHaveLength(1);

      // Track the successful one for cleanup
      trackLock(visitorUid, successfulLocks[0]!);
    });
  });
});
