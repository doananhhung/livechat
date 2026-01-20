import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit.entity';
import {
  AuditAction,
  JsonValue,
  CreateAuditLogDto,
} from '@live-chat/shared-types';
import { ListAuditLogsDto } from '@live-chat/shared-dtos';
import { PaginationDto } from '@live-chat/shared-types';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>
  ) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    try {
      // 1. Validation: Safe JSON check
      if (dto.metadata) {
        try {
          JSON.stringify(dto.metadata);
        } catch (e) {
          throw new Error(
            'Metadata contains circular reference or non-serializable data'
          );
        }
      }

      // 2. Prepare Entity
      const actorType = dto.actorType ?? (dto.actorId ? 'USER' : 'SYSTEM');

      const logEntry = this.auditRepository.create({
        projectId: dto.projectId ?? null,
        actorId: dto.actorId ?? null,
        actorType: actorType,
        ipAddress: dto.ipAddress ?? null,
        userAgent: dto.userAgent ?? null,
        action: dto.action,
        entity: dto.entity,
        entityId: dto.entityId,
        metadata: dto.metadata ?? {},
      });

      // 3. Save
      await this.auditRepository.save(logEntry);
    } catch (error) {
      // 4. Fail Open
      this.logger.error(
        `AuditLogWriteError: Failed to write audit log for ${dto.entity}:${dto.entityId}`,
        error
      );
    }
  }

  async findAll(
    projectId: number,
    query: ListAuditLogsDto
  ): Promise<PaginationDto<AuditLog>> {
    const { action, actorId, startDate, endDate, page = 1, limit = 20 } = query;
    const qb = this.auditRepository.createQueryBuilder('audit');

    qb.where('audit.projectId = :projectId', { projectId });

    if (action) {
      qb.andWhere('audit.action = :action', { action });
    }

    if (actorId) {
      qb.andWhere('audit.actorId = :actorId', { actorId });
    }

    if (startDate) {
      qb.andWhere('audit.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('audit.createdAt <= :endDate', { endDate });
    }

    qb.orderBy('audit.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
