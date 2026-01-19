# Decision Log: Conversation Status Lifecycle

## Decision 1: Rename `closed` to `solved`
-   **Date**: 2025-12-12
-   **Context**: The legacy status was `closed`. We wanted to align with industry standards (Zendesk, Intercom).
-   **Decision**: Rename `closed` to `solved`.
-   **Rationale**:
    -   `Solved` implies a successful resolution.
    -   `Closed` often implies "Done and locked", whereas `Solved` tickets can be re-opened by a customer reply.
-   **Migration**:
    -   Added `solved` and `spam` to the postgres enum.
    -   Ran SQL `UPDATE conversations SET status = 'solved' WHERE status = 'closed'`.
    -   (Future) Remove `closed` from enum when safe.

## Decision 2: Auto-Open on Customer Reply
-   **Date**: 2025-12-12
-   **Context**: What happens if a customer replies to a `Solved` or `Pending` ticket?
-   **Decision**: Force status to `OPEN`.
-   **Rationale**:
    -   Safety first. We must never miss a customer message.
    -   Implemented in the persistence layer (`updateLastMessage`) to guarantee it happens on every incoming message event.

## Decision 3: "Spam" Status
-   **Date**: 2025-12-12
-   **Context**: How to handle junk messages without deleting them (for audit)?
-   **Decision**: Add a `SPAM` status.
-   **Rationale**:
    -   Allows hiding conversations from the main inbox without data loss.
    -   Better than `Delete` because mistakes can be undone.

## Decision 4: No "Archived" Status yet
-   **Date**: 2025-12-12
-   **Context**: Do we need a final state that cannot be re-opened?
-   **Decision**: Not for V1.
-   **Rationale**: `Solved` is sufficient. "Archiving" adds complexity (read-only locking) not needed yet.
