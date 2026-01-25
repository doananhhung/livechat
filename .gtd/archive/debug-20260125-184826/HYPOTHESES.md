# Root Cause Hypotheses

**Analyzed:** 2026-01-25
**Status:** PENDING VERIFICATION

## Summary

Based on code analysis, the most likely root cause is a mismatch between the React Query cache key used for reading messages and the key used for the optimistic update.

---

## Hypothesis 1: Cache Key Mismatch

**Confidence:** High (95%)

**Description:**
`useGetMessages` includes `params` in its query key: `["messages", projectId, conversationId, params]`.
`useSendAgentReply` updates the cache using a key _without_ params: `["messages", projectId, conversationId]`.

When `MessagePane` calls `useGetMessages(pid, cid)`, `params` is `undefined`.
React Query treats `["messages", 1, 1]` and `["messages", 1, 1, undefined]` as **different keys**.
Therefore, the optimistic update writes to a key that the UI is not observing. The UI only updates when the mutation succeeds and invalidates the queries (fuzzy matching might be working for invalidation but not for `setQueryData`).

**Evidence:**

- `packages/frontend/src/services/inboxApi.ts`:

  ```typescript
  // Line 155
  queryKey: ["messages", projectId, conversationId, params],

  // Line 179
  const queryKey = [
    "messages",
    newMessagePayload.projectId,
    newMessagePayload.conversationId,
  ];
  ```

**Location:**

- File: `packages/frontend/src/services/inboxApi.ts`
- Lines: 155, 179

**Verification Method:**
Modify `useSendAgentReply` to include `undefined` as the 4th element in the query key, or iterate over all active queries matching the base key.

---
