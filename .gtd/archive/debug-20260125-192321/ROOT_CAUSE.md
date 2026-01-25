# Root Cause

**Found:** 2026-01-25
**Status:** CONFIRMED

## Root Cause

**Backend Double-Save Race Condition**: `MessageService.sendAgentReply` performs two save operations:

1.  **Initial Save**: Saves message with `status: SENDING` inside a transaction.
2.  **Latency Window**: Performs Redis lookup calling `realtimeSessionService.getVisitorSession`.
3.  **Final Save**: Updates message to `status: SENT` (or `DELIVERED`).

The frontend receives the `sendAgentReply` response (the final `SENT` message) and optimistically updates the UI. However, the `onSettled` handler immediately invalidates the query. If the frontend's subsequent GET request hits the database during the "Latency Window" (after Initial Save commit but before Final Save commit), it retrieves the `SENDING` status. This overwrites the frontend's correct `SENT` state, causing the spinner to reappear ("blink") until a subsequent update corrects it.

## Verified Hypothesis

**Original Hypothesis 1:** Backend Double-Save Race Condition
**Confidence:** 90% → **Confirmed**

## Evidence

**Code Analysis of `packages/backend/src/inbox/services/message.service.ts`:**

- Lines 63-110: Transaction creates and saves message as `SENDING`.
- Lines 114-116: `realtimeSessionService.getVisitorSession` (Async Redis call).
- Lines 137: `this.entityManager.save(savedMessage)` updates to `SENT`.

This structure guarantees a window of time where the visible database state is `SENDING` even though the operation is logically complete.

## Location

- **File:** `packages/backend/src/inbox/services/message.service.ts`
- **Lines:** 96 (First Save), 137 (Second Save)

## Why It Causes The Symptom

1. **Mutation Success**: Frontend has `SENT` message.
2. **Invalidation**: Query refetches.
3. **Race**: Refetch reads DB state `SENDING` (from First Save).
4. **UI Update**: Message reverts to spinner.
5. **Resolution**: Socket event or later refetch brings `SENT` state.
6. **Result**: Spinner -> Normal -> Spinner -> Normal ("Blink").

## Rejected Hypotheses

None.
