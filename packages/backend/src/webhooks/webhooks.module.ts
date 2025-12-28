import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhookDispatcher } from './webhook.dispatcher';
import { WebhookProcessor } from './webhook.processor';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { WEBHOOKS_QUEUE } from '../common/constants';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookSubscription, WebhookDelivery]),
    BullModule.registerQueue({
      name: WEBHOOKS_QUEUE,
    }),
    RedisModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookDispatcher, WebhookProcessor],
  exports: [WebhooksService],
})
export class WebhooksModule {}
