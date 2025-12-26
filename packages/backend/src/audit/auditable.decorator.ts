import { SetMetadata } from "@nestjs/common";
import { AuditAction, JsonValue } from "./audit.entity";

export const AUDIT_LOG_METADATA = "audit_log_metadata";

export interface AuditableMetadata {
  action: AuditAction;
  entity: string; // The name of the resource being acted upon (e.g., 'Project', 'User')
  // We use 'unknown' here for safety, but the user will likely need to cast it to their specific type
  entityIdExtractor?: (data: unknown) => string;
  metadataExtractor?: (
    request: unknown,
    response: unknown
  ) => Record<string, JsonValue>;
}

export const Auditable = (metadata: AuditableMetadata) =>
  SetMetadata(AUDIT_LOG_METADATA, metadata);
