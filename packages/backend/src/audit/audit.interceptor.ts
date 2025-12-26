import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { AuditService } from "./audit.service";
import { AUDIT_LOG_METADATA, AuditableMetadata } from "./auditable.decorator";
import { JsonValue } from "./audit.entity";
import { Request } from "express";
import { sanitizeMetadata, DEFAULT_SENSITIVE_KEYS } from "./audit.utils";
import { RequestWithUser } from "../common/interfaces/request-with-user.interface";

@Injectable()
export class AuditLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLoggerInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditableMetadata = this.reflector.get<AuditableMetadata>(
      AUDIT_LOG_METADATA,
      context.getHandler()
    );

    if (!auditableMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    const { ip, headers, body, params } = request;
    const actorId = user?.id ? String(user.id) : null;
    const ipAddress = ip || null;
    const userAgent = headers["user-agent"] || null;

    return next.handle().pipe(
      tap((responseBody) => {
        try {
          const entityId = auditableMetadata.entityIdExtractor
            ? auditableMetadata.entityIdExtractor(responseBody || body || params)
            : params.id || (responseBody && responseBody.id) || null;

          let metadata: Record<string, JsonValue> = {};
          if (auditableMetadata.metadataExtractor) {
            metadata = auditableMetadata.metadataExtractor(request, responseBody);
          } else {
            metadata = {
              requestBody: sanitizeMetadata(body, DEFAULT_SENSITIVE_KEYS) as JsonValue,
              params: params as unknown as JsonValue,
              responseBody: sanitizeMetadata(responseBody, DEFAULT_SENSITIVE_KEYS) as JsonValue,
            };
          }

          this.auditService
            .log({
              actorId,
              actorType: actorId ? "USER" : "SYSTEM",
              ipAddress,
              userAgent,
              action: auditableMetadata.action,
              entity: auditableMetadata.entity,
              entityId: String(entityId || "unknown"),
              metadata,
            })
            .catch((error) => {
              this.logger.error(
                "Failed to log audit event from interceptor",
                error
              );
            });
        } catch (err) {
            this.logger.error("Error in audit interceptor logic (success path)", err);
        }
      }),
      catchError((error) => {
        try {
            // Attempt to log even on failure
            const entityId = params.id || "unknown";
            
            this.auditService
            .log({
                actorId,
                actorType: actorId ? "USER" : "SYSTEM",
                ipAddress,
                userAgent,
                action: auditableMetadata.action,
                entity: auditableMetadata.entity,
                entityId: String(entityId),
                              metadata: {
                                error: error.message,
                                stack: error.stack,
                                requestBody: sanitizeMetadata(body, DEFAULT_SENSITIVE_KEYS) as JsonValue,
                                params: params as unknown as JsonValue,
                              },            })
            .catch((auditError) => {
                this.logger.error(
                "Failed to log audit event on error from interceptor",
                auditError
                );
            });
        } catch (loggingError) {
             this.logger.error("Error in audit interceptor logic (error path)", loggingError);
        }
        
        return throwError(() => error);
      })
    );
  }
}
