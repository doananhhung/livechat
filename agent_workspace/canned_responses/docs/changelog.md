# Changelog: Canned Responses

## 2025-12-12 - Initial Implementation
-   **Slice:** `canned_responses_frontend` & `canned_responses_core`
-   **What Changed:** Full stack implementation of the feature.
-   **Files Modified:**
    -   **Backend:** Added `CannedResponsesModule`, `Service`, `Controller`, `Entity`.
    -   **Frontend:** Added `CannedResponsesPage`, `SlashCommandPopover`, updated `MessageComposer`.
    -   **Shared:** Added `CannedResponse` types and DTOs.
-   **Features:**
    -   Management UI for Managers to CRUD responses.
    -   Slash command integration in the Inbox for Agents.
    -   RBAC enforcement (Manager Write / Agent Read).
-   **Reviewed By:** Reviewer (see `agent_workspace/canned_responses/code_reviews/`)
-   **Verified By:** Architect (see `agent_workspace/canned_responses/handoffs/`)
