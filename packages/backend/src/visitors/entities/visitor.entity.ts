import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Conversation } from '../../inbox/entities/conversation.entity';
import { VisitorNote } from '../../visitor-notes/entities/visitor-note.entity';

@Entity('visitors')
export class Visitor {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'bigint' })
  projectId: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Index('idx_visitor_uid')
  @Column({ type: 'uuid', unique: true })
  visitorUid: string;

  @Column({ type: 'varchar', nullable: true })
  displayName?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: object;

  // This property is NOT a database column.
  // It will be populated at runtime from Redis.
  currentUrl: string | null;

  @OneToMany(() => Conversation, (conversation) => conversation.visitor)
  conversations: Conversation[];

  @OneToMany(() => VisitorNote, (note) => note.visitor)
  notes: VisitorNote[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt?: Date;
}
