import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { type Redis } from 'ioredis';
import { REDIS_PUBLISHER_CLIENT } from '../redis/redis.module';

const NEW_MESSAGE_CHANNEL = 'new_message_channel';

@Injectable()
export class OutboxListenerService implements OnModuleInit {
  private readonly logger = new Logger(OutboxListenerService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(REDIS_PUBLISHER_CLIENT) private readonly redisPublisher: Redis
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Outbox Listener...');
    this.startListening();
  }

  private async startListening() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    // Access the underlying PostgreSQL driver connection
    const pgClient = (queryRunner.connection.driver as any).master;

    pgClient.on('notification', async (msg) => {
      this.logger.log(`Received notification on channel: ${msg.channel}`);
      if (msg.channel === 'outbox_channel') {
        await this.processOutboxEvents();
      }
    });

    await queryRunner.query('LISTEN outbox_channel');
    this.logger.log('Successfully listening on "outbox_channel".');

    // Optional: Add a fallback poller for added robustness
    setInterval(() => this.processOutboxEvents(), 60000); // every 60 seconds
  }

  private async processOutboxEvents() {
    this.logger.debug('Processing outbox events...');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      // Select and lock rows to prevent race conditions if you run multiple listeners
      const events = await queryRunner.manager.query(
        `SELECT * FROM outbox_events ORDER BY created_at ASC LIMIT 100 FOR UPDATE SKIP LOCKED`
      );

      if (events.length === 0) {
        await queryRunner.commitTransaction();
        return;
      }

      this.logger.log(`Found ${events.length} events to process.`);

      for (const event of events) {
        // This is the logic that used to be in EventConsumerService
        await this.redisPublisher.publish(
          NEW_MESSAGE_CHANNEL,
          JSON.stringify(event.payload)
        );
      }

      const eventIds = events.map((e) => e.id);
      await queryRunner.manager.query(
        `DELETE FROM outbox_events WHERE id = ANY($1)`,
        [eventIds]
      );

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
