# Action Log: Status Automation

## Implemented Features
1.  **Database Schema Changes:**
    *   Added `auto_resolve_minutes` to `projects` table (Migration `AddAutoResolveMinutesToProjects`).
    *   Added `last_message_id` to `conversations` table (Migration `AddLastMessageIdToConversations`).
    *   Updated `Project` and `Conversation` entities.

2.  **Backend Logic:**
    *   **Workflow Module:** Created `WorkflowModule` and `WorkflowConsumer` to handle `conversation-workflow-queue` jobs.
    *   **Atomic Update Logic:** Implemented `UPDATE conversations SET status='pending' WHERE id=:id AND status='open' AND last_message_id=:triggerId` in `WorkflowConsumer`.
    *   **Spam Immunity:** Updated `ConversationPersistenceService.updateLastMessage` to prevent `SPAM` conversations from transitioning to `OPEN`, and to set `lastMessageId`.
    *   **Job Scheduling:** Injected `conversation-workflow-queue` into `MessageService` and implemented scheduling logic in `sendAgentReply` based on `project.autoResolveMinutes`.

3.  **Frontend Logic:**
    *   **Settings UI:** Updated `ProjectBasicSettingsForm.tsx` to include an input field for `autoResolveMinutes`. It validates the input (non-negative number) and sends it via `UpdateProjectDto`.
    *   **Toast Notification:** Updated `SocketContext.tsx` to listen for `automation.triggered` event and display a Toast notification to the agent.

## Fixes Applied
*   **Critical Migration Error:** Corrected `1765610726351-AddAutoResolveMinutesToProjects.ts` to remove redundant and dangerous enum recreation. The migration now solely handles the `auto_resolve_minutes` column.
*   **Frontend-Backend Sync:** Updated `shared-dtos` and `shared-types` to include `autoResolveMinutes` in `UpdateProjectDto` and `Project` interface, ensuring type safety across the stack.
*   **Frontend Test Type Errors:** Resolved TypeScript errors in test files:
    *   Correctly imported `ProjectRole` and `ProjectWithRole` from `@live-chat/shared-types`.
    *   Updated `ProjectWithRole` mock to use `myRole` property instead of `role`.
    *   Fixed `react-router-dom` mock to correctly return types.
    *   Replaced explicit `any` with `Mock` type in `SocketContext.test.tsx`.
*   **Frontend Test Runtime Error (2024-12-13):** Fixed "Element type is invalid: expected a string but got undefined" error in `SocketContext.test.tsx`.
    *   **Root Cause:** `authStore.ts` imported `queryClient` from `main.tsx`, which transitively loaded `BrowserRouter` from `react-router-dom`. When tests ran with async mocks (`importOriginal`), the mock wasn't resolved before React tried to render `<BrowserRouter>`, causing the undefined component error.
    *   **Solution:** Extracted `queryClient` into a dedicated module `src/lib/queryClient.ts` to break the circular dependency chain:
        *   Created `src/lib/queryClient.ts` with the shared QueryClient instance.
        *   Updated `src/main.tsx` to import from the new module.
        *   Updated `src/stores/authStore.ts` to import from `../lib/queryClient` instead of `../main`.
    *   **Additional Improvements:** Added `queryClient.clear()` in `afterEach` and created fresh `QueryClient` per test in `SocketContext.test.tsx` for better test isolation.

## New Tests Implemented
*   **Frontend Unit Tests:**
    *   `packages/frontend/src/components/features/projects/ProjectBasicSettingsForm.test.tsx`:
        *   Renders input field for Auto-Resolve Timer with current value.
        *   Renders input field with 0 if `autoResolveMinutes` is `null`/`undefined`.
        *   Calls update API with correct `autoResolveMinutes` when submitted.
        *   Shows error if `autoResolveMinutes` is negative.
    *   `packages/frontend/src/contexts/SocketContext.test.tsx`:
        *   Connects socket when `accessToken` is present.
        *   Disconnects socket when `accessToken` is removed.
        *   Shows a toast notification when `'automation.triggered'` event is received.

## Verification Results
*   **Backend:**
    *   **Type Check:** Passed.
    *   **Build:** Passed.
    *   **Tests:** All 8 unit/integration tests passed.
*   **Frontend:**
    *   **Type Check:** Passed (`npm run check-types`).
    *   **Build:** Passed (`npm run build`).
    *   **Tests:** All 18 tests passed with no runtime errors.

## Next Steps
*   Ready for final review and deployment.

