# Decision Log: Configurable Visitor History Visibility

## Decision 1: Two Distinct History Modes
-   **Date**: 2025-12-13
-   **Context**: How to address varying customer needs for chat history?
-   **Decision**: Implement two modes: `limit_to_active` ("Ticket Style") and `forever` ("Chat Style").
-   **Rationale**: These two paradigms cover the vast majority of customer support workflows. "Ticket Style" is good for formal, self-contained issues, while "Chat Style" is preferred for continuous engagement.

## Decision 2: Default to `limit_to_active`
-   **Date**: 2025-12-13
-   **Context**: What is the default behavior for existing projects or when the setting is not explicitly chosen?
-   **Decision**: Default `historyVisibility` to `limit_to_active`.
-   **Rationale**: This preserves the existing behavior of the system prior to this feature, ensuring no breaking changes for current users.

## Decision 3: Spam Exclusion
-   **Date**: 2025-12-13
-   **Context**: Should `SPAM` conversations be visible in any history mode?
-   **Decision**: `SPAM` conversations are **always** excluded from visitor history, regardless of the `historyVisibility` setting.
-   **Rationale**: `SPAM` is explicitly for irrelevant content and should never be exposed to visitors, even in "Chat Style" mode. This maintains data hygiene and security.

## Decision 4: Re-opening vs. New Conversation Logic
-   **Date**: 2025-12-13
-   **Context**: How should a new message from a visitor behave when no actively visible conversation exists?
-   **Decision**:
    -   If `forever` mode: Find the most recent non-`SPAM` conversation and set its status to `OPEN`.
    -   If `limit_to_active` mode: Create a brand new conversation with `OPEN` status.
-   **Rationale**: This aligns directly with the "Ticket Style" (new ticket for new issue) and "Chat Style" (continue old conversation) paradigms. Implemented primarily in `ConversationPersistenceService.findOrCreateByVisitorId`.
