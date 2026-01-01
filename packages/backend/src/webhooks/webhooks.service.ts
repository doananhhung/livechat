import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { randomBytes } from 'crypto';
import * as ipaddr from 'ipaddr.js';
import { URL } from 'url';
import * as dns from 'dns';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(WebhookSubscription)
    private readonly subscriptionRepo: Repository<WebhookSubscription>,
  ) {}

  private generateSecret(): string {
    return `sk_wh_${randomBytes(24).toString('hex')}`;
  }

  // SSRF Protection
  private async validateUrl(urlString: string): Promise<void> {
    try {
      const parsedUrl = new URL(urlString);
      const hostname = parsedUrl.hostname;

      // Test environment: allow loopback for local test servers
      // This enables E2E testing without external dependencies
      if (process.env.NODE_ENV === 'test' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
        return;
      }

      // Resolve DNS
      let addresses: string[];
      try {
        const result = await dns.promises.lookup(hostname, { all: true });
        addresses = result.map(r => r.address);
      } catch (error) {
         // If DNS fails, it's safer to block
         throw new BadRequestException('Could not resolve hostname');
      }

      for (const ip of addresses) {
        if (!ipaddr.isValid(ip)) continue;
        
        const addr = ipaddr.parse(ip);
        // Handle IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
        const checkAddr = addr.kind() === 'ipv6' && (addr as ipaddr.IPv6).isIPv4MappedAddress() 
          ? (addr as ipaddr.IPv6).toIPv4Address() 
          : addr;

        const range = checkAddr.range();
        
        // Block private ranges
        if (range === 'loopback' || range === 'private' || range === 'uniqueLocal' || range === 'carrierGradeNat') {
           throw new BadRequestException(`Resolved IP ${ip} is in a private range`);
        }
      }

    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Invalid URL');
    }
  }

  async create(projectId: number, dto: CreateSubscriptionDto): Promise<WebhookSubscription> {
    await this.validateUrl(dto.url);

    const subscription = this.subscriptionRepo.create({
      projectId,
      ...dto,
      secret: this.generateSecret(),
    });
    return this.subscriptionRepo.save(subscription);
  }

  async findAll(projectId: number): Promise<WebhookSubscription[]> {
    return this.subscriptionRepo.find({ where: { projectId } });
  }

  async findOne(id: string, projectId: number): Promise<WebhookSubscription | null> {
    return this.subscriptionRepo.findOne({ where: { id, projectId } });
  }

  async delete(id: string, projectId: number): Promise<void> {
    await this.subscriptionRepo.delete({ id, projectId });
  }

  // Internal method for Dispatcher
  async findActiveByProjectAndTrigger(projectId: number, trigger: string): Promise<WebhookSubscription[]> {
    // We can optimize this with a custom query or query builder
    const subs = await this.subscriptionRepo.find({
      where: { projectId, isActive: true },
    });
    return subs.filter(sub => sub.eventTriggers.includes(trigger));
  }
}
