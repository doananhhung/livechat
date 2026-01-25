# Bug Symptom

**Reported:** 2026-01-25
**Status:** CONFIRMED

## Expected Behavior

When an agent sends a message:

1. The message should appear **immediately** in the chat list (Optimistic UI).
2. It should have 0.7 opacity and a spinner (Sending state).
3. It should update to normal opacity once confirmed by backend.

## Actual Behavior

1. User clicks send.
2. **Nothing happens** for a short duration (network delay).
3. The message appears suddenly with 0.7 opacity (Sending state).
4. After another ~1 second, it updates to normal state.

## Cause Analysis (Preliminary)

The `useSendAgentReply` hook updates the query cache key `['messages', projectId, conversationId]`.
However, `MessagePane` reads from `useGetMessages` which uses the key `['messages', projectId, conversationId, params]`.
Even when `params` is `undefined`, React Query treats `[..., undefined]` as distinct from `[...]`.
As a result, the optimistic update is written to a cache key that is not being observed by the UI. The UI only updates when the mutation success triggers a fuzzy invalidation of `['messages', projectId, conversationId]`, which refetches the list from the server (returning the message in `SENDING` state).

## Reproduction Steps

1. Open a conversation in Inbox.
2. Type a message and click Send.
3. Observe the chat list.
4. Note the delay between click and message appearance.

## Environment

- **Component:** `MessagePane`, `useSendAgentReply`
- **File:** `packages/frontend/src/services/inboxApi.ts`
