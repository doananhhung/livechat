# Specification

**Status:** FINALIZED
**Created:** 2026-01-25

## Goal

Inspect the entire AI workflow stack (Backend → Frontend) to document inconsistencies, incomplete work, stale state mechanisms, and orphan components. The output will be a comprehensive audit report with NO code changes.

## Requirements

### Must Have

- [ ] **Backend Audit**: Deep inspect `packages/backend/src/ai-responder` logic:
  - Consistency of `WorkflowEngineService` state machine.
  - `AiResponderService` loop and persistence logic (`conversation.metadata.workflowState`).
  - Tool execution flow and `route_decision` handling.
- [ ] **Frontend Audit**: Deep inspect `packages/frontend/src/components/features/workflow` & `ai-responder`:
  - Workflow Editor node configuration vs Backend expectations.
  - Stale props or unused components in the React Flow implementation.
- [ ] **Stale State Analysis**: Identify persistence gaps or stale data risks in the `workflowState` logic.
- [ ] **Orphan Component Analysis**: Identify dead code or unused files in both backend services and frontend components.
- [ ] **End-to-End Flow Verification**: Trace the path from `VisitorMessageReceived` → `WorkflowEngine` → `LLM` → `Tool/Response` → `Socket Event` to find logic gaps.

### Nice to Have

- [ ] Recommendations for refactoring identified issues.

### Won't Have

- Code changes (Strict Read-Only).
- Refactoring implementation.

## Constraints

- Produce documentation only (Audit Report).
- Deep dive inspection required (read all code in the flow).

## Open Questions

- None.
