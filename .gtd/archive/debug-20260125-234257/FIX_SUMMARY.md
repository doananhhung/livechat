# Bug Fix Summary

**Status:** Fixed
**Executed:** 2026-01-25

## Bug Summary

**Symptom:** Infinite fetch loop when opening conversation, messages in wrong order
**Root Causes:** Multiple (see ROOT_CAUSE.md)

## What Was Done

### 1. Frontend: Use Backend Pagination Metadata

- Added `PaginatedMessages` interface with `data`, `hasNextPage`, `nextCursor`
- Changed `getMessages()` to return full response, not just array
- Updated `getNextPageParam` to use `lastPage.hasNextPage` and `lastPage.nextCursor`
- **Files:** `inboxApi.ts`

### 2. Backend: Parse Limit as Number

- Added `Number(query.limit) || 20` to fix string concatenation bug
- **Files:** `message.service.ts`

### 3. Frontend: Move Observer to DOM Start

- Moved intersection observer `<div>` from DOM end to DOM start inside `space-y-4`
- Now appears at visual TOP in flex-col-reverse layout
- **Files:** `MessagePane.tsx`

### 4. Frontend: Reverse Pages Before Flattening

- Changed `pages.flatMap(...)` to `pages.slice().reverse().flatMap(...)`
- Older pages now appear first (chronological order)
- **Files:** `MessagePane.tsx`

### 5. Frontend: Fix useEffect Dependencies

- Removed `isFetchingNextPage` from dependency array
- Added `isFirstRender` ref to skip initial observation
- **Files:** `MessagePane.tsx`

## Files Changed

| File                                                              | Changes                                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `packages/frontend/src/services/inboxApi.ts`                      | PaginatedMessages interface, getMessages return type, getNextPageParam logic |
| `packages/frontend/src/components/features/inbox/MessagePane.tsx` | Observer placement, page ordering, useEffect deps                            |
| `packages/backend/src/inbox/services/message.service.ts`          | Number() parsing for limit                                                   |

## Verification

- [x] No infinite fetch loop
- [x] Newest 20 messages load first
- [x] Scroll to top loads older messages ABOVE
- [x] Correct chronological order (oldest top, newest bottom)
- [x] No auto-fetching without user scroll
