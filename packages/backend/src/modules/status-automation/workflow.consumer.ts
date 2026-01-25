import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../database/entities';
import { ConversationStatus, WorkerEventTypes } from '@live-chat/shared-types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConversationUpdatedEvent } from '../../inbox/events';

interface AutoPendingJob {
  conversationId: string;
  projectId: number;
  triggerMessageId: string;
}

export class AutomationTriggeredEvent {
  projectId: number;
  conversationId: string;
  type: string;
  message: string;
}

@Processor('conversation-workflow-queue')
export class WorkflowConsumer extends WorkerHost {
  private readonly logger = new Logger(WorkflowConsumer.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<AutoPendingJob>): Promise<void> {
    const { conversationId, projectId, triggerMessageId } = job.data;
    
    this.logger.debug(`Processing auto-pending job for conversation ${conversationId}, trigger: ${triggerMessageId}`);

    // Atomic Update:
    // Update status to PENDING only if:
    // 1. ID matches
    // 2. Status is OPEN
    // 3. Last Message ID matches the trigger message ID (Agent's message)
    
    const result = await this.conversationRepo
      .createQueryBuilder()
      .update(Conversation)
      .set({ status: ConversationStatus.PENDING })
      .where('id = :id', { id: conversationId })
      .andWhere('status = :status', { status: ConversationStatus.OPEN })
      .andWhere('last_message_id = :triggerId', { triggerId: triggerMessageId })
      .execute();

    if (result?.affected && result.affected > 0) {
      this.logger.log(`Auto-pending triggered for conversation ${conversationId}`);
      
      // Emit conversation updated event
      const updateEvent = new ConversationUpdatedEvent();
      updateEvent.projectId = projectId;
      updateEvent.payload = {
        conversationId: conversationId,
        fields: {
          status: ConversationStatus.PENDING,
        },
      };
      this.eventEmitter.emit('conversation.updated', updateEvent);

      // Emit automation triggered event
      const automationEvent = new AutomationTriggeredEvent();
      automationEvent.projectId = projectId;
      automationEvent.conversationId = conversationId;
      automationEvent.type = 'auto_pending';
      automationEvent.message = 'Conversation automatically moved to Pending due to inactivity.';
      this.eventEmitter.emit('automation.triggered', automationEvent);
    } else {
        this.logger.debug(`Auto-pending skipped for conversation ${conversationId} (Condition failed or already handled).`);
    }
  }
}

