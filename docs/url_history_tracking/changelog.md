# Changelog: Session-Based URL History & Referrer Tracking

## 2025-12-13 - Initial Implementation
- **Slice:** url_history_design
- **What Changed:** Implemented full-stack support for tracking visitor URL history and referrer.
- **Files Modified:**
  - `packages/shared-types/src/conversation.types.ts` — Added `VisitorSessionMetadata` interface.
  - `packages/shared-types/src/websocket.types.ts` — Updated `SendMessagePayload`.
  - `packages/backend/src/database/entities/conversation.entity.ts` — Added `metadata` JSONB column.
  - `packages/backend/src/inbox/services/persistence/conversation.persistence.service.ts` — Added metadata persistence logic.
  - `packages/backend/src/event-consumer/event-consumer.service.ts` — Updated to handle metadata in worker.
  - `packages/backend/src/gateway/events.gateway.ts` — Updated `handleUpdateContext` to append history.
  - `packages/frontend/src/widget/services/historyTracker.ts` — **New**. Service for tracking session history.
  - `packages/frontend/src/widget/App.tsx` — Integrated `HistoryTracker`.
  - `packages/frontend/src/components/features/inbox/MessagePane.tsx` — Added UI to display referrer and history.
- **Tests Added:**
  - `packages/backend/test/chat.e2e-spec.ts` — E2E tests for metadata persistence and updates.
  - `packages/frontend/src/widget/services/historyTracker.test.ts` — Unit tests for history tracking logic.
- **Reviewed By:** Reviewer (see `agent_workspace/url_history_tracking/code_reviews/url_history_design.md`)
- **Verified By:** Auto-verification during Action phase.
