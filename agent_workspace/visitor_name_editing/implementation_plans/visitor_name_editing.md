# Implementation Plan: visitor_name_editing

## 1. Acceptance Tests (What "Done" Looks Like)
Define the test criteria below. **Test code will be written during BUILD phase, after the implementation.**

> **CRITICAL:** Tests must be specific and actionable. Vague descriptions like 
> "API works" are NOT acceptable. Each test must specify input, action, and expected output.

### Backend

#### Unit Tests (Services/Business Logic)
Test isolated functions and methods. Mock external dependencies.
- [ ] Test: `VisitorService.update()` with valid `visitorId`, `projectId`, and `displayName` → Expected: Returns updated `Visitor` entity.
- [ ] Test: `VisitorService.update()` with empty `displayName` → Expected: Throws validation error (e.g., `BadRequestException`).
- [ ] Test: `VisitorService.update()` with `displayName` exceeding 50 characters → Expected: Throws validation error.
- [ ] Test: `VisitorService.update()` when visitor not found → Expected: Throws `NotFoundException`.
- [ ] Test: `EventsGateway.emit('visitorUpdated')` is called after successful update.

#### E2E Tests (API Endpoints)
Test full request/response cycle through the HTTP layer.
- [ ] Test: `PATCH /projects/:projectId/visitors/:visitorId` with valid `displayName` by `AGENT` → Expected: 200 OK, returns updated visitor, `visitorUpdated` event is broadcast.
- [ ] Test: `PATCH /projects/:projectId/visitors/:visitorId` with empty `displayName` → Expected: 400 Bad Request, error message indicates validation failure.
- [ ] Test: `PATCH /projects/:projectId/visitors/:visitorId` with `displayName` > 50 chars → Expected: 400 Bad Request, error message indicates validation failure.
- [ ] Test: `PATCH /projects/:projectId/visitors/:visitorId` with non-existent `visitorId` → Expected: 404 Not Found.
- [ ] Test: `PATCH /projects/:projectId/visitors/:visitorId` without authentication → Expected: 401 Unauthorized.
- [ ] Test: `PATCH /projects/:projectId/visitors/:visitorId` by non-`AGENT`/`MANAGER` user → Expected: 403 Forbidden.

### Frontend

#### Unit Tests (Custom Hooks/Utilities)
Test hooks and utility functions in isolation.
- [ ] Test: `useUpdateVisitor` mutation success → Expected: `queryClient` invalidates `['conversations']` and `['visitor', visitorId]` queries.
- [ ] Test: `useUpdateVisitor` mutation error → Expected: Error handled gracefully (e.g., toast notification).
- [ ] Test: `useVisitorEvents` hook listens for `visitorUpdated` event → Expected: `queryClient` invalidates `['conversations']` and `['visitor', event.visitorId]` queries.

#### Integration Tests (Components with Logic)
Test component behavior via React Testing Library. Test BEHAVIOR, not implementation.
- [ ] Test: `<VisitorNameEditor />` displays current visitor name.
- [ ] Test: `<VisitorNameEditor />` clicking pencil icon enters edit mode (input field and Save/Cancel buttons visible).
- [ ] Test: `<VisitorNameEditor />` in edit mode, typing valid name and clicking Save → Expected: API mutation called, display name updates, exits edit mode.
- [ ] Test: `<VisitorNameEditor />` in edit mode, typing invalid name (e.g., empty) → Expected: Error message shown, Save button disabled/API not called.
- [ ] Test: `<VisitorNameEditor />` in edit mode, clicking Cancel → Expected: Exits edit mode, display name reverts to original.
- [ ] Test: `<RenameVisitorDialog />` opens correctly with current visitor name pre-filled.
- [ ] Test: `<RenameVisitorDialog />` entering valid name and clicking Save → Expected: API mutation called, dialog closes.
- [ ] Test: `<RenameVisitorDialog />` entering invalid name → Expected: Error message shown, Save button disabled/API not called.
- [ ] Test: `<ConversationList />` context menu "Rename Visitor" option exists and opens `RenameVisitorDialog`.
- [ ] Test: `<VisitorContextPanel />` displays `<VisitorNameEditor />`.

#### E2E Tests (Critical User Flows)
At least 1 per feature. Test via Playwright/browser subagent.
- [ ] Test: As an `AGENT`, navigate to a conversation, open Visitor Details, click on the pencil icon next to the visitor name, enter a new valid name, click Save → Expected: Visitor name updates in Visitor Details and Conversation List, no errors.
- [ ] Test: As an `AGENT`, right-click a conversation in the list, select "Rename Visitor", enter a new valid name, click Save → Expected: Visitor name updates in Conversation List and Visitor Details, no errors.

### Shared (if applicable)
- [ ] Test: `UpdateVisitorDto` (or equivalent) schema is correctly defined with validation rules for `displayName`.

## 2. Verification Commands
List the exact commands you will run to verify the changes. You must include:
- [ ] Type Check: `npx tsc --noEmit`
- [ ] Backend Tests: `npm test packages/backend/src/visitors/__tests__/*.spec.ts` (or relevant files)
- [ ] Frontend Tests: `npm test packages/frontend/src/components/features/inbox/__tests__/*.spec.ts` (or relevant files)
- [ ] E2E Tests: `npm run test:e2e packages/frontend/e2e/__tests__/visitor-rename.e2e-spec.ts` (or relevant files)

## 3. Implementation Approach
### Backend
1. Create `UpdateVisitorDto` with validation rules.
2. Implement `update` method in `VisitorController` to handle `PATCH` request.
3. Implement `update` method in `VisitorService` to update the visitor `displayName` in the database.
4. Emit `visitorUpdated` event via `EventsGateway` after a successful update.
### Frontend
1. Create `useUpdateVisitor` mutation hook using `inboxApi.ts` for calling the backend API.
2. Implement `VisitorNameEditor` component for inline editing in the details panel.
3. Implement `RenameVisitorDialog` component for the modal renaming experience.
4. Add a socket listener (e.g., in `InboxLayout` or a dedicated hook) for `visitorUpdated` events to invalidate relevant queries using `queryClient`.
5. Integrate `VisitorNameEditor` into `VisitorContextPanel`.
6. Add "Rename Visitor" option to `ConversationList` context menu and integrate `RenameVisitorDialog`.

## 4. Files to Create/Modify
### Backend
- `packages/backend/src/visitors/dto/update-visitor.dto.ts` (New)
- `packages/backend/src/visitors/visitors.controller.ts` (Modify)
- `packages/backend/src/visitors/visitors.service.ts` (Modify)
- `packages/backend/src/events/events.gateway.ts` (Modify, if not already injecting)
- `packages/backend/src/visitors/__tests__/visitors.service.spec.ts` (New/Modify)
- `packages/backend/e2e/__tests__/visitors.e2e-spec.ts` (New/Modify)
### Frontend
- `packages/frontend/src/components/features/inbox/VisitorNameEditor.tsx` (New)
- `packages/frontend/src/components/features/inbox/RenameVisitorDialog.tsx` (New)
- `packages/frontend/src/features/inbox/inboxApi.ts` (Modify)
- `packages/frontend/src/features/inbox/hooks/useVisitorEvents.ts` (New, or modify existing socket listener)
- `packages/frontend/src/features/inbox/ConversationList.tsx` (Modify)
- `packages/frontend/src/features/inbox/VisitorContextPanel.tsx` (Modify)
- `packages/frontend/src/components/features/inbox/__tests__/VisitorNameEditor.spec.tsx` (New)
- `packages/frontend/src/components/features/inbox/__tests__/RenameVisitorDialog.spec.tsx` (New)
- `packages/frontend/e2e/__tests__/visitor-rename.e2e-spec.ts` (New)
### Shared
- `packages/shared-dtos/src/visitors/update-visitor.dto.ts` (New, if DTOs are shared)

## 5. Dependencies
- `@nestjs/swagger` for DTO annotations (Backend)
- `class-validator` / `class-transformer` for DTO validation (Backend)
- `@tanstack/react-query` for `useMutation` and `queryClient` invalidation (Frontend)
- `socket.io-client` for listening to WebSocket events (Frontend)
- `shadcn/ui` for dialog component (Frontend)

## 6. Risk Assessment
- **Stale Data:** As noted in the design, failure to invalidate the `['conversations']` and `['visitor']` queries after a successful update or upon receiving a `visitorUpdated` WebSocket event could lead to stale data being displayed in the UI. This will be mitigated by explicit `queryClient.invalidateQueries` calls.
- **Race Conditions:** Multiple agents renaming the same visitor concurrently could lead to the last update winning. This is generally acceptable for display names but could be a risk if strict ordering was required (not the case here).
- **Permissions:** Incorrect implementation of permission checks on the backend could allow unauthorized users to rename visitors. This will be addressed with proper guards/interceptors in the backend.