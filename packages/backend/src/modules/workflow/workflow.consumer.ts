import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../database/entities';
import { ConversationStatus, WorkerEventTypes } from '@live-chat/shared-types';
import { EventsGateway } from '../../gateway/events.gateway';

interface AutoPendingJob {
  conversationId: string;
  projectId: number;
  triggerMessageId: string;
}

@Processor('conversation-workflow-queue')
export class WorkflowConsumer extends WorkerHost {
  private readonly logger = new Logger(WorkflowConsumer.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    private readonly eventsGateway: EventsGateway,
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
      
      // Emit socket events
      
      // 1. General conversation update (for lists)
      this.eventsGateway.emitConversationUpdated(projectId, {
        conversationId: conversationId,
        fields: {
          status: ConversationStatus.PENDING,
        },
      });

      // 2. Specific automation triggered event (for Toast)
      // We can reuse a generic event or create a specific one. 
      // Using a custom event name via socket for the frontend to listen to.
      // Ideally this should be typed in shared-types.
      
      this.eventsGateway.server.to(`project:${projectId}`).emit('automation.triggered', {
        conversationId,
        type: 'auto_pending',
        message: 'Conversation automatically moved to Pending due to inactivity.',
      });
    } else {
        this.logger.debug(`Auto-pending skipped for conversation ${conversationId} (Condition failed or already handled).`);
    }
  }
}
