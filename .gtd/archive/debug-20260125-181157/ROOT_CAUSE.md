# Root Cause

**Found:** 2026-01-25
**Status:** CONFIRMED

## Root Cause 1: React Query Key Mismatch (Sync Failure)

The `SocketContext` optimistically updates the message cache using the key `['messages', projectId, conversationId]`. However, the `MessagePane` component retrieves messages using `useGetMessages`, which generates the key `['messages', projectId, conversationId, undefined]` (because the optional `params` argument is undefined).

React Query treats `['a', 'b', 'c']` and `['a', 'b', 'c', undefined]` as distinct keys. Therefore, the real-time updates from the socket are written to a "ghost" cache entry that the UI never reads.

## Root Cause 2: Wrong Timestamp Used (Time Display Error)

The system is displaying "Time of Last Activity" instead of "Time of Last Message".

- **Expected:** Show when the last message was sent (`lastMessageTimestamp`).
- **Actual:** Shows when the conversation was last modified (`updatedAt`).

**Why this is a bug:**
The `updatedAt` field updates on *any* change, including:
- Marking as read
- Changing status (Open/Pending/Solved)
- Assigning an agent
- Visitor coming online (via socket status updates)

**Example Scenario:**
1. **Yesterday:** Visitor sends "Help me". (`lastMessageTimestamp` = Yesterday)
2. **Today (1 hour ago):** AI or System marks the conversation as "Read" or updates visitor status.
3. **Result:** `updatedAt` becomes "1 hour ago".
4. **UI Display:** User sees "1 hour ago" next to the visitor's name, implying the message is recent, but the message itself is from yesterday.

## Verified Hypothesis

**Original Hypothesis 1 & 2:** Confirmed.

## Evidence

**Debug Logs:**
- `inboxApi.ts`: `[DEBUG] useGetMessages using key: (4) ['messages', 1, 18, undefined]`
- `SocketContext.tsx`: `[DEBUG] SocketContext updating messages with key: (3) ['messages', 1, 18]`
- `ConversationList.tsx`: `updatedAt: '2026-01-25T11:00:36.093Z'` vs `lastMessageTimestamp: '2026-01-25T11:00:33.902Z'` (showing divergence).

## Location

- **Files:**
  - `packages/frontend/src/contexts/SocketContext.tsx`
  - `packages/frontend/src/components/features/inbox/ConversationList.tsx`