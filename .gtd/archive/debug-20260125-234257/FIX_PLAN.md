---
created: 2026-01-25
root_cause: Frontend strips pagination metadata and derives cursor from wrong array index
---

# Fix Plan

## Objective

Fix infinite fetch loop in `MessagePane` by preserving backend pagination metadata and using it correctly in `getNextPageParam`.

## Context

- ./.gtd/debug/current/ROOT_CAUSE.md
- `packages/frontend/src/services/inboxApi.ts`

## Architecture Constraints

- **Single Source:** Backend is authoritative for pagination state (`hasNextPage`, `nextCursor`)
- **Invariants:** Frontend must use `nextCursor` from backend, not derive from array index
- **Resilience:** Handle edge cases (empty pages, undefined cursors)
- **Testability:** Pure function logic; testable without mocking

## Tasks

<task id="1" type="auto">
  <name>Preserve pagination metadata in getMessages</name>
  <files>packages/frontend/src/services/inboxApi.ts</files>
  <action>
    1. Define interface for paginated response:
       ```typescript
       interface PaginatedMessages {
         data: Message[];
         hasNextPage: boolean;
         nextCursor: string | null;
       }
       ```
    2. Change `getMessages` return type from `Promise<Message[]>` to `Promise<PaginatedMessages>`
    3. Return full `response.data` instead of just `response.data.data`
  </action>
  <done>
    - `getMessages` returns object with `data`, `hasNextPage`, `nextCursor`
    - TypeScript compiles without errors
  </done>
</task>

<task id="2" type="auto">
  <name>Update useGetMessages to use backend pagination metadata</name>
  <files>packages/frontend/src/services/inboxApi.ts</files>
  <action>
    1. Update `useInfiniteQuery` generic types to reflect new page shape
    2. Update `queryFn` to handle the object response
    3. Update `getNextPageParam` to:
       - Use `lastPage.hasNextPage` instead of `lastPage.length < 20`
       - Use `lastPage.nextCursor` instead of deriving from array index
    4. Update `select` or data consumers to extract `.data` from pages
  </action>
  <done>
    - `getNextPageParam` uses `hasNextPage` and `nextCursor` from backend
    - No hardcoded limit check (20) in frontend
    - TypeScript compiles without errors
  </done>
</task>

<task id="3" type="checkpoint:human-verify">
  <name>Verify fix resolves infinite loop</name>
  <files>N/A</files>
  <action>
    1. Open browser DevTools → Network tab
    2. Navigate to conversation with >20 messages
    3. Verify only expected number of fetches occur
    4. Scroll to top to trigger next page → verify single fetch
    5. Confirm loop stops when `hasNextPage: false`
  </action>
  <done>
    - No infinite fetch loop
    - Pagination works correctly (fetches stop at end of history)
    - Console shows no rapid successive requests
  </done>
</task>

## Success Criteria

- [ ] Original symptom (infinite fetch loop) no longer occurs
- [ ] Messages load correctly with pagination
- [ ] Fetches stop when `hasNextPage: false` from backend
- [ ] No TypeScript errors

## Rollback Plan

Revert changes to `inboxApi.ts`. No database or schema changes involved.
