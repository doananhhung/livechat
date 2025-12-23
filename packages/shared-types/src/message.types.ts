import { Attachment } from "./attachment.types";

export enum MessageStatus {
  SENDING = "sending",
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed",
}

export interface Message {
  id: number | string;
  conversationId: number;
  visitorId?: number;
  userId?: string;
  content: string;
  contentType: string; // 'text' | 'image' etc
  attachments?: Attachment[];
  fromCustomer: boolean;
  /** Date on backend, string after JSON serialization on frontend */
  createdAt: Date | string;
  status: MessageStatus;
}
