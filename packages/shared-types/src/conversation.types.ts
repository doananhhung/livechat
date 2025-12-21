import { IProject } from "./project.types";
import { Visitor } from "./visitor.types"; // Need to create this too or define interface here

export enum ConversationStatus {
  OPEN = "open",
  CLOSED = "closed",
  PENDING = "pending",
}

export interface Conversation {
  id: number;
  projectId: number;
  project?: IProject;
  visitorId: number;
  visitor?: Visitor;
  lastMessageSnippet: string | null;
  lastMessageTimestamp: Date | null;
  status: ConversationStatus;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}
