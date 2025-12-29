# Implementation Plan: assignment_engine

## 1. Acceptance Tests (What "Done" Looks Like)
Before writing code, define the tests that MUST pass:

### Happy Path Tests
- [ ] Test: `POST /conversations/:id/assignments` with valid assignee (member of project) -> Returns 200, updates DB.
- [ ] Test: `DELETE /conversations/:id/assignments` -> Returns 200, sets assignee to null.
- [ ] Test: Re-assignment overwrites previous assignee.
- [ ] Test: Realtime event `conversationUpdated` is emitted to project room upon assignment.

### Edge Case Tests
- [ ] Test: Assign to user NOT in project -> Returns 400 Bad Request.
- [ ] Test: Assign to non-existent user -> Returns 400 or 404.
- [ ] Test: Assign non-existent conversation -> Returns 404.
- [ ] Test: Unassign already unassigned conversation -> Returns 200 (Idempotent) or 404 (if conversation missing).

### Error Handling Tests
- [ ] Test: Invalid UUID format -> Returns 400.
- [ ] Test: Unauthorized user (not project member) attempts to assign -> Returns 403.

## 2. Implementation Approach
1.  **Shared Types:** Add `CONVERSATION_UPDATED` event and payload to `shared-types`. Rebuild package.
2.  **Database:** Update `Conversation` entity with `assignee` relation.
3.  **Service Layer:**
    *   Extend `ConversationService` with `assign(conversationId, assigneeId, actorId)` and `unassign(conversationId, actorId)`.
    *   Implement logic: Validate `conversationId` exists -> Validate `actor` has permission -> Validate `assignee` is Project Member -> Update DB -> Emit Event.
4.  **Gateway:** Add `emitConversationUpdated` method to `EventsGateway`.
5.  **API Layer:** Create `AssignmentsController` with `POST` and `DELETE` endpoints.

## 3. Files to Create/Modify
- `packages/shared-types/src/websocket.types.ts` — Add event enum.
- `packages/backend/src/database/entities/conversation.entity.ts` — Add columns.
- `packages/backend/src/inbox/dto/assign-conversation.dto.ts` — Create DTO.
- `packages/backend/src/inbox/services/conversation.service.ts` — Add business logic.
- `packages/backend/src/gateway/events.gateway.ts` — Add emit method.
- `packages/backend/src/inbox/assignments.controller.ts` — Create controller.
- `packages/backend/src/inbox/inbox.module.ts` — Register controller.
- `packages/backend/test/assignments.e2e-spec.ts` — E2E Tests.

## 4. Dependencies
- `ProjectService` (for membership validation).
- `EventsGateway` (for realtime updates).

## 5. Risk Assessment
- **Zombie Assignments:** If a user is removed from a project, old assignments remain. (Accepted for V1).
- **Event Race:** Client might receive event before API response if network is weird, but usually fine.
