# Root Cause Hypotheses

**Analyzed:** 2026-01-25
**Status:** PENDING VERIFICATION

## Summary

Based on code analysis, I have identified two distinct root causes corresponding to the two symptoms.

---

## Hypothesis 1: Mismatched React Query Keys (Sync Failure)

**Confidence:** High (95%)

**Description:**
The real-time update in `SocketContext` writes to a different cache key than the one `MessagePane` reads from. `MessagePane` uses `useGetMessages`, which includes an `undefined` params object in its query key structure: `['messages', projectId, conversationId, undefined]`. `SocketContext` updates `['messages', projectId, conversationId]`. Because React Query keys are strict deep-equal arrays, these are treated as separate cache entries.

**Evidence:**
- `packages/frontend/src/services/inboxApi.ts` L82: `queryKey: ["messages", projectId, conversationId, params]` (where `params` is often undefined).
- `packages/frontend/src/contexts/SocketContext.tsx` L59: `queryClient.setQueryData(["messages", projectIdFromUrl, conversationId], ...)` (missing the 4th element).

**Location:**
- File: `packages/frontend/src/contexts/SocketContext.tsx`
- Lines: 59 (and other `setQueryData` calls for messages)

**Verification Method:**
- In `/d-verify`, inspect the React Query cache using `queryClient.getQueryCache().getAll()`.
- Observe that two separate keys exist for the same conversation messages.

---

## Hypothesis 2: Wrong Timestamp Field Used (Time Display Error)

**Confidence:** High (90%)

**Description:**
The `ConversationList` component displays `conversation.updatedAt` instead of `conversation.lastMessageTimestamp`. The `updatedAt` field changes whenever *any* property of the conversation changes (e.g., status update, read marking, assignee change, or even internal metadata updates), not just when a message is sent. This causes the displayed time to show "Just now" or recent times even for conversations where the last message is days old.

**Evidence:**
- `packages/frontend/src/components/features/inbox/ConversationList.tsx` L189: `<ConversationTime date={conversation.updatedAt} />`.
- `packages/shared-types/src/conversation.types.ts` defines `lastMessageTimestamp` explicitly for this purpose.

**Location:**
- File: `packages/frontend/src/components/features/inbox/ConversationList.tsx`
- Line: 189

**Verification Method:**
- Check the database/API response for a conversation.
- Compare `updatedAt` vs `lastMessageTimestamp`.
- Confirm `ConversationList` renders the `updatedAt` value.

---

## Code Analysis Notes

- **URL Regex Fragility:** `SocketContext` extracts `projectId` using regex `/\/projects\/(\d+)/`. While this currently works for the standard inbox route, it is brittle. If the route structure changes, real-time updates will break.
- **Date Handling:** The `useTimeAgo` hook seems correct (`date-fns` handles timezones well), assuming the input date string is valid ISO 8601. The issue is almost certainly *which* date is being passed to it.
