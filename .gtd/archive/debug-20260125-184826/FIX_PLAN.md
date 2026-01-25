---
created: 2026-01-25
root_cause: React Query cache key mismatch between useGetMessages (reader) and useSendAgentReply (writer)
---

# Fix Plan

## Objective

Ensure optimistic UI updates for agent messages appear immediately by aligning the React Query cache keys between the mutation and the query.

## Context

- `packages/frontend/src/services/inboxApi.ts`: Contains both `useGetMessages` and `useSendAgentReply`.

## Architecture Constraints

- **Single Source:** React Query Cache is the single source of truth for UI state.
- **Invariants:** Optimistic updates MUST write to the exact same key that the UI is observing.
- **Resilience:** If the mutation fails, the optimistic update must be rolled back (already handled by React Query but needs key alignment).

## Tasks

<task id="1" type="auto">
  <name>Align Query Keys in useSendAgentReply</name>
  <files>packages/frontend/src/services/inboxApi.ts</files>
  <action>
    Modify the `useSendAgentReply` hook:
    1. Update `onMutate`: Construct `queryKey` to include `undefined` as the 4th element: `["messages", projectId, conversationId, undefined]`.
    2. Update `onSuccess`: Use the same 4-element key for updating the final message.
    3. Update `onError`: Use the same 4-element key for rollback.
    4. Keep `onSettled` invalidation broad (fuzzy match) or explicit.
    
    *Constraint:* Ensure we do not break other consumers if they exist. (Checked: `MessagePane` is the primary consumer and uses `undefined` implicitly).
  </action>
  <done>
    - "messages" query key in mutation matches "messages" query key in query.
  </done>
</task>

## Success Criteria

- [ ] Agent message appears immediately (within ms) upon sending.
- [ ] No regression in message list loading.
- [ ] Error state handling still works (if send fails).

## Rollback Plan

Revert changes to `packages/frontend/src/services/inboxApi.ts`.
