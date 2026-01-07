# Implementation Plan: history_visibility

## 1. Acceptance Tests (What "Done" Looks Like)

### Shared
- [ ] **Type Definition**: `HistoryVisibilityMode` ('limit_to_active' | 'forever') is exported from `shared-dtos`.
- [ ] **DTO Update**: `IWidgetSettingsDto` includes `historyVisibility` field.

### Backend

#### Unit Tests (`ConversationService` & `ConversationPersistenceService`)
- [ ] **Test**: `findConversationForWidget` with `limit_to_active` mode
    - Input: Visitor with `SOLVED` conversation.
    - Expected: Returns new `OPEN` conversation (ignores `SOLVED`).
- [ ] **Test**: `findConversationForWidget` with `forever` mode
    - Input: Visitor with `SOLVED` conversation.
    - Expected: Returns the `SOLVED` conversation (re-opening it effectively).
- [ ] **Test**: `findConversationForWidget` with `forever` mode
    - Input: Visitor with `SPAM` conversation.
    - Expected: Returns new `OPEN` conversation (ignores `SPAM`).
- [ ] **Test**: `updateLastMessage` (Message Processing) with `forever` mode
    - Input: New message for visitor with `SOLVED` conversation.
    - Expected: Updates `SOLVED` conversation to `OPEN`.
- [ ] **Test**: `updateLastMessage` (Message Processing) with `limit_to_active` mode
    - Input: New message for visitor with `SOLVED` conversation.
    - Expected: Creates NEW `OPEN` conversation.

#### E2E Tests (Inbox Flow)
- [ ] **Test**: Visitor chat flow with `historyVisibility = 'forever'`
    - Action: Visitor chats -> Agent solves -> Visitor returns.
    - Expected: Visitor sees history. New message re-opens same ID.
- [ ] **Test**: Visitor chat flow with `historyVisibility = 'limit_to_active'`
    - Action: Visitor chats -> Agent solves -> Visitor returns.
    - Expected: Visitor sees empty chat. New message creates new ID.

### Frontend

#### Unit Tests (`ProjectWidgetSettingsDialog`)
- [ ] **Test**: Renders "Conversation History" radio group.
- [ ] **Test**: Selecting "Limit to Active" updates the form state.
- [ ] **Test**: Selecting "Forever" updates the form state.

## 2. Implementation Approach
1.  **Shared Types**: Add the mode type and update the DTO.
2.  **Backend Persistence**:
    -   Modify `ConversationPersistenceService.findOrCreateByVisitorId` to accept a `mode` (or separate methods).
    -   Modify `ConversationPersistenceService.updateLastMessage` or related logic to handle the re-opening vs new creation logic based on project settings.
    -   *Correction*: The design implies checking settings *before* calling persistence. I'll pass the strategy/mode down.
3.  **Backend Service**:
    -   Update `ConversationService.getOrCreateHistoryByVisitorId` to fetch project settings first, then determine the query strategy.
    -   Refactor `InboxEventHandler` (or wherever `getOrCreateHistoryByVisitorId` is called) to ensure it works with the new signature if needed.
4.  **Frontend**:
    -   Add the configuration UI to `ProjectWidgetSettingsDialog`.

## 3. Files to Create/Modify
- `packages/shared-dtos/src/widget-settings.dto.ts`
- `packages/backend/src/inbox/services/conversation.service.ts`
- `packages/backend/src/inbox/services/persistence/conversation.persistence.service.ts`
- `packages/frontend/src/components/features/inbox/ProjectWidgetSettingsDialog.tsx`
- `packages/backend/src/inbox/services/conversation.service.spec.ts` (Tests)
- `packages/backend/src/inbox/services/persistence/conversation.persistence.service.spec.ts` (Tests)

## 4. Dependencies
- None (Standard internal dependencies).

## 5. Risk Assessment
-   **Data Migration**: Existing projects have no `historyVisibility` setting.
    -   *Mitigation*: Default to `limit_to_active` (current behavior) in code handling `undefined`.
-   **Performance**: `forever` mode queries might be slightly slower if we don't index properly, but we are querying by `visitorId` + `projectId`, which should be indexed.
-   **Race Conditions**: Concurrent messages. The existing transaction logic in `EventConsumer` handles this, but we must ensure we lock the correct rows.
