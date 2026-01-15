# Design: Visitor Online/Offline Status

## 1. The Domain Physics (Invariants)

### What MUST be true:

1.  **Strict Binary State (from UX perspective)**:
    -   **Online (Active)**: Visitor has an active socket connection.
    -   **Offline (Inactive)**: Visitor has NO active socket connection OR status is unknown (Redis failure).

2.  **Visual Exclusivity**:
    -   **IF Online**: Show "🟢 Online on [Page Title]" OR "🟢 Online (Viewing [URL])".
    -   **IF Offline**: Show "⚫ Offline • Last seen [Time] ago". **Do NOT show "Current Page" or URL.**

3.  **Data Source Hierarchy**:
    -   **Online Status**: Sourced from Redis (via ephemeral active session key).
    -   **Last Seen Time**: Sourced from PostgreSQL (`Visitor.lastSeenAt`). This value must be updated whenever a visitor disconnects or activity stops.

4.  **Graceful Fallback**:
    -   If Redis is unreachable or returns `null` for status, the system defaults to **Offline**.
    -   "When in doubt, assume they are gone."

---

## 2. The Data Structure (Logical)

### 2.1 Entity: Visitor (Augmented)

We logically extend the `Visitor` concept with runtime properties:

-   **`isOnline` (Boolean)**:
    -   `true` if Redis session key exists.
    -   `false` if Redis session key missing OR Redis error.
-   **`lastSeenAt` (Timestamp)**:
    -   Persisted in Database.
    -   Updated on:
        -   Socket Disconnect.
        -   Socket Connect (optional, to keep it fresh).
        -   Page Navigation.

### 2.2 Event: Visitor Status Changed

A real-time signal broadcast to Agents:

-   **Trigger**: Visitor connects or disconnects.
-   **Payload**:
    -   `visitorId`
    -   `status` (Online/Offline)
    -   `timestamp` (Time of event)

---

## 3. User Experience (UX) Design

### 3.1 Panel State: ONLINE 🟢

**Header Area:**
-   **Avatar**: Shows green dot indicator (bottom-right corner).
-   **Status Text**: "Online" (Green text).
-   **Current Activity**: "Viewing: [Page Title/URL]" (Visible).
-   **Page Preview**: Visible (Live screenshot).

### 3.2 Panel State: OFFLINE ⚫

**Header Area:**
-   **Avatar**: Shows gray/hollow dot indicator (or no dot).
-   **Status Text**: "Offline • Last seen 5m ago" (Gray text).
-   **Current Activity**: **HIDDEN**. (Do not show stale URL).
-   **Page Preview**: **HIDDEN** or "Visitor is offline".

---

## 4. Logic Flow

### 4.1 Connection Flow (Visitor Arrives)

1.  **Visitor Connects**: Widget establishes socket.
2.  **Backend**:
    -   Sets Redis Session.
    -   Updates DB: `visitor.lastSeenAt = NOW()`.
    -   Broadcasts `VisitorStatusChanged(Online)`.
3.  **Frontend (Agent)**:
    -   Receives event.
    -   Updates UI to **Online State**.
    -   Shows Current Page URL.

### 4.2 Disconnection Flow (Visitor Leaves)

1.  **Visitor Disconnects**: Socket closed (tab closed or network loss).
2.  **Backend**:
    -   Removes Redis Session.
    -   Updates DB: `visitor.lastSeenAt = NOW()`.
    -   Broadcasts `VisitorStatusChanged(Offline)`.
3.  **Frontend (Agent)**:
    -   Receives event.
    -   Updates UI to **Offline State**.
    -   **Hides** Current Page URL immediately.
    -   Starts "Last seen" counter.

### 4.3 Redis Failure Flow

1.  **Backend Check**: Agent requests visitor details.
2.  **Redis Error**: Connection times out.
3.  **Fallback**: Backend returns `isOnline: false`.
4.  **Frontend**: Renders **Offline State**.

---

## 5. The Pre-Mortem (Failure Modes)

### 5.1 "Ghost" Online Status
-   **Risk**: Visitor closes laptop (hard disconnect), socket doesn't close immediately.
-   **Logic**: Socket.IO heartbeat will eventually fail. Redis key has TTL (Time To Live).
-   **Constraint**: UI will show "Online" for max ~60s (heartbeat timeout) then switch to "Offline". Acceptable.

### 5.2 Rapid Flapping
-   **Risk**: Unstable network causes rapid Connect/Disconnect events.
-   **Logic**: UI will flicker.
-   **Constraint**: Acceptable for MVP. Can add frontend "debounce" (don't show offline until >5s disconnected) in future if annoying.

---

## 6. Self-Audit (The Defense)

### 6.1 Gall's Law (Simplicity)
-   Removing the URL when offline simplifies the mental model: "Active data only exists when user is active." No continuous stale data.
-   Treating "Unknown" as "Offline" prevents misleading "Online" indicators.

### 6.2 Ubiquitous Language
-   Using "Last Seen" matches standard chat app patterns (Messenger, WhatsApp).
-   "Offline" clearly implies "Cannot receive messages right now."

### 6.3 Reversibility
-   Purely additive logic. If we decide to show stale URLs later, we just unhide the UI element.
