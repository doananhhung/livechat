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
  /** Sender identifier (visitor UID or agent ID) */
  senderId?: string;
  /** Recipient identifier */
  recipientId?: string;
  content: string | null;
  /** Optional content type, defaults to 'text' if not provided */
  contentType?: string;
  attachments?: Attachment[] | null;
  fromCustomer: boolean;
  /** Date on backend, string after JSON serialization on frontend */
  createdAt: Date | string;
  status: MessageStatus;
}

