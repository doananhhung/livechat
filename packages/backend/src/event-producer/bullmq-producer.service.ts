import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class BullMqProducerService {
  private readonly logger = new Logger(BullMqProducerService.name);

  constructor(
    @InjectQueue('live-chat-events-queue') private readonly queue: Queue
  ) {}

  async sendMessage(payload: any): Promise<string> {
    try {
      const job = await this.queue.add('event-job', payload, {
        removeOnComplete: true,
        removeOnFail: false,
      });
      this.logger.log(`Successfully added job ${job.id} to BullMQ.`);
      this.logger.debug(`Job payload: ${JSON.stringify(payload)}`);
      return job.id as string;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to add job to BullMQ: ${error.message}`,
          error.stack
        );
      } else {
        this.logger.error(
          `An unknown error occurred while adding a job to BullMQ`,
          error
        );
      }
      throw error;
    }
  }
}
