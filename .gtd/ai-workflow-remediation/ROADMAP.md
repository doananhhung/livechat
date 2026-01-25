# Roadmap

**Spec:** ./.gtd/ai-workflow-remediation/SPEC.md
**Goal:** Stabilize the AI subsystem by fixing critical race conditions, improving type safety, and unifying configuration.
**Created:** 2026-01-25

## Must-Haves

- [x] Fix "Stale Save" Race Condition (Atomic `UPDATE`)
- [x] Type Safety Hardening (Zod schemas for `WorkflowNode.data`)
- [x] Unified AI Configuration (Migrate legacy fields)

## Nice-To-Haves

- [x] Integration Test for concurrency

## Phases

### Phase 1: Reliability Hardening

**Status**: ✅ Complete
**Objective**: Eliminate the critical "Stale Save" race condition in `AiResponderService` to prevent data loss during long-running AI operations.

**Tasks:**

1.  Refactor `AiResponderService._processMessage` to use `conversationRepository.update()` or optimistic locking instead of `save()`.
2.  Verify ensuring `lastMessageSnippet` and `status` updates do not overwrite concurrent changes.

### Phase 2: Runtime Safety

**Status**: ✅ Complete
**Objective**: Prevent runtime crashes caused by malformed AI configuration or invalid tool execution arguments.

**Tasks:**

1.  Implement Zod schemas for `WorkflowNode` and `ToolData`.
2.  Add validation pipeline in `WorkflowEngineService`.
3.  Validate `project.aiConfig` on load.

### Phase 3: Configuration Cleanup

**Status**: ✅ Complete
**Objective**: Remove technical debt by consolidating split AI configuration into a single source of truth.

**Tasks:**

1.  Migrate reading of `aiResponderEnabled` and `aiResponderPrompt` to `aiConfig`.
2.  Update `Project` entity to mark legacy fields as deprecated (or remove usage).

### Phase 4 (Optional): Verification

**Status**: ✅ Complete
**Objective**: Verify the fix with a reproduction test case.

**Tasks:**

1.  Create `ai-concurrency.e2e-spec.ts`.
2.  Run E2E tests to confirm no regression.
