# Changelog: Visitor Online/Offline Status

## 2025-12-14 - Initial Implementation
- **Slice:** visitor_online_status
- **What Changed:** Implemented real-time online/offline tracking backed by Redis.
- **Files Modified:**
  - `packages/backend/src/realtime-session/realtime-session.service.ts` — **Refactor**. Added `isVisitorOnline` logic.
  - `packages/backend/src/gateway/events.gateway.ts` — Emits status events.
  - `packages/backend/src/visitors/visitors.service.ts` — Enriches visitor data with online status.
  - `packages/frontend/src/components/features/inbox/VisitorContextPanel.tsx` — **UI Update**. Shows status indicators.
  - `packages/frontend/src/contexts/SocketContext.tsx` — **New Logic**. Handles status events.
  - `packages/shared-types/src/websocket.types.ts` — Added `VISITOR_STATUS_CHANGED`.
- **Tests Added:**
  - `packages/backend/src/realtime-session/realtime-session.service.spec.ts`
  - `packages/frontend/src/components/features/inbox/VisitorContextPanel.test.tsx`
- **Reviewed By:** Reviewer (see `agent_workspace/visitor_online_status/code_reviews/visitor_online_status.md`)
- **Verified By:** Auto-verification during Action phase.
