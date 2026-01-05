# API Reference: Conversation Status

## Endpoints

### 1. Update Conversation Status
**PATCH** `/projects/:projectId/inbox/conversations/:id`

Manually updates the status of a conversation.

**Authentication:**
-   Requires `Bearer` token (JWT).
-   Role: `AGENT` or `MANAGER`.

**Body:**
```json
{
  "status": "solved"
}
```
*Valid values:* `'open'`, `'pending'`, `'solved'`, `'spam'`.

**Response (200 OK):**
Returns the updated `Conversation` object.

### 2. List Conversations (Filtered)
**GET** `/projects/:projectId/inbox/conversations`

Lists conversations, optionally filtering by status.

**Query Parameters:**
-   `status` (enum, optional): Filter by status (e.g., `?status=solved`). Defaults to returning all if omitted (or specific logic implemented in service).
-   `page` (int): Pagination.
-   `limit` (int): Pagination.

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "...",
      "status": "solved",
      "lastMessageSnippet": "...",
      ...
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

## Error Handling
-   `400 Bad Request`: Invalid status value.
-   `404 Not Found`: Conversation does not exist.
-   `403 Forbidden`: Agent does not belong to the project.
