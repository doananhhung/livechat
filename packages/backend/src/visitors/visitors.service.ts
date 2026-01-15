import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visitor } from '../database/entities/visitor.entity';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { RealtimeSessionService } from '../realtime-session/realtime-session.service';
import { EventsGateway } from '../gateway/events.gateway';
import { Visitor as SharedVisitorType, WebSocketEvent } from '@live-chat/shared-types'; // ADDED WebSocketEvent

@Injectable()
export class VisitorsService {
  constructor(
    @InjectRepository(Visitor)
    private readonly visitorRepository: Repository<Visitor>,
    @Inject(forwardRef(() => EventsGateway)) private readonly eventsGateway: EventsGateway,
    private readonly realtimeSessionService: RealtimeSessionService,
  ) {}

  /**
   * Finds a visitor by their ID and project ID, populating their online status.
   *
   * @param projectId The ID of the project the visitor belongs to.
   * @param visitorId The ID of the visitor to find.
   * @returns The visitor entity with the isOnline status (as SharedVisitorType).
   * @throws NotFoundException if the visitor is not found.
   */
  async findOne(projectId: number, visitorId: number): Promise<SharedVisitorType> {
    const visitorEntity = await this.visitorRepository.findOne({
      where: { id: visitorId, projectId: projectId },
    });

    if (!visitorEntity) {
      throw new NotFoundException(`Visitor with ID ${visitorId} not found in project ${projectId}.`);
    }

    const isOnline = await this.realtimeSessionService.isVisitorOnline(visitorEntity.visitorUid);

    // Explicitly map properties to ensure type compatibility
    const sharedVisitor: SharedVisitorType = {
      id: visitorEntity.id,
      projectId: visitorEntity.projectId,
      visitorUid: visitorEntity.visitorUid,
      displayName: visitorEntity.displayName || null,
      // Temporarily cast to any to handle potential missing properties like email/phone
      email: (visitorEntity as any).email || null,
      phone: (visitorEntity as any).phone || null,
      customData: (visitorEntity as any).customData || null,
      currentUrl: (visitorEntity as any).currentUrl || null,
      lastSeenAt: visitorEntity.lastSeenAt, // Changed from || null
      createdAt: visitorEntity.createdAt,
      updatedAt: visitorEntity.updatedAt,
      isOnline: isOnline,
    };

    return sharedVisitor;
  }

  /**
   * Updates a visitor's display name.
   *
   * @param projectId The ID of the project the visitor belongs to.
   * @param visitorId The ID of the visitor to update.
   * @param updateVisitorDto The DTO containing the new display name.
   * @returns The updated visitor entity (as SharedVisitorType).
   * @throws NotFoundException if the visitor is not found.
   * @throws BadRequestException if the display name validation fails (though primarily handled by DTO validation).
   */
  async updateDisplayName(
    projectId: number,
    visitorId: number,
    updateVisitorDto: UpdateVisitorDto,
  ): Promise<SharedVisitorType> {
    const { displayName } = updateVisitorDto;

    // Although DTO validation handles length, a quick check here ensures robustness
    if (!displayName || displayName.trim().length === 0) {
      throw new BadRequestException('Display name cannot be empty.');
    }
    if (displayName.length > 50) {
        throw new BadRequestException('Display name cannot exceed 50 characters.');
    }

    const visitor = await this.visitorRepository.findOne({
      where: { id: visitorId, projectId: projectId },
    });

    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${visitorId} not found in project ${projectId}.`);
    }

    visitor.displayName = displayName;
    await this.visitorRepository.save(visitor);

    // Fetch the updated visitor with online status before emitting and returning
    const updatedVisitor = await this.findOne(projectId, visitorId);

    // Emit WebSocket event for real-time updates
    this.eventsGateway.server.to(`project.${projectId}`).emit(WebSocketEvent.VISITOR_UPDATED, {
      projectId: projectId,
      visitorId: updatedVisitor.id,
      visitor: updatedVisitor,
    });

    return updatedVisitor;
  }

  /**
   * Updates the lastSeenAt timestamp for a visitor.
   *
   * @param visitorId The ID of the visitor to update.
   */
  async updateLastSeenAt(visitorId: number): Promise<void> {
    await this.visitorRepository.update(visitorId, { lastSeenAt: new Date() });
  }

  /**
   * Updates the lastSeenAt timestamp for a visitor by their UID.
   *
   * @param visitorUid The UID of the visitor to update.
   */
  async updateLastSeenAtByUid(visitorUid: string): Promise<void> {
    await this.visitorRepository.update({ visitorUid }, { lastSeenAt: new Date() });
  }
}
