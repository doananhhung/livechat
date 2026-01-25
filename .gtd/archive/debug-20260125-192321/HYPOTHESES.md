# Root Cause Hypotheses

**Analyzed:** 2026-01-25
**Status:** PENDING VERIFICATION

## Summary

The optimistic UI fix worked, but exposed a race condition in the backend's message saving logic interacting with frontend invalidation.

---

## Hypothesis 1: Backend Double-Save Race Condition

**Confidence:** High (90%)

**Description:**
`MessageService.sendAgentReply` saves the message **twice**:

1.  Inside a transaction, with `status: SENDING`.
2.  After Redis lookup and event emission, with `status: SENT`.

The frontend mutation `onSuccess` updates the cache to `SENT` immediately.
However, `onSettled` triggers `queryClient.invalidateQueries`.
If this invalidation triggers a refetch from the DB **between** the first save and the second save (the "Critical Window"), the frontend loads the `SENDING` status.
This overwrites the optimistic/success `SENT` status, causing the spinner to reappear ("blink").
Eventually, a socket event or subsequent refetch corrects it to `SENT`.

**Evidence:**

- `packages/backend/src/inbox/services/message.service.ts`:
  - Line 96: `await transactionalEntityManager.save(message)` (Status: SENDING)
  - Line 137: `await this.entityManager.save(savedMessage)` (Status: SENT)
- `packages/frontend/src/services/inboxApi.ts`:
  - Line 243: `queryClient.invalidateQueries` in `onSettled`.

**Location:**

- Backend: `packages/backend/src/inbox/services/message.service.ts` (lines 96, 137)
- Frontend: `packages/frontend/src/services/inboxApi.ts` (line 243)

**Verification Method:**

1.  Logs: Add logs in backend around the two saves.
2.  Observed Behavior: The "blink" timing (~1s) matches the latency of a DB roundtrip + Redis lookup.

**Fix Strategy:**
Refactor `MessageService.sendAgentReply` to determine the status (check visitor presence) **before** the initial save commit, so the message is committed to the DB as `SENT` (or `DELIVERED`) in a single transaction.

---
