import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Message } from "./message.entity";
import { Project } from "./project.entity";
import { Visitor } from "./visitor.entity";
import { User } from "./user.entity";
import { ConversationStatus, VisitorSessionMetadata } from "@live-chat/shared-types";

@Entity("conversations")
export class Conversation {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string;

  @ManyToOne(() => Project, (project) => project.conversations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ type: "bigint", name: "project_id" })
  projectId: number;

  @ManyToOne(() => Visitor, (visitor) => visitor.conversations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "visitor_id" })
  visitor: Visitor;

  @Column({ type: "bigint", name: "visitor_id" })
  visitorId: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: "assignee_id" })
  assignee: User | null;

  @Column({ type: "uuid", nullable: true, name: "assignee_id" })
  assigneeId: string | null;

  @Column({ type: "timestamptz", nullable: true, name: "assigned_at" })
  assignedAt: Date | null;

  @Column({ type: "text", nullable: true, name: "last_message_snippet" })
  lastMessageSnippet: string | null;

  @Column({
    type: "timestamptz",
    nullable: true,
    name: "last_message_timestamp",
  })
  lastMessageTimestamp: Date | null;

  @Column({ type: "bigint", nullable: true, name: "last_message_id" })
  lastMessageId: string | null;

  @Index()
  @Column({
    type: "enum",
    enum: ConversationStatus,
    default: ConversationStatus.OPEN,
  })
  status: ConversationStatus;

  @Column({ type: "integer", default: 0, name: "unread_count" })
  unreadCount: number;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: VisitorSessionMetadata | null;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;
}