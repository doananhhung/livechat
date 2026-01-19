# Decision Log: Status Automation

## Decision 1: Use BullMQ for Delayed Jobs
-   **Date**: 2025-12-13
-   **Context**: How to execute logic "M minutes after event X"?
-   **Decision**: Use **BullMQ** (Redis-based queue) with `delay` option.
-   **Rationale**:
    -   Robust, persistent, and scalable.
    -   Handling `setTimeout` in memory is unreliable (server restarts lose timers).
    -   Cron jobs polling the DB every minute is inefficient and less precise.

## Decision 2: Atomic "Compare-and-Swap" in Worker
-   **Date**: 2025-12-13
-   **Context**: What if the customer replies *while* the job is in the queue or processing?
-   **Decision**: The worker performs a conditional update: `UPDATE ... WHERE id=:id AND last_message_id=:triggerId`.
-   **Rationale**:
    -   This guarantees strict consistency without complex locking.
    -   If the `last_message_id` has changed, it means *someone* (customer or agent) sent a message, so the timer is invalid.

## Decision 3: Spam Immunity
-   **Date**: 2025-12-13
-   **Context**: Should `SPAM` conversations behave like normal ones?
-   **Decision**: No. `SPAM` conversations should **never** auto-open or auto-pending.
-   **Rationale**:
    -   Spam is often automated. Auto-opening creates noise in the inbox.
    -   We modified `ConversationPersistenceService` to check status before reopening.

## Decision 4: Frontend Notification via Socket
-   **Date**: 2025-12-13
-   **Context**: How does the agent know *why* a conversation disappeared from "Open"?
-   **Decision**: Emit a specific socket event `automation.triggered` to show a Toast.
-   **Rationale**:
    -   Provides feedback and transparency.
    -   "Magic" UI updates can be confusing without explanation.
