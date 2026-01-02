# Decision Log: Internal Visitor Notes

## Decision 1: Attach Notes to Visitor, not Conversation
-   **Date**: 2025-12-12
-   **Context**: Should notes be linked to a specific conversation (ticket) or the person (visitor)?
-   **Decision**: Link to **Visitor**.
-   **Rationale**:
    -   The goal is "Contextual Memory". Notes like "This user is a VIP" or "Don't mention X" are relevant *forever*, across multiple conversations.
    -   If linked to a Conversation, the note gets "archived" when the ticket closes, losing visibility for the next time they chat.

## Decision 2: Cascade Delete on Author
-   **Date**: 2025-12-12
-   **Context**: What happens to notes if the Agent who wrote them is deleted?
-   **Decision**: **Cascade Delete** (Delete the notes).
-   **Rationale**:
    -   For V1, this is the simplest approach to maintain referential integrity.
    -   *Alternative:* `SET NULL`. This would keep the note but lose the author. This is safer for data preservation but requires handling "Unknown Author" in the UI. We chose simplicity for now.

## Decision 3: Real-time Updates via Socket.IO
-   **Date**: 2025-12-12
-   **Context**: How to ensure all agents see new notes immediately?
-   **Decision**: Emit events (`VISITOR_NOTE_ADDED`) to the project room.
-   **Rationale**:
    -   Collaborative feel is essential. If Agent A adds a note, Agent B (also viewing the chat) must see it without refreshing.
    -   Reuses existing `EventsGateway` infrastructure.

## Decision 4: No Edit Restrictions (V1)
-   **Date**: 2025-12-12
-   **Context**: Should agents only be able to edit their *own* notes?
-   **Decision**: **No**. Any agent can edit/delete any note.
-   **Rationale**:
    -   Simplicity and trust. In a support team, agents trust each other. Strict permissions add complexity (backend checks, UI conditional rendering) unnecessary for MVP.
