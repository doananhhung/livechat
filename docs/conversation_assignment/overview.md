# Conversation Assignment Engine

## Purpose
The Assignment Engine allows agents to claim ownership of specific conversations. This moves the system from a "Shared Pool" model (where everyone sees everything and collisions occur) to an "Ownership" model (where an agent explicitly takes responsibility for a ticket). This reduces duplicate work and clarifies accountability.

## Summary
Agents can assign conversations to themselves or other team members. The system enforces project membership rules and ensures that a conversation has at most one assignee at a time. All changes are broadcast in real-time to other agents to keep the dashboard synchronized.

## Key Components
- **Assignments Controller**: Exposes HTTP endpoints for assigning (`POST`) and unassigning (`DELETE`) conversations.
- **Conversation Service**: Handles the business logic, including membership validation, database updates, and event emission.
- **Events Gateway**: Broadcasts `CONVERSATION_UPDATED` events to all online agents in the project when an assignment changes.
- **Database Schema**: Updates the `conversations` table to link to the `users` table via `assignee_id`.
- **Frontend Controls**: UI components (`AssignmentControls`) for agents to visualize and manage ownership, powered by optimistic updates and real-time synchronization.

## How It Works
1.  **Request**: An agent clicks "Assign to Me" in the UI. A `POST` request is sent to the backend.
2.  **Optimistic Update**: The UI immediately reflects the assignment (showing the agent's avatar) before the server responds.
3.  **Validation**: 
    -   Is the requester a member of the project?
    -   Is the target assignee a member of the project?
4.  **Execution**: The system updates the conversation record with the new `assigneeId` and sets the `assignedAt` timestamp.
5.  **Notification**: A `CONVERSATION_UPDATED` WebSocket event is emitted to the project room.
6.  **Synchronization**: Other connected agents receive the event, and their interface updates automatically to show the new assignee.

## Related Documentation
- [Architecture](./architecture.md)
- [API Reference](./api.md)
- [Decision Log](./decisions.md)
- [Changelog](./changelog.md)