/**
 * Event types used for communication between the API server (producer)
 * and the Worker process (consumer).
 * 
 * These constants ensure type-safe, consistent event type strings
 * across the distributed system.
 */
export const WorkerEventTypes = {
  /** Fired when a visitor sends a new message via the chat widget */
  NEW_MESSAGE_FROM_VISITOR: 'NEW_MESSAGE_FROM_VISITOR',
  /** Fired when an agent sends a reply to a visitor */
  AGENT_REPLY: 'AGENT_REPLY',
} as const;

export type WorkerEventType = typeof WorkerEventTypes[keyof typeof WorkerEventTypes];

/**
 * Payload structure for NEW_MESSAGE_FROM_VISITOR events.
 */
export interface NewMessageFromVisitorPayload {
  tempId: string;
  content: string;
  visitorUid: string;
  projectId: number;
  socketId: string;
}

/**
 * Base structure for all worker events.
 */
export interface WorkerEvent<T = unknown> {
  type: WorkerEventType;
  payload: T;
}

/**
 * Typed event for new messages from visitors.
 */
export type NewMessageFromVisitorEvent = WorkerEvent<NewMessageFromVisitorPayload> & {
  type: typeof WorkerEventTypes.NEW_MESSAGE_FROM_VISITOR;
};
