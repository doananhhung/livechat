# Implementation Plan: Visitor Online/Offline Status

## 1. Acceptance Tests (What "Done" Looks Like)

### Backend

#### Unit Tests (Services/Business Logic)
- [ ] `RealtimeSessionService.isVisitorOnline(visitorUid)` returns `true` if Redis key exists.
- [ ] `RealtimeSessionService.isVisitorOnline(visitorUid)` returns `false` if Redis key missing.
- [ ] `RealtimeSessionService.isVisitorOnline(visitorUid)` returns `null` (graceful failure) if Redis throws error.
- [ ] `RealtimeSessionService.getManyVisitorOnlineStatus([uids])` returns Map with correct booleans.

#### E2E Tests (WebSocket & API)
- [ ] **Socket Connect**: When visitor connects and identifies, `VISITOR_STATUS_CHANGED` event is emitted with `{ isOnline: true }`.
- [ ] **Socket Disconnect**: When visitor disconnects, `VISITOR_STATUS_CHANGED` event is emitted with `{ isOnline: false }`.
- [ ] **Data Fetch**: API response for fetching Visitor includes `isOnline` field populated from Redis.

### Frontend

#### Unit Tests (Hooks/Components)
- [ ] `VisitorContextPanel` renders "Online" indicator when `visitor.isOnline` is true.
- [ ] `VisitorContextPanel` renders "Offline" indicator when `visitor.isOnline` is false.
- [ ] `VisitorContextPanel` handles `null` (unknown) status gracefully.

#### Integration Tests (Real-time Updates)
- [ ] **Event Handling**: When `VISITOR_STATUS_CHANGED` event is received via WebSocket, the visitor's status in the UI updates immediately without page refresh.
- [ ] **Cache Update**: React Query cache for the visitor is updated optimistically upon event receipt.

## 2. Verification Commands
- [ ] Type Check: `npx tsc --noEmit`
- [ ] Backend Unit Tests: `npm test packages/backend/src/realtime-session`
- [ ] Backend Gateway Tests: `npm test packages/backend/src/gateway`
- [ ] Frontend Tests: `npm test packages/frontend/src/components/features/inbox/VisitorContextPanel.test.tsx` (Note: File to be created/updated)

## 3. Implementation Approach
1.  **Types**: Update `shared-types` to include `isOnline` in `Visitor` and add `VISITOR_STATUS_CHANGED` event.
2.  **Backend Service**: Enhance `RealtimeSessionService` to check Redis for online status.
3.  **Backend Gateway**: Emit events on connection/disconnection in `EventsGateway`.
4.  **Backend Controller**: (Optional) If existing endpoints need to return this, update `VisitorsService` to mix in this data. *Correction*: Design says "On conversation/visitor data fetch". I will ensure `VisitorsService.findOne` calls `RealtimeSessionService`.
5.  **Frontend**: Update `useVisitorEvents` to listen for the new event and update the React Query cache. Update `VisitorContextPanel` to display the status.

## 4. Files to Create/Modify
- `packages/shared-types/src/websocket.types.ts`
- `packages/shared-types/src/visitor.types.ts`
- `packages/backend/src/realtime-session/realtime-session.service.ts`
- `packages/backend/src/gateway/events.gateway.ts`
- `packages/backend/src/visitors/visitors.service.ts` (to inject `RealtimeSessionService` and populate `isOnline`)
- `packages/frontend/src/features/inbox/hooks/useVisitorEvents.ts`
- `packages/frontend/src/components/features/inbox/VisitorContextPanel.tsx`

## 5. Dependencies
- Redis (already available via `RedisService`)
- Socket.IO (already available)
- React Query (already available)

## 6. Risk Assessment
- **Race Conditions**: Rapid connect/disconnect might cause UI flicker or stale state. *Mitigation*: The backend handles `socketId` verification before deleting session. Frontend relies on latest event.
- **Redis Failure**: If Redis is down, `isOnline` will be `null`. UI must handle this (e.g., show nothing or grey dot).
