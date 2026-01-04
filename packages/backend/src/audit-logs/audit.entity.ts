import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { AuditAction, JsonValue } from '@live-chat/shared-types';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'int', nullable: true })
  projectId: number | null;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar' })
  actorType: 'USER' | 'SYSTEM' | 'API_KEY';

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar' })
  action: AuditAction;

  @Column({ type: 'varchar' })
  entity: string;

  @Index()
  @Column({ type: 'varchar' })
  entityId: string;

  @Column({ type: 'jsonb' })
  metadata: Record<string, JsonValue>;

  @CreateDateColumn()
  createdAt: Date;
}
