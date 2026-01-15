import { Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLoggerInterceptor } from './audit-logs/audit.interceptor';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { InboxModule } from './inbox/inbox.module';
import { GatewayModule } from './gateway/gateway.module';
import { RbacModule } from './rbac/rbac.module';
import { ProjectModule } from './projects/project.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CommonModule } from './common/common.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { REDIS_PUBLISHER_CLIENT, RedisModule } from './redis/redis.module';
import { ScreenshotModule } from './screenshot/screenshot.module';
import { RedisClientType } from 'redis';
import { MailModule } from './mail/mail.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { TYPEORM_CONFIG } from './database/database.config';
import { AuditModule } from './audit-logs/audit.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CannedResponsesModule } from './canned-responses/canned-responses.module';
import { VisitorNotesModule } from './visitor-notes/visitor-notes.module';
import { VisitorsModule } from './visitors/visitors.module'; // Import VisitorsModule

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
        prefix: configService.get('BULL_PREFIX') || 'bull',
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
    // Use shared database configuration
    TypeOrmModule.forRootAsync(TYPEORM_CONFIG),
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
    AuditModule,
    WebhooksModule,
    CannedResponsesModule,
    VisitorNotesModule,
    VisitorsModule, // Add VisitorsModule here
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLoggerInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure() {}
}