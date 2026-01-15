# Architecture: Visitor Online/Offline Status

## System Diagram

```mermaid
sequenceDiagram
    participant Visitor as Visitor Widget
    participant Gateway as EventsGateway (Socket.IO)
    participant Redis as Redis Cache
    participant DB as Postgres DB
    participant Agent as Agent Dashboard

    Note over Visitor, Gateway: Connect
    Visitor->>Gateway: Connect + Identify
    Gateway->>Redis: SET session:visitor:{id} (TTL)
    Gateway->>DB: UPDATE visitors SET last_seen_at = NOW()
    Gateway->>Agent: emit('visitorStatusChanged', { isOnline: true })

    Note over Visitor, Gateway: Disconnect
    Visitor->>Gateway: Disconnect
    Gateway->>Redis: DEL session:visitor:{id}
    Gateway->>DB: UPDATE visitors SET last_seen_at = NOW()
    Gateway->>Agent: emit('visitorStatusChanged', { isOnline: false })

    Note over Agent: UI Update
    Agent->>Agent: SocketContext receives event
    Agent->>Agent: Update React Query Cache (Optimistic)
    Agent->>Agent: Re-render VisitorContextPanel
```

## Components

### 1. Backend
- **RealtimeSessionService**:
  - Abstraction over Redis.
  - `isVisitorOnline(uid)`: Checks existence of session key.
  - `getManyVisitorOnlineStatus(uids)`: Batch check via `MGET`.
- **EventsGateway**:
  - Intercepts `handleIdentify` and `handleDisconnect`.
  - Calls `visitorsService.updateLastSeenAtByUid`.
  - Emits `WebSocketEvent.VISITOR_STATUS_CHANGED`.
- **VisitorsService**:
  - `findOne`: Enriches the static DB entity with dynamic `isOnline` status from Redis.

### 2. Frontend
- **VisitorContextPanel**:
  - **Online**: Shows Green Dot, Current URL, Page Preview.
  - **Offline**: Shows Gray Dot, "Last seen X ago". **Hides** stale URL/Preview.
- **SocketContext**:
  - Listens for `VISITOR_STATUS_CHANGED`.
  - Updates `['conversations']` and `['visitor', id]` queries directly.

## Data Flow
- **Source of Truth (Online)**: Redis (Ephemeral).
- **Source of Truth (History)**: Postgres (`lastSeenAt`).
- **Sync**: WebSocket events push state changes. REST APIs pull state on load.

## Error Handling
- **Redis Down**: `RealtimeSessionService` catches errors and defaults to `false` (Offline). "When in doubt, assume they are gone."
- **Ghost Sessions**: Redis keys have TTLs to prevent stuck "Online" states if a server crashes.
