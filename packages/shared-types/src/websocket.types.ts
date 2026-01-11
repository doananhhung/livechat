import { Message, MessageStatus } from './message.types';
import { VisitorSessionMetadata } from './conversation.types';

export enum WebSocketEvent {
  // Client (Widget/Frontend) -> Server
  IDENTIFY = 'identify',
  SEND_MESSAGE = 'sendMessage',
  VISITOR_TYPING = 'visitorIsTyping',
  UPDATE_CONTEXT = 'updateContext',
  JOIN_PROJECT_ROOM = 'joinProjectRoom',
  LEAVE_PROJECT_ROOM = 'leaveProjectRoom',

  // Server -> Client
  CONVERSATION_HISTORY = 'conversationHistory',
  MESSAGE_SENT = 'messageSent',
  AGENT_REPLIED = 'agentReplied',
  AGENT_TYPING = 'agentIsTyping',
  NEW_MESSAGE = 'newMessage', // Broadcast to agents
  VISITOR_CONTEXT_UPDATED = 'visitorContextUpdated', // Broadcast to agents
  CONVERSATION_UPDATED = 'conversationUpdated', // Broadcast to agents
  CONVERSATION_DELETED = 'conversationDeleted', // Broadcast to agents
  VISITOR_NOTE_ADDED = 'visitorNoteAdded',
  VISITOR_NOTE_UPDATED = 'visitorNoteUpdated',
  VISITOR_NOTE_DELETED = 'visitorNoteDeleted',
}

export interface IdentifyPayload {
  projectId: number;
  visitorUid: string;
}

export interface SendMessagePayload {
  content: string;
  tempId: string;
  sessionMetadata?: VisitorSessionMetadata;
}

export interface VisitorTypingPayload {
  isTyping: boolean;
}

export interface UpdateContextPayload {
  currentUrl: string;
}

export interface JoinRoomPayload {
  projectId: number;
}

export interface AgentTypingPayload {
  agentName: string;
  isTyping: boolean;
}

export interface MessageSentPayload {
  tempId: string;
  finalMessage: any; // Ideally strictly typed as WidgetMessageDto
}

export interface VisitorContextUpdatedPayload {
  conversationId: number;
  currentUrl: string;
}

export interface VisitorTypingBroadcastPayload {
  conversationId: number;
  isTyping: boolean;
}

export interface ConversationUpdatedPayload {
  conversationId: string;
  fields: Record<string, any>; // Flexible payload for partial updates
}

export interface VisitorNotePayload {
  visitorId: number;
  note: any; // Ideally VisitorNote type, but keeping it flexible to avoid circular deps if needed
}

export interface VisitorNoteDeletedPayload {
  visitorId: number;
  noteId: string;
}