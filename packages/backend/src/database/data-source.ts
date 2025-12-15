import 'reflect-metadata';
import { DataSource } from 'typeorm';
import {
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
} from '@social-commerce/shared';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';

dotenv.config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('PSQL_HOST') || 'localhost',
  port: configService.get<number>('PSQL_PORT') || 5432,
  username: configService.get<string>('PSQL_USER') || 'hoang',
  password: configService.get<string>('PSQL_PASSWORD') || '',
  database: configService.get<string>('PSQL_DATABASE') || 'your_database',
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
  ],
  migrations: ['src/database/migrations/*.ts'],
  namingStrategy: new SnakeNamingStrategy(),
});
