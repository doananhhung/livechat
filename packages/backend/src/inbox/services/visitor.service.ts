
// src/inbox/services/visitor.service.ts

import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Visitor } from '../../database/entities';
import { RealtimeSessionService } from '../../realtime-session/realtime-session.service';
import { VisitorPersistenceService } from './persistence/visitor.persistence.service';

@Injectable()
export class VisitorService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly realtimeSessionService: RealtimeSessionService,
    private readonly visitorPersistenceService: VisitorPersistenceService
  ) {}

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
    return this.visitorPersistenceService.findOrCreateByUid(
      projectId,
      visitorUid,
      manager
    );
  }

  /**
   * @NEW
   * Finds a visitor by their ID.
   * Used by the inbox controller to display visitor information.
   * Populates currentUrl and isOnline from Redis.
   * @param visitorId The ID of the visitor.
   * @returns The Visitor entity with runtime properties or null if not found.
   */
  async getVisitorById(visitorId: number): Promise<(Visitor & { isOnline: boolean | null }) | null> {
    const visitor = await this.entityManager.findOne(Visitor, {
      where: { id: visitorId },
    });

    if (visitor) {
      // Populate currentUrl from Redis
      visitor.currentUrl =
        await this.realtimeSessionService.getVisitorCurrentUrl(
          visitor.visitorUid
        );
      
      // Populate isOnline status from Redis
      const isOnline = await this.realtimeSessionService.isVisitorOnline(
        visitor.visitorUid
      );

      return { ...visitor, isOnline };
    }

    return null;
  }
}
