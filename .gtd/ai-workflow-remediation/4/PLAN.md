---
phase: 4
created: 2026-01-25
---

# Plan: Phase 4 - Verification

## Objective

Verify that the "Critical Race Condition" fixed in Phase 1 is indeed solved.
We will create a specific E2E test that simulates the exact failure scenario: a concurrent update occurring while the AI is "thinking" (awaiting LLM response).

## Context

- `packages/backend/test/ai-concurrency.e2e-spec.ts` (New File)
- `packages/backend/src/ai-responder/ai-responder.service.ts`

## Test Strategy

1.  **Mock LLM Latency:** We will override `LLMProviderManager` to allow manual control of when the AI response is returned (`barrier` pattern).
2.  **Concurrent Operation:** While the AI service is halted at the barrier, we will execute a database update (`assigneeId` change) on the same conversation.
3.  **Resume & Assert:** We allow the AI service to finish. Then we assert that the database update was **preserved** (not overwritten by stale state).

## Tasks

<task id="1" type="auto">
  <name>Create Concurrency E2E Test</name>
  <files>packages/backend/test/ai-concurrency.e2e-spec.ts</files>
  <action>
    Create a new E2E test file.
    - Setup `AiResponderModule` with `Test.createTestingModule`.
    - Mock `LLMProviderManager.generateResponse` to wait for a signal.
    - **Test Flow:**
      1. Create Project (AI enabled), Visitor, Conversation.
      2. Trigger `aiResponderService.handleVisitorMessage`.
      3. **Await Barrier:** AI pauses.
      4. **Concurrent Write:** Update `conversation.metadata` or `assigneeId`.
      5. **Release Barrier:** AI completes save.
      6. **Assert:** Check that Concurrent Write persisted AND AI response persisted.
  </action>
  <done>
    - File created.
    - Test passes with `npm run test:e2e -- test/ai-concurrency.e2e-spec.ts`.
  </done>
</task>

## Success Criteria

- [ ] New E2E test passes.
- [ ] Test explicitly validates that `update()` did not overwrite intermediate changes.
