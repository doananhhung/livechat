# Audit Logging System

## Purpose
The Audit Logging System provides a secure, immutable, and searchable history of critical actions within the application. It answers the "Who, What, When, and Where" of system changes (e.g., "User X deleted Project Y from IP Z"). Its primary goal is compliance, security forensics, and operational debugging.

## Summary
This feature implements a "Write-Only" ledger for tracking changes to critical resources. It is designed to be **"Fail Open"** for V1, meaning that if the audit log fails to write (e.g., database down), the user's operation will still proceed to ensure system availability.

**Update (Frontend Slice):** Project Managers can now inspect these logs directly via the "Security & Audit" section in Project Settings. The UI provides filtering capabilities (by date, action, actor) and a detailed view of the changes (metadata).

## Key Components
- **Audit Service**: The core provider responsible for validating and writing log entries to the database.
- **Audit Controller**: Exposes a read-only API for fetching and filtering audit logs for authorized managers.
- **Audit Interceptor**: A NestJS interceptor that automatically captures HTTP request details (User, IP, Body) for endpoints decorated with `@Auditable`.
- **Sanitization Engine**: A utility that automatically redacts sensitive keys (like passwords or tokens) from the logged metadata to prevent data leakage.
- **Audit UI**: A frontend interface (`AuditLogsPage`, `AuditLogTable`) allowing managers to view and filter logs.

## How It Works
1.  **Decoration**: A developer adds the `@Auditable({ action: AuditAction.UPDATE, entity: 'Project' })` decorator to a controller method.
2.  **Interception**: When a request hits that method, the `AuditLoggerInterceptor` activates.
3.  **Execution**: The request is handled by the main controller/service logic.
4.  **Logging**: 
    -   **On Success**: The interceptor captures the response, sanitizes the body/response, and asynchronously sends a log entry to the `AuditService`.
    -   **On Error**: The interceptor captures the error details and stack trace, sanitizes the request body, logs the failure, and re-throws the original error to the user.
5.  **Persistence**: The `AuditService` saves the record to the `audit_logs` table (including `projectId` for scoping).
6.  **Inspection**: A Project Manager navigates to the "Audit Logs" page. The frontend requests logs via `GET /projects/:id/audit-logs`. The backend enforces role checks and returns the paginated data.

## Related Documentation
- [Architecture](./architecture.md)
- [API Reference](./api.md)
- [Decision Log](./decisions.md)
- [Changelog](./changelog.md)