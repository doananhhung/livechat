
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { EventConsumerService } from './event-consumer.service';

@Processor('live-chat-events-queue')
@Injectable()
export class EventProcessor extends WorkerHost {
  private readonly logger = new Logger(EventProcessor.name);

  constructor(private readonly eventConsumerService: EventConsumerService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
    try {
      if (job.name === 'event-job') {
        const payload = job.data;
        const event = payload;

        await this.eventConsumerService.processEvent(event);
      }
    } catch (error) {
       this.logger.error(`Failed to process job ${job.id}`, error);
       throw error;
    }
  }
}
