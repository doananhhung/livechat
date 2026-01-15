## Implementation Log: Visitor Online/Offline Status (Design Update & Bug Fixes)

**Date**: December 14, 2025

**Task**: Update Visitor Online/Offline Status implementation to align with revised design specifications and fix critical UI synchronization bugs.

**Changes Implemented**:

1.  **Backend (`@live-chat/backend`)**:
    *   **`RealtimeSessionService` (`packages/backend/src/realtime-session/realtime-session.service.ts`)**:
        *   Updated `isVisitorOnline` to return `false` (instead of `null`) when Redis throws an error, adhering to the "When in doubt, assume they are gone" principle.
    *   **`VisitorsService` (`packages/backend/src/visitors/visitors.service.ts`)**:
        *   Added `updateLastSeenAtByUid(visitorUid: string): Promise<void>` method to efficiently update the `lastSeenAt` timestamp using the visitor's UID.
        *   Added `@Inject(forwardRef(() => EventsGateway))` to the constructor to resolve circular dependency with `EventsGateway`.
        *   Updated `updateDisplayName` to emit `WebSocketEvent.VISITOR_UPDATED` instead of a string literal.
    *   **`EventsGateway` (`packages/backend/src/gateway/events.gateway.ts`)**:
        *   Injected `VisitorsService` (using `forwardRef` to prevent circular dependencies).
        *   Modified `handleIdentify` (Connect) to call `visitorsService.updateLastSeenAtByUid` after identifying the visitor.
        *   Modified `handleDisconnect` (Disconnect) to call `visitorsService.updateLastSeenAtByUid` after session deletion.
    *   **`GatewayModule` (`packages/backend/src/gateway/gateway.module.ts`)**:
        *   Imported `VisitorsModule` using `forwardRef`.
    *   **`VisitorsModule` (`packages/backend/src/visitors/visitors.module.ts`)**:
        *   Updated `GatewayModule` import to use `forwardRef`.
    *   **Tests**:
        *   Updated `realtime-session.service.spec.ts` to expect `false` on error for `isVisitorOnline`.
        *   Updated `events.gateway.spec.ts` to include `VisitorsService` mock and verify `updateLastSeenAtByUid` is called on connect/disconnect.

2.  **Shared Types (`@live-chat/shared-types`)**:
    *   **`websocket.types.ts`**:
        *   Added `VISITOR_UPDATED` to `WebSocketEvent` enum.
        *   Added `VisitorUpdatedPayload` interface.

3.  **Frontend (`@live-chat/frontend`)**:
    *   **`SocketContext.tsx` (`packages/frontend/src/contexts/SocketContext.tsx`)**:
        *   Implemented `handleVisitorStatusChanged` to listen for `VISITOR_STATUS_CHANGED` events and update the React Query cache (both conversation list and individual visitor details) in real-time. This fixes the issue where the UI remained "Offline" despite backend events.
        *   Implemented `handleVisitorUpdated` to listen for `VISITOR_UPDATED` (name changes) and update cache.
    *   **`VisitorContextPanel` (`packages/frontend/src/components/features/inbox/VisitorContextPanel.tsx`)**:
        *   Imported `formatDistanceToNow` from `date-fns`.
        *   Updated rendering logic:
            *   **Online**: Shows Green Dot, "Current Page" section, "Page Preview", and **Session History**.
            *   **Offline**: Shows Gray Dot, "Offline • Last seen [Time] ago", and **HIDES** "Current Page", "Page Preview", and **Session History** sections.
    *   **`inboxApi.ts` (`packages/frontend/src/services/inboxApi.ts`)**:
        *   Fixed message duplication bug (React key warning) by refining `onSuccess` logic in `useSendAgentReply` to remove the optimistic message if the final message (via socket) already exists.
    *   **Translations**:
        *   Added `visitor.status.online`, `visitor.status.offline`, and `visitor.lastSeen` to `en.json` and `vi.json`.
    *   **Tests**:
        *   Updated `VisitorContextPanel.test.tsx` to include detailed assertions for the new conditional rendering logic (Online vs. Offline states) and set `isOnline: true` in mock data where visibility is expected.

## Fixes (Summary)

**Issue 1**: Circular dependency between `VisitorsService` and `EventsGateway`.
**Resolution**: Used `forwardRef` in both `VisitorsService` (constructor injection) and `EventsGateway` (constructor injection).

**Issue 2**: Circular dependency between `VisitorsModule` and `GatewayModule`.
**Resolution**: Used `forwardRef` in `imports` array of both modules.

**Issue 3**: Test failures in `events.gateway.spec.ts` due to missing `VisitorsService` provider.
**Resolution**: Mocked `VisitorsService` and added it to the test module.

**Issue 4**: `handleDisconnect` logic mismatch in `events.gateway.ts`.
**Resolution**: Updated `handleDisconnect` to use `updateLastSeenAtByUid` consistent with the test expectation and design.

**Issue 5**: UI Implementation Deviation (Status Text & Visibility).
**Resolution**: Updated `VisitorContextPanel` to hide Session History when offline and corrected status text translations. Updated translation files.

**Issue 6**: Real-time Status Sync Failure (UI stuck on Offline).
**Resolution**: Implemented `VISITOR_STATUS_CHANGED` handler in `SocketContext.tsx` to directly update the React Query cache upon receiving the event, ensuring immediate UI reflection of online status.

**Issue 7**: Message Duplication (React Key Warning).
**Resolution**: Updated `useSendAgentReply` optimistic update logic to detect if the message was already added by the socket event before replacing it, preventing duplicates.

**Verification Results**:
*   **Type Check**: `npm run check-types` - **Passed** (Exit Code: 0)
*   **Backend Tests**: `npm test --workspace=@live-chat/backend` - **Passed**
*   **Frontend Tests**: `npm test --workspace=@live-chat/frontend` - **Passed**

**Conclusion**: The implementation has been successfully updated to match the revised design and fix critical sync bugs. The system now strictly defaults to offline on errors, persists `lastSeenAt` on connect/disconnect, and the UI correctly reflects the binary state logic (hiding details when offline) and updates in real-time. Message duplication is resolved.