import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
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
  VisitorNote,
  WebhookSubscription,
  WebhookDelivery,
  CannedResponse,
  ActionTemplate,
  ActionSubmission,
} from './entities';
import { AuditLog } from '../audit-logs/audit.entity';

/**
 * All database entities used in the application.
 * Exported as a single array for consistency between API and Worker.
 */
export const DATABASE_ENTITIES = [
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
  WebhookSubscription,
  WebhookDelivery,
  AuditLog,
  CannedResponse,
  VisitorNote,
  ActionTemplate,
  ActionSubmission,
];

/**
 * Shared TypeORM configuration factory.
 * Used by both the API (AppModule) and Worker (EventConsumerModule)
 * to ensure consistent database configuration.
 */
export const createTypeOrmConfig = (configService: ConfigService) => {
  const host = configService.get<string>('PSQL_HOST');
  const username = configService.get<string>('PSQL_USER');
  const database = configService.get<string>('PSQL_DATABASE');
  const nodeEnv = configService.get<string>('NODE_ENV');

  if (!host || !username || !database) {
    throw new Error(
      'Missing required database environment variables: PSQL_HOST, PSQL_USER, or PSQL_DATABASE'
    );
  }

  return {
    type: 'postgres' as const,
    host,
    port: configService.get<number>('PSQL_PORT') || 5432,
    username,
    password: configService.get<string>('PSQL_PASSWORD') || '',
    database,
    entities: DATABASE_ENTITIES,
    namingStrategy: new SnakeNamingStrategy(),
    // Enable synchronize for test environment only (auto-creates schema)
    synchronize: nodeEnv === 'test',
  };
};

/**
 * Async TypeORM module options for NestJS.
 * Import this in both AppModule and EventConsumerModule.
 */
export const TYPEORM_CONFIG: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: createTypeOrmConfig,
};
