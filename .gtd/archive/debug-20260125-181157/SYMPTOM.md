# Bug Symptom

**Reported:** 2026-01-25
**Status:** CONFIRMED

## 1. Real-time Message Sync Failure (Visitor Messages)

**Expected Behavior**
When a **Visitor** sends a new message, it should appear immediately in the Agent's open chat window (`MessagePane`) without refreshing.

**Actual Behavior**
- The Sidebar (`ConversationList`) **correctly updates** (shows the new message snippet/time).
- The Main Chat Window (`MessagePane`) **does not update** (the new visitor message is missing).
- Refreshing the page makes the message appear.

## 2. Incorrect Timestamp Display (AI Messages)

**Expected Behavior**
Messages sent by the **AI (acting as Agent)** should display the correct relative time in the Sidebar (e.g., "1 day ago").

**Actual Behavior**
- Timestamps for AI-generated messages are incorrect (e.g., displaying "1 hour ago" when the message was sent 1 day ago).
- This specifically correlates with messages where the AI is the sender.

## Reproduction Steps

**Scenario A (Sync):**
1. Agent opens a conversation in the dashboard.
2. **Visitor** sends a message to that conversation.
3. Observe: Sidebar updates, but the message does not appear in the main chat view.

**Scenario B (Time):**
1. Locate a conversation where the **AI** sent the last response ~1 day ago.
2. Observe the timestamp in the Sidebar.
3. Actual: It displays "1 hour ago" (or similar incorrect time).

## Environment

- **OS:** Linux
- **Component:** Frontend (`ConversationList`, `MessagePane`)
