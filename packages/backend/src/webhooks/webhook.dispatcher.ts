import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { NEW_MESSAGE_CHANNEL, WEBHOOKS_QUEUE } from '../common/constants';
import { REDIS_SUBSCRIBER_CLIENT } from '../redis/redis.module';
import { WebhooksService } from './webhooks.service';

@Injectable()
export class WebhookDispatcher implements OnModuleInit {
  private readonly logger = new Logger(WebhookDispatcher.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER_CLIENT) private readonly redisSubscriber: Redis,
    @InjectQueue(WEBHOOKS_QUEUE) private readonly webhooksQueue: Queue,
    private readonly webhooksService: WebhooksService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Webhook Dispatcher...');
    
    await this.redisSubscriber.subscribe(NEW_MESSAGE_CHANNEL, (err) => {
      if (err) {
        this.logger.error(`Failed to subscribe to ${NEW_MESSAGE_CHANNEL}`, err);
      } else {
        this.logger.log(`Subscribed to ${NEW_MESSAGE_CHANNEL}`);
      }
    });

    this.redisSubscriber.on('message', async (channel, message) => {
      if (channel === NEW_MESSAGE_CHANNEL) {
        await this.handleNewMessage(message);
      }
    });
  }

  private async handleNewMessage(messageData: string) {
    try {
      const payload = JSON.parse(messageData);
      // Payload structure: { message: {...}, tempId, visitorUid, projectId }
      
      const projectId = payload.projectId;
      if (!projectId) {
        this.logger.debug('Skipping webhook dispatch: Missing projectId in event payload');
        return;
      }

      await this.processEvent(projectId, 'message.created', payload);
    } catch (error) {
      this.logger.error('Error handling Redis message', error);
    }
  }

  private async processEvent(projectId: number, eventName: string, payload: any) {
    const subscriptions = await this.webhooksService.findActiveByProjectAndTrigger(projectId, eventName);
    
    if (subscriptions.length === 0) {
      return;
    }

    this.logger.debug(`Dispatching event ${eventName} to ${subscriptions.length} subscriptions for project ${projectId}`);

    const jobs = subscriptions.map(sub => ({
      name: 'send-webhook',
      data: {
        subscriptionId: sub.id,
        eventId: payload.message?.id || Date.now().toString(), // Use message ID as idempotency key if available
        trigger: eventName,
        payload: payload
      },
      opts: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      }
    }));

    await this.webhooksQueue.addBulk(jobs);
  }
}
