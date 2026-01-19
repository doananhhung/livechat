# Architecture: Session-Based URL History & Referrer Tracking

## System Diagram

```mermaid
sequenceDiagram
    participant Visitor as Visitor Browser
    participant Tracker as HistoryTracker (Widget)
    participant API as Backend API
    participant DB as Database (Postgres)
    participant Agent as Agent Dashboard

    Note over Visitor, Tracker: Silent Recording Phase
    Visitor->>Tracker: Page Load (Ref: Google)
    Tracker->>Tracker: Save { referrer: "Google", history: [Page A] } -> sessionStorage

    Visitor->>Tracker: Navigate to Page B
    Tracker->>Tracker: Update history: [Page A, Page B] -> sessionStorage

    Note over Visitor, API: Conversation Start
    Visitor->>Tracker: Send Message "Hello"
    Tracker->>API: emit('sendMessage', { content: "Hello", metadata: { ...history } })
    API->>DB: INSERT INTO conversations (metadata: history)

    Note over Visitor, Agent: Real-time Updates
    Visitor->>Tracker: Navigate to Page C
    Tracker->>API: emit('updateContext', { url: "Page C" })
    API->>DB: UPDATE conversations SET metadata.urlHistory.push("Page C")
    API->>Agent: emit('conversationUpdated', { metadata: ... })
    Agent->>Agent: Re-render History List
```

## Components

### Frontend: HistoryTracker
- **Location:** `packages/frontend/src/widget/services/historyTracker.ts`
- **Purpose:** Manages the client-side state of the visitor's session.
- **Responsibilities:**
    - Capture `document.referrer` on first load.
    - Sanitize URLs (remove `token`, `password`, etc.).
    - Maintain a FIFO buffer of the last 50 visited URLs.
    - Persist state to `sessionStorage` to survive page reloads.

### Backend: Conversation Persistence
- **Location:** `packages/backend/src/inbox/services/persistence/conversation.persistence.service.ts`
- **Purpose:** Handles the storage of conversation data.
- **Responsibilities:**
    - Saves the `metadata` payload from the initial message.
    - Updates `metadata` for existing conversations (idempotency).

### Database Schema
- **Entity:** `Conversation` (`packages/backend/src/database/entities/conversation.entity.ts`)
- **Column:** `metadata` (`jsonb`)
- **Structure:**
    ```typescript
    interface VisitorSessionMetadata {
      referrer: string | null;
      landingPage: string;
      urlHistory: NavigationEntry[]; // { url, title, timestamp }
    }
    ```

## Data Flow
1.  **Capture**: Widget captures data from `window.location` and `document`.
2.  **Buffer**: Data is buffered in `sessionStorage`.
3.  **Transmit**: Data is sent via WebSocket (`socket.io`).
4.  **Persist**: Data is stored in PostgreSQL as a JSON document.
5.  **Broadcast**: Updates are broadcast to Redis (Project Room) and pushed to Agent clients.

## Error Handling
- **Storage Quota**: If `sessionStorage` is full, `HistoryTracker` fails silently to prevent breaking the core chat experience.
- **Payload Bloat**: The history list is capped at 50 entries to prevent WebSocket message size issues.
- **Sanitization**: Sensitive query parameters are stripped before storage to prevent leaking PII/secrets.

## Failure Modes
- **Offline**: If the user is offline, history accumulates in `sessionStorage` and syncs on the next successful message or reconnection.
- **Tab Close**: Closing the tab clears `sessionStorage` (by browser design), resetting the session context.
