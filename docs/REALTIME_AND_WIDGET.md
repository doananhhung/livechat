
# Real-time & Widget Architecture

## 1. WebSocket Gateway Topology

The Real-time layer is built on **Socket.IO** and designed for horizontal scalability.

### 1.1 Redis Adapter
The `EventsGateway` utilizes the `@socket.io/redis-adapter`.
*   **Function**: It replaces the default in-memory adapter.
*   **Benefit**: Allows broadcasting events to sockets connected to *different* API instances.
*   **Requirement**: A Redis instance is mandatory for the WebSocket server to start.

### 1.2 Room Strategy
The system uses specific room patterns to target message delivery:

| Scope | Room Name | Usage |
| :--- | :--- | :--- |
| **Project (Agents)** | `project:{projectId}` | Agents join this room upon entering the Inbox. Used to broadcast "New Message" events to all agents of a tenant. |
| **Visitor (Direct)** | `socket.id` | Visitors do not join rooms. They are addressed directly via their Socket ID, which is mapped to their `visitorUid` in Redis. |

---

## 2. Widget Micro-Frontend

The embedded widget (`packages/frontend/src/widget`) is a standalone application built with **Preact**.

### 2.1 Isolation: Shadow DOM
To prevent CSS bleeding (Host styles affecting Widget, or Widget styles affecting Host), the widget is rendered inside a **Shadow DOM** root (`#live-chat-widget-host`).
*   **Styles**: CSS is injected directly into the Shadow Root.
*   **Exception**: Scrollbar styles are currently injected globally (Known Issue).

### 2.2 History API Monkey-Patching
The widget needs to track user navigation on Single Page Applications (SPAs) to update the "Current URL" in the Agent Dashboard.
*   **Mechanism**: The widget overrides `history.pushState` and `history.replaceState` on the host `window` object.
*   **Event**: It dispatches a custom `urlchange` event whenever navigation occurs.
*   **Throttling**: Updates are sent to the backend via `socket.emit('updateContext')`.

### 2.3 Resilience
*   **Retry Logic**: The widget initialization uses an exponential backoff strategy if the API is unreachable.
*   **Memory Safety**: The internal store (`useChatStore`) implements a circular buffer, keeping only the last 500 messages to prevent memory leaks in long-running tabs.

---

## 3. Optimistic UI & Synchronization

### 3.1 Agent Side
*   **Optimistic Updates**: When an agent sends a reply, the UI immediately renders the message with a temporary UUID and status `SENDING`.
*   **Reconciliation**: Once the backend confirms persistence, the temporary ID is swapped for the real Database ID.

### 3.2 Visitor Side
*   **Queueing**: Visitor messages are **not** written to the DB immediately by the API node. They are pushed to `BullMQ`.
*   **Feedback**: The widget receives a `messageSent` socket event once the Worker node has successfully processed and persisted the message.
