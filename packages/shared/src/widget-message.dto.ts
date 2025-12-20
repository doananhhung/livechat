import { MessageStatus } from './message.entity';

export type MessageSender = {
  type: 'visitor' | 'agent';
  name?: string;
};

export interface WidgetMessageDto {
  id: string | number;
  content: string;
  sender: MessageSender;
  status: MessageStatus;
  timestamp: string;
}
