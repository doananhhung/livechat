# Bug Fix Summary

**Status:** Fixed
**Executed:** 2026-02-01

## Bug Summary

**Symptom:** Unit test `AiResponderService › Condition Node Logic` hung indefinitely.
**Root Cause:** Infinite recursion in `_processMessage` caused by a static LLM mock returning a `route_decision` tool call on every iteration, combined with a static conversation repository mock.

## What Was Done

Updated the unit test to use a dynamic LLM mock. The mock now returns a routing decision once (triggering one recursion) and then returns a plain text response to terminate the cycle.

## Behaviour

**Before:** Running tests would hang the process, requiring manual termination (Ctrl+C).
**After:** Tests complete in seconds and correctly verify that Condition Nodes only evaluate the latest user message.

## Tasks Completed

1. ✓ Fix Condition Node Unit Test
   - Implemented `mockResolvedValueOnce` followed by `mockResolvedValue` for `llmProviderManager.generateResponse`.
   - Removed temporary debugging code.
   - Files: `packages/backend/src/ai-responder/ai-responder.service.spec.ts`

## Deviations

None.

## Verification

- [x] Original symptom no longer reproduces (Unit tests pass without hang)
- [x] `llmProviderManager.generateResponse` correctly receives only the last message for Condition nodes.

## Files Changed

- `packages/backend/src/ai-responder/ai-responder.service.spec.ts` — Updated mock logic for the new test case.

## Proposed Commit Message

test(ai-responder): fix infinite recursion in condition node unit test

- Update `AiResponderService` spec to use dynamic LLM mocks for recursive workflow flows.
- Ensure `generateResponse` terminates after processing the initial routing decision.
- Verified that history filtering for Condition nodes works as expected.

Root cause: Static mocks caused `_processMessage` to recurse indefinitely.
