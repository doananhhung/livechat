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
import { WebhookProcessor } from '../../src/webhooks/webhook.processor';
import { WebhookDelivery } from '../../src/webhooks/entities/webhook-delivery.entity';
import { WebhooksService } from '../../src/webhooks/webhooks.service';
import { WebhookSubscription } from '../../src/webhooks/entities/webhook-subscription.entity';

/**
 * This module extends AppModule by adding the EventProcessor and WebhookProcessor
 * (BullMQ workers) as providers.
 * 
 * InboxPersistenceModule provides:
 * - ConversationPersistenceService
 * - VisitorPersistenceService  
 * - MessagePersistenceService
 * (Required by EventConsumerService)
 */
@Module({
  imports: [
    AppModule,
    InboxPersistenceModule,
    TypeOrmModule.forFeature([OutboxEvent, WebhookDelivery, WebhookSubscription]),
  ],
  providers: [
    EventConsumerService,
    EventProcessor,
    OutboxPersistenceService,
    OutboxListenerService,
    // Webhook processor for webhook E2E tests
    WebhooksService,
    // WebhookProcessor is provided by WebhooksModule imported via AppModule (or we should import WebhooksModule here if not)
    // But since AppModule imports WebhooksModule which provides WebhookProcessor, we don't need it here if we import AppModule.
    // However, E2ETestModule imports AppModule which imports WebhooksModule.
    // So WebhookProcessor is already available.
  ],
})
export class E2ETestModule {}
