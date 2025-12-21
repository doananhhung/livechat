export interface Visitor {
  id: number;
  visitorUid: string;
  projectId: number;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  customFields?: Record<string, any> | null;
  currentUrl?: string | null;
  lastSeenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
