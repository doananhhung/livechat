# Implementation Plan: internal_notes_core

## 1. Acceptance Tests (What "Done" Looks Like)

### API Tests
- [ ] Test: `POST /projects/:pid/visitors/:vid/notes` as Agent -> 201 Created.
- [ ] Test: `GET .../notes` -> 200 OK (List).
- [ ] Test: `PATCH .../notes/:nid` -> 200 OK (Content updated).
- [ ] Test: `DELETE .../notes/:nid` -> 200 OK.
- [ ] Test: Accessing visitor from different project -> 404 Not Found (Security).

### Realtime Tests
- [ ] Test: Creating note emits `VISITOR_NOTE_ADDED` to project room.

### UI Tests
- [ ] Test: Sidebar shows "Internal Notes" section.
- [ ] Test: Adding note updates list immediately.
- [ ] Test: Notes persist across page reloads.

## 2. Implementation Approach
1.  **Shared:** Define `VisitorNote` type, DTOs, and WebSocket events.
2.  **Database:**
    *   Create `VisitorNote` entity.
    *   Update `Visitor` entity (OneToMany).
    *   Generate and Run Migration.
3.  **Backend:**
    *   Create `VisitorNotesModule`.
    *   Implement Service (CRUD + emit events).
    *   Implement Controller.
4.  **Frontend:**
    *   Update `visitorApi.ts`.
    *   Create `VisitorNoteList` component.
    *   Integrate into `MessagePane` sidebar.
    *   Handle realtime events in `SocketContext`.

## 3. Files to Create/Modify
- `packages/shared-types/src/visitor-note.types.ts` — New.
- `packages/shared-types/src/websocket.types.ts` — Update.
- `packages/shared-dtos/src/visitor-note.dto.ts` — New.
- `packages/backend/src/database/entities/visitor-note.entity.ts` — New.
- `packages/backend/src/database/entities/visitor.entity.ts` — Update relation.
- `packages/backend/src/visitor-notes/visitor-notes.service.ts` — New.
- `packages/backend/src/visitor-notes/visitor-notes.controller.ts` — New.
- `packages/backend/src/visitor-notes/visitor-notes.module.ts` — New.
- `packages/backend/src/app.module.ts` — Register module.
- `packages/frontend/src/services/visitorApi.ts` — New file (or update existing if any).
- `packages/frontend/src/components/features/inbox/VisitorNoteList.tsx` — New.
- `packages/frontend/src/components/features/inbox/MessagePane.tsx` — Update sidebar.
- `packages/frontend/src/contexts/SocketContext.tsx` — Update handlers.

## 4. Dependencies
- `TypeORM`
- `Socket.IO`

## 5. Risk Assessment
- **Migration:** Modifying `Visitor` entity needs care (relation).
- **Security:** Ensure `visitorId` belongs to `projectId`.
