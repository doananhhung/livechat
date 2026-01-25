# Specification

**Status:** FINALIZED
**Created:** 2026-01-25

## Goal

Stabilize the AI subsystem by fixing critical race conditions ("Stale Save"), clarifying module architecture (renaming done, now confirming), and improving type safety as identified in the audit reports.

## Requirements

### Must Have

- [ ] **Fix "Stale Save" Race Condition:**
  - Replace `repository.save(conversation)` in `AiResponderService` with atomic `UPDATE` queries or optimistic locking.
  - Ensure concurrent updates from human agents (assignments, status changes) are not overwritten by the AI response cycle.
- [ ] **Type Safety Hardening:**
  - Implement Zod schemas for `WorkflowNode.data` to prevent runtime crashes from malformed config.
  - Validate `project.aiConfig` at the service boundary.
- [ ] **Unified AI Configuration (Cleanup):**
  - The `Project` entity currently splits AI settings between legacy columns (`aiResponderEnabled`, `aiResponderPrompt`) and new columns (`aiConfig`).
  - Migrate the legacy logic to read from `aiConfig` (e.g., `{ "enabled": true, "prompt": "..." }`) or explicitly map them.
  - **Why Legacy?** They fragment the configuration. `AiResponderService` currently checks `project.aiResponderEnabled` separately from the workflow config. We need a single source of truth.

### Nice to Have

- [ ] **Integration Test:**
  - A test case giving proof that the race condition is solved (simulating concurrent specific updates).

### Won't Have

- New feature development.
- Major UI changes.
- Renaming `modules/workflow` (Already completed: verified as `modules/status-automation`).

## Constraints

- **Backward Compatibility:** Existing projects using "Simple" mode must continue to work without manual migration if possible, or a migration script must be provided.
- **Downtime:** Zero downtime deployment preferred.

## Open Questions

- None.
