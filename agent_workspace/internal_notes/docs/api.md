# API Reference: Internal Visitor Notes

## Endpoints

### 1. List Notes
**GET** `/projects/:projectId/visitors/:visitorId/notes`

Retrieves all internal notes for a specific visitor.

**Authentication:**
-   Requires `Bearer` token (JWT).
-   Role: `AGENT` or higher.

**Response (200 OK):**
```json
[
  {
    "id": "uuid...",
    "visitorId": 123,
    "authorId": "user_uuid...",
    "content": "Customer requested a callback.",
    "createdAt": "2025-12-12T10:00:00Z",
    "updatedAt": "2025-12-12T10:00:00Z",
    "author": {
      "id": "user_uuid...",
      "fullName": "Agent Smith",
      "avatarUrl": "..."
    }
  }
]
```

### 2. Create Note
**POST** `/projects/:projectId/visitors/:visitorId/notes`

Creates a new internal note.

**Body:**
```json
{
  "content": "This is a private note."
}
```

**Response (201 Created):** Returns the created `VisitorNote` object.

### 3. Update Note
**PATCH** `/projects/:projectId/visitors/:visitorId/notes/:noteId`

Updates the content of an existing note.

**Body:**
```json
{
  "content": "Updated content."
}
```

**Response (200 OK):** Returns the updated `VisitorNote` object.

### 4. Delete Note
**DELETE** `/projects/:projectId/visitors/:visitorId/notes/:noteId`

Permanently removes a note.

**Response (200 OK):** Empty body.

## Errors
-   `404 Not Found`: If Visitor or Note does not exist, or if they do not belong to the specified Project.
-   `403 Forbidden`: If user lacks Agent role.
