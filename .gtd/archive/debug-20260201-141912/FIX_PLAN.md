---
created: 2026-02-01
root_cause: Infinite recursion in _processMessage during testing due to static mocks.
---

# Fix Plan

## Objective

Resolve the infinite loop in the `AiResponderService › Condition Node Logic` unit test by making the LLM mock dynamic, ensuring it terminates after evaluating the routing decision.

## Context

- [ROOT_CAUSE.md](file:///home/hoang/node/live_chat/.gtd/debug/current/ROOT_CAUSE.md)
- [ai-responder.service.spec.ts](file:///home/hoang/node/live_chat/packages/backend/src/ai-responder/ai-responder.service.spec.ts)

## Architecture Constraints

- **Testability:** Unit tests must use dynamic mocks for recursive flows to prevent infinite execution cycles.

## Tasks

<task id="1" type="auto">
  <name>Fix Condition Node Unit Test</name>
  <files>packages/backend/src/ai-responder/ai-responder.service.spec.ts</files>
  <action>
    - Update the `llmProviderManager.generateResponse` mock to return a `route_decision` tool call on the first call and a plain text response ("OK") on subsequent calls.
    - Remove the `loggerErrorSpy` and the manual `throw new Error` debugging block.
  </done>
  <done>Unit test passes without hanging and verifies history filtering.</done>
</task>

## Success Criteria

- [ ] `AiResponderService › Condition Node Logic` unit test passes.
- [ ] No regressions in other tests.

## Rollback Plan

Revert changes to `ai-responder.service.spec.ts`.
