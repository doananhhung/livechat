## Implementation Log: Visitor Online/Offline Status

**Date**: December 14, 2025

**Task**: Implement Visitor Online/Offline Status feature based on the approved design.

**Changes Implemented**:

1.  **Shared Types (`@live-chat/shared-types`)**:
    *   Modified `packages/shared-types/src/websocket.types.ts`:
        *   Added `VISITOR_STATUS_CHANGED` to the `WebSocketEvent` enum.
        *   Defined `VisitorStatusChangedPayload` interface.
        *   Corrected the file content to ensure all existing WebSocket event types and payloads were preserved.
    *   Modified `packages/shared-types/src/visitor.types.ts`:
        *   Added `isOnline?: boolean | null;` property to the `Visitor` interface.
        *   Adjusted `displayName` to `displayName?: string | null;` and `lastSeenAt` to `lastSeenAt?: Date;` to align with the backend's `Visitor` entity definition.

2.  **Backend (`@live-chat/backend`)**:
    *   **`RealtimeSessionService` (`packages/backend/src/realtime-session/realtime-session.service.ts`)**:
        *   Added `isVisitorOnline(visitorUid: string): Promise<boolean | null>` method to check Redis for visitor session existence, with graceful error handling (returns `null` on Redis unavailability).
        *   Added `getManyVisitorOnlineStatus(visitorUids: string[]): Promise<Map<string, boolean>>` method for bulk status retrieval using Redis MGET, with graceful error handling (returns empty map on Redis unavailability).
        *   Fixed `error` type access in catch blocks by asserting `(error as Error).message`.
    *   **`EventsGateway` (`packages/backend/src/gateway/events.gateway.ts`)**:
        *   Added `emitVisitorStatusChanged(projectId: number, visitorUid: string, isOnline: boolean)` public method.
        *   Modified `handleIdentify` to call `emitVisitorStatusChanged` with `isOnline: true` after a visitor identifies.
        *   Modified `handleDisconnect` to call `emitVisitorStatusChanged` with `isOnline: false` after a visitor disconnects and their session is deleted.
    *   **`VisitorsService` (`packages/backend/src/visitors/visitors.service.ts`)**:
        *   Injected `RealtimeSessionService`.
        *   Modified `findOne(projectId: number, visitorId: number)` to return `Promise<SharedVisitorType>`. This method now fetches the TypeORM `Visitor` entity, retrieves `isOnline` status from `RealtimeSessionService`, and maps the entity properties to a `SharedVisitorType` object, explicitly handling properties (like `email`, `phone`, `customData`) that might not be directly present on the TypeORM entity by setting them to `null`.
        *   Modified `updateDisplayName` to return `Promise<SharedVisitorType>`. It now calls the updated `findOne` method after saving changes to ensure the returned visitor object (and the `visitorUpdated` WebSocket event payload) includes the `isOnline` status.
    *   **`VisitorsController` (`packages/backend/src/visitors/visitors.controller.ts`)**:
        *   Imported `Visitor as SharedVisitorType` from `@live-chat/shared-types`.
        *   Created `VisitorResponseDto` (`packages/backend/src/visitors/dto/visitor-response.dto.ts`) to represent `SharedVisitorType` for Swagger documentation.
        *   Changed the return type of `updateDisplayName` method to `Promise<SharedVisitorType>`.
        *   Updated the `@ApiResponse` decorator for `updateDisplayName` to use `VisitorResponseDto` as its `type`.
    *   **`VisitorResponseDto` (`packages/backend/src/visitors/dto/visitor-response.dto.ts`)**:
        *   Created a new DTO file to match the `SharedVisitorType` structure, enabling correct Swagger documentation for the API response.
        *   Added `additionalProperties: true` to `@ApiPropertyOptional` for `customData` to resolve Swagger schema validation error.

3.  **Frontend (`@live-chat/frontend`)**:
    *   **`useVisitorEvents` (`packages/frontend/src/features/inbox/hooks/useVisitorEvents.ts`)**:
        *   Imported `WebSocketEvent` and `type VisitorStatusChangedPayload`.
        *   Added a listener for `WebSocketEvent.VISITOR_STATUS_CHANGED`.
        *   The listener iterates through React Query's cache for `visitor` queries, finding the matching visitor by `visitorUid` and optimistically updating its `isOnline` status.
        *   Added cleanup for the new event listener.
        *   Fixed `TS1484` error by using `import type` for `VisitorStatusChangedPayload`.
    *   **`VisitorContextPanel` (`packages/frontend/src/components/features/inbox/VisitorContextPanel.tsx`)**:
        *   Added a visual online status indicator (green/gray dot) next to the visitor's display name, conditionally rendered based on the `visitor.isOnline` property.
    *   **Test Files**:
        *   `packages/frontend/src/components/features/inbox/MessagePane.test.tsx`
        *   `packages/frontend/src/components/features/inbox/VisitorContextPanel.test.tsx`
        *   `packages/frontend/src/components/features/inbox/__tests__/RenameVisitorDialog.spec.tsx`
        *   `packages/frontend/src/components/features/inbox/__tests__/VisitorNameEditor.spec.tsx`
        *   Updated mock `Visitor` objects in these files to include the `lastSeenAt` property, resolving test failures caused by `Visitor` interface changes.
        *   Added dedicated tests for the online status indicator's rendering in `packages/frontend/src/components/features/inbox/VisitorContextPanel.test.tsx`.
    *   **`EventsGateway` Test File (`packages/backend/src/gateway/events.gateway.spec.ts`)**:
        *   Updated `handleDisconnect` test to include `client.data.projectId` and assert `emitVisitorStatusChanged`.
        *   Updated `handleIdentify` test to assert `emitVisitorStatusChanged`.
        *   Added `jest.spyOn(gateway, 'emitVisitorStatusChanged');` in `beforeEach` to correctly spy on the method.

## Fixes (Attempt 1)

**Issue**: Missing unit tests for `RealtimeSessionService` new methods (`isVisitorOnline`, `getManyVisitorOnlineStatus`).

**Changes**:
1.  Modified `packages/backend/src/realtime-session/realtime-session.service.spec.ts`:
    *   Added mocks for `redis.exists` and `redis.mget` in the test module setup.
    *   Added a `describe` block for `isVisitorOnline` with tests for:
        *   Returning `true` when session exists in Redis.
        *   Returning `false` when session does not exist.
        *   Returning `null` when Redis throws an error.
    *   Added a `describe` block for `getManyVisitorOnlineStatus` with tests for:
        *   Returning a correct map of statuses when Redis returns data.
        *   Returning an empty map when input is empty.
        *   Returning an empty map when Redis throws an error.

**Verification Results**:
*   **Backend Unit Tests (`RealtimeSessionService`)**: `npm test --workspace=@live-chat/backend -- packages/backend/src/realtime-session/realtime-session.service.spec.ts` - **Passed** (13/13 tests)

**Conclusion**: The missing unit tests have been implemented and pass successfully.

## Fixes (Attempt 2)

**Issue**: Dependency injection issue in `VisitorsService` at runtime: `Nest can't resolve dependencies of the VisitorsService (...) RealtimeSessionService at index [2] is available in the VisitorsModule context.`

**Changes**:
1.  Modified `packages/backend/src/visitors/visitors.module.ts`:
    *   Imported `RealtimeSessionModule`.
    *   Added `RealtimeSessionModule` to the `imports` array of `VisitorsModule`.

**Verification Results**:
*   **Type Check**: `npm run check-types` - **Passed** (Exit Code: 0)
*   **Backend Unit Tests (`VisitorsService`)**: `npm test --workspace=@live-chat/backend -- packages/backend/src/visitors/__tests__/visitors.service.spec.ts` - **Passed** (8/8 tests)
*   **Backend Unit Tests (`RealtimeSessionService`)**: `npm test --workspace=@live-chat/backend -- packages/backend/src/realtime-session/realtime-session.service.spec.ts` - **Passed** (13/13 tests)
*   **Backend Unit Tests (`EventsGateway`)**: `npm test --workspace=@live-chat/backend -- packages/backend/src/gateway/events.gateway.spec.ts` - **Passed** (9/9 tests)
*   **Frontend Tests (`All`)**: `npm test --workspace=@live-chat/frontend` - **Passed** (71/71 tests)

**Conclusion**: The dependency injection issue has been resolved, and all tests for affected components are passing.
