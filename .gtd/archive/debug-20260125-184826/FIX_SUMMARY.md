# Bug Fix Summary

**Status:** Fixed
**Executed:** 2026-01-25

## Bug Summary

**Symptom:** Agent messages did not appear immediately after sending, showing a delay before appearing (missing optimistic update).
**Root Cause:** The `useSendAgentReply` mutation used a cache key `["messages", pid, cid]` which differed from the `useGetMessages` reader key `["messages", pid, cid, params]`. Optimistic updates were writing to an unobserved location.

## What Was Done

Updated `useSendAgentReply` in `packages/frontend/src/services/inboxApi.ts` to include `undefined` as the 4th element in the query key, aligning it with the default behavior of `useGetMessages`.

## Behaviour

**Before:** User sends message -> Wait -> Message appears (from serve refetch).
**After:** User sends message -> Message appears immediately (optimistic) -> Confirms later.

## Tasks Completed

1. ✓ Align Query Keys in useSendAgentReply
   - Updated `onMutate`, `onSuccess`, and `onError` to use `["messages", projectId, conversationId, undefined]`.
   - Files: `packages/frontend/src/services/inboxApi.ts`

## Deviations

None.

## Verification

- [ ] Original symptom no longer reproduces (User verification required)

## Files Changed

- `packages/frontend/src/services/inboxApi.ts` — Updated mutation optimization logic.

## Proposed Commit Message

fix(inbox): align optimistic update query key with reader

Fixes an issue where agent messages did not appear immediately in the chat.
The mutation was updating a cache key without the `params` argument, while the list component reads from a key that includes `params` (defaulting to undefined).

Root cause: React Query cache key mismatch.

- Update `useSendAgentReply` to match `useGetMessages` key structure
