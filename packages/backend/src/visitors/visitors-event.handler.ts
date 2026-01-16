
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { VisitorDisconnectedEvent, VisitorConnectedEvent } from './events';
import { VisitorsService } from './visitors.service';

@Injectable()
export class VisitorsEventHandler {
  private readonly logger = new Logger(VisitorsEventHandler.name);

  constructor(private readonly visitorsService: VisitorsService) {}

  @OnEvent('visitor.disconnected')
  async handleVisitorDisconnected(event: VisitorDisconnectedEvent): Promise<void> {
    this.logger.debug(`Handling visitor.disconnected for visitorUid: ${event.visitorUid}`);

    // Update lastSeenAt
    try {
      await this.visitorsService.updateLastSeenAtByUid(event.visitorUid);
    } catch (err) {
      this.logger.error(`Failed to update lastSeenAt for visitorUid ${event.visitorUid}`, err);
    }
  }

  @OnEvent('visitor.connected')
  async handleVisitorConnected(event: VisitorConnectedEvent): Promise<void> {
    this.logger.debug(`Handling visitor.connected for visitorUid: ${event.visitorUid}`);

    // Update lastSeenAt on connect as well
    try {
      await this.visitorsService.updateLastSeenAtByUid(event.visitorUid);
    } catch (err) {
      this.logger.error(`Failed to update lastSeenAt for visitorUid ${event.visitorUid}`, err);
    }
  }
}

