import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visitor } from '../database/entities/visitor.entity';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class VisitorsService {
  constructor(
    @InjectRepository(Visitor)
    private readonly visitorRepository: Repository<Visitor>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Updates a visitor's display name.
   *
   * @param projectId The ID of the project the visitor belongs to.
   * @param visitorId The ID of the visitor to update.
   * @param updateVisitorDto The DTO containing the new display name.
   * @returns The updated visitor entity.
   * @throws NotFoundException if the visitor is not found.
   * @throws BadRequestException if the display name validation fails (though primarily handled by DTO validation).
   */
  async updateDisplayName(
    projectId: number,
    visitorId: number,
    updateVisitorDto: UpdateVisitorDto,
  ): Promise<Visitor> {
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

    // Emit WebSocket event for real-time updates
    this.eventsGateway.server.to(`project.${projectId}`).emit('visitorUpdated', {
      projectId: projectId,
      visitorId: visitor.id,
      visitor: visitor,
    });

    return visitor;
  }
}
