# Internal Visitor Notes

## Purpose
The Internal Visitor Notes feature allows agents and managers to attach persistent private notes to a **Visitor**. These notes act as "Contextual Memory" for the team, enabling agents to share critical information (e.g., "Customer is a VIP", "Prefers email contact") that survives across different conversations.

## Summary
Agents can view, create, edit, and delete notes within the conversation sidebar. Notes are strictly internal (never visible to the visitor) and are synced in real-time to all other agents viewing the same visitor.

## Key Components
-   **VisitorNotesController**: Exposes REST API endpoints for managing notes.
-   **VisitorNotesService**: Handles business logic, including database interactions and real-time event emission.
-   **VisitorNote Entity**: Database table linking notes to Visitors and Authors.
-   **Frontend Sidebar**: Integrated UI in `VisitorContextPanel` for managing notes alongside visitor details.
-   **Real-time Sync**: Uses Socket.IO to broadcast note changes to all agents in the project.

## How It Works
1.  **Creation**: An agent types a note in the sidebar and clicks "Add". A `POST` request is sent.
2.  **Persistence**: The backend saves the note, linking it to the `Visitor` and the `Author` (Agent).
3.  **Broadcast**: The backend emits a `VISITOR_NOTE_ADDED` event to the project's socket room.
4.  **Update**: All connected agents (including the sender) receive the event and update their UI immediately.
5.  **Retrieval**: When opening a conversation, the frontend fetches existing notes via `GET`.

## Related Documentation
-   [Architecture](./architecture.md)
-   [API Reference](./api.md)
-   [Decision Log](./decisions.md)
-   [Changelog](./changelog.md)
