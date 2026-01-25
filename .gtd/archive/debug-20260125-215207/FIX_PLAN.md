---
created: 2026-01-25
root_cause: MessagePane lacks infinite scrolling and useGetMessages uses non-paginated useQuery
---

# Fix Plan

## Objective

Implement infinite scrolling in the `MessagePane` component to allow agents to view complete conversation history. This involves refactoring the data fetching hook to support pagination and adding a scroll observer to the UI.

## Context

- ./.gtd/debug/current/ROOT_CAUSE.md
- `packages/frontend/src/services/inboxApi.ts`
- `packages/frontend/src/components/features/inbox/MessagePane.tsx`

## Architecture Constraints

- **Single Source:** React Query cache (`InfiniteData`) is the single source of truth for message lists.
- **Invariants:**
  - Messages MUST remain strictly ordered by timestamp (newest at bottom).
  - Optimistic updates MUST be compatible with paginated data structures.
  - Pagination MUST use cursor-based logic compatible with backend `ListMessagesDto`.
- **Resilience:** Network failures during pagination should show a retry option, not crash the UI.
- **Testability:** The scroll trigger should be isolated enough to be manually verifyable.

## Tasks

<task id="1" type="auto">
  <name>Refactor useGetMessages to useInfiniteQuery</name>
  <files>packages/frontend/src/services/inboxApi.ts</files>
  <action>
    Refactor `useGetMessages` to use `useInfiniteQuery`.
    
    1. Update hook signature to match `useGetConversations` pattern.
    2. Implement `getNextPageParam`:
       - Check if `lastPage.length < limit` to determine if more data exists.
       - Use the ID/timestamp of the oldest message in `lastPage` as the cursor for the next page.
       - *Correction:* Check backend `ListMessagesDto`. It expects `cursor` and `limit`. The controller `MessageService` likely uses `before` cursor logic.
       - *Crucial:* Ensure the query key includes `projectId` and `conversationId`.
    3. Update `useSendAgentReply` optimistic updates to handle `InfiniteData<Message[]>` structure instead of `Message[]`.
       - Must iterate over pages to find where to append (usually first page if reversed, or last page if standard).
       - *Note:* Messages are usually typically returned newest-first from API but displayed reversed. Need to confirm direction.
  </action>
  <done>
    - `useGetMessages` returns `InfiniteData`.
    - `useSendAgentReply` correctly updates the infinite cache structure.
  </done>
</task>

<task id="2" type="auto">
  <name>Implement Infinite Scroll in MessagePane</name>
  <files>packages/frontend/src/components/features/inbox/MessagePane.tsx</files>
  <action>
    Integrate infinite scrolling into the message list.

    1. Replace `useGetMessages` call and handle `data.pages` flattening.
    2. Add `useInView` (from `react-intersection-observer` or manual Ref) at the **top** of the message list (since it's flex-col-reverse or scrollTop 0).
       - Note: `MessagePane` uses `flex-col-reverse` for auto-scroll-to-bottom behavior.
       - The "loader" needs to be at the *end* of the DOM list (visually top).
    3. When in view, trigger `fetchNextPage()`.
    4. Show a loading spinner when `isFetchingNextPage` is true.
    5. *Preserve Scroll Position:* When new messages load at the top, the scroll position must adjust to prevent "jumping".
       - This is tricky with `flex-col-reverse`. Usually, it handles it naturally, but verification is needed.
  </action>
  <done>
    - Scrolling to top triggers network request.
    - Older messages appear.
    - UI shows spinner while loading.
  </done>
</task>

## Success Criteria

- [ ] Opening a long conversation loads initial 20 messages.
- [ ] Scrolling to top loads the next batch.
- [ ] Sending a message still updates UI immediately (optimistic update works with infinite query).
- [ ] No visual jumping when older messages load.

## Rollback Plan

Revert `packages/frontend/src/services/inboxApi.ts` and `packages/frontend/src/components/features/inbox/MessagePane.tsx` to previous state using git checkout.
