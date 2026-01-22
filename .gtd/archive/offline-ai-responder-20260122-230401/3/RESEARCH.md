# Research: Phase 3

**Status:** Completed
**Date:** 2026-01-22

## Findings

### PM Configuration UI
- **Location:** `packages/frontend/src/pages/settings/ProjectSettingsPage.tsx`
- **Form Component:** `packages/frontend/src/components/features/projects/ProjectBasicSettingsForm.tsx` (but this is for basic name/domain).
- **Strategy:**
    - Update `ProjectBasicSettingsForm` to include `AI Responder` section?
    - Or add a new expandable section in `ProjectSettingsPage.tsx` like "Widget Settings".
    - Decision: Add a new section "AI Auto-Responder" in `ProjectSettingsPage.tsx` similar to "Widget Settings".
    - Need to update `ProjectWithRole` type on frontend if not already updated (shared types usually).

### Visitor Widget UI
- **Store:** `packages/frontend/src/widget/store/useChatStore.ts`.
- **Components:** `ChatWindow.tsx`, `Header.tsx`, `Composer.tsx`.
- **AI Status:**
    - Needs to know if AI is active.
    - We can pass this via `WidgetConfig` or a new WebSocket event.
    - However, the SPEC says "Trigger Mechanism: Logic to automatically trigger an AI response only when (Agents are Offline) AND (Visitor AI Toggle is ON)".
    - This means the Visitor needs a **Toggle**.
    - Where to put the toggle? `Header` or `ChatWindow` top area.
    - The *state* of the toggle needs to be in `useChatStore`.
    - The *logic* to check if agents are offline is in backend `AiResponderService`.
    - How does the frontend know if agents are offline?
    - Backend `EventsGateway` emits `visitor.status.changed`? No.
    - We need an event `project.status.changed` or similar, or just `agent.online.count`.
    - **Simpler approach:** The AI Responder service checks offline status. The frontend just needs to send a signal "AI Enabled by Visitor".
    - Or better: The backend AI service checks (Agents Offline) AND (Visitor Preference).
    - Frontend needs a way to set Visitor Preference.
    - We can add a toggle in the widget header.
    - When toggled, we emit `socket.emit('visitor.update_preference', { aiEnabled: boolean })`?
    - Or just store it in local state/localStorage and send it with every message? `sessionMetadata`?
    - **Decision:** Add "AI Assistant" toggle in Widget Header. Store state in `useChatStore` (persist to localStorage). Send this state in `sessionMetadata` with every message. Backend checks this metadata.

### Implementation Plan
1.  **Frontend Settings:**
    - Modify `ProjectSettingsPage.tsx` to add AI section.
    - Use `updateProject` API (already supports `aiResponderEnabled` and `aiResponderPrompt` via DTO update in Phase 1).

2.  **Widget Toggle:**
    - Update `useChatStore` to add `isAiEnabled` (default true).
    - Update `Header.tsx` to show toggle.
    - Update `App.tsx` / `socketService` to include `isAiEnabled` in `sessionMetadata`.

3.  **Backend Adjustment (Phase 2 revisit?):**
    - `AiResponderService` in Phase 2 didn't check for visitor toggle because we didn't send it yet.
    - We need to ensure `VisitorMessageReceivedEvent` contains `sessionMetadata`.
    - Phase 1 research showed `VisitorMessageReceivedEvent` has `sessionMetadata`.
    - We need to update `AiResponderService` to check `payload.sessionMetadata.aiEnabled`.

## Refined Plan for Phase 3
- **Task 1: PM Settings UI**
    - Add AI configuration fields to `ProjectSettingsPage`.
- **Task 2: Widget Store & Metadata**
    - Add `aiEnabled` to `useChatStore`.
    - Persist to `localStorage`.
    - Include in `sendMessage` payload.
- **Task 3: Widget Header UI**
    - Add Toggle Switch to `Header.tsx`.
    - Show "AI Active" indicator if enabled.

