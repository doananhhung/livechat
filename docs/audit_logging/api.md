# API Reference: Audit Logging

## Endpoints

### 1. List Audit Logs
**GET** `/projects/:projectId/audit-logs`

Retrieves a paginated list of audit logs for a specific project.

**Authentication:**
- Requires `Bearer` token (JWT).

**Permissions:**
- Role: `MANAGER` (or higher)
- Scope: User must be a member of the project.

**Path Parameters:**
- `projectId` (int): The ID of the project.

**Query Parameters:**
- `page` (int, default: 1): Page number.
- `limit` (int, default: 20, max: 100): Items per page.
- `action` (enum, optional): Filter by `AuditAction` (e.g., `CREATE`, `UPDATE`, `DELETE`, `LOGIN`).
- `actorId` (uuid, optional): Filter by User ID.
- `startDate` (ISO Date string, optional): Filter logs created after this date.
- `endDate` (ISO Date string, optional): Filter logs created before this date.

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "projectId": 123,
      "actorId": "user_123",
      "actorType": "USER",
      "action": "UPDATE",
      "entity": "Project",
      "entityId": "123",
      "metadata": {
        "params": { "id": "123" },
        "requestBody": { "name": "New Project Name" },
        "responseBody": { "id": "123", "name": "New Project Name" }
      },
      "createdAt": "2025-12-12T10:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

**Errors:**
- `403 Forbidden`: User is not a member of the project OR user is not a Manager.
- `400 Bad Request`: Invalid query parameters (e.g., invalid date format).
