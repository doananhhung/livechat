export interface Visitor {
  id: number;
  visitorUid: string;
  projectId: number;
  displayName?: string | null; // Changed to optional and nullable
  email?: string | null;
  phone?: string | null;
  customData?: Record<string, any> | null;
  currentUrl?: string | null;
  lastSeenAt?: Date; // Changed to optional
  createdAt: Date;
  updatedAt: Date;
  
  /**
   * Runtime-only field, populated from Redis.
   * null = unknown (Redis unavailable or not queried)
   * true = visitor has active socket connection
   * false = visitor has no active socket connection
   */
  isOnline?: boolean | null;
}