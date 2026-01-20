import { Message, MessageStatus } from "./message.types";
import { VisitorSessionMetadata } from "./conversation.types";
import { ActionDefinition } from "./actions";

export enum WebSocketEvent {
  // Client (Widget/Frontend) -> Server
  IDENTIFY = "identify",
  SEND_MESSAGE = "sendMessage",
  VISITOR_TYPING = "visitorIsTyping",
  UPDATE_CONTEXT = "updateContext",
  JOIN_PROJECT_ROOM = "joinProjectRoom",
  LEAVE_PROJECT_ROOM = "leaveProjectRoom",
  SUBMIT_FORM = "submitForm", // Widget -> Server: visitor submits form

  // Server -> Client
  CONVERSATION_HISTORY = "conversationHistory",
  MESSAGE_SENT = "messageSent",
  AGENT_REPLIED = "agentReplied",
  AGENT_TYPING = "agentIsTyping",
  NEW_MESSAGE = "newMessage", // Broadcast to agents
  VISITOR_CONTEXT_UPDATED = "visitorContextUpdated", // Broadcast to agents
  CONVERSATION_UPDATED = "conversationUpdated", // Broadcast to agents
  CONVERSATION_DELETED = "conversationDeleted", // Broadcast to agents
  VISITOR_NOTE_ADDED = "visitorNoteAdded",
  VISITOR_NOTE_UPDATED = "visitorNoteUpdated",
  VISITOR_NOTE_DELETED = "visitorNoteDeleted",

  // NEW: Visitor Online Status
  VISITOR_STATUS_CHANGED = "visitorStatusChanged",
  VISITOR_UPDATED = "visitorUpdated",

  // Form-related events
  FORM_REQUEST_SENT = "formRequestSent", // Server → Visitor
  VISITOR_FILLING_FORM = "visitorFillingForm", // Visitor → Server → Agents
  FORM_SUBMITTED = "formSubmitted", // Server → Agents & Visitor
  FORM_UPDATED = "formUpdated", // Server → Agents & Visitor
  FORM_DELETED = "formDeleted", // Server → Agents & Visitor

  // Automation events
  AUTOMATION_TRIGGERED = "automation.triggered",
}

// NEW: Visitor Online Status Payload
export interface VisitorStatusChangedPayload {
  visitorUid: string;
  projectId: number;
  isOnline: boolean;
}

export interface VisitorUpdatedPayload {
  // ADDED
  projectId: number;
  visitorId: number;
  visitor: any; // Type 'Visitor' - preventing circular dependency or strict type issues
}

// Existing payloads

export interface AgentTypingPayload {
  agentName: string;
  isTyping: boolean;
}

export interface MessageSentPayload {
  tempId: string;
  finalMessage: any; // Ideally strictly typed as WidgetMessageDto
}

export interface VisitorContextUpdatedPayload {
  conversationId: string;
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

// Form-related payloads

/**
 * Sent to visitor when agent sends a form request.
 */
export interface FormRequestSentPayload {
  messageId: string;
  conversationId: string;
  templateId: number;
  templateName: string;
  definition: ActionDefinition;
}

/**
 * Broadcasted when visitor is actively filling a form.
 */
export interface VisitorFillingFormPayload {
  conversationId: string;
  isFilling: boolean;
}

/**
 * Sent when a form is submitted.
 */
export interface FormSubmittedPayload {
  conversationId: string;
  submissionId: string;
  messageId: string; // The form_submission message ID
  message?: Message; // Full message object for immediate display
  submittedBy: "agent" | "visitor";
  data: Record<string, unknown>;
  formRequestMessageId?: string; // Optional: ID of the original request
}

/**
 * Sent when a form submission is updated.
 */
export interface FormUpdatedPayload {
  conversationId: string;
  submissionId: string;
  data: Record<string, unknown>;
}

/**
 * Sent when a form submission is deleted.
 */
export interface FormDeletedPayload {
  conversationId: string;
  submissionId: string;
  messageId?: string;
}

/**
 * Payload for automation.triggered event.
 */
export interface AutomationTriggeredPayload {
  conversationId: string;
  type: string;
  message: string;
}
