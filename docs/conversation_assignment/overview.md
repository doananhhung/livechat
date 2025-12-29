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

## How It Works
1.  **Request**: An agent clicks "Assign to Me" in the UI. A `POST` request is sent to the backend.
2.  **Validation**: 
    -   Is the requester a member of the project?
    -   Is the target assignee a member of the project?
3.  **Execution**: The system updates the conversation record with the new `assigneeId` and sets the `assignedAt` timestamp.
4.  **Notification**: A `CONVERSATION_UPDATED` WebSocket event is emitted to the project room.
5.  **UI Update**: All connected agents see the conversation move to the "Assigned" column or show the assignee's avatar.

## Related Documentation
- [Architecture](./architecture.md)
- [API Reference](./api.md)
- [Decision Log](./decisions.md)
- [Changelog](./changelog.md)
