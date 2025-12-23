/**
 * Unified E2E test module that combines AppModule (producer) with EventProcessor (consumer)
 * sharing the same BullMQ connection for proper integration testing.
 */
import { Module } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { EventProcessor } from '../../src/event-consumer/event.processor';
import { EventConsumerService } from '../../src/event-consumer/event-consumer.service';
import { OutboxPersistenceService } from '../../src/event-consumer/outbox.persistence.service';
import { OutboxListenerService } from '../../src/event-consumer/outbox-listener.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent } from '../../src/database/entities';
import { InboxPersistenceModule } from '../../src/inbox/inbox.persistence.module';

/**
 * This module extends AppModule by adding the EventProcessor (BullMQ worker)
 * as a provider. Since AppModule already registers the BullMQ queue,
 * the EventProcessor will share the same connection.
 * 
 * InboxPersistenceModule provides:
 * - ConversationPersistenceService
 * - VisitorPersistenceService  
 * - MessagePersistenceService
 * 
 * These are required by EventConsumerService.
 */
@Module({
  imports: [
    AppModule,
    InboxPersistenceModule,
    TypeOrmModule.forFeature([OutboxEvent]),
  ],
  providers: [
    EventConsumerService,
    EventProcessor,
    OutboxPersistenceService,
    OutboxListenerService,
  ],
})
export class E2ETestModule {}
