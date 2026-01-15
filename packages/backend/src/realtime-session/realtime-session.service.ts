
// src/realtime-session/realtime-session.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import { REDIS_PUBLISHER_CLIENT } from '../redis/redis.module';

@Injectable()
export class RealtimeSessionService {
  private readonly logger = new Logger(RealtimeSessionService.name);
  constructor(
    @Inject(REDIS_PUBLISHER_CLIENT) private readonly redis: RedisClientType
  ) {}

  private getKey(visitorUid: string): string {
    return `session:visitor:${visitorUid}`;
  }

  async setVisitorSession(visitorUid: string, socketId: string): Promise<void> {
    this.logger.debug(
      `Setting session for visitorUid: ${visitorUid} with socketId: ${socketId}`
    );
    const key = this.getKey(visitorUid);
    await this.redis.set(key, socketId);
    await this.redis.expire(key, 3 * 24 * 60 * 60); // Expire in 3 days
  }

  async getVisitorSession(visitorUid: string): Promise<string | null> {
    this.logger.debug(`Getting session for visitorUid: ${visitorUid}`);
    const key = this.getKey(visitorUid);
    return this.redis.get(key);
  }

  /**
   * Removes the session only if the stored socket ID matches the provided socket ID.
   * This prevents a race condition where a new connection's session is accidentally
   * deleted by the old connection's disconnect event.
   */
  async deleteVisitorSession(visitorUid: string, socketId: string): Promise<void> {
    const key = this.getKey(visitorUid);
    const currentSocketId = await this.redis.get(key);
    
    if (currentSocketId === socketId) {
      this.logger.debug(`Deleting session for visitorUid: ${visitorUid} (Socket matched: ${socketId})`);
      await this.redis.del(key);
    } else {
      this.logger.debug(
        `Skipping session deletion for visitorUid: ${visitorUid}. Stored socket (${currentSocketId}) does not match disconnecting socket (${socketId}).`
      );
    }
  }

  /**
   * Checks if a visitor has an active session.
   * @returns true if session exists, false otherwise, or null if Redis is unavailable.
   */
  async isVisitorOnline(visitorUid: string): Promise<boolean | null> {
    const key = this.getKey(visitorUid);
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error: unknown) { // ADDED unknown type for safety
      this.logger.error(`Redis unavailable for isVisitorOnline(${visitorUid}): ${(error as Error).message}`);
      return false; // Default to offline on error per design
    }
  }

  /**
   * Bulk check online status for multiple visitors.
   * Uses Redis MGET for O(1) round-trip.
   *
   * @param visitorUids - Array of visitor UIDs to check status for.
   * @returns Map of visitorUid to their online status. (true if online, false if offline).
   *          If Redis is unavailable, returns an empty map or partially populated map.
   */
  async getManyVisitorOnlineStatus(
    visitorUids: string[]
  ): Promise<Map<string, boolean>> {
    if (visitorUids.length === 0) {
      return new Map();
    }

    try {
      const keys = visitorUids.map((uid) => this.getKey(uid));
      const values = await (this.redis as any).mget(keys); // RedisClientType might not have mget directly typed

      const result = new Map<string, boolean>();
      visitorUids.forEach((uid, index) => {
        result.set(uid, values[index] !== null);
      });
      return result;
    } catch (error: unknown) { // ADDED unknown type for safety
      this.logger.error(`Redis unavailable for getManyVisitorOnlineStatus: ${(error as Error).message}`);
      return new Map(); // Return empty map on error for graceful degradation
    }
  }

  private getCurrentUrlKey(visitorUid: string): string {
    return `session:visitor:${visitorUid}:currentUrl`;
  }

  async setVisitorCurrentUrl(
    visitorUid: string,
    currentUrl: string
  ): Promise<void> {
    this.logger.debug(
      `Setting currentUrl for visitorUid: ${visitorUid} to ${currentUrl}`
    );
    const key = this.getCurrentUrlKey(visitorUid);
    await this.redis.set(key, currentUrl);
    await this.redis.expire(key, 3 * 24 * 60 * 60); // Expire in 3 days
  }

  async getVisitorCurrentUrl(visitorUid: string): Promise<string | null> {
    const key = this.getCurrentUrlKey(visitorUid);
    return this.redis.get(key);
  }

  /**
   * Bulk retrieval of current URLs for multiple visitors.
   * Uses Redis MGET for O(1) round-trip instead of O(N) individual calls.
   *
   * @param visitorUids - Array of visitor UIDs to fetch URLs for
   * @returns Map of visitorUid to currentUrl (null if not found)
   */
  async getManyVisitorCurrentUrls(
    visitorUids: string[]
  ): Promise<Map<string, string | null>> {
    if (visitorUids.length === 0) {
      return new Map();
    }

    const keys = visitorUids.map((uid) => this.getCurrentUrlKey(uid));
    const values = await (this.redis as any).mget(keys);

    const result = new Map<string, string | null>();
    visitorUids.forEach((uid, index) => {
      result.set(uid, values[index] ?? null);
    });

    return result;
  }
}
