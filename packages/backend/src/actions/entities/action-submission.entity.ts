import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
  Index,
} from 'typeorm';
import { ActionTemplate } from './action-template.entity';
import { Conversation } from '../../inbox/entities/conversation.entity';
import { User } from '../../users/entities/user.entity';
import { Visitor } from '../../visitors/entities/visitor.entity';
import { Message } from '../../inbox/entities/message.entity';
import { ActionSubmissionStatus } from '@live-chat/shared-types';

/**
 * ActionSubmission entity represents a filled form submission.
 *
 * Invariant: Exactly one of creatorId (agent) or visitorId must be set.
 * This is enforced by a database CHECK constraint.
 */
@Entity('action_submissions')
@Check(
  `(creator_id IS NOT NULL AND visitor_id IS NULL) OR (creator_id IS NULL AND visitor_id IS NOT NULL)`
)
@Index(['formRequestMessageId'], {
  unique: true,
  where: 'form_request_message_id IS NOT NULL',
})
export class ActionSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer', name: 'template_id' })
  templateId: number;

  @ManyToOne(() => ActionTemplate)
  @JoinColumn({ name: 'template_id' })
  template: ActionTemplate;

  @Column({ type: 'bigint', name: 'conversation_id' })
  conversationId: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  /**
   * Creator ID (agent/user). Null if submitted by visitor.
   */
  @Column({ type: 'uuid', name: 'creator_id', nullable: true })
  creatorId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creator_id' })
  creator: User | null;

  /**
   * Visitor ID. Null if submitted by agent.
   */
  @Column({ type: 'integer', name: 'visitor_id', nullable: true })
  visitorId: number | null;

  @ManyToOne(() => Visitor, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'visitor_id' })
  visitor: Visitor | null;

  /**
   * Links submission to the form request message that prompted it.
   * Null for agent-initiated submissions (non-form-request).
   */
  @Column({ type: 'bigint', name: 'form_request_message_id', nullable: true })
  formRequestMessageId: string | null;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'form_request_message_id' })
  formRequestMessage: Message | null;

  @Column({ type: 'jsonb' })
  data: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: ActionSubmissionStatus,
    default: ActionSubmissionStatus.SUBMITTED,
  })
  status: ActionSubmissionStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
