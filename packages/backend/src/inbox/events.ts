import {
  WidgetMessageDto,
  VisitorSessionMetadata,
  ConversationUpdatedPayload,
  MessageSentPayload,
} from '@live-chat/shared-types';
import { Conversation, Visitor } from '../database/entities';
import { Message } from './entities/message.entity';

export class VisitorMessageReceivedEvent {
  tempId: string;
  content: string;
  visitorUid: string;
  projectId: number;
  socketId: string;
  sessionMetadata?: VisitorSessionMetadata;
}

export class VisitorIdentifiedEvent {
  projectId: number;
  visitorUid: string;
  socketId: string;
}

export class VisitorTypingEvent {
  isTyping: boolean;
  projectId: number;
  conversationId: number;
}

export class VisitorContextUpdatedEvent {
  currentUrl: string;
  projectId: number;
  conversationId: string;
}

export class UpdateContextRequestEvent {
  projectId: number;
  visitorUid: string;
  currentUrl: string;
  conversationId?: string;
  socketId: string;
}

export class ConversationUpdatedEvent {
  projectId: number;
  payload: ConversationUpdatedPayload;
}

export class ConversationDeletedEvent {
  projectId: number;
  conversationId: string;
}

export class AgentTypingEvent {
  visitorSocketId: string;
  isTyping: boolean;
  agentName: string;
}

export class AgentMessageSentEvent {
  visitorSocketId: string | null;
  message: Message;
  projectId: number;
}

export class AiProcessMessageEvent {
  conversationId: string;
  projectId: number;
  visitorUid: string;
}

export class VisitorSessionReadyEvent {
  socketId: string;
  visitor: Visitor;
  conversation: Conversation | null;
  projectId: number;
  visitorUid: string;
  messages: WidgetMessageDto[];
}

export class VisitorMessageProcessedEvent {
  visitorSocketId: string;
  payload: MessageSentPayload;
}
