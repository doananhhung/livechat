# Implementation Plan: audit_log_frontend

## 1. Acceptance Tests (What "Done" Looks Like)

### API Tests
- [ ] Test: `GET /projects/:id/audit-logs` as Manager -> Returns 200 with paginated logs.
- [ ] Test: `GET /projects/:id/audit-logs` as Agent -> Returns 403 Forbidden.
- [ ] Test: Filtering by `action`, `actorId`, `dateRange` works.
- [ ] Test: Accessing audit logs of a project user is not a member of -> Returns 403.

### Data Integrity Tests
- [ ] Test: Creating a new audit log (via interceptor or service) saves `projectId`.

### UI Tests
- [ ] Test: Audit Log table renders correct columns.
- [ ] Test: Pagination buttons work.
- [ ] Test: "View Details" modal shows metadata.

## 2. Implementation Approach
1.  **Refactoring:** Move `AuditAction` from backend to `shared-types`. Update backend imports. Rebuild shared-types.
2.  **Database:** Generate migration to add `projectId` column to `audit_logs` table.
3.  **Backend:**
    *   Update `AuditLog` entity.
    *   Update `AuditService.log` to accept `projectId`.
    *   Update `AuditLoggerInterceptor` to extract `projectId` from request.
    *   Implement `AuditService.findAll` with QueryBuilder for filtering.
    *   Create `AuditController` with `GET` endpoint.
4.  **Frontend:**
    *   Create `auditApi.ts` with `useGetAuditLogs`.
    *   Create `AuditLogTable` component.
    *   Create `AuditLogPage` route.

## 3. Files to Create/Modify
- `packages/shared-types/src/audit.types.ts` — New file (Enum + DTO).
- `packages/backend/src/audit/audit.entity.ts` — Update schema.
- `packages/backend/src/audit/audit.service.ts` — Add logic.
- `packages/backend/src/audit/audit.controller.ts` — New controller.
- `packages/backend/src/common/interceptors/audit.interceptor.ts` — Update extraction logic.
- `packages/frontend/src/services/auditApi.ts` — New hook.
- `packages/frontend/src/components/features/audit/AuditLogTable.tsx` — New component.
- `packages/frontend/src/pages/ProjectSettings/AuditLogsPage.tsx` — New page.

## 4. Dependencies
- `shared-types` (Refactoring).
- `TypeORM` (QueryBuilder).
- `React Query` (Frontend state).

## 5. Risk Assessment
- **Migration:** Existing audit logs will have `projectId = NULL`. They won't appear in project-scoped queries. This is acceptable for V1 (start fresh).
- **Refactoring:** Moving `AuditAction` requires checking all usages in backend to fix imports.
