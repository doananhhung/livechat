# Implementation Log: internal_notes_core

## Status
- [x] Implementation Complete
- [x] Tests Pending (Manual Verification)

## Changes
1.  **Shared Types:** Added `VisitorNote` interface, DTOs, and WebSocket events.
2.  **Database:**
    *   Created `visitor_notes` table via migration `CreateVisitorNote`.
    *   Updated `Visitor` entity to have `OneToMany` notes relation.
3.  **Backend:**
    *   Created `VisitorNotesModule`.
    *   Implemented `VisitorNotesService` (CRUD + Realtime Events).
    *   Implemented `VisitorNotesController` (API).
    *   Updated `EventsGateway` to support `emitToProject`.
    *   **Fix:** Resolved build errors in `visitor-notes.service.ts` (type check) and `events.gateway.ts` (missing event enum). Added `CONVERSATION_DELETED` to shared types.
4.  **Frontend:**
    *   Created `visitorApi.ts` with React Query hooks.
    *   Created `VisitorNoteList` component.
    *   Integrated notes into `MessagePane` sidebar.
    *   Updated `SocketContext` to handle `VISITOR_NOTE_ADDED`, `UPDATED`, `DELETED` for real-time sync.
    *   **Fix:** Updated `MessagePane.tsx` layout for `VisitorContextPanel` to correctly display `VisitorNoteList` using flexbox.
    *   **Fix:** Updated `VisitorNoteList.tsx` layout to use `flex-1 min-h-0` instead of `h-full` and correctly applied padding. Removed redundant `px-4` from children within `VisitorNoteList` to prevent the composer from overflowing. Added `min-w-0` to input to prevent flex overflow.
    *   **Fix:** Replaced `Input` with auto-expanding `textarea` in both `MessageComposer` and `VisitorNoteList` for better UX.

## Verification
-   **API:**
    -   Create note: `POST /projects/:id/visitors/:id/notes`.
    -   List notes: `GET ...`.
    -   Update/Delete.
-   **UI:**
    -   Open conversation.
    -   Check sidebar for "Internal Notes".
    -   Verify "Add a note..." composer is correctly positioned at bottom of sidebar and doesn't overlap "Chi tiết khách truy cập".
    -   Verify the composer's width is constrained within the sidebar.
    -   Verify both chat composer and note composer auto-expand vertically when typing long text.
    -   Add note -> Appears immediately.
    -   Open same conversation in another window -> Note appears via socket.