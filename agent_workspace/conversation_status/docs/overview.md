# Conversation Status Lifecycle (Core)

## Purpose
The Conversation Status Lifecycle feature introduces a professional workflow for managing customer conversations. It expands the lifecycle from a simple "Open/Closed" binary to a more nuanced set of states: `Open`, `Pending`, `Solved`, and `Spam`. This allows agents to better organize their inbox, track pending items, and filter out noise.

## Summary
Conversations can now exist in one of four states. Agents can manually transition conversations between these states via the UI. Crucially, if a customer replies to a `Pending` or `Solved` conversation, it automatically re-opens (`Open`), ensuring no customer query is missed.

## Key Components
- **ConversationStatus Enum**: Updated database enum supporting `OPEN`, `PENDING`, `SOLVED`, `SPAM`.
- **Auto-Open Logic**: A mechanism in the persistence layer that forces status to `OPEN` whenever a new message arrives from a customer.
- **Inbox UI**:
    - **Filters**: `ConversationList` now supports filtering by status (tabs or dropdown).
    - **Controls**: `MessagePane` header now allows agents to change the status (e.g., "Mark as Solved").
- **Migration**: Database migration script to safely transition from the old `closed` status to `solved`.

## How It Works
1.  **State Definition**:
    -   **OPEN**: Active conversation requiring agent attention.
    -   **PENDING**: Agent is waiting for customer response.
    -   **SOLVED**: Issue resolved. Archives the conversation.
    -   **SPAM**: Irrelevant or malicious content. Hidden from main view.
2.  **Manual Transition**: An agent selects a new status from the dropdown in the message header. The frontend calls `PATCH /conversations/:id` with the new status.
3.  **Automatic Transition**: If a visitor sends a message to a `SOLVED` conversation, the backend (`ConversationPersistenceService`) detects this and updates the status to `OPEN` and increments the unread count.
4.  **Filtering**: Agents can switch tabs in the inbox to view only `Open` or `Solved` tickets.

## Related Documentation
- [Architecture](./architecture.md)
- [API Reference](./api.md)
- [Decision Log](./decisions.md)
- [Changelog](./changelog.md)
