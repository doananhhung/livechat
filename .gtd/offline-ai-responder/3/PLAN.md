---
phase: 3
created: 2026-01-22
---

# Plan: Phase 3 - User Experience (Frontend)

## Objective

Implement the user-facing controls for the AI Auto-Responder: Project Manager settings to configure the AI, and a visitor-facing toggle in the widget to opt-in/out of AI assistance.

## Context

- `packages/frontend/src/pages/settings/ProjectSettingsPage.tsx`: Main settings page.
- `packages/frontend/src/widget/store/useChatStore.ts`: Widget state management.
- `packages/frontend/src/widget/components/Header.tsx`: Widget header for toggle.
- `packages/backend/src/ai-responder/ai-responder.service.ts`: Backend logic (needs update for visitor preference).

## Tasks

<task id="1" type="auto">
  <name>Add AI Configuration to Project Settings</name>
  <files>
    packages/frontend/src/pages/settings/ProjectSettingsPage.tsx
    packages/shared-types/src/project.types.ts
  </files>
  <action>
    1.  Update `ProjectWithRole` type in frontend (if not shared) or rely on `shared-types` (check if `aiResponderEnabled` is in `ProjectWithRole`).
    2.  Modify `ProjectSettingsPage.tsx`:
        -   Add a new expandable section: "AI Auto-Responder".
        -   Add `PermissionGate` (Manager only).
        -   Add Form:
            -   Switch/Checkbox: `aiResponderEnabled`.
            -   Textarea: `aiResponderPrompt` (System Prompt).
        -   Use `updateProject` API mutation (existing).
  </action>
  <done>
    -   Settings page has AI Auto-Responder section.
    -   Can toggle enabled/disabled and save prompt.
  </done>
</task>

<task id="2" type="auto">
  <name>Implement Visitor AI Toggle (Store & UI)</name>
  <files>
    packages/frontend/src/widget/store/useChatStore.ts
    packages/frontend/src/widget/components/Header.tsx
    packages/frontend/src/widget/App.tsx
    packages/shared-types/src/websocket.types.ts
  </files>
  <action>
    1.  Update `useChatStore`:
        -   Add `isAiEnabled`: boolean (default true, persist to localStorage 'live_chat_ai_enabled').
        -   Add action `toggleAiEnabled()`.
    2.  Update `Header.tsx`:
        -   Add a toggle switch/icon button.
        -   Tooltip: "Turn off AI Assistant" / "Turn on AI Assistant".
    3.  Update `App.tsx`:
        -   In `handleSendMessage`, include `aiEnabled` in `sessionMetadata`.
    4.  Update `shared-types` `VisitorSessionMetadata` to include `aiEnabled?: boolean`.
  </action>
  <done>
    -   Widget Header shows AI toggle.
    -   Toggling updates store and localStorage.
    -   `sessionMetadata` includes `aiEnabled` flag.
  </done>
</task>

<task id="3" type="auto">
  <name>Update Backend to Respect Visitor Toggle</name>
  <files>
    packages/backend/src/ai-responder/ai-responder.service.ts
  </files>
  <action>
    1.  Update `AiResponderService.handleVisitorMessage`:
        -   Extract `sessionMetadata` from `VisitorMessageReceivedEvent`.
        -   Check if `sessionMetadata?.aiEnabled === false`.
        -   If false, return/skip AI response.
  </action>
  <done>
    -   Backend skips AI generation if visitor explicitly disabled it.
  </done>
</task>

## Success Criteria

- [ ] Project Managers can enable/disable AI and set prompts.
- [ ] Visitors can toggle AI on/off in the widget.
- [ ] Backend respects the visitor's choice.
