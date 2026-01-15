# Visitor Online/Offline Status

## Purpose
This feature provides real-time visibility into whether a visitor is currently active on the website (Online) or has left (Offline). It helps agents understand if they can expect an immediate reply or if they are sending a message to be read later.

## Summary
The system tracks the visitor's socket connection status.
- **Online**: Visitor has an active WebSocket connection. Displayed with a green indicator and their current page.
- **Offline**: Visitor has disconnected. Displayed with a gray indicator and "Last seen" timestamp. Detailed page info is hidden to avoid showing stale data.

## Key Components
- **RealtimeSessionService (Backend)**: Uses Redis to track active visitor sessions.
- **EventsGateway (Backend)**: Emits `VISITOR_STATUS_CHANGED` events on connect/disconnect.
- **VisitorContextPanel (Frontend)**: Visualizes the status and conditionally renders context (URL/History) based on the state.
- **SocketContext (Frontend)**: Listens for status changes and updates the React Query cache in real-time.

## How It Works
1.  **Connection**: When a visitor's widget connects, the backend marks them as "Online" in Redis and broadcasts a status change.
2.  **Disconnection**: When the tab is closed, the backend removes the Redis key, updates `lastSeenAt` in Postgres, and broadcasts "Offline".
3.  **Persistence**: `lastSeenAt` is stored in the database to show relative time (e.g., "Last seen 5m ago").
4.  **UI**: The Agent Dashboard updates instantly without refreshing.

## Related Documentation
- [Architecture](./architecture.md)
- [Decision Log](./decisions.md)
