# Remediation Roadmap

**Date:** 2026-01-25
**Objective:** Stabilize the AI subsystem and pay down critical technical debt.

## Priority 0: Immediate (Critical Fixes)
*Must be addressed before any new features.*

### 1. Fix "Stale Save" Race Condition
- **Goal:** Prevent data loss during AI execution.
- **Pattern:** Replace `repository.save(entity)` with atomic `UPDATE` queries.
- **Action:**
  - Modify `AiResponderService.handleVisitorMessage`.
  - Instead of saving the whole `conversation` object, execute specific updates:
    ```typescript
    await conversationRepository.update(
      { id: conversation.id },
      {
        lastMessageSnippet: aiResponseText,
        lastMessageTimestamp: new Date(),
        metadata: updatedMetadata // CAREFUL: jsonb merge needed?
      }
    );
    ```
  - **Better:** Re-fetch conversation *immediately* before saving to merge changes (Optimistic Concurrency).

## Priority 1: Near-Term (Hygiene)
*Address within 1-2 sprints.*

### 2. Rename Legacy "Workflow" Module
- **Goal:** Eliminate cognitive dissonance.
- **Action:**
  - Rename `packages/backend/src/modules/workflow` -> `packages/backend/src/modules/status-automation`.
  - Rename `WorkflowConsumer` -> `StatusAutomationConsumer`.
  - Update all imports and queue names.

### 3. Harden Workflow Engine Types
- **Goal:** Prevent runtime crashes from bad config.
- **Action:**
  - Introduce `zod` schemas for `WorkflowNode`, `ToolData`, `ConditionData`.
  - Validate `project.aiConfig` at the boundary (service entry).

## Priority 2: Long-Term (Quality)
*Address when capacity allows.*

### 4. Integration Test Suite for Concurrency
- **Goal:** Verify locking and race condition handling automatically.
- **Action:**
  - Create a test that simulates a human agent update *during* the AI processing delay.
  - Assert that the human update is NOT overwritten.

### 5. Unified AI Configuration
- **Goal:** Simplify project settings.
- **Action:**
  - Migrate legacy fields (`aiResponderEnabled`, `aiResponderPrompt`) into the `aiConfig` JSON structure.
  - Deprecate columns in `Project` entity.
