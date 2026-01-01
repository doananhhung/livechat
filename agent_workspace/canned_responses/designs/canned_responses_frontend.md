# Design: Canned Responses Frontend
## Slice: canned_responses_frontend

### 1. Objective
To allow agents to insert canned responses into the chat via a keyboard shortcut (e.g., typing `/`) and allow managers to configure these responses.

### 2. The Domain Physics (Invariants)
1.  **Usage:** Typing `/` in the `MessageComposer` should trigger a popup list of available canned responses.
2.  **Filtering:** Typing `/wel` should filter the list to shortcuts matching "wel".
3.  **Selection:** Pressing `Enter` or clicking an item should replace the shortcut (e.g., `/welcome`) with the full content.
4.  **Management:** A new Settings page for Managers to CRUD canned responses.

### 3. Architecture & Components

#### 3.1 Component Hierarchy

```mermaid
graph TD
    ProjectSettingsLayout
    └── CannedResponsesPage (New)
        └── CannedResponseList
            ├── CreateResponseDialog
            └── EditResponseDialog

    MessageComposer (Existing)
        └── SlashCommandPopover (New)
```

#### 3.2 `SlashCommandPopover` (The "Autocomplete" Widget)
*   **Trigger:** Detect `/` character in `textarea`.
*   **State:**
    *   `isOpen`: boolean
    *   `filterQuery`: string (text after the `/`)
    *   `selectedIndex`: number (for keyboard navigation)
*   **Data Source:** `useCannedResponses(projectId)` hook.
*   **Positioning:** Floating UI (using `@floating-ui/react` or absolute positioning relative to cursor if possible, or simple absolute positioning above the textarea for V1).

#### 3.3 `CannedResponsesPage` (Management UI)
*   **Route:** `/projects/:projectId/settings/canned-responses`
*   **Access:** Managers only (enforced by `PermissionGate`).
*   **Features:**
    *   List view of responses (Shortcut | Content Preview | Actions).
    *   "Add Response" button.
    *   Edit/Delete actions.

### 4. Data Strategy

#### 4.1 API Hooks (`cannedResponsesApi.ts`)
*   `useGetCannedResponses(projectId)`
*   `useCreateCannedResponse()`
*   `useUpdateCannedResponse()`
*   `useDeleteCannedResponse()`

#### 4.2 State
*   We will rely on React Query caching. `useGetCannedResponses` will be called in the `MessageComposer`. Since this data changes infrequently, we can set a high `staleTime` (e.g., 5 minutes) to avoid spamming the API on every keystroke.

### 5. Implementation Plan

1.  **API Service:** Create `cannedResponsesApi.ts` in `packages/frontend/src/services`.
2.  **Management UI:**
    *   Create `CannedResponsesPage.tsx`.
    *   Add route to `SettingsLayout`.
3.  **Chat Integration:**
    *   Modify `MessageComposer.tsx`.
    *   Implement logic to detect `/` and show a simple list (V1: Absolute positioned list above input).
    *   Handle `Enter` key to insert text.

### 6. Pre-Mortem
*   **Scenario:** Filter lag.
    *   *Mitigation:* Filter client-side. The list of canned responses is usually small (< 100). Fetch all, filter in memory.
*   **Scenario:** Collision with normal text.
    *   *Case:* User wants to type "1/2".
    *   *Mitigation:* Only trigger if `/` is at the start of the line or preceded by a space. *Decision for V1:* Only start of line or space.

### 7. UX Detail (The "Composer" Logic)
*   **Input:** "Hi /wel"
*   **UI:** Shows list filtered by "wel".
    *   `welcome` -> "Hello, how can I help?"
*   **Action:** User selects "welcome".
*   **Result:** Input becomes "Hi Hello, how can I help?" (Replaces `/wel` with content).

