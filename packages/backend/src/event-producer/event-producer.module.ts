import { Module } from '@nestjs/common';
import { BullMqProducerService } from './bullmq-producer.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'live-chat-events-queue',
    }),
  ],
  providers: [BullMqProducerService],
  exports: [BullMqProducerService],
})
export class EventProducerModule {}
