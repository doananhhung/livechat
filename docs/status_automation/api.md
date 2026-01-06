# API Reference: Status Automation

## Project Configuration

### Update Project Settings
**PATCH** `/projects/:id`

Updates the project configuration, including automation settings.

**Body:**
```json
{
  "autoResolveMinutes": 15
}
```
-   `autoResolveMinutes` (number): Time in minutes before an answered conversation moves to `PENDING`. Set to `0` or `null` to disable.

**Response (200 OK):**
Returns the updated `Project` object.

## Socket Events

### `automation.triggered`
Emitted to the project room when a conversation status is automatically changed.

**Payload:**
```json
{
  "conversationId": "123",
  "type": "auto_pending",
  "message": "Conversation #123 moved to Pending automatically."
}
```

**Frontend Handling:**
-   Displays a Toast notification with the `message`.
