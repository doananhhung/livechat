# Root Cause Hypotheses

**Analyzed:** 2026-01-25
**Status:** PENDING VERIFICATION

## Summary

Based on code analysis of `MessagePane.tsx` and `inboxApi.ts`, the root cause is a **missing implementation of infinite scrolling** in the frontend. The backend supports pagination, but the frontend never requests anything beyond the first page.

---

## Hypothesis 1: Missing Infinite Scroll Implementation

**Confidence:** High (95%)

**Description:**
The frontend component `MessagePane` and its data hook `useGetMessages` are designed for a single-page fetch.
1. `useGetMessages` uses `useQuery` instead of `useInfiniteQuery`, meaning it only fetches one page of data.
2. `MessagePane` lacks any `onScroll` event listener or `IntersectionObserver` to detect when the user scrolls to the top.
3. There is no logic to call a `fetchNextPage` function.

**Evidence:**
- `packages/frontend/src/services/inboxApi.ts`: `useGetMessages` calls `useQuery` with no pagination logic.
- `packages/frontend/src/components/features/inbox/MessagePane.tsx`: No `onScroll` handler on the message container.
- `packages/shared-dtos/src/list-messages.dto.ts`: Backend `ListMessagesDto` supports `cursor` and `limit`, confirming the backend is ready for pagination.

**Location:**
- File: `packages/frontend/src/components/features/inbox/MessagePane.tsx` (Lines 163-300)
- File: `packages/frontend/src/services/inboxApi.ts` (Lines 102-113)

**Verification Method:**
1. Check the network tab in the browser.
2. Observe that only one request to `/messages` is made when loading the conversation.
3. Scroll up and observe that NO new network requests are triggered.

---

## Code Analysis Notes

- The backend default limit appears to be 100 (from `ListMessagesDto`), or controlled by the controller. If the user sees 20, it might be a default somewhere else or just the amount of test data.
- The fix requires refactoring `useGetMessages` to `useInfiniteQuery` and implementing a scroll observer in `MessagePane`.
