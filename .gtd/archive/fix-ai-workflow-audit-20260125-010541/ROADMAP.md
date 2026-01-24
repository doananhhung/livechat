# Roadmap

**Spec:** ./.gtd/fix-ai-workflow-audit/SPEC.md
**Goal:** Fix all problems identified in the AI Workflow Audit Report
**Created:** 2026-01-25

## Must-Haves

- [ ] Fix Race Condition (Redis Locking)
- [ ] Remove Dead Code (Trigger Node)
- [ ] Centralize Tool Definitions
- [ ] Explicit System Actor

## Nice-To-Haves

- [ ] Integration tests for concurrent message handling
- [ ] Add logging when lock acquisition fails

## Phases

<must-have>

### Phase 1: Explicit System Actor

**Status**: ✅ Complete
**Objective**: Create a dedicated "System" user in the database. This is a foundational change that other fixes (like `AiToolExecutor`) will depend on. Includes migration, role enum update, and constant definition.

### Phase 2: Fix Race Condition

**Status**: ✅ Complete
**Objective**: Implement Redis-based per-visitor locking in `AiResponderService`. Prevents `conversation.metadata.workflowState` overwrites during concurrent message processing.

### Phase 3: Centralize Tool Definitions

**Status**: ✅ Complete
**Objective**: Move tool names and definitions to `@live-chat/shared-types`. Update `AiToolExecutor.ts`, `NodeConfigPanel.tsx`, and `GlobalToolsPanel.tsx` to import from shared package.

### Phase 4: Remove Dead Code

**Status**: ✅ Complete
**Objective**: Remove the orphaned `trigger` node type reference from `WorkflowEngineService.getNodeContext()`. Clean up any related unused logic.

</must-have>

<nice-to-have>

### Phase 5 (optional): Concurrency Tests

**Status**: ✅ Complete
**Objective**: Add integration tests that verify Redis locking prevents race conditions.

</nice-to-have>
