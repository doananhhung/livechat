import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, JsonValue } from './audit.entity';

export interface CreateAuditLogDto {
  actorId?: string | null;
  actorType?: 'USER' | 'SYSTEM' | 'API_KEY';
  ipAddress?: string | null;
  userAgent?: string | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  metadata?: Record<string, JsonValue>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    try {
      // 1. Validation: Safe JSON check
      // We rely on JSON.stringify to detect circular references or unsafe types
      // Only do this if metadata is present
      if (dto.metadata) {
        try {
           JSON.stringify(dto.metadata);
        } catch (e) {
           throw new Error('Metadata contains circular reference or non-serializable data');
        }
      }

      // 2. Prepare Entity
      const actorType = dto.actorType ?? (dto.actorId ? 'USER' : 'SYSTEM');

      const logEntry = this.auditRepository.create({
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
      this.logger.error(`AuditLogWriteError: Failed to write audit log for ${dto.entity}:${dto.entityId}`, error);
      // We do NOT re-throw, per design "Fail Open"
    }
  }
}
