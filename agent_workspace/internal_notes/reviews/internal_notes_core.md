# Design Review: internal_notes_core

## Status
**VERDICT: APPROVE**

## Findings
1.  **Architecture:** Linking notes to `Visitor` instead of `Conversation` correctly implements "Contextual Memory" persistence.
2.  **Schema:** `visitor_notes` table with `visitorId` and `authorId` FKs is correct.
3.  **Real-time:** Broadcasting note events to project room ensures collaboration.

## Notes
-   **Implementation Detail:** Ensure `VisitorNoteController` validates that `visitorId` belongs to `projectId` before access to prevent IDOR.
-   **Events:** Add `VISITOR_NOTE_ADDED`, `VISITOR_NOTE_UPDATED`, `VISITOR_NOTE_DELETED` to `WebSocketEvent` enum in `shared-types`.
