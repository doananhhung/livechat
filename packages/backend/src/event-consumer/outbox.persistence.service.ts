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
}
