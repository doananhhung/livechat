# Root Cause Hypotheses

**Analyzed:** 2026-02-01
**Status:** PENDING VERIFICATION

## Summary

The unit test hang is caused by an infinite recursion loop in `_processMessage`. The recursive call in `_handleRoutingDecision` re-enters `_processMessage`, which re-fetches the conversation state. In the unit test environment, the mock repository returns the same initial state every time, preventing the workflow from advancing.

---

## Hypothesis 1: Static Mock Data in Recursive Flow

**Confidence:** High (90%)

**Description:**
The unit test mocks `conversationRepository.findOne` to return a static `mockConversation` object with `currentNodeId: 'cond-node'`. When `_handleRoutingDecision` calls `_processMessage` recursively, the service re-fetches the conversation. The mock returns the original state, causing the service to process the same condition node again, leading to an infinite loop.

**Evidence:**

- `AiResponderService.ts:440` calls `_processMessage(payload)` recursively.
- `AiResponderService.ts:109` re-loads context (`findOne`) at the start of every recursive call.
- `ai-responder.service.spec.ts:287` mocks `findOne` to return a constant.

**Location:**

- Files: `packages/backend/src/ai-responder/ai-responder.service.ts`, `packages/backend/src/ai-responder/ai-responder.service.spec.ts`
- Lines: `_processMessage` recursion point and `beforeEach` mock setup.

**Verification Method:**
Modify the test mock to return different states on subsequent calls or limit recursion depth in `_processMessage`.

---

## Hypothesis 2: Lack of Recursion Depth Limit

**Confidence:** Medium (60%)

**Description:**
`AiResponderService._processMessage` does not implement a maximum recursion depth or "turn limit". While the primary cause in the test is the static mock, the absence of a guard allows the loop to run indefinitely rather than failing gracefully.

**Evidence:**

- `_processMessage` implementation lacks a counter or depth parameter.
- The recursion at line 440 is unconditional if a routing decision is made.

**Location:**

- Files: `packages/backend/src/ai-responder/ai-responder.service.ts`
- Lines: 106-141

**Verification Method:**
Add a `depth` parameter to `_processMessage` and assert that it stops/logs error after N turns.

---

## Code Analysis Notes

- The service logic correctly updates the database before recursing, but unit tests skip the actual DB side-effect.
- In production, if a workflow has a cycle (e.g., A -> B -> A), this logic will also cause an infinite loop and potentially crash the worker.
