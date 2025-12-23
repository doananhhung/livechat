
# Database & Event-Driven Core

## 1. Event-Driven Architecture (EDA)

The backend decouples high-throughput ingestion from heavy processing using an **Asynchronous Ingestion Pipeline**.

### 1.1 Visitor Message Flow
1.  **Ingest**: API Node receives `sendMessage` socket event.
2.  **Buffer**: Pushes payload to `live-chat-events-queue` (BullMQ/Redis).
3.  **Ack**: API acknowledges receipt to the client immediately.
4.  **Process**: Worker Node consumes the job.
5.  **Persist**: Worker writes to PostgreSQL (`Message`, `Conversation`).
6.  **Broadcast**: Worker publishes to Redis Pub/Sub (`NEW_MESSAGE_CHANNEL`) to notify API nodes to push updates to Agents.

### 1.2 Agent Message Flow (Synchronous)
Unlike visitors, Agent messages are written directly to the DB via HTTP POST to ensure immediate consistency ("Read your writes") for the dashboard UI.

---

## 2. Transactional Outbox Pattern

To ensure data consistency between the Database (PostgreSQL) and the Message Broker (Redis/Socket.IO), the system implements the **Transactional Outbox Pattern**.

### 2.1 The Problem
Avoiding "Dual Write" issues where the DB commits but the notification fails (or vice versa).

### 2.2 The Solution
*   **Entity**: `OutboxEvent` table.
*   **Mechanism**:
    1.  Inside the business transaction, the system inserts the domain entity (e.g., `Message`) AND an `OutboxEvent` record.
    2.  Commit Transaction.
    3.  **Post-Commit Hook**: PostgreSQL `NOTIFY` triggers the `OutboxListenerService`.
    4.  **Relay**: The listener reads the event, publishes it to Redis, and deletes the outbox record.

### 2.3 Concurrency Control
The `OutboxPersistenceService` uses `FOR UPDATE SKIP LOCKED` when fetching pending events. This allows multiple backend instances to process the outbox concurrently without processing the same event twice.

---

## 3. Read-Side Denormalization

To optimize the performance of the "Inbox List" query (the most frequent read operation), specific fields are denormalized onto the `Conversation` entity.

*   **Fields**: `lastMessageSnippet`, `lastMessageTimestamp`, `unreadCount`.
*   **Sync Logic**: These fields are updated transactionally whenever a new message is inserted.
*   **Benefit**: Eliminates the need for expensive `JOIN` or `COUNT(*)` queries on the `messages` table when listing conversations.

---

## 4. Hybrid State & Persistence

### 4.1 Visitor Entity
*   **Persistent**: `visitorUid`, `projectId`, `metadata`.
*   **Ephemeral (Redis)**: `currentUrl`.
    *   *Note*: The `Visitor` entity class defines `currentUrl`, but it is **not** a database column. It is hydrated at runtime.

### 4.2 Encryption
Sensitive fields (e.g., `twoFactorAuthenticationSecret`) are encrypted using **AES-256-GCM**.
*   **Format**: `IV:AuthTag:EncryptedData`.
*   **Key**: Requires a 32-byte `ENCRYPTION_KEY` in environment variables.
