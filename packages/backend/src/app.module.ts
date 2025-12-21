import {
  Module,
  NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { InboxModule } from './inbox/inbox.module';
import { GatewayModule } from './gateway/gateway.module';
import { RbacModule } from './rbac/rbac.module';
import { ProjectModule } from './projects/project.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { HttpModule } from '@nestjs/axios';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CommonModule } from './common/common.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { REDIS_PUBLISHER_CLIENT, RedisModule } from './redis/redis.module';
import { ScreenshotModule } from './screenshot/screenshot.module';
import { RedisClientType } from 'redis';
import { MailModule } from './mail/mail.module';
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
} from './database/entities';

import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
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
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [RedisModule],
      useFactory: async (redisClient: RedisClientType) => {
        return {
          store: redisStore,
          client: redisClient,
        };
      },
      inject: [REDIS_PUBLISHER_CLIENT],
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('PSQL_HOST');
        const username = configService.get<string>('PSQL_USER');
        const database = configService.get<string>('PSQL_DATABASE');

        if (!host || !username || !database) {
          throw new Error(
            'Missing required database environment variables: PSQL_HOST, PSQL_USER, or PSQL_DATABASE'
          );
        }

        return {
          type: 'postgres',
          host,
          port: configService.get<number>('PSQL_PORT') || 5432,
          username,
          password: configService.get<string>('PSQL_PASSWORD') || '',
          database,
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
          ],
          namingStrategy: new SnakeNamingStrategy(),
          synchronize: false,
        };
      },
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    RedisModule,
    AuthModule,
    UserModule,
    InboxModule,
    GatewayModule,
    RbacModule,
    ProjectModule,
    CommonModule,
    MailModule,
    ScreenshotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure() {}
}
