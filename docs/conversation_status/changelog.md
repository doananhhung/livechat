# Changelog: Conversation Status Lifecycle

## 2025-12-12 - Core Implementation (Slice: conversation_status_core)
-   **What Changed**: Expanded conversation statuses to `OPEN`, `PENDING`, `SOLVED`, `SPAM`.
-   **Features**:
    -   **Migration**: Renamed `closed` → `solved`. Added `spam`.
    -   **Auto-Open**: Customer replies automatically set status to `OPEN`.
    -   **Inbox UI**: Added filters for new statuses and a dropdown for manual transitions.
-   **Files Modified**:
    -   `packages/shared-types/src/conversation.types.ts`: Enum update.
    -   `packages/backend/src/database/migrations/...`: SQL migration.
    -   `packages/backend/src/inbox/services/persistence/conversation.persistence.service.ts`: Auto-open logic.
    -   `packages/frontend/src/components/features/inbox/ConversationList.tsx`: Filters.
    -   `packages/frontend/src/components/features/inbox/MessagePane.tsx`: Header controls.
-   **Reviewed By**: Reviewer (see `agent_workspace/conversation_status/code_reviews/conversation_status_core.md`)
-   **Verified By**: Architect (see `agent_workspace/conversation_status/actions/conversation_status_core.md`)
