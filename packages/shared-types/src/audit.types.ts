export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_LOGIN = 'FAILED_LOGIN',
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface AuditLogDto {
  id: string;
  projectId?: number;
  actorId: string | null;
  actorType: 'USER' | 'SYSTEM' | 'API_KEY';
  ipAddress: string | null;
  userAgent: string | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  metadata: Record<string, JsonValue>;
  createdAt: Date | string;
}
