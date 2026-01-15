# Architecture: Visitor Name Editing

## System Diagram

```mermaid
sequenceDiagram
    participant Agent as Agent UI
    participant API as Backend API
    participant DB as Database
    participant WS as WebSocket Gateway
    participant Peer as Peer Agent UI

    Agent->>API: PATCH /visitors/:id { displayName: "John Doe" }
    API->>DB: UPDATE visitors SET display_name = "John Doe"
    API->>DB: INSERT INTO audit_logs (action: UPDATE)
    API->>WS: emit('visitorUpdated', { visitorId: 1, displayName: "John Doe" })
    API-->>Agent: 200 OK (Updated Visitor)

    par Real-time Sync
        WS-->>Agent: visitorUpdated event
        WS-->>Peer: visitorUpdated event
    end

    Agent->>Agent: Invalidate Query Cache (Refetch)
    Peer->>Peer: Invalidate Query Cache (Refetch)
```

## Components

### 1. Frontend
- **VisitorNameEditor (`VisitorNameEditor.tsx`)**: 
  - Handles inline state (isEditing, value).
  - Uses `useUpdateVisitor` mutation.
- **RenameVisitorDialog (`RenameVisitorDialog.tsx`)**:
  - Controlled dialog component.
  - Shares the same mutation hook.
- **useUpdateVisitor Hook**:
  - Wrapper around `useMutation`.
  - Optimistically updates UI or invalidates cache on success.
- **useVisitorEvents Hook**:
  - Listens for `visitorUpdated`.
  - Triggers cache invalidation for `['conversations']` and `['visitor', id]`.

### 2. Backend
- **VisitorController**:
  - Endpoint: `PATCH /projects/:projectId/visitors/:visitorId`
  - Guards: `JwtAuthGuard`, `RolesGuard` (Agent/Manager only).
  - Decorator: `@Auditable({ action: AuditAction.UPDATE, resource: 'visitor' })`
- **VisitorsService**:
  - Logic: Finds visitor -> Updates field -> Saves -> Emits Event.
- **EventsGateway**:
  - Emits: `visitorUpdated` to room `project:{projectId}`.

## Data Flow
- **Input**: User provides string (max 50 chars).
- **Validation**: Backend `UpdateVisitorDto` enforces constraints.
- **Storage**: `display_name` column in `visitors` table.
- **Audit**: Every name change is recorded in `audit_logs`.

## Error Handling
- **Validation Error (400)**: Name too long or empty.
- **Not Found (404)**: Visitor ID does not exist.
- **Forbidden (403)**: User does not have permission (e.g., Viewer role).
