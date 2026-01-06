# Changelog: Status Automation

## 2025-12-13 - Initial Implementation (Slice: status_automation)
-   **What Changed**: Implemented "Auto-Pending" workflow.
-   **Features**:
    -   **Backend**: `WorkflowModule` with BullMQ for delayed job processing.
    -   **Automation**: Conversations move to `PENDING` automatically if customer doesn't reply after M minutes.
    -   **Configuration**: Added `autoResolveMinutes` to Project Settings.
    -   **Safety**: Added `last_message_id` to conversations for atomic state checks (Race condition prevention).
    -   **UI**: Settings form updated; Toast notifications for automation events.
-   **Files Modified**:
    -   `packages/backend/src/workflow/`: New module.
    -   `packages/backend/src/inbox/services/message.service.ts`: Schedule jobs.
    -   `packages/backend/src/inbox/services/persistence/conversation.persistence.service.ts`: Update logic.
    -   `packages/frontend/src/components/features/projects/ProjectBasicSettingsForm.tsx`: UI.
    -   `packages/frontend/src/contexts/SocketContext.tsx`: Event listener.
    -   `packages/backend/src/database/migrations/...`: Schema changes.
-   **Reviewed By**: Reviewer (see `agent_workspace/status_automation/code_reviews/status_automation.md`)
-   **Verified By**: Architect (see `agent_workspace/status_automation/actions/status_automation.md`)
