# Root Cause

**Found:** 2026-01-25
**Status:** CONFIRMED

## Root Cause

The React Query cache key used for optimistic updates in `useSendAgentReply` does not match the key used by `useGetMessages` to read the message list.

- **Reader:** `["messages", projectId, conversationId, params]` (where `params` is often `undefined`)
- **Writer:** `["messages", projectId, conversationId]`

React Query treats these as distinct keys. The optimistic update writes to a key that no active observer is watching, so the UI does not update until the mutation succeeds and invalidates the query (triggering a refetch).

## Verified Hypothesis

**Original Hypothesis 1:** Cache Key Mismatch
**Confidence:** 95% → **Confirmed**

## Evidence

**Code Analysis of `packages/frontend/src/services/inboxApi.ts`:**

1.  **Reader (`useGetMessages`, line 155):**

    ```typescript
    queryKey: ["messages", projectId, conversationId, params],
    ```

    Arguments are passed including `params` (which is `undefined` in `MessagePane`).

2.  **Writer (`useSendAgentReply`, line 179):**
    ```typescript
    const queryKey = [
      "messages",
      newMessagePayload.projectId,
      newMessagePayload.conversationId,
    ];
    ```
    This array has length 3, whereas the reader key has length 4 (ending in `undefined`).

## Location

- **File:** `packages/frontend/src/services/inboxApi.ts`
- **Lines:** 155, 179

## Why It Causes The Symptom

1.  User clicks Send.
2.  `onMutate` runs, setting data for Key A (`[..., id]`).
3.  UI is subscribed to Key B (`[..., id, undefined]`).
4.  UI sees no change (Key B is untouched).
5.  Mutation finishes (`onSuccess`).
6.  `queryClient.invalidateQueries({ queryKey: [..., id] })` runs.
7.  This invalidation uses fuzzy matching, so it invalidates Key B.
8.  UI refetches Key B from server.
9.  Server returns the new message.
10. UI updates (displaying the message after network delay).

## Rejected Hypotheses

None.
