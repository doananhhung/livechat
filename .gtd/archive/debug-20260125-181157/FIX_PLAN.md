---
created: 2026-01-25
root_cause: React Query key mismatch in SocketContext & Wrong timestamp field in ConversationList
---

# Fix Plan

## Objective
Restore real-time message synchronization and correct the "Time Ago" display in the conversation list.

## Context
- `packages/frontend/src/contexts/SocketContext.tsx`: Updates cache with wrong key structure.
- `packages/frontend/src/components/features/inbox/ConversationList.tsx`: Displays modification time instead of message time.
- `packages/frontend/src/services/inboxApi.ts`: Contains debug logs to be removed.

## Architecture Constraints
- **React Query Keys:** Must strictly match the array structure defined in `useQuery` hooks. `['key', id]` !== `['key', id, undefined]`.
- **Data Integrity:** `lastMessageTimestamp` is the semantic truth for "Last Message Time". `updatedAt` is "Last Modification Time".

## Tasks

<task id="1" type="auto">
  <name>Fix Socket Context Query Key</name>
  <files>packages/frontend/src/contexts/SocketContext.tsx</files>
  <action>
    In `handleNewMessage` and `handleFormSubmitted`:
    1. Update `queryClient.setQueryData` calls for the "messages" key.
    2. Change the key from `["messages", projectId, conversationId]` to `["messages", projectId, conversationId, undefined]`.
    3. Ensure this matches the `useGetMessages` hook signature exactly.
    4. Also fix the `handleFormSubmitted` function which performs a similar update.
  </action>
  <done>Query key matches the one used in `inboxApi.ts` (length 4 ending in undefined)</done>
</task>

<task id="2" type="auto">
  <name>Use Correct Timestamp Field</name>
  <files>packages/frontend/src/components/features/inbox/ConversationList.tsx</files>
  <action>
    In `ConversationList.tsx`:
    1. Locate the `<ConversationTime />` component usage.
    2. Change the `date` prop from `conversation.updatedAt` to `conversation.lastMessageTimestamp || conversation.updatedAt`.
    3. Remove the temporary debug logs added during verification.
  </action>
  <done>Conversation list displays time based on the last message, not the last update.</done>
</task>

<task id="3" type="auto">
  <name>Cleanup Debug Logs</name>
  <files>packages/frontend/src/services/inboxApi.ts</files>
  <action>
    Remove the `console.log` added to `useGetMessages` during verification.
  </action>
  <done>Codebase is clean of temporary debug logs.</done>
</task>

## Success Criteria
- [ ] New messages appear in the chat window immediately without refresh.
- [ ] Old messages (e.g., from yesterday) display "1 day ago" instead of "Just now" (or "1 hour ago") even if the conversation was recently read.

## Rollback Plan
Revert changes to `SocketContext.tsx` and `ConversationList.tsx` to previous state.
