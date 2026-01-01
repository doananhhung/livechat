import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookDelivery, DeliveryStatus } from './entities/webhook-delivery.entity';
import { WebhooksService } from './webhooks.service';
import { WEBHOOKS_QUEUE } from '../common/constants';
import * as crypto from 'crypto';
import axios from 'axios';

@Processor(WEBHOOKS_QUEUE)
@Injectable()
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly webhooksService: WebhooksService,
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepo: Repository<WebhookDelivery>,
  ) {
    super();
    this.logger.log('[STARTUP] WebhookProcessor initialized');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { subscriptionId, eventId, trigger, payload } = job.data;
    this.logger.debug(`Processing webhook for subscription ${subscriptionId}`);

    const subscription = await this.webhooksService.findOne(subscriptionId, payload.projectId);
    
    // Create initial delivery record
    const delivery = this.deliveryRepo.create({
      subscriptionId,
      eventId: typeof eventId === 'number' ? eventId.toString() : eventId, // Handle BigInt/String mismatch
      status: DeliveryStatus.PENDING,
      requestPayload: payload,
    });
    await this.deliveryRepo.save(delivery);

    if (!subscription || !subscription.isActive) {
      this.logger.warn(`Subscription ${subscriptionId} not found or inactive`);
      delivery.status = DeliveryStatus.FAILURE;
      delivery.error = 'Subscription inactive or not found';
      await this.deliveryRepo.save(delivery);
      return;
    }

    try {
      const signature = this.signPayload(payload, subscription.secret);
      
      const response = await axios.post(subscription.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': signature,
          'User-Agent': 'LiveChat-Webhooks/1.0',
          'X-LiveChat-Event': trigger,
        },
        timeout: 5000, // 5s hard timeout
      });

      delivery.status = DeliveryStatus.SUCCESS;
      delivery.responseStatus = response.status;
      await this.deliveryRepo.save(delivery);
      
          } catch (error) {
            delivery.status = DeliveryStatus.FAILURE;
            if (axios.isAxiosError(error)) {        delivery.responseStatus = error.response?.status ?? 0;
        delivery.error = error.message;
      } else {
        delivery.error = String(error);
      }
      await this.deliveryRepo.save(delivery);
      throw error; // Rethrow to trigger BullMQ retry
    }
  }

  private signPayload(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }
}