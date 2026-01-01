# API Reference: Canned Responses

## Base URL
`/projects/:projectId/canned-responses`

## Authentication
Requires `Bearer` token (JWT).

## Endpoints

### 1. List Responses
**GET** `/`

Returns all canned responses for the project.

**Permissions:** `AGENT` or `MANAGER`.

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "shortcut": "welcome",
    "content": "Hello! How can I help you today?",
    "projectId": 123
  }
]
```

### 2. Create Response
**POST** `/`

Creates a new canned response.

**Permissions:** `MANAGER` only.

**Body:**
```json
{
  "shortcut": "reset_pass",
  "content": "To reset your password, go to settings..."
}
```
*Note: `shortcut` must contain only letters, numbers, underscores, or dashes.*

**Response (201 Created):** Returns the created object.

**Errors:**
-   `409 Conflict`: Shortcut already exists in this project.
-   `400 Bad Request`: Invalid shortcut format.

### 3. Update Response
**PATCH** `/:id`

Updates an existing response.

**Permissions:** `MANAGER` only.

**Body:** (Partial)
```json
{
  "content": "Updated content..."
}
```

### 4. Delete Response
**DELETE** `/:id`

Deletes a response.

**Permissions:** `MANAGER` only.

**Response (200 OK)**
