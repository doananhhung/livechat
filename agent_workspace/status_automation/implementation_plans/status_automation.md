# Implementation Plan: Status Automation

## 1. Acceptance Tests

### Backend (COMPLETED)

#### Unit Tests (`MessagesService`)
- [x] Test: `sendAgentReply` schedules a job on `conversation-workflow-queue` if `project.autoResolveMinutes > 0`.
- [x] Test: `sendAgentReply` does NOT schedule a job if `project.autoResolveMinutes` is 0 or null.
- [x] Test: `sendAgentReply` does NOT schedule a job if `project.autoResolveMinutes` is missing.

#### Unit Tests (`WorkflowConsumer`)
- [x] Test: `process` updates status to `PENDING` if conversation is `OPEN` and `lastMessageId` matches job data.
- [x] Test: `process` emits `CONVERSATION_UPDATED` and `AUTOMATION_TRIGGERED` events upon successful update.
- [x] Test: `process` does NOTHING if conversation status is NOT `OPEN` (e.g., already pending or solved).
- [x] Test: `process` does NOTHING if `lastMessageId` does NOT match (customer replied).
- [x] Test: `process` handles database errors gracefully (retry or log).

#### Integration Tests (`ConversationPersistenceService`)
- [x] Test: `updateLastMessage` DOES NOT change status to `OPEN` if current status is `SPAM`.
- [x] Test: `updateLastMessage` changes status to `OPEN` if current status is `PENDING` or `SOLVED` (existing behavior).
- [x] Test: `updateLastMessage` updates `lastMessageId` correctly.

#### E2E Tests (API)
- [x] Test: `PATCH /projects/:id` accepts `autoResolveMinutes` and updates the database.
- [x] Test: `GET /projects/:id` returns the correct `autoResolveMinutes`.

### Frontend (PENDING)

#### Unit Tests (Project Settings)
- [ ] Test: Input field for "Auto-Resolve Timer" renders correctly with current value.
- [ ] Test: Updating the input calls the API with the correct value.
- [ ] Test: Input accepts 0 (disabled) and positive integers.

#### Integration Tests (Toast Notification)
- [ ] Test: When `AUTOMATION_TRIGGERED` event is received via socket, a Toast notification appears.

## 2. Implementation Approach

### Backend (Done)
-   Implemented `WorkflowModule` and `WorkflowConsumer` for `conversation-workflow-queue`.
-   Implemented atomic update logic in `WorkflowConsumer`.
-   Implemented Spam Immunity in `ConversationPersistenceService`.
-   Implemented Job Scheduling in `MessageService`.
-   Added `auto_resolve_minutes` to `projects` and `last_message_id` to `conversations`.

### Frontend (Next Steps)

1.  **Project Settings UI:**
    -   Modify `packages/frontend/src/features/projects/components/ProjectSettings.tsx`.
    -   Add a `NumberInput` field for `autoResolveMinutes`.
    -   Label: "Auto-Resolve Timer (Minutes)".
    -   Helper Text: "Automatically move conversations to Pending if the customer doesn't reply. Set to 0 to disable."
    -   Bind to existing form handler (implied `react-hook-form` or similar).

2.  **Toast Notification:**
    -   Modify `packages/frontend/src/context/SocketContext.tsx` (or equivalent global event listener).
    -   Listen for the socket event `automation.triggered` (as emitted by Backend).
    -   On event: Call `toast.info()` (or equivalent) with the message from the payload.

## 3. Files to Create/Modify

### Backend
-   (All files completed)

### Frontend
-   `packages/frontend/src/features/projects/components/ProjectSettings.tsx` (Modify)
-   `packages/frontend/src/context/SocketContext.tsx` (Modify)

## 4. Dependencies
-   `@nestjs/bullmq` (Backend - Done)
-   `bullmq` (Backend - Done)
-   Frontend UI Library (likely Chakra UI or similar, existing in project)

## 5. Risk Assessment
-   **Race Conditions:** Handled by atomic DB updates in the worker. (Verified)
-   **Data Consistency:** `lastMessageId` kept in sync. (Verified)
-   **Frontend:** Ensure socket event name matches exactly what backend emits (`automation.triggered`).
