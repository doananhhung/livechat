# Root Cause

**Found:** 2026-01-25
**Status:** FIXED

## Root Causes (Multiple)

### 1. Frontend Ignored Backend Pagination Metadata

- `getMessages()` returned only `response.data.data`, discarding `hasNextPage` and `nextCursor`
- `getNextPageParam` derived cursor from wrong array index instead of using backend's `nextCursor`
- **Location:** `inboxApi.ts:84-96, 173-182`

### 2. Backend Limit Ignored (String Type Issue)

- Query params arrive as strings (`"20"` not `20`)
- `"20" + 1` = `"201"` (string concatenation) instead of `21`
- **Location:** `message.service.ts:180-184`

### 3. Intersection Observer Placement

- Observer div was at DOM END of message list (visual BOTTOM in flex-col-reverse)
- Became visible immediately when messages loaded, triggering auto-fetch
- **Location:** `MessagePane.tsx:259-266`

### 4. Page Order in useInfiniteQuery

- Pages appended in fetch order (newest first)
- Displayed as: today's messages → yesterday's (wrong)
- Should reverse pages before flattening
- **Location:** `MessagePane.tsx:282`

### 5. useEffect Dependency Loop

- `isFetchingNextPage` in deps caused re-trigger when fetch completed
- Combined with inView staying true = infinite loop
- **Location:** `MessagePane.tsx:97-114`

## Fix Applied

See FIX_SUMMARY.md for complete resolution.
