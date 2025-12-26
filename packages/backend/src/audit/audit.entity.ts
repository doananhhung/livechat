import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_LOGIN = 'FAILED_LOGIN',
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
