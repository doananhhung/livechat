import { IProject } from "./project.types";
import { Visitor } from "./visitor.types";
import { User } from "./user.types";

export enum ConversationStatus {
  OPEN = "open",
  PENDING = "pending",
  SOLVED = "solved", // Was 'closed'
  SPAM = "spam"
}

export interface NavigationEntry {
  url: string;
  title: string;
  timestamp: string; // ISO 8601
}

export interface VisitorSessionMetadata {
  referrer: string | null;     // e.g., "https://google.com" or null (direct)
  landingPage: string;         // The first page they hit
  urlHistory: NavigationEntry[];
  browser?: string;            // User-Agent summary (optional future proofing)
  os?: string;                 // OS summary (optional future proofing)
  aiEnabled?: boolean;         // Visitor opt-in/out for AI Responder
}

export interface Conversation {
  /** Can be string when BigInt values are serialized from database */
  id: number | string;
  projectId: number;
  project?: IProject;
  visitorId: number;
  visitor?: Visitor;
  assigneeId: string | null;
  assignee?: User | null;
  assignedAt: Date | string | null;
  lastMessageSnippet: string | null;
  /** Date on backend, string after JSON serialization on frontend */
  lastMessageTimestamp: Date | string | null;
  status: ConversationStatus;
  unreadCount: number;
  /** Date on backend, string after JSON serialization on frontend */
  createdAt: Date | string;
  /** Date on backend, string after JSON serialization on frontend */
  updatedAt: Date | string;
  metadata?: VisitorSessionMetadata | null;
}