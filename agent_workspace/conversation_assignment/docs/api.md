# API Reference: Conversation Assignment

## Endpoints

### 1. Assign Conversation
**POST** `/conversations/:id/assignments`

Assigns a conversation to a specific user (agent).

**Parameters:**
- `id` (Path): The UUID of the conversation.

**Body:**
```json
{
  "assigneeId": "uuid-of-agent"
}
```

**Response (200 OK):**
Returns the updated `Conversation` object.
```json
{
  "id": "1",
  "assigneeId": "uuid-of-agent",
  "assignedAt": "2025-12-12T12:00:00Z",
  "status": "open",
  ...
}
```

**Errors:**
- `400 Bad Request`: Invalid UUID or Assignee is not in the project.
- `403 Forbidden`: Requester is not in the project.
- `404 Not Found`: Conversation does not exist.

### 2. Unassign Conversation
**DELETE** `/conversations/:id/assignments`

Removes the current assignee from the conversation.

**Parameters:**
- `id` (Path): The UUID of the conversation.

**Response (200 OK):**
Returns the updated `Conversation` object.
```json
{
  "id": "1",
  "assigneeId": null,
  "assignedAt": null,
  "status": "open",
  ...
}
```
