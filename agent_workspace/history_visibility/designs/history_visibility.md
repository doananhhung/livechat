# Design: Configurable Visitor History Visibility
## Slice: history_visibility

### 1. Objective
To allow Project Managers to configure how conversation history is presented to returning visitors. This supports two common support paradigms: "Continuous Chat" (history always visible) vs "Ticket Based" (history clears on resolution).

### 2. The Domain Physics (Invariants)
1.  **Configuration:** A Project setting `widgetSettings.historyVisibility` controls the behavior.
2.  **Modes:**
    *   `limit_to_active` (Default): Visitors only see `OPEN` or `PENDING` conversations. `SOLVED` conversations are hidden (archived).
    *   `forever`: Visitors see their entire conversation history (except Spam).
3.  **Spam Exclusion:** Conversations marked as `SPAM` are NEVER shown to the visitor, regardless of the setting.
4.  **Re-opening Logic:**
    *   In `forever` mode: A new message on a `SOLVED` conversation **re-opens** it (`status` -> `OPEN`).
    *   In `limit_to_active` mode: A new message when no active conversation exists creates a **NEW** conversation.

### 3. The Data Structure

#### 3.1 Shared Types
Update `IWidgetSettings` interface.

```typescript
export type HistoryVisibilityMode = 'limit_to_active' | 'forever';

export interface IWidgetSettingsDto {
  // ... existing fields
  historyVisibility?: HistoryVisibilityMode;
}
```

### 4. Backend Logic

#### 4.1 Widget Initialization (`EventsGateway`)
When a visitor identifies:
1.  Fetch `Project` settings.
2.  Call `conversationService.findConversationForWidget(projectId, visitorId, mode)`.

#### 4.2 `ConversationService.findConversationForWidget`
*   **Input:** `projectId`, `visitorId`, `mode`.
*   **Logic:**
    *   Base Query: `WHERE visitorId = :id AND projectId = :pid AND status != 'spam'`
    *   **If `limit_to_active`:** `AND status IN ('open', 'pending')`.
    *   **If `forever`:** Order by `createdAt DESC`, Take 1.
*   **Return:** `Conversation` or `null`.

#### 4.3 Message Handling (`ConversationPersistenceService`)
When processing a new message:
1.  Check `historyVisibility` setting.
2.  **If `forever`:**
    *   Find *any* recent non-spam conversation.
    *   If found: Update it (Set `status = OPEN`, `lastMessageId`, etc).
    *   If not found: Create New.
3.  **If `limit_to_active`:**
    *   Find *active* (`OPEN`/`PENDING`) conversation.
    *   If found: Update it.
    *   If not found: Create New.

### 5. Frontend (Project Settings)
Update `ProjectWidgetSettingsDialog.tsx` (or `ProjectBasicSettingsForm`? *Note: `widgetSettings` is a JSONB column, distinct from `autoResolveMinutes`*).
*   Add **Radio Group**: "Conversation History".
    *   Option 1: "Limit to Active (Ticket Style)" - Hides history after resolution.
    *   Option 2: "Forever (Chat Style)" - Keeps history visible always.

### 6. Implementation Plan

1.  **Shared:** Update `IWidgetSettingsDto` and `HistoryVisibilityMode` type.
2.  **Backend:**
    *   Update `ConversationService` to support the new lookup logic.
    *   Update `ConversationPersistenceService` (Worker) to respect the re-opening logic.
    *   Refactor `InboxEventHandler` to pass the correct conversation to the widget.
3.  **Frontend:**
    *   Update `ProjectWidgetSettingsDialog` to include the configuration UI.

### 7. Pre-Mortem
*   **Data Integrity:** A visitor in `forever` mode replies to a 2-year-old conversation.
    *   *Result:* It re-opens.
    *   *Impact:* Metrics (Resolution Time) might look weird (2 years).
    *   *Mitigation:* Acceptable for "Chat Style". If this is a concern, managers should use `limit_to_active`.
*   **Migration:** Existing projects have `historyVisibility` undefined.
    *   *Default:* Treat `undefined` as `limit_to_active` to preserve existing behavior (Ticket Style).

