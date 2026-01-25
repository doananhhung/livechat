# Bug Fix Summary

**Status:** Fixed
**Executed:** 2026-01-25

## Bug Summary

**Symptom:** When viewing a conversation with more than 20 messages, scrolling to the top did not load older messages.
**Root Cause:** The `MessagePane` component lacked infinite scrolling logic, and the `useGetMessages` hook was using `useQuery` (single fetch) instead of `useInfiniteQuery` (paginated fetch).

## What Was Done

Refactored the message fetching layer to support cursor-based pagination and integrated an intersection observer in the UI to trigger loading when the user scrolls to the top of the message list.

## Behaviour

**Before:**
- Only the most recent 20 messages were displayed.
- Scrolling to the top did nothing.

**After:**
- Initial load shows 20 messages.
- Scrolling to the top triggers a fetch for the next 20 messages (older).
- A loading spinner appears at the top while fetching.
- Optimistic updates for sent messages are preserved.

## Tasks Completed

1. ✓ Refactor useGetMessages to useInfiniteQuery
   - Updated `useGetMessages` to `useInfiniteQuery` with cursor logic.
   - Updated `useSendAgentReply` to handle `InfiniteData<Message[]>` structure for optimistic updates.
   - Files: `packages/frontend/src/services/inboxApi.ts`

2. ✓ Implement Infinite Scroll in MessagePane
   - Installed `react-intersection-observer`.
   - Added `useInView` hook to detect when the top of the list is visible.
   - Connected `fetchNextPage` to the scroll observer.
   - Files: `packages/frontend/src/components/features/inbox/MessagePane.tsx`

## Deviations

- Installed `react-intersection-observer` package as it was missing.

## Verification

- [x] Original symptom no longer reproduces
- [x] Scrolling triggers network request
- [x] Optimistic updates work correctly

## Files Changed

- `packages/frontend/src/services/inboxApi.ts` — Refactored to `useInfiniteQuery`
- `packages/frontend/src/components/features/inbox/MessagePane.tsx` — Added scroll observer and updated data consumption

## Proposed Commit Message

fix(inbox): implement infinite scrolling for message history

Refactored message fetching to use infinite query and added scroll-to-load logic in the dashboard.

Root cause: MessagePane lacked infinite scrolling and useGetMessages uses non-paginated useQuery

- Refactor `useGetMessages` to `useInfiniteQuery`
- Add `react-intersection-observer` for scroll detection
- Handle optimistic updates for infinite data structure
