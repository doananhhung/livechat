# Root Cause Hypotheses

**Analyzed:** 2026-01-25
**Status:** PENDING VERIFICATION

## Summary

The infinite fetch loop is caused by a mismatch between frontend pagination logic and backend response structure. The frontend ignores the backend's pagination metadata and derives cursors incorrectly.

---

## Hypothesis 1: Frontend Ignores Backend Pagination Metadata

**Confidence:** High (85%)

**Description:**
The backend returns a structured response with `{ data, hasNextPage, nextCursor }` but the frontend's `getNextPageParam` ignores these fields entirely. Instead, it:

1. Uses `lastPage.length < 20` to determine if there are more pages
2. Derives cursor from `lastPage[lastPage.length - 1].id`

The backend sends `data: messages.reverse()` (oldest-first in the page). So `lastPage[lastPage.length - 1]` is actually the **newest** message in that batch, not the oldest. This sends the wrong cursor value.

**Evidence:**

- `inboxApi.ts:173-181`: `getNextPageParam` returns `lastPage[lastPage.length - 1].id` without using `hasNextPage` or `nextCursor`
- `message.service.ts:217`: Backend returns `data: messages.reverse()` — oldest first
- `message.service.ts:219`: Backend provides `nextCursor: hasNextPage ? messages[0].id : null`

**Location:**

- Files: `packages/frontend/src/services/inboxApi.ts`
- Lines: 173-181

**Verification Method:**

1. Log `lastPage` in `getNextPageParam` to see actual response structure
2. Compare derived cursor with backend's `nextCursor`
3. Check if response has `hasNextPage` field that frontend ignores

---

## Hypothesis 2: Response Shape Mismatch (Array vs Object)

**Confidence:** High (80%)

**Description:**
The `getMessages` function at line 95 returns `response.data.data` (the array). This strips out `hasNextPage` and `nextCursor`. The `useInfiniteQuery` only sees the raw `Message[]` array, losing pagination metadata.

Without access to `hasNextPage`, the frontend's `lastPage.length < 20` check fails when exactly 20 messages are returned (even if no more exist), causing infinite fetches.

**Evidence:**

- `inboxApi.ts:84-96`: `getMessages` returns only `response.data.data`
- `message.service.ts:216-220`: Backend sends object with `data`, `hasNextPage`, `nextCursor`
- Frontend never sees `hasNextPage` or `nextCursor`

**Location:**

- Files: `packages/frontend/src/services/inboxApi.ts`
- Lines: 84-96, 157-185

**Verification Method:**

1. Log `response.data` before stripping `.data`
2. Verify backend sends pagination metadata
3. Confirm frontend receives only the array

---

## Hypothesis 3: Intersection Observer Triggers on Initial Render

**Confidence:** Medium (50%)

**Description:**
The loader div is positioned at line 243 inside a `flex-col-reverse` container (line 142). With `flex-col-reverse`, the loader is at the **visual top** but **DOM bottom**. If the initial content doesn't fill the viewport, the loader is immediately visible, triggering `fetchNextPage` before the first fetch completes.

Combined with the cursor issues above, this creates rapid successive fetches.

**Evidence:**

- `MessagePane.tsx:142`: Container uses `flex-col-reverse`
- `MessagePane.tsx:243`: Loader div with `ref` for intersection observer
- `MessagePane.tsx:94-98`: `useEffect` triggers on `inView` change

**Location:**

- Files: `packages/frontend/src/components/features/inbox/MessagePane.tsx`
- Lines: 92-98, 142, 243

**Verification Method:**

1. Add logging to `useEffect` to track when `inView` becomes true
2. Check if multiple fetches start before first one completes
3. Test with `threshold` option on `useInView`

---

## Code Analysis Notes

The root cause is almost certainly Hypothesis 1 + 2 combined:

1. **Data loss:** `getMessages` strips pagination metadata from response
2. **Wrong cursor:** Frontend derives cursor from wrong array position (newest instead of oldest)
3. **No termination:** Without `hasNextPage`, frontend relies on `length < 20` which fails when batch is exactly 20

The cursor decrementing by 1 (280 → 233 → 232 → 231...) matches the hypothesis: each fetch grabs the "newest" message ID in the returned batch, which is just 1 less than the previous fetch's oldest message, creating an off-by-one backward crawl through the entire message table.
