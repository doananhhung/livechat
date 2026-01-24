import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Conversation } from '../../inbox/entities/conversation.entity';
import { ProjectMember } from './project-member.entity';
import type { IWidgetSettingsDto, WorkflowDefinition } from '@live-chat/shared-types';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToMany(() => Conversation, (conversation) => conversation.project)
  conversations: Conversation[];

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'jsonb', default: {} })
  widgetSettings: IWidgetSettingsDto;

  @Column({
    type: 'text',
    array: true,
    nullable: true,
    name: 'whitelisted_domains',
  })
  whitelistedDomains: string[];

  @Column({ type: 'integer', nullable: true, name: 'auto_resolve_minutes' })
  autoResolveMinutes: number | null;

  @Column({ type: 'boolean', default: false, name: 'ai_responder_enabled' })
  aiResponderEnabled: boolean;

  @Column({ type: 'text', nullable: true, name: 'ai_responder_prompt' })
  aiResponderPrompt: string | null;

  @Column({ type: 'varchar', default: 'simple', name: 'ai_mode' })
  aiMode: 'simple' | 'orchestrator';

  @Column({ type: 'jsonb', nullable: true, name: 'ai_config' })
  aiConfig: WorkflowDefinition | Record<string, any> | null;

  @OneToMany(() => ProjectMember, (member) => member.project)
  members: ProjectMember[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}