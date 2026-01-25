# Root Cause

**Found:** 2026-01-25
**Status:** CONFIRMED

## Root Cause

The frontend lacks the implementation for **infinite scrolling** or **pagination** in the `MessagePane` component. The data fetching hook `useGetMessages` is implemented using `useQuery` (single fetch) instead of `useInfiniteQuery` (paginated fetch), and the UI component has no scroll event listener to trigger fetching older messages.

## Verified Hypothesis

**Original Hypothesis 1:** Missing Infinite Scroll Implementation
**Confidence:** High (95%) → **Confirmed**

## Evidence

**Code Inspection confirmed:**

1.  **`packages/frontend/src/services/inboxApi.ts`**: The `useGetMessages` hook uses `useQuery` which only supports a single data fetch. It does not return `fetchNextPage` or `hasNextPage` properties required for pagination.
    ```typescript
    export const useGetMessages = (...) => {
      return useQuery({ ... }); // ❌ Should be useInfiniteQuery
    };
    ```

2.  **`packages/frontend/src/components/features/inbox/MessagePane.tsx`**: The `MessageList` component renders a simple list with `overflow-y-auto` but has **no `onScroll` handler** and no **IntersectionObserver** to detect when the user reaches the top of the list.

3.  **`packages/shared-dtos/src/list-messages.dto.ts`**: The backend DTO `ListMessagesDto` *does* support `cursor` and `limit`, confirming this is purely a frontend implementation gap.

## Location

- **Files:**
    - `packages/frontend/src/services/inboxApi.ts`
    - `packages/frontend/src/components/features/inbox/MessagePane.tsx`

## Why It Causes The Symptom

When the component mounts, `useGetMessages` fetches the default page (likely the most recent N messages). Since `useQuery` is used, it never attempts to fetch more data. When the user scrolls to the top, there is no code listening for that event, and no mechanism to request the previous page of messages from the API.

## Rejected Hypotheses

None. The first hypothesis was confirmed by static analysis.
