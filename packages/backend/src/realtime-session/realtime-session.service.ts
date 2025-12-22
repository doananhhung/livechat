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

  async deleteVisitorSession(visitorUid: string): Promise<void> {
    this.logger.debug(`Deleting session for visitorUid: ${visitorUid}`);
    const key = this.getKey(visitorUid);
    await this.redis.del(key);
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
    const values = await this.redis.mGet(keys);

    const result = new Map<string, string | null>();
    visitorUids.forEach((uid, index) => {
      result.set(uid, values[index] ?? null);
    });

    return result;
  }
}
