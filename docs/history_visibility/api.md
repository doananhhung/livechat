# API Reference: Configurable Visitor History Visibility

This feature primarily introduces a new configuration option within the existing Project Widget Settings API.

## Project Widget Settings

### Update Project Widget Settings
**PATCH** `/projects/:projectId/widget-settings`

Updates the configuration for the project's chat widget.

**Authentication:**
-   Requires `Bearer` token (JWT).
-   Role: `MANAGER` or higher.

**Body:**
```json
{
  "historyVisibility": "forever",
  "theme": "dark",
  // ... other widget settings
}
```

**New Field:**
-   `historyVisibility` (string, optional):
    -   **Type**: `HistoryVisibilityMode = 'limit_to_active' | 'forever'`
    -   **Description**: Controls how conversation history is presented to returning visitors in the widget.
        -   `'limit_to_active'`: Only active (`OPEN`, `PENDING`) conversations are shown. `SOLVED` conversations are hidden. A new message from a visitor when no active conversation exists will create a new conversation. (Default behavior)
        -   `'forever'`: The visitor's entire non-`SPAM` conversation history is shown. A new message from a visitor will always attempt to re-open the most recent conversation (setting its status to `OPEN`).

**Response (200 OK):**
Returns the updated `Project` object, including the new `widgetSettings`.

## Related API Calls (Backend Internal)

The logic internally affects the behavior of:
-   `conversationService.findConversationForWidget`
-   `conversationPersistenceService.findOrCreateByVisitorId`
-   `eventConsumerService.handleNewMessageFromVisitor`
-   `eventsGateway.prepareSocketForVisitor`

These internal methods now dynamically adjust their queries and conversation creation/re-opening logic based on the `historyVisibility` setting.
