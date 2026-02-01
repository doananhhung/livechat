phase: 3
created: 2026-01-31
is_tdd: true

---

# Plan: Phase 3 - Cleanup & Optimization

## Objective

Finalize the refactor with nice-to-haves (single DB update) and verify system integrity across all AI modes.

## Context

- ./.gtd/ai-responder-refactor/SPEC.md
- ./.gtd/ai-responder-refactor/ROADMAP.md
- `packages/backend/src/ai-responder/ai-responder.service.ts`
- `packages/backend/src/ai-responder/ai-responder.service.spec.ts`

## Architecture Constraints

- **Single Source:** Conversation metadata (`workflowState`) is the authoritative workflow state.
- **Invariants:** State must be persisted after each workflow transition, not multiple times per message cycle.
- **Resilience:** If DB update fails, the workflow state should not be corrupted (atomic operation).
- **Testability:** Existing tests should continue to pass.

## Tasks

<task id="1" type="auto" complexity="Medium">
  <name>Create Failing Test for Single DB Update</name>
  <risk>Need to spy on repository calls to count invocations.</risk>
  <files>packages/backend/src/ai-responder/ai-responder.service.spec.ts</files>
  <action>
    Add a test case: "should perform at most one DB update for conversation metadata in _finalizeResponse".
    - Mock `conversationRepository.save` or `.update` as a spy.
    - Execute a full message processing flow via `_processMessage`.
    - Assert that the repository update method was called exactly once (not 2+ times).
    Run test to confirm failure (Red) if current implementation performs multiple writes.
  </action>
  <done>
    Test exists and asserts single DB write behavior.
    Test may pass or fail depending on current implementation.
  </done>
</task>

<task id="2" type="auto" complexity="Medium">
  <name>Optimize DB Updates in _finalizeResponse</name>
  <risk>Changing transaction boundaries could cause state inconsistency if done incorrectly.</risk>
  <files>packages/backend/src/ai-responder/ai-responder.service.ts</files>
  <action>
    Review `_finalizeResponse` method.
    Identify all `conversationRepository.update` or `.save` calls.
    Consolidate multiple writes into a single update call where possible.
    Ensure the final state update includes all necessary metadata changes.
    Run tests to confirm pass (Green).
  </action>
  <done>
    `_finalizeResponse` performs at most one DB write for conversation metadata.
    Test passes.
  </done>
</task>

<task id="3" type="checkpoint:human-verify">
  <name>Manual Integration Test</name>
  <risk>Final verification before declaring refactor complete.</risk>
  <files>N/A</files>
  <action>
    Start backend in development mode.
    Send a test message through the widget to a project configured with:
    - Orchestrator mode with a sample workflow.
    - Simple mode (no workflow).
    Verify bot responds correctly in both scenarios.
  </action>
  <done>User confirms both AI modes work as expected.</done>
</task>

## Success Criteria

- [ ] Test asserts single DB write behavior.
- [ ] `_finalizeResponse` performs at most one DB write for conversation metadata.
- [ ] Manual integration test passes for both Orchestrator and Simple modes.
