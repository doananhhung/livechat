import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Conversation } from "./conversation.entity";
import { MessageStatus } from "@live-chat/shared-types";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number | string;

  @Column({ type: "bigint", name: "conversation_id" })
  conversationId: number;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "conversation_id" })
  conversation: Conversation;

  @Column({ type: "text", nullable: true })
  content: string | null;

  @Column({ type: "jsonb", nullable: true })
  attachments: any | null;

  @Column({ type: "varchar", name: "sender_id" })
  senderId: string;

  @Column({ type: "varchar", name: "recipient_id" })
  recipientId: string;

  @Column({ type: "boolean", name: "from_customer" })
  fromCustomer: boolean;

  @Index()
  @Column({
    type: "enum",
    enum: MessageStatus,
    default: MessageStatus.SENDING,
  })
  status: MessageStatus;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;
}
