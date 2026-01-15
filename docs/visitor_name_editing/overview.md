# Visitor Name Editing

## Purpose
Visitor names are initially auto-generated (e.g., "Visitor #123456"). Agents often need to rename a visitor after identifying them during a conversation to provide better context for the team. This feature allows agents and managers to update the display name of a visitor.

## Summary
The system provides two ways to rename a visitor:
1.  **Inline Editing**: Directly in the Visitor Details panel using a "Slack-style" pencil icon interaction.
2.  **Context Menu**: Via a "Rename Visitor" option in the Conversation List dropdown.

Updates are instantaneous and propagate in real-time to all other agents viewing the same project.

## Key Components
- **VisitorNameEditor**: Inline input component in the Visitor Details panel.
- **RenameVisitorDialog**: Modal dialog triggered from the conversation list.
- **VisitorController (Backend)**: Handles the `PATCH` request to update the name.
- **WebSocket Events**: Broadcasts `visitorUpdated` to sync all clients.

## How It Works
1.  **Update**: Agent submits a new name via UI.
2.  **API**: Frontend calls `PATCH /projects/:projectId/visitors/:visitorId`.
3.  **Persistence**: Backend updates the database and logs an audit entry.
4.  **Broadcast**: Backend emits `visitorUpdated` event to the project room.
5.  **Sync**: Connected clients receive the event and invalidate their local cache to show the new name.

## Related Documentation
- [Architecture](./architecture.md)
- [Decision Log](./decisions.md)
