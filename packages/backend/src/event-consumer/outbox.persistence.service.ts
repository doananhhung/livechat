import { Injectable, Logger } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OutboxEvent } from '../database/entities';
import { WorkerEventType } from '@live-chat/shared-types';

/**
 * Payload structure for outbox events.
 */
export interface OutboxEventPayload {
  message: unknown;
  tempId: string;
  visitorUid: string;
  [key: string]: unknown; // Index signature for Record<string, unknown> compatibility
}

@Injectable()
export class OutboxPersistenceService {
  private readonly logger = new Logger(OutboxPersistenceService.name);

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>
  ) {}

  /**
   * Creates an outbox event within a transaction.
   * Uses TypeORM entity instead of raw SQL for type safety.
   *
   * @param aggregateType - The type of aggregate (e.g., 'message')
   * @param aggregateId - The ID of the aggregate
   * @param eventType - The type of event (from WorkerEventTypes)
   * @param payload - The event payload
   * @param manager - The EntityManager from an active transaction
   */
  async createEvent(
    aggregateType: string,
    aggregateId: string | number,
    eventType: WorkerEventType,
    payload: OutboxEventPayload,
    manager: EntityManager
  ): Promise<OutboxEvent> {
    const outboxRepo = manager.getRepository(OutboxEvent);

    const event = outboxRepo.create({
      aggregateType,
      aggregateId: String(aggregateId),
      eventType,
      payload,
    });

    const savedEvent = await outboxRepo.save(event);

    this.logger.log(
      `Inserted outbox event for ${aggregateType}:${aggregateId} (type: ${eventType})`
    );

    return savedEvent;
  }

  /**
   * Fetches unprocessed outbox events with row-level locking to prevent race conditions.
   * Uses `FOR UPDATE SKIP LOCKED` to allow concurrent processors.
   *
   * @param manager - The EntityManager from an active transaction
   * @param limit - Maximum number of events to fetch
   * @returns Array of unprocessed OutboxEvent entities
   */
  async fetchAndLockUnprocessedEvents(
    manager: EntityManager,
    limit: number = 100
  ): Promise<OutboxEvent[]> {
    return manager.query(
      `SELECT * FROM outbox_events ORDER BY created_at ASC LIMIT $1 FOR UPDATE SKIP LOCKED`,
      [limit]
    );
  }

  /**
   * Deletes outbox events by their IDs after successful processing.
   *
   * @param manager - The EntityManager from an active transaction
   * @param eventIds - Array of event IDs to delete
   */
  async deleteEvents(manager: EntityManager, eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;

    await manager.query(`DELETE FROM outbox_events WHERE id = ANY($1)`, [eventIds]);

    this.logger.log(`Deleted ${eventIds.length} processed outbox events.`);
  }
}
