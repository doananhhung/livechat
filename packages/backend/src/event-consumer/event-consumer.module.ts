// src/event-consumer/event-consumer.module.ts

import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventConsumerService } from './event-consumer.service';
import { InboxModule } from '../inbox/inbox.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { GatewayModule } from '../gateway/gateway.module';
import { BullModule } from '@nestjs/bullmq';
import { EventProcessor } from './event.processor';
import {
  Conversation,
  EmailChangeRequest,
  Invitation,
  Message,
  Project,
  ProjectMember,
  RefreshToken,
  TwoFactorRecoveryCode,
  User,
  UserIdentity,
  Visitor,
  OutboxEvent,
} from '../database/entities';
import { OutboxListenerService } from './outbox-listener.service';
import { RedisModule } from '../redis/redis.module';

export const LIVE_CHAT_EVENTS_QUEUE = 'live-chat-events-queue';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GatewayModule,
    TypeOrmModule.forFeature([OutboxEvent]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('PSQL_HOST'),
        port: configService.get<number>('PSQL_PORT'),
        username: configService.get<string>('PSQL_USER'),
        password: configService.get<string>('PSQL_PASSWORD'),
        database: configService.get<string>('PSQL_DATABASE'),
        entities: [
          Conversation,
          EmailChangeRequest,
          Invitation,
          Message,
          Project,
          ProjectMember,
          RefreshToken,
          TwoFactorRecoveryCode,
          User,
          UserIdentity,
          Visitor,
          OutboxEvent,
        ],
        namingStrategy: new SnakeNamingStrategy(),
        synchronize: false,
      }),
    }),
    InboxModule,
    RedisModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get('REDIS_PORT') || '6379', 10),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'live-chat-events-queue',
    }),
  ],
  providers: [
    EventConsumerService,
    EventProcessor,
    Logger,
    OutboxListenerService,
  ],
})
export class EventConsumerModule {}
