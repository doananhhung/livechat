import 'reflect-metadata';
import { DataSource } from 'typeorm';
import {
  Invitation,
  Project,
  ProjectMember,
  RefreshToken,
  TwoFactorRecoveryCode,
  User,
  UserIdentity,
  Visitor,
  EmailChangeRequest,
  OutboxEvent,
  VisitorNote,
  Conversation,
  Message,
  WebhookSubscription,
  WebhookDelivery,
  CannedResponse,
  ActionTemplate,
  ActionSubmission,
} from './entities';
import { AuditLog } from '../audit-logs/audit.entity';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';

dotenv.config();

const configService = new ConfigService();

// Validate required environment variables
const requiredEnvVars = ['PSQL_HOST', 'PSQL_USER', 'PSQL_DATABASE'];
for (const envVar of requiredEnvVars) {
  if (!configService.get<string>(envVar)) {
    throw new Error(
      `Missing required environment variable: ${envVar}. ` +
        'Ensure your .env file is configured correctly.'
    );
  }
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('PSQL_HOST'),
  port: configService.get<number>('PSQL_PORT') || 5432,
  username: configService.get<string>('PSQL_USER'),
  password: configService.get<string>('PSQL_PASSWORD') || '',
  database: configService.get<string>('PSQL_DATABASE'),
  synchronize: false,
  logging: false,
  entities: [
    Conversation,
    Invitation,
    Message,
    Project,
    ProjectMember,
    RefreshToken,
    TwoFactorRecoveryCode,
    User,
    UserIdentity,
    Visitor,
    EmailChangeRequest,
    OutboxEvent,
    WebhookSubscription,
    WebhookDelivery,
    AuditLog,
    CannedResponse,
    VisitorNote,
    ActionTemplate,
    ActionSubmission,
  ],
  migrations: ['src/database/migrations/*.ts'],
  namingStrategy: new SnakeNamingStrategy(),
});
