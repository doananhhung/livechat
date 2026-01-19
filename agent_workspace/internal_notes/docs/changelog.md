# Changelog: Internal Visitor Notes

## 2025-12-12 - Initial Implementation (Slice: internal_notes_core)
-   **What Changed**: Implemented persistent internal notes for visitors.
-   **Features**:
    -   `visitor_notes` table in database.
    -   API for Create, Read, Update, Delete (CRUD).
    -   Real-time sync to all agents in the project.
    -   UI integration in Conversation Sidebar.
-   **Files Modified**:
    -   `packages/backend/src/visitor-notes/`: New module, controller, service.
    -   `packages/frontend/src/components/features/inbox/VisitorNoteList.tsx`: New component.
    -   `packages/frontend/src/contexts/SocketContext.tsx`: Added event handlers.
    -   `packages/shared-types/`: Added DTOs and interfaces.
-   **Reviewed By**: Reviewer (see `agent_workspace/internal_notes/code_reviews/internal_notes_core.md`)
-   **Verified By**: Architect (see `agent_workspace/internal_notes/actions/internal_notes_core.md`)
