import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WorkflowConsumer } from './workflow.consumer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '../../database/entities';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'conversation-workflow-queue',
    }),
    TypeOrmModule.forFeature([Conversation]), // To allow consumer to access Conversation entity
  ],
  providers: [WorkflowConsumer],
  exports: [BullModule], // Export BullModule to allow other modules to inject the queue
})
export class WorkflowModule {}

