# Bug Symptom

**Reported:** 2026-02-01
**Status:** DRAFT

## Expected Behavior

The unit test `AiResponderService › Condition Node Logic` should complete and pass, verifying the history filtering logic.

## Actual Behavior

The test hangs indefinitely during execution.

## Reproduction Steps

1. Run `npm run test -- packages/backend/src/ai-responder/ai-responder.service.spec.ts`

## Conditions

- Condition Node is mocked to return a `route_decision`.
- `_handleRoutingDecision` calls `_processMessage` recursively.
- Static mocks cause infinite recursion.

## Environment

- **Environment:** dev (Linux)
- **Recent Changes:** Added `Condition Node Logic` test case to `ai-responder.service.spec.ts`.
