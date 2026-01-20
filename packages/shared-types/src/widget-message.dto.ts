import { MessageContentType, MessageStatus } from "./message.types";

export type MessageSender = {
  type: "visitor" | "agent";
  name?: string;
};

export interface WidgetMessageDto {
  id: string | number;
  content: string;
  senderId?: string;
  fromCustomer: boolean;
  status: MessageStatus;
  createdAt: string;
  contentType?: MessageContentType;
  metadata?: Record<string, unknown>;
}
