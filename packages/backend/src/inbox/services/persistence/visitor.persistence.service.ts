
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Visitor } from '../../../database/entities';

@Injectable()
export class VisitorPersistenceService {
  /**
   * Finds an existing visitor by their unique UID or creates a new one if not found.
   * This operation is designed to be used within a transaction.
   * @param projectId The ID of the project the visitor belongs to.
   * @param visitorUid The unique identifier for the visitor (from client-side).
   * @param manager The EntityManager from an active transaction.
   * @returns The found or newly created Visitor entity.
   */
  async findOrCreateByUid(
    projectId: number,
    visitorUid: string,
    manager: EntityManager
  ): Promise<Visitor> {
    let visitor = await manager.findOne(Visitor, {
      where: { visitorUid },
    });

    if (!visitor) {
      // Generate a user-friendly display name for new visitors
      const displayName = `Visitor #${visitorUid.substring(0, 6)}`;

      visitor = manager.create(Visitor, {
        projectId,
        visitorUid,
        displayName,
        lastSeenAt: new Date(),
      });
      await manager.save(visitor);
    } else {
      // Update last seen timestamp for returning visitors
      visitor.lastSeenAt = new Date();
      await manager.save(visitor);
    }

    return visitor;
  }
}
