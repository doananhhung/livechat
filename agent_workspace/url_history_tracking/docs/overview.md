# Session-Based URL History & Referrer Tracking

## Purpose
Agents often lack context about a visitor's journey before the conversation starts. Knowing where a visitor came from (Referrer) and what pages they viewed (History) helps agents understand the visitor's intent and provide better support. This feature enables "silent" recording of the visitor's navigation and synchronizes it with the backend when the conversation begins.

## Summary
The system tracks the visitor's navigation history locally in the browser (`sessionStorage`) from the moment the widget loads. When the visitor sends their first message, this history is transmitted to the backend and stored in the `Conversation` record. Subsequent navigation updates are sent in real-time to keep the agent's view up-to-date.

## Key Components
- **HistoryTracker (Frontend Service)**: A singleton service in the widget that captures `document.referrer`, tracks URL changes, sanitizes sensitive parameters, and persists state to `sessionStorage`.
- **VisitorSessionMetadata (Shared Type)**: Defines the structure of the tracking data (referrer, landing page, URL history).
- **Conversation Entity (Backend)**: Extended with a `metadata` JSONB column to store the session data.
- **Agent Dashboard (Frontend UI)**: Visualizes the referrer and history in the visitor details panel, with real-time updates.

## How It Works
1.  **Silent Recording**: When the widget loads, `HistoryTracker` captures the referrer and starts recording page visits to `sessionStorage`.
2.  **Lazy Sync**: No data is sent to the server until the visitor initiates a chat.
3.  **Initial Payload**: On the first `sendMessage` event, the full history is attached to the payload.
4.  **Persistence**: The backend saves the history into the `conversations` table.
5.  **Real-time Updates**: As the visitor navigates during the chat, `updateContext` events append new URLs to the stored history and notify connected agents.

## Related Documentation
- [Architecture](./architecture.md)
- [Decision Log](./decisions.md)
