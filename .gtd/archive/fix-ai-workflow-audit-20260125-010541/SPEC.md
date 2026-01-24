# Specification

**Status:** FINALIZED
**Created:** 2026-01-25

## Goal

Fix all problems identified in the AI Workflow Audit Report (`.gtd/archive/audit-ai-workflow-20260125-002740/AUDIT_REPORT.md`). This includes critical race conditions, dead code, maintenance risks, and implicit patterns that reduce reliability and auditability.

## Requirements

### Must Have

- [ ] **Fix Race Condition (Critical):** Implement Redis-based per-visitor locking in `AiResponderService` to serialize message processing for the same visitor. Lock pattern: `SET visitorLock:{visitorUid} {value} NX EX 30`. Prevents `conversation.metadata.workflowState` overwrites.
- [ ] **Remove Dead Code (Medium):** Remove the orphaned `trigger` node type reference from `WorkflowEngineService.getNodeContext()`. If future use is intended, add a proper handler in `executeStep()` or remove from codebase entirely.
- [ ] **Centralize Tool Definitions (Medium):** Move tool names and definitions to `@live-chat/shared-types` as a Single Source of Truth. Update:
  - `packages/backend/src/ai-responder/services/ai-tool.executor.ts`
  - `packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx`
  - `packages/frontend/src/components/features/workflow/GlobalToolsPanel.tsx`
- [ ] **Explicit System Actor (Low):** Create a dedicated "System" user in the database:
  - Add migration to seed System user (id: 1 or known UUID, email: `system@internal.local`, role: `system`).
  - Add `role: 'system'` to `UserRole` enum if not existing.
  - Create `SYSTEM_USER_ID` constant in `@live-chat/shared-types`.
  - Update `AiToolExecutor.ts` to use `SYSTEM_USER_ID` instead of string `'system'`.
  - Add guard to prevent deletion of System user.

### Nice to Have

- [ ] Integration tests for concurrent message handling (verify locking works).
- [ ] Add logging when lock acquisition fails or times out.

### Won't Have

- New AI features.
- Frontend visual changes.
- Changes to LLM provider logic.

## Constraints

- Redis is already available (used for BullMQ).
- Backend changes require restart of `start:dev` and `start:worker`.
- TypeORM migrations must be idempotent (check-before-insert for System user seed).
- Frontend must import from `@live-chat/shared-types`, not define its own tool list.

## Open Questions

- None.
