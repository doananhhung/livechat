
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
        // The payload usually comes as { type, payload: {...} } or similar structure
        // depending on how it was sent.
        // In SqsService passing:
        // sendMessage(payload: any) -> MessageBody: JSON.stringify(payload)
        // In EventConsumerService: const event = JSON.parse(message.Body); const { type, payload } = event;

        // So here 'job.data' IS the 'event' object.
        const event = payload;

        // We can reuse the logic in EventConsumerService if we expose a method
        // or we can move the logic here.
        // For now, let's expose a public method in EventConsumerService to handle the event logic
        // so we don't duplicate code or break dependencies involving EntityManager/Services.

        // Actually, let's look at EventConsumerService.handleMessage(message: Message)
        // It parses body and calls handleNewMessageFromVisitor.
        // I will refactor EventConsumerService to have a 'processEvent(event: any)' method.

        await this.eventConsumerService.processEvent(event);
      }
    } catch (error) {
       this.logger.error(`Failed to process job ${job.id}`, error);
       throw error;
    }
  }
}
