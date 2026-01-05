# Implementation Plan: Conversation Status Lifecycle (Core)

## 1. Acceptance Tests (What "Done" Looks Like)

### Backend

#### Unit Tests (Services/Business Logic)
- [ ] Test: `ConversationService.updateStatus(user, id, 'spam')` with valid ID → Expected: Conversation status updates to `SPAM`
- [ ] Test: `ConversationService.listByProject(user, id, { status: 'solved' })` → Expected: Returns only conversations with status `SOLVED`
- [ ] Test: `ConversationService.updateLastMessage(id, ..., fromCustomer=true)` when status is `SOLVED` → Expected: Status transitions to `OPEN`

#### E2E Tests (API Endpoints)
- [ ] Test: `PATCH /projects/:id/inbox/conversations/:cid` with body `{ status: 'solved' }` → Expected: 200 OK, response.status is `solved`
- [ ] Test: `GET /projects/:id/inbox/conversations?status=spam` → Expected: 200 OK, list contains only spam conversations
- [ ] Test: `PATCH /projects/:id/inbox/conversations/:cid` with body `{ status: 'invalid_status' }` → Expected: 400 Bad Request

### Frontend

#### Unit Tests (Utilities)
- [ ] Test: `getStatusLabel(ConversationStatus.SPAM)` → Expected: Returns localized string "Spam"
- [ ] Test: `getAvailableTransitions(ConversationStatus.SOLVED)` → Expected: Returns array containing `OPEN`

#### Integration Tests (Components)
- [ ] Test: `<ConversationList />` when filter 'Solved' clicked → Expected: Calls API with `status=solved`
- [ ] Test: `<MessagePane />` when 'Mark Spam' clicked in dropdown → Expected: Calls update API with `status=spam` and shows success toast

### Shared
- [ ] Test: `ConversationStatus` enum exports `OPEN`, `PENDING`, `SOLVED`, `SPAM`

## 2. Implementation Approach
1.  **Shared:** Update `shared-types` with new Enum values.
2.  **Migration:** Create manual TypeORM migration to alter Postgres enum type and migrate `closed` -> `solved`.
3.  **Backend:** Update Service/Controller logic to handle new statuses and enforce "Auto-Open" rule.
4.  **Frontend:** Update UI components (`ConversationList`, `MessagePane`) to reflect new statuses and transitions.

## 3. Files to Create/Modify
- `packages/shared-types/src/conversation.types.ts`
- `packages/backend/src/database/migrations/<timestamp>_UpdateConversationStatusEnum.ts`
- `packages/backend/src/inbox/services/conversation.service.ts`
- `packages/backend/src/inbox/services/persistence/conversation.persistence.service.ts`
- `packages/shared-dtos/src/list-conversations.dto.ts`
- `packages/frontend/src/components/features/inbox/ConversationList.tsx`
- `packages/frontend/src/components/features/inbox/MessagePane.tsx`

## 4. Dependencies
- TypeORM (for migrations)

## 5. Risk Assessment
- **Data Migration:** Renaming an enum value in Postgres is non-trivial. Risk of downtime or lock if not handled carefully.
    - *Mitigation:* Use `ALTER TYPE ADD VALUE` and `UPDATE` data, rather than dropping the type immediately.