
import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Client } from 'pg';
import { ConfigService } from '@nestjs/config';
import { REDIS_PUBLISHER_CLIENT } from '../redis/redis.module';
import { Redis } from 'ioredis';
import { OUTBOX_CHANNEL, NEW_MESSAGE_CHANNEL } from '../common/constants';
import { OutboxPersistenceService } from './outbox.persistence.service';

@Injectable()
export class OutboxListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxListenerService.name);
  private pgClient: Client;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    @Inject(REDIS_PUBLISHER_CLIENT) private readonly redisPublisher: Redis,
    private readonly outboxPersistenceService: OutboxPersistenceService
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Outbox Listener...');
    
    this.pgClient = new Client({
      host: this.configService.get<string>('PSQL_HOST'),
      port: this.configService.get<number>('PSQL_PORT'),
      user: this.configService.get<string>('PSQL_USER'),
      password: this.configService.get<string>('PSQL_PASSWORD'),
      database: this.configService.get<string>('PSQL_DATABASE'),
    });

    try {
      await this.pgClient.connect();
      this.logger.log('Dedicated PostgreSQL client connected for LISTEN/NOTIFY.');

      this.pgClient.on('notification', async (msg) => {
        this.logger.debug(`Received notification on channel: ${msg.channel}`);
        if (msg.channel === OUTBOX_CHANNEL) {
          await this.processOutboxEvents();
        }
      });

      await this.pgClient.query(`LISTEN ${OUTBOX_CHANNEL}`);
      this.logger.log(`Successfully listening on "${OUTBOX_CHANNEL}".`);

      // Optional: Add a fallback poller for added robustness
      setInterval(() => this.processOutboxEvents(), 60000); // every 60 seconds
    } catch (error) {
      this.logger.error('Failed to initialize Outbox Listener', error);
    }
  }

  async onModuleDestroy() {
    if (this.pgClient) {
      this.logger.log('Closing PostgreSQL client...');
      await this.pgClient.end();
    }
  }

  private async processOutboxEvents() {
    this.logger.debug('Processing outbox events...');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      // Use persistence service for data access
      const events = await this.outboxPersistenceService.fetchAndLockUnprocessedEvents(
        queryRunner.manager,
        100
      );

      if (events.length === 0) {
        await queryRunner.commitTransaction();
        return;
      }

      this.logger.log(`Found ${events.length} events to process.`);

      for (const event of events) {
        await this.redisPublisher.publish(
          NEW_MESSAGE_CHANNEL,
          JSON.stringify(event.payload)
        );
      }

      const eventIds = events.map((e) => e.id);
      await this.outboxPersistenceService.deleteEvents(queryRunner.manager, eventIds);

      await queryRunner.commitTransaction();
      this.logger.log(
        `Successfully processed and deleted ${events.length} events.`
      );
    } catch (error) {
      this.logger.error('Error processing outbox events', error);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}
