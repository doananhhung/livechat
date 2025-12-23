import { IProject } from "./project.types";
import { Visitor } from "./visitor.types";

export enum ConversationStatus {
  OPEN = "open",
  CLOSED = "closed",
  PENDING = "pending",
}

export interface Conversation {
  /** Can be string when BigInt values are serialized from database */
  id: number | string;
  projectId: number;
  project?: IProject;
  visitorId: number;
  visitor?: Visitor;
  lastMessageSnippet: string | null;
  /** Date on backend, string after JSON serialization on frontend */
  lastMessageTimestamp: Date | string | null;
  status: ConversationStatus;
  unreadCount: number;
  /** Date on backend, string after JSON serialization on frontend */
  createdAt: Date | string;
  /** Date on backend, string after JSON serialization on frontend */
  updatedAt: Date | string;
}
