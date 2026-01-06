# Design: Status Automation (Auto-Pending)
## Slice: status_automation

### 1. Objective
To automate the workflow by automatically moving conversations to `PENDING` if an agent has replied and the customer has not responded after a configurable time (M minutes).

### 2. The Domain Physics (Invariants)
1.  **Trigger:** Automation starts only when an **Agent** sends a message.
2.  **Condition:** The conversation status MUST be `OPEN`.
3.  **Cancellation:** If the **Customer** replies before the timer expires, the automation is cancelled (or becomes a no-op).
4.  **Action:** After M minutes, if the last message is still from the Agent, set status to `PENDING`.
5.  **Notification:** When the status changes automatically, notify the Agent (Toast).
6.  **Spam Immunity:** Conversations marked as `SPAM` MUST NOT automatically reopen (transition to `OPEN`) upon receiving a new message from the visitor. They should remain `SPAM` to prevent cluttering the inbox.

### 3. The Architecture

#### 3.1 Project Settings
We need to store the configuration.
*   **Entity:** `Project` (or `WidgetSettings`? Project seems more appropriate for workflow).
*   **Field:** `autoResolveMinutes` (int, nullable).
    *   `null` or `0` = Disabled.
    *   `> 0` = Enabled (Minutes).

#### 3.2 The Scheduler (BullMQ)
We will use BullMQ's "Delayed Jobs" feature.

**Queue:** `conversation-workflow-queue`

**Job Data:**
```typescript
interface AutoPendingJob {
  conversationId: string;
  projectId: number;
  triggerMessageId: string; // The ID of the agent message that started the timer
}
```

**Flow:**
1.  **Agent sends message.**
2.  `ConversationsService` checks `project.autoResolveMinutes`.
3.  If enabled, add a job to `conversation-workflow-queue` with `delay = M * 60 * 1000`.
4.  **... M minutes pass ...**
5.  **Worker processes job.**
6.  Worker checks:
    *   Is conversation still `OPEN`?
    *   Is the `lastMessageId` equal to `triggerMessageId`? (Or is the last message still from an agent?)
7.  If YES:
    *   Update status to `PENDING`.
    *   Emit `CONVERSATION_UPDATED` (Socket).
    *   Emit `AUTOMATION_TRIGGERED` (Socket - special event for Toast).

### 4. API & Schema Changes

#### 4.1 Database
*   **Migration 1:** Add `auto_resolve_minutes` to `projects` table (int, default null).
*   **Migration 2:** Add `last_message_id` to `conversations` table (BigInt, nullable, FK to `messages`).
    *   *Reason:* Critical for atomic state checks in the workflow job (Prevent race conditions).

#### 4.2 API
*   `UpdateProjectDto`: Add `autoResolveMinutes`.

### 5. Implementation Plan

1.  **Backend:**
    *   **Migrations:** Generate migrations for `projects` and `conversations`.
    *   **Entity:** Update `Project` and `Conversation`.
    *   **Persistence:** Update `ConversationPersistenceService.updateLastMessage` to save `lastMessageId`.
    *   **Module:** `WorkflowModule` (Imports `BullModule`).
    *   **Producer:** Inject queue into `MessagesService` (or `InboxEventHandler`). Schedule job on agent reply.
    *   **Consumer:** `WorkflowConsumer` (Process the job).
        *   Atomic Check: `UPDATE conversations SET status='pending' WHERE id=:id AND status='open' AND last_message_id=:triggerId`.
    *   **Logic Refinement:** Update `ConversationPersistenceService` (or `updateLastMessage`) to prevent `SPAM` conversations from transitioning to `OPEN`.
2.  **Frontend:**
    *   **Settings UI:**
        *   Modify `ProjectSettingsPage.tsx` or create a new sub-component `WorkflowSettings.tsx`.
        *   Add a number input field for "Auto-Pending Timer (Minutes)".
        *   Display descriptive helper text (e.g., "Automatically move conversations to Pending if the customer doesn't reply. Set to 0 to disable.").
        *   Connect this input to update `Project.autoResolveMinutes` via the existing `updateProject` API hook.
    *   **Toast Notification:**
        *   Update `SocketContext.tsx` to listen for the `AUTOMATION_TRIGGERED` WebSocket event (as defined in backend).
        *   Upon receiving this event, trigger the `useToast()` hook to display a message to the agent (e.g., "Conversation #123 moved to Pending automatically.").

### 6. Pre-Mortem
*   **Race Condition:** User replies *exactly* when job runs.
    *   *Mitigation:* The Worker does a DB check inside a transaction (or atomic update).
    *   *Logic:* `UPDATE conversations SET status='pending' WHERE id=:id AND status='open' AND last_message_id=:triggerId`. If affected=0, do nothing.
*   **Clutter:** Agent sends 5 messages in a row.
    *   *Result:* 5 jobs scheduled?
    *   *Fix:* Ideally, we deduplicate. But simpler: Just schedule 5 jobs. Job 1 runs, sets Pending. Job 2 runs, sees status is Pending (not Open), does nothing. Job 5 runs, same. **Safe.**

