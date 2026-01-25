# Phase 1 Summary

**Status:** Complete
**Executed:** 2026-01-25

## What Was Done

Refactored `AiResponderService` to eliminate the "Stale Save" race condition. replaced the unsafe `repository.save(conversation)` pattern with a "Re-fetch & Atomic Update" pattern.

## Behaviour

**Before:**

- `AiResponderService` fetched a conversation at T0.
- AI processing took 5-30s.
- At T30, the service overwrote the conversation record with the stale T0 data, reverting any changes made by human agents (assignments, status updates) during that window.

**After:**

- AI processing takes 5-30s.
- Before saving, the service strictly re-fetches the latest `metadata`.
- It performs an atomic `repository.update()` only on the fields it needs to modify (`lastMessageSnippet`, `lastMessageTimestamp`, `metadata`).
- Concurrent updates to other fields (e.g. `assigneeId`, `status`) are preserved.

## Tasks Completed

1. ✓ Refactor Condition Node Persistence
   - Replaced `save` with `findOne` + `update` in the recursive routing logic.
   - Files: `packages/backend/src/ai-responder/ai-responder.service.ts`

2. ✓ Refactor Final Response Persistence
   - Replaced `save` with `findOne` + `update` in the final response logic.
   - Fixed variable scoping issues for `nextNodeId` to ensure type safety.
   - Files: `packages/backend/src/ai-responder/ai-responder.service.ts`

## Deviations

- Fixed a TypeScript error where `stepResult` and `nextNodeId` were scoped incorrectly inside an `if` block but accessed outside. Introduced a properly typed `nextNodeId` variable.

## Success Criteria

- [x] Fix "Stale Save" Race Condition (Atomic `UPDATE`)

## Files Changed

- `packages/backend/src/ai-responder/ai-responder.service.ts` — Replaced `save()` with atomic updates.

## Proposed Commit Message

feat(phase-1): harden ai responder persistence against race conditions

- replace unsafe `save()` with atomic `update()` in `AiResponderService`
- implement re-fetch pattern for metadata merging
- fix potential data loss during long-running LLM operations
