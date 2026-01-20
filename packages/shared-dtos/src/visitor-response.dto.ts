import { Visitor as SharedVisitorType } from "@live-chat/shared-types";

/**
 * DTO representing a visitor in API responses.
 * Implements the shared Visitor interface for type consistency.
 */
export class VisitorResponseDto implements SharedVisitorType {
  id: number;
  projectId: number;
  visitorUid: string;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  customData?: Record<string, any> | null;
  currentUrl?: string | null;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isOnline?: boolean | null;
}
