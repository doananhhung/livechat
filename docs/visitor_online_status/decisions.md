# Decision Log: Visitor Online/Offline Status

## Decision 1: Redis for Online Status
- **Date:** 2025-12-14
- **Context:** We need low-latency, high-frequency read/write for connection status.
- **Decision:** Use Redis (specifically, ephemeral keys).
- **Rationale:**
  1.  **Performance:** Database updates on every connect/disconnect are too heavy.
  2.  **Ephemerality:** Status is transient; it doesn't need permanent storage history (unlike `lastSeenAt`).
  3.  **TTL Support:** Automatic cleanup of "ghost" sessions via Time-To-Live.

## Decision 2: Hybrid Data Source (Redis + DB)
- **Date:** 2025-12-14
- **Context:** Agents need to know *if* a visitor is online, and if not, *when* they were last seen.
- **Decision:** 
  - `isOnline`: Read from Redis.
  - `lastSeenAt`: Read from Postgres.
- **Rationale:**
  - `isOnline` is a binary real-time state.
  - `lastSeenAt` is historical data that must survive server restarts.

## Decision 3: "Strict Offline" UI
- **Date:** 2025-12-14
- **Context:** When a visitor goes offline, the "Current URL" they were viewing becomes stale immediately.
- **Decision:** Hide the "Current Page" and "Preview" sections entirely when offline.
- **Rationale:**
  - **Accuracy:** Prevents agents from assuming the visitor is still looking at that page.
  - **Clarity:** "No data" is better than "Wrong data."

## Decision 4: Optimistic Cache Updates
- **Date:** 2025-12-14
- **Context:** Waiting for a refetch after a status change event feels sluggish.
- **Decision:** Manually update the React Query cache in `SocketContext`.
- **Rationale:**
  - **Responsiveness:** UI updates instantly.
  - **Efficiency:** Reduces API calls.
