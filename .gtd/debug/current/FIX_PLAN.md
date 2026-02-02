---
created: 2026-02-02
root_cause: onMutate uses wrong type InfiniteData<Message[]> instead of InfiniteData<PaginatedMessages>
---

# Fix Plan

## Objective

Fix agent message send by correcting the type annotations and data access in `useSendAgentReply` hook's optimistic update logic.

## Context

- ./.gtd/debug/current/ROOT_CAUSE.md
- packages/frontend/src/services/inboxApi.ts

## Architecture Constraints

- **Single Source:** Query cache is the authoritative UI state
- **Invariants:** Page structure must be `{ data: Message[], hasNextPage, nextCursor }`
- **Resilience:** Optimistic update must not break if cache is empty
- **Testability:** N/A - logic fix only

## Tasks

<task id="1" type="auto">
  <name>Fix optimistic update type and data access in useSendAgentReply</name>
  <files>packages/frontend/src/services/inboxApi.ts</files>
  <action>
    In `useSendAgentReply` hook, update all three `setQueryData` calls (onMutate, onSuccess, onError):
    
    1. Change type from `InfiniteData<Message[]>` to `InfiniteData<PaginatedMessages>`
    2. Access `page.data` instead of `page` directly when manipulating messages
    3. Preserve the page structure `{ data, hasNextPage, nextCursor }` when updating
    
    Specifically in onMutate:
    - OLD: `newPages[0] = [...newPages[0], optimisticMessage]`
    - NEW: `newPages[0] = { ...newPages[0], data: [...newPages[0].data, optimisticMessage] }`
  </action>
  <done>No TypeError when sending message; optimistic message appears in UI</done>
</task>

<task id="2" type="auto">
  <name>Remove debug logs</name>
  <files>packages/frontend/src/services/inboxApi.ts, packages/frontend/src/components/features/inbox/MessageComposer.tsx</files>
  <action>
    Remove all temporary `[DEBUG]` console.log statements added during verification.
  </action>
  <done>No debug logs in code</done>
</task>

<task id="3" type="checkpoint:human-verify">
  <name>Verify message send works</name>
  <files>N/A</files>
  <action>
    1. Open any conversation as agent
    2. Type message and send (Enter or click)
    3. Verify message appears optimistically
    4. Verify network request is made
    5. Verify message persists after refresh
  </action>
  <done>Agent can send messages successfully</done>
</task>

## Success Criteria

- [ ] Original symptom no longer occurs (message sends work)
- [ ] Optimistic update shows message immediately
- [ ] Network request is made to backend
- [ ] No regressions (existing tests pass)

## Rollback Plan

Revert changes to `inboxApi.ts` if issues occur.
