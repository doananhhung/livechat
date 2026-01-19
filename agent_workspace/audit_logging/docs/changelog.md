# Changelog: Audit Logging System

## 2025-12-12 - Audit Log Frontend (Slice 3)
- **Slice:** `audit_log_frontend`
- **What Changed:** Exposed audit logs via API and built the UI for Project Managers.
- **Files Modified/Created:**
  - `packages/shared-types/src/audit.types.ts`: Shared Enums/DTOs (Refactored).
  - `packages/backend/src/audit/audit.entity.ts`: Added `projectId` column.
  - `packages/backend/src/audit/audit.controller.ts`: New API endpoint.
  - `packages/backend/src/audit/audit.service.ts`: Added `findAll` logic.
  - `packages/frontend/src/pages/ProjectSettings/AuditLogsPage.tsx`: New UI page.
  - `packages/frontend/src/components/features/audit/`: UI Components.
- **Features:**
  - Filterable Audit Log Table (by Action, Actor, Date).
  - JSON Metadata Viewer (Sanitized).
  - Role-based access control (Manager only).
- **Reviewed By:** Reviewer (see `agent_workspace/audit_logging/code_reviews/audit_log_frontend.md`)
- **Verified By:** Architect (see `agent_workspace/audit_logging/actions/audit_log_frontend.md`)

## 2025-12-12 - Audit Log Interceptor (Slice 2)
- **Slice:** `audit_log_interceptor`
- **What Changed:** Added the interception layer for automatic HTTP logging.
- **Files Modified/Created:**
  - `packages/backend/src/audit/audit.interceptor.ts`: New interceptor logic.
  - `packages/backend/src/audit/auditable.decorator.ts`: New configuration decorator.
  - `packages/backend/src/audit/audit.utils.ts`: New sanitization utility.
  - `packages/backend/src/common/interfaces/request-with-user.interface.ts`: Type definitions.
  - `packages/backend/src/audit/audit.interceptor.spec.ts`: Unit tests.
- **Features:**
  - Automatic success/error logging.
  - Sensitive data redaction (passwords, tokens).
  - "Fail Open" error handling in interceptor.
- **Reviewed By:** Reviewer (see `agent_workspace/audit_logging/code_reviews/audit_log_interceptor.md`)
- **Verified By:** Architect (see `agent_workspace/audit_logging/actions/audit_log_interceptor.md`)

## 2025-12-12 - Audit Log Core (Slice 1)
- **Slice:** `audit_log_core`
- **What Changed:** Implemented the foundational service and database entity.
- **Files Modified/Created:**
  - `packages/backend/src/audit/audit.module.ts`: Module definition.
  - `packages/backend/src/audit/audit.service.ts`: Core logging logic.
  - `packages/backend/src/audit/audit.entity.ts`: DB Schema.
- **Features:**
  - `AuditLog` entity with `JSONB` metadata.
  - `AuditService.log()` with circular reference protection.
- **Reviewed By:** Reviewer (see `agent_workspace/audit_logging/code_reviews/audit_log_core.md`)
- **Verified By:** Architect (see `agent_workspace/audit_logging/actions/audit_log_core.md`)