# Bug Fix Summary

**Status:** Fixed
**Executed:** 2026-02-02

## Bug Summary

**Symptom:** Messages not appearing when agent opens conversation after receiving socket event. Errors: `oldData.some is not a function` and `Cannot read properties of undefined (reading 'length')`.

**Root Cause:** Socket handlers expected `Message[]` but `useGetMessages` uses `useInfiniteQuery` which stores `InfiniteData<PaginatedMessages>`.

## What Was Done

Updated socket handlers to use correct TanStack Query infinite data structure. Both `handleNewMessage` and `handleFormSubmitted` now properly access `oldData.pages[0].data` instead of treating `oldData` as a flat array.

## Behaviour

**Before:** Socket events corrupted cache structure, causing crashes when agent opened conversation.

**After:** Socket events correctly update infinite query cache, messages appear immediately.

## Tasks Completed

1. ✓ Fix handleNewMessage cache update
   - Changed type from `Message[]` to `InfiniteData<PaginatedMessages>`
   - Access messages via `pages[0].data`
   - Handle empty cache by creating proper structure
   - Files: `SocketContext.tsx:71-101`

2. ✓ Fix handleFormSubmitted cache update
   - Same pattern as Task 1
   - Files: `SocketContext.tsx:299-362`

## Deviations

None

## Verification

- [ ] Original symptom no longer reproduces (needs manual test)
- [x] Code compiles without type errors

## Files Changed

- `packages/frontend/src/contexts/SocketContext.tsx` — Updated socket handlers to use InfiniteData structure

## Proposed Commit Message

```
fix(frontend): fix socket handlers corrupting infinite query cache

Socket handlers in SocketContext.tsx expected Message[] but useGetMessages
uses useInfiniteQuery which stores InfiniteData<PaginatedMessages>.

Root cause: Data structure mismatch between socket cache updates and query hook.

- Update handleNewMessage to use InfiniteData<PaginatedMessages> structure
- Update handleFormSubmitted with same fix
- Handle empty cache case by creating proper pages structure
```
