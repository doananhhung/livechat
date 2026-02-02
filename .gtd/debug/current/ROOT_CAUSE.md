# Root Cause

**Found:** 2026-02-02
**Status:** CONFIRMED

## Root Cause

The `useSendAgentReply` hook's `onMutate` function has incorrect type annotations and logic that doesn't match the actual query data structure.

The code assumes `pages` contains `Message[][]` (arrays of message arrays), but the actual structure is `PaginatedMessages[]` where each page is:
```typescript
{ data: Message[], hasNextPage: boolean, nextCursor: string | null }
```

When trying to spread `newPages[0]` as an array, it fails because `newPages[0]` is an object, not an array.

## Verified Hypothesis

**Original Hypothesis 1:** sendMessage mutate function not being called
**Confidence:** 75% → **Partially Confirmed**

The mutation IS being called, but `onMutate` throws an error before completing, which prevents `mutationFn` from executing.

## Evidence

Debug logs showed:
```
[DEBUG] onMutate ERROR: TypeError: newPages[0] is not iterable
    at inboxApi.ts:253:29
```

The line that fails:
```typescript
newPages[0] = [...newPages[0], optimisticMessage];
```

## Location

- **File:** `packages/frontend/src/services/inboxApi.ts`
- **Lines:** 239-259 (setQueryData callback in onMutate)
- **Function:** `useSendAgentReply().onMutate`

## Why It Causes The Symptom

1. Agent clicks Send → `sendMessage()` called
2. TanStack Query calls `onMutate` first (before `mutationFn`)
3. `onMutate` tries to optimistically update cache
4. `setQueryData` callback spreads `newPages[0]` thinking it's `Message[]`
5. But `newPages[0]` is actually `PaginatedMessages` object
6. Throws `TypeError: newPages[0] is not iterable`
7. Error is swallowed silently (TanStack Query default behavior)
8. `mutationFn` (the actual API call) is NEVER executed
9. No network request made

## Rejected Hypotheses

- Hypothesis 2 (Event handlers not triggering): REJECTED - debug logs showed handlers ARE called
- Hypothesis 3 (slashState.isOpen stuck): REJECTED - submitMessage was called
- Hypothesis 4 (Props undefined): REJECTED - props were correct in logs

## Fix Required

Update `setQueryData` to use correct type `InfiniteData<PaginatedMessages>` and access `page.data` instead of spreading the page object directly.
