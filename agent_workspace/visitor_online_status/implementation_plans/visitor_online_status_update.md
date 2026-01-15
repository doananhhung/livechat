# Implementation Plan: Visitor Online/Offline Status (Design Update)

## 1. Acceptance Tests (What "Done" Looks Like)

### Backend

#### Unit Tests (RealtimeSessionService)
- [ ] `RealtimeSessionService.isVisitorOnline` returns `false` (not `null`) if Redis throws an error.
- [ ] `RealtimeSessionService.getManyVisitorOnlineStatus` returns `false` for entries where Redis throws/fails (failsafe default).

#### Integration Tests (EventsGateway)
- [ ] **On Connect**: When `handleIdentify` is called, `Visitor` entity in DB is updated with `lastSeenAt = NOW()`.
- [ ] **On Disconnect**: When `handleDisconnect` is called, `Visitor` entity in DB is updated with `lastSeenAt = NOW()`.

### Frontend

#### Unit Tests (VisitorContextPanel)
- [ ] **Online State**:
    - [ ] Shows Green Dot + "Online".
    - [ ] Shows "Current Page" / "Viewing [URL]".
    - [ ] Shows Page Preview (Screenshot).
- [ ] **Offline State**:
    - [ ] Shows Gray Dot + "Offline • Last seen [Time] ago".
    - [ ] **HIDES** "Current Page" section.
    - [ ] **HIDES** Page Preview section (or shows "Offline" placeholder).
    - [ ] Shows "Last seen" timestamp if available.

## 2. Verification Commands
- [ ] Type Check: `npx tsc --noEmit`
- [ ] Backend Tests: `npm test packages/backend/src/realtime-session` & `npm test packages/backend/src/gateway`
- [ ] Frontend Tests: `npm test packages/frontend/src/components/features/inbox/VisitorContextPanel.test.tsx`

## 3. Implementation Approach

### Backend
1.  **`RealtimeSessionService`**: Modify `isVisitorOnline` to catch errors and return `false` (strict offline default).
2.  **`EventsGateway`**:
    -   Inject `VisitorsService` (or `Repository<Visitor>`).
    -   In `handleIdentify`: Call `visitorsService.updateLastSeenAt(visitorId)`.
    -   In `handleDisconnect`: Call `visitorsService.updateLastSeenAt(visitorId)`.
3.  **`VisitorsService`**: Add `updateLastSeenAt` method.

### Frontend
1.  **`VisitorContextPanel`**:
    -   Add logic to hide `currentUrl` and `screenshot` blocks if `!visitor.isOnline`.
    -   Update status text logic to show "Offline • Last seen X ago".
    -   Use `date-fns` (already in deps) for relative time formatting.

## 4. Files to Create/Modify
-   `packages/backend/src/realtime-session/realtime-session.service.ts`
-   `packages/backend/src/gateway/events.gateway.ts`
-   `packages/backend/src/visitors/visitors.service.ts`
-   `packages/frontend/src/components/features/inbox/VisitorContextPanel.tsx`

## 5. Dependencies
-   `date-fns` (Frontend - already present)
