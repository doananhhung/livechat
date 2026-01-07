# Action Log: history_visibility

## Summary of Changes
Implemented configurable visitor history visibility, allowing projects to choose between "Ticket Style" (history clears on resolution) and "Chat Style" (history persists forever).

### Shared
*   Updated `IWidgetSettingsDto` and `WidgetSettingsDto` to include `historyVisibility` ('limit_to_active' | 'forever').
*   Updated `WidgetSettings` type definition.

### Backend
*   **ConversationPersistenceService**:
    *   Added `findByVisitorId` method that accepts a `HistoryVisibilityMode`.
    *   Updated `findOrCreateByVisitorId` to accept `HistoryVisibilityMode` and respect the strategy (re-opening solved chats vs creating new ones).
*   **ConversationService**:
    *   Added `findConversationForWidget` which delegates to persistence with the correct mode.
*   **InboxEventHandler**:
    *   Updated `handleVisitorIdentified` to fetch project settings and pass the configured `historyVisibility` mode when loading conversation history.
*   **EventConsumerService**:
    *   Updated `handleNewMessageFromVisitor` to fetch project settings and pass the mode to `findOrCreateByVisitorId`.
*   **Tests**:
    *   Updated `ConversationPersistenceService.spec.ts` to test both modes.
    *   Updated `ConversationService.spec.ts` to verify delegation.
    *   Updated `EventConsumerService.spec.ts` to mock project settings and verify correct mode passing.
    *   Created `history-visibility.e2e-spec.ts` to verify the end-to-end behavior of history visibility modes.

### Frontend
*   **ProjectWidgetSettingsDialog**:
    *   Added a Radio Group for "Conversation History" ("Ticket Style" vs "Chat Style").
    *   Integrated with `updateProjectSettings` API.
*   **Tests**:
    *   Created `ProjectWidgetSettingsDialog.test.tsx` to verify rendering and state updates.
    *   **Fixed**: Addressed type errors in `ProjectWidgetSettingsDialog.test.tsx` by using `import type` and aligning the mock object with `ProjectWithRole` interface.

## Verification Results
*   **Type Check**: Passed (`npx tsc --noEmit` on both packages).
*   **Build**: Passed (`npm run build` on all workspaces).
*   **Backend Tests**: All 16 relevant tests passed.
*   **Frontend Tests**: All 4 relevant tests passed.
*   **E2E Tests**: The `history-visibility.e2e-spec.ts` passed (after fixing the test environment).
