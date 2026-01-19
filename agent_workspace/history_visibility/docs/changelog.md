# Changelog: Configurable Visitor History Visibility

## 2025-12-13 - Initial Implementation (Slice: history_visibility)
-   **What Changed**: Implemented configurable visitor chat history visibility.
-   **Features**:
    -   **Two Modes**: "Ticket Style" (`limit_to_active`) and "Chat Style" (`forever`).
    -   **Backend Logic**: Updates in `ConversationPersistenceService` and `ConversationService` to adapt to the selected mode.
    -   **Re-opening Logic**: Dynamically re-opens existing conversations or creates new ones based on the mode.
    -   **UI**: New radio group in Project Widget Settings for configuration.
    -   **Spam Exclusion**: `SPAM` conversations are always hidden from visitors.
-   **Files Modified**:
    -   `packages/shared-dtos/src/widget-settings.dto.ts`: Added `historyVisibility` field.
    -   `packages/shared-types/src/widget-settings.types.ts`: Added `HistoryVisibilityMode` type.
    -   `packages/backend/src/inbox/services/conversation.service.ts`: Updated lookup methods.
    -   `packages/backend/src/inbox/services/persistence/conversation.persistence.service.ts`: Core mode logic.
    -   `packages/backend/src/event-consumer/event-consumer.service.ts`: Pass history mode.
    -   `packages/frontend/src/components/features/inbox/ProjectWidgetSettingsDialog.tsx`: Frontend UI.
-   **Reviewed By**: Reviewer (see `agent_workspace/history_visibility/code_reviews/history_visibility.md`)
-   **Verified By**: Architect (see `agent_workspace/history_visibility/handoffs/history_visibility.md`)
