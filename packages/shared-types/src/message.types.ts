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
  attachments?: any;
  fromCustomer: boolean;
  createdAt: Date;
  status: MessageStatus;
}
