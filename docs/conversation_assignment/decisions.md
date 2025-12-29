# Decision Log: Conversation Assignment

## Decision 1: "Last Write Wins" for Concurrency
- **Date:** 2025-12-12
- **Context:** Two agents might try to assign the same conversation to themselves at the same time.
- **Decision:** The last request processed by the server wins. We do not implement complex locking or "optimistic concurrency control" (versioning) for this V1.
- **Rationale:** 
    -   In a collaborative support environment, "stealing" a ticket is rare and sometimes necessary. 
    -   Real-time events will update the UI quickly, minimizing the window for race conditions.
    -   Strict locking adds significant complexity for low value in this use case.

## Decision 2: Foreign Key `ON DELETE SET NULL`
- **Date:** 2025-12-12
- **Context:** What happens to a conversation if the assigned agent is deleted from the system?
- **Decision:** The conversation remains but `assigneeId` becomes `NULL`.
- **Rationale:** We must never lose conversation data just because an employee left.

## Decision 3: Membership Validation in Service Layer
- **Date:** 2025-12-12
- **Context:** How to prevent an agent from assigning a ticket to a user from a *different* project?
- **Decision:** Explicitly validate `ProjectMembership` for both the *Actor* (requester) and the *Assignee* inside the `assign` method.
- **Rationale:** 
    -   The database FK only checks if the user exists in the `users` table, not if they are in the specific `project`. 
    -   This prevents cross-tenant data leaks or confusion.
