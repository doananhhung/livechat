export enum ActionFieldType {
  TEXT = "text",
  NUMBER = "number",
  DATE = "date",
  BOOLEAN = "boolean",
  SELECT = "select",
}

export interface ActionFieldDefinition {
  key: string;
  label: string;
  type: ActionFieldType;
  required: boolean;
  options?: string[]; // For SELECT type
}

export interface ActionDefinition {
  fields: ActionFieldDefinition[];
}

/**
 * Metadata stored in Message when agent sends a form to visitor.
 * The definition is a snapshot at time of send to ensure consistency.
 */
export interface FormRequestMetadata {
  templateId: number;
  templateName: string;
  templateDescription?: string;
  definition: ActionDefinition; // Snapshot at time of send
  expiresAt?: string;           // ISO 8601, optional
}

/**
 * Metadata stored in Message when a form is submitted.
 * Links back to the original form request and submission record.
 */
export interface FormSubmissionMetadata {
  formRequestMessageId: string; // Links to original form request
  submissionId: string;         // Links to ActionSubmission record
  templateName: string;
  data: Record<string, unknown>; // The filled form data for display
}

export interface ActionTemplate {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  definition: ActionDefinition;
  isEnabled: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum ActionSubmissionStatus {
  SUBMITTED = "submitted",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export interface ActionSubmission {
  id: string;
  templateId: number;
  template?: ActionTemplate;
  conversationId: string;
  /** Creator ID (agent/user). Null if submitted by visitor. */
  creatorId: string | null;
  /** Visitor ID. Null if submitted by agent. */
  visitorId?: number | null;
  /** Links to the form request message that prompted this submission. */
  formRequestMessageId?: string | null;
  data: Record<string, unknown>;
  status: ActionSubmissionStatus;
  createdAt: Date;
  updatedAt: Date;
}

