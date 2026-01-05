# Design: Conversation Status Lifecycle (Core)
## Slice: conversation_status_core

### 1. Objective
To expand the conversation lifecycle beyond "Open/Closed" to a professional workflow: **Open, Pending, Solved, Spam**. This slice establishes the data model and manual controls. Automation (Auto-Pending) will follow in a separate slice.

### 2. The Domain Physics (Invariants)
1.  **Valid Transitions:** Any status can transition to any other status manually.
2.  **Default State:** New conversations start as `OPEN`.
3.  **Customer Reply:** A new message from a Visitor ALWAYS forces the status to `OPEN` (regardless of current state).
4.  **List Visibility:**
    *   **Open:** Active conversations (Customer waiting or Agent working).
    *   **Pending:** Waiting for Customer.
    *   **Solved:** Historic/Closed.
    *   **Spam:** Hidden.

### 3. The Data Structure

#### 3.1 Database Enum
Modify the Postgres Enum `conversation_status_enum`.

*   **Old:** `'open', 'closed', 'pending'`
*   **New:** `'open', 'pending', 'solved', 'spam'`
    *   *Migration Strategy:*
        *   Rename `closed` -> `solved`.
        *   Add `spam`.
        *   Ensure `pending` is active.

#### 3.2 Shared Types
Update `ConversationStatus` enum in `shared-types`.

```typescript
export enum ConversationStatus {
  OPEN = 'open',
  PENDING = 'pending',
  SOLVED = 'solved', // Was 'closed'
  SPAM = 'spam'
}
```

#### 3.3 DTOs
Update `ListConversationsDto` to accept the new enum values.

### 4. API Interface

**Endpoints:**
*   `PATCH /conversations/:id` -> Accepts `status: ConversationStatus`.
*   `GET /conversations` -> Accepts `status` filter (Enum).

### 5. Backend Logic (Triggers)

**Event Consumer (`handleNewMessage`):**
*   **IF** `message.fromCustomer === true`:
    *   **THEN** Update Conversation `status = OPEN`.
    *   **AND** Emit `CONVERSATION_UPDATED` event.

### 6. Frontend UI

#### 6.1 `ConversationList`
*   **Filters:** Replace "Open/Closed" tabs with a Dropdown or Tabs:
    *   `Open` (Default)
    *   `Pending`
    *   `Solved`
    *   `Spam` (Maybe hidden in a "More" menu or just the 4th tab)

#### 6.2 `MessagePane` Header
*   **Status Indicator:** Shows current status badge.
*   **Status Controls:** Dropdown Menu.
    *   *Current: Open* -> Options: "Mark Pending", "Mark Solved", "Mark Spam".
    *   *Current: Pending* -> Options: "Mark Open", "Mark Solved".
    *   *Current: Solved* -> Options: "Re-open".

### 7. Implementation Plan

1.  **Shared:** Update `ConversationStatus` enum.
2.  **Backend:**
    *   **Migration:** Rename 'closed' to 'solved', add 'spam'.
    *   **Entity:** Update default value if needed.
    *   **Service:** Ensure `listByProject` filters correctly.
    *   **Consumer:** Implement "Auto-Open on Reply" logic.
3.  **Frontend:**
    *   Update `inboxApi` types.
    *   Update `ConversationList` filters.
    *   Update `MessagePane` header controls.

### 8. Pre-Mortem
*   **Migration Risk:** Renaming enum values in Postgres can be tricky depending on TypeORM version.
    *   *Mitigation:* Safe approach: Add new values first. Update data (`UPDATE conversations SET status='solved' WHERE status='closed'`). Then remove 'closed' if possible, or just leave it deprecated.
    *   *Constraint:* TypeORM `sync` might struggle. We will write a manual SQL migration.

