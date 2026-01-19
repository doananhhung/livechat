# Configurable Visitor History Visibility

## Purpose
The Configurable Visitor History Visibility feature allows Project Managers to tailor how conversation history is presented to returning visitors. This enables support teams to align the chat widget's behavior with their specific support paradigms, whether it's a "Ticket Style" approach where history clears upon resolution or a "Chat Style" approach where all past interactions are persistently visible.

## Summary
Projects can now configure the `historyVisibility` setting in their widget. This setting dictates whether a returning visitor sees only their active (open/pending) conversations or their entire conversation history (excluding spam). The backend logic ensures that new messages either re-open an existing conversation (in "Chat Style") or create a brand new one (in "Ticket Style") based on this configuration.

## Key Components
-   **Widget Settings**: The `IWidgetSettingsDto` and related backend logic store the chosen `historyVisibility` mode.
-   **Conversation Persistence Service**: Contains the core logic for finding or creating conversations based on the selected mode, including specific queries for "active" vs "any" conversations.
-   **Conversation Service**: Delegates the history lookup to the persistence layer based on project settings.
-   **Event Consumers (`InboxEventHandler`, `EventConsumerService`)**: Fetch the project's `historyVisibility` setting and pass it down to the conversation lookup logic.
-   **Frontend UI**: `ProjectWidgetSettingsDialog` provides a user-friendly interface for Project Managers to select their preferred mode.

## How It Works
1.  **Configuration**: A Project Manager accesses the widget settings and selects either "Ticket Style" (`limit_to_active`) or "Chat Style" (`forever`) for conversation history visibility.
2.  **Visitor Identification**: When a visitor connects to the widget, the backend identifies them.
3.  **History Lookup**: The backend fetches the project's `historyVisibility` setting.
    -   **"Ticket Style" (`limit_to_active`)**: The system attempts to find only `OPEN` or `PENDING` conversations for that visitor. If a new message comes in and no such conversation exists, a *new* conversation is created.
    -   **"Chat Style" (`forever`)**: The system attempts to find the most recent non-`SPAM` conversation for that visitor. If a new message comes in, it will re-open this existing conversation (setting its status to `OPEN`).
4.  **Display**: The widget then displays the conversation history according to the retrieved conversation.

## Related Documentation
- [Architecture](./architecture.md)
- [API Reference](./api.md)
- [Decision Log](./decisions.md)
- [Changelog](./changelog.md)
