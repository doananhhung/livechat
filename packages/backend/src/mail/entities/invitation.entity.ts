// src/projects/entities/invitation.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProjectRole } from '@live-chat/shared-types';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
}

/**
 * @description
 * This entity stores pending invitations for users to join a project.
 * It contains a unique token that will be sent via email.
 */
@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  email: string;

  /**
   * @description
   * A secure, unique, and non-guessable token for the invitation link.
   */
  @Column({ type: 'varchar', unique: true })
  token: string;

  @Column({ type: 'int' })
  projectId: number;

  /**
   * The project this invitation is for.
   */
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  /**
   * @description
   * The ID of the manager who sent the invitation.
   */
  @Column('uuid')
  inviterId: string;

  /**
   * The user who created this invitation.
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inviter_id' })
  inviter: User;

  /**
   * @description
   * The role that the invited user will have in the project.
   * Can be either MANAGER or AGENT.
   */
  @Column({
    type: 'enum',
    enum: ProjectRole,
  })
  role: ProjectRole;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  /**
   * @description
   * The timestamp when this invitation will expire and become invalid.
   */
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
