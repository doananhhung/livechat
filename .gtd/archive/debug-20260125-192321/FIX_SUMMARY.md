# Bug Fix Summary

**Status:** Fixed
**Executed:** 2026-01-25

## Bug Summary

**Symptom:** Agent messages visually "blinked" (re-rendered rapidly) after sending.
**Root Cause:**

1.  Backend double-save: Initial save as `SENDING`, then update to `SENT`.
2.  Frontend redundant invalidation: `onSettled` triggered refetch even though `onSuccess` already updated cache, causing rapid array length changes (20 → 21 → 22 → 21 → 20).

## What Was Done

**Backend:**

- Refactored `MessageService.sendAgentReply` to perform a single atomic save with the final status (`sent` or `delivered`), eliminating the race condition.

**Frontend:**

- Removed `invalidateQueries` from `useSendAgentReply.onSettled`. The cache is already correctly updated by `onSuccess` and socket events.

## Files Changed

- `packages/backend/src/inbox/services/message.service.ts` — Single atomic save
- `packages/frontend/src/services/inboxApi.ts` — Removed redundant invalidation

## Proposed Commit Message

```
fix(inbox): eliminate message blink on send

Backend: Refactor sendAgentReply to single atomic save.
Frontend: Remove redundant invalidateQueries in onSettled.

Root cause: Backend double-save + frontend refetch race caused rapid
cache changes, creating visual blink.
```
