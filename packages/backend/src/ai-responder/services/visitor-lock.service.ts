import { Inject, Injectable, Logger } from '@nestjs/common';
import { REDIS_PUBLISHER_CLIENT } from '../../redis/redis.module';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

/** TTL for visitor locks in seconds. Prevents deadlock if process crashes. */
const DEFAULT_LOCK_TTL_SECONDS = 30;

/** Redis key prefix for visitor locks. */
const LOCK_KEY_PREFIX = 'ai:lock:visitor:';

/**
 * Service for managing per-visitor locks using Redis.
 * Ensures only one AI message processing runs per visitor at a time.
 */
@Injectable()
export class VisitorLockService {
  private readonly logger = new Logger(VisitorLockService.name);

  /**
   * Lua script for atomic lock release.
   * Only deletes the key if the stored value matches the provided lockId.
   */
  private readonly releaseLockScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  constructor(
    @Inject(REDIS_PUBLISHER_CLIENT)
    private readonly redis: Redis
  ) {}

  /**
   * Attempts to acquire a lock for the specified visitor.
   * @param visitorUid - The unique identifier of the visitor.
   * @param ttlSeconds - Time-to-live for the lock in seconds (default: 30).
   * @returns The lock ID if acquired successfully, null if lock is held by another.
   */
  async acquireLock(
    visitorUid: string,
    ttlSeconds: number = DEFAULT_LOCK_TTL_SECONDS
  ): Promise<string | null> {
    const key = `${LOCK_KEY_PREFIX}${visitorUid}`;
    const lockId = randomUUID();

    // SET key lockId NX EX ttlSeconds
    // NX = only set if key does not exist
    // EX = expire after ttlSeconds
    const result = await this.redis.set(key, lockId, 'EX', ttlSeconds, 'NX');

    if (result === 'OK') {
      this.logger.debug(
        `Lock acquired for visitor ${visitorUid} (lockId: ${lockId})`
      );
      return lockId;
    }

    this.logger.debug(
      `Lock not acquired for visitor ${visitorUid} (already held)`
    );
    return null;
  }

  /**
   * Releases a lock for the specified visitor.
   * Only releases if the lockId matches (prevents releasing another process's lock).
   * @param visitorUid - The unique identifier of the visitor.
   * @param lockId - The lock ID returned from acquireLock.
   * @returns true if the lock was released, false if not owner or lock expired.
   */
  async releaseLock(visitorUid: string, lockId: string): Promise<boolean> {
    const key = `${LOCK_KEY_PREFIX}${visitorUid}`;

    // Use Lua script for atomic check-and-delete
    const result = await this.redis.eval(
      this.releaseLockScript,
      1,
      key,
      lockId
    );

    const released = result === 1;
    if (released) {
      this.logger.debug(
        `Lock released for visitor ${visitorUid} (lockId: ${lockId})`
      );
    } else {
      this.logger.debug(
        `Lock not released for visitor ${visitorUid} (not owner or expired)`
      );
    }

    return released;
  }
}
