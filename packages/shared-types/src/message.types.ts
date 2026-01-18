import { Attachment } from "./attachment.types";

export enum MessageStatus {
  SENDING = "sending",
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed",
}

/**
 * Content type for messages.
 * - TEXT: Standard text message (default)
 * - FORM_REQUEST: Agent sends form to visitor
 * - FORM_SUBMISSION: Visitor/Agent submits filled form
 */
export enum MessageContentType {
  TEXT = "text",
  FORM_REQUEST = "form_request",
  FORM_SUBMISSION = "form_submission",
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
  /** Optional metadata for form requests/submissions */
  metadata?: Record<string, unknown>;
  attachments?: Attachment[] | null;
  fromCustomer: boolean;
  /** Date on backend, string after JSON serialization on frontend */
  createdAt: Date | string;
  status: MessageStatus;
}

