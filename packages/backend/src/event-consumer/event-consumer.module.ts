// src/event-consumer/event-consumer.module.ts

import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventConsumerService } from './event-consumer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { BullModule } from '@nestjs/bullmq';
import { EventProcessor } from './event.processor';
import { OutboxEvent } from '../database/entities';
import { OutboxListenerService } from './outbox-listener.service';
import { RedisModule } from '../redis/redis.module';
import { InboxPersistenceModule } from '../inbox/inbox.persistence.module';
import { OutboxPersistenceService } from './outbox.persistence.service';
import { TYPEORM_CONFIG } from '../database/database.config';

export const LIVE_CHAT_EVENTS_QUEUE = 'live-chat-events-queue';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forFeature([OutboxEvent]),
    // Use shared database configuration
    TypeOrmModule.forRootAsync(TYPEORM_CONFIG),
    InboxPersistenceModule,
    RedisModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get('REDIS_PORT') || '6379', 10),
          db: parseInt(configService.get('REDIS_DB') || '0', 10),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: LIVE_CHAT_EVENTS_QUEUE,
    }),
  ],
  providers: [
    EventConsumerService,
    EventProcessor,
    OutboxPersistenceService,
    Logger,
    OutboxListenerService,
  ],
})
export class EventConsumerModule {}
