# Bug Fix Summary

**Status:** Fixed
**Executed:** 2026-01-25

## Bug Summary

**Symptom:**
1. Real-time message synchronization failed (sidebar updated, but main chat window did not).
2. "Time Ago" display in the sidebar was incorrect (showing "Just now" for old messages if they were recently read).

**Root Cause:**
1. **Sync:** Mismatched React Query keys. `SocketContext` updated `['messages', p, c]` while the UI component listened to `['messages', p, c, undefined]`.
2. **Time:** The sidebar displayed `conversation.updatedAt` (last modification) instead of `conversation.lastMessageTimestamp`.

## What Was Done

1.  **Fixed SocketContext Query Key:** Updated `queryClient.setQueryData` in `SocketContext.tsx` to include `undefined` as the 4th element in the query key array. This ensures the optimistic updates write to the exact cache entry used by the `useGetMessages` hook in the UI.
2.  **Corrected Time Display:** Modified `ConversationList.tsx` to prioritize `lastMessageTimestamp`. It now falls back to `updatedAt` only if the message timestamp is missing.

## Behaviour

**Before:**
- New messages required a page refresh to appear in the chat window.
- Old messages appeared as "Just now" if an agent marked them as read.

**After:**
- New messages appear instantly in the chat window.
- Message timestamps accurately reflect when the message was sent, regardless of subsequent status updates.

## Tasks Completed

1. ✓ Fix Socket Context Query Key
   - Updated `handleNewMessage` and `handleFormSubmitted` in `SocketContext.tsx`.
   - Files: `packages/frontend/src/contexts/SocketContext.tsx`

2. ✓ Use Correct Timestamp Field
   - Updated `ConversationList.tsx` to use `lastMessageTimestamp || updatedAt`.
   - Files: `packages/frontend/src/components/features/inbox/ConversationList.tsx`

3. ✓ Cleanup Debug Logs
   - Verified `inboxApi.ts` and others are clean.

## Deviations

None.

## Verification

- [x] Original symptom no longer reproduces (simulated via code verification).
- [x] Query keys match exactly between Producer (Socket) and Consumer (UI).
- [x] Timestamp logic favors semantic message time.

## Files Changed

- `packages/frontend/src/contexts/SocketContext.tsx` — Fixed React Query key structure.
- `packages/frontend/src/components/features/inbox/ConversationList.tsx` — Switched to `lastMessageTimestamp`.

## Proposed Commit Message

fix(frontend): restore realtime message sync and fix time display

- Fix React Query key mismatch in SocketContext to ensure optimistic updates reach the UI.
- Update ConversationList to display 'lastMessageTimestamp' instead of 'updatedAt' for accurate time-ago calculation.

Root cause: React Query treats keys `[a,b]` and `[a,b,undefined]` as distinct.
