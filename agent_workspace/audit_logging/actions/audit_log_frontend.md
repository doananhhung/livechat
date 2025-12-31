# Implementation Log: audit_log_frontend

## Status
- [x] Implementation Complete
- [x] Tests Passing (E2E)

## Changes
1.  **Shared Types:** Moved `AuditAction` to `shared-types` and created `AuditLogDto` and `ListAuditLogsDto`.
2.  **Database:** Added `projectId` column to `audit_logs` table via migration `AddProjectIdToAuditLog`.
3.  **Backend:**
    *   Updated `AuditService` to support `findAll` with filtering and pagination.
    *   Updated `AuditLoggerInterceptor` to capture `projectId`.
    *   Created `AuditController` to expose logs via API.
    *   **Fix:** Added `@Auditable` decorator to `ProjectController` for verifying interceptor logic.
    *   **Fix:** Updated all backend files (`audit.interceptor`, `audit.utils`, `auditable.decorator`) to import `AuditAction` and `JsonValue` from `shared-types`.
4.  **Frontend:**
    *   Created `auditApi` service.
    *   Created `AuditLogTable` component with filtering and details modal.
    *   Added `AuditLogsPage` and linked it in `ProjectManagementMenu`.
    *   **Fix:** Updated `AuditLogTable.tsx` to use type-only import for `AuditLogDto`.

## Verification
-   Run `npm run test:e2e packages/backend/test/audit.e2e-spec.ts` to verify backend logic.
-   Manual: Navigate to Project Settings -> Audit Logs to verify UI.
