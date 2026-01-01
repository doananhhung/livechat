# Implementation Plan: canned_responses_frontend

## 1. Acceptance Tests (What "Done" Looks Like)

### Management UI Tests
- [ ] Test: Navigate to "Canned Responses" from Project Settings.
- [ ] Test: List existing responses.
- [ ] Test: "Add Response" opens dialog -> Create -> Updates List.
- [ ] Test: Create duplicate shortcut -> Shows error message.
- [ ] Test: Edit response -> Updates List.
- [ ] Test: Delete response -> Updates List.

### Composer Tests
- [ ] Test: Typing `/` at start of message opens popover.
- [ ] Test: Typing `/hel` filters list to "hello", "help".
- [ ] Test: Pressing `Enter` or Click replaces `/hel` with full content.
- [ ] Test: Typing `/` in middle of word (e.g. `1/2`) does NOT open popover.
- [ ] Test: Escape key closes popover.

## 2. Implementation Approach
1.  **API Service:** Implement `cannedResponsesApi.ts` using React Query.
2.  **Management UI:**
    *   Create `CannedResponsesPage` layout.
    *   Create `CannedResponseList` component with Add/Edit/Delete dialogs.
    *   Integrate into Navigation (`ProjectManagementMenu`, `ProjectSettingsPage`, `App.tsx`).
3.  **Composer Integration:**
    *   Create `SlashCommandPopover` component (receives filter text, onSelect callback).
    *   Update `MessageComposer` to:
        *   Detect `/` trigger.
        *   Track cursor position and filter text.
        *   Render `SlashCommandPopover` when active.
        *   Handle text replacement.

## 3. Files to Create/Modify
- `packages/frontend/src/services/cannedResponsesApi.ts` — New.
- `packages/frontend/src/components/features/canned-responses/CannedResponseList.tsx` — New (Management table + Dialogs).
- `packages/frontend/src/pages/settings/CannedResponsesPage.tsx` — New (Page wrapper).
- `packages/frontend/src/components/features/canned-responses/SlashCommandPopover.tsx` — New (Autocomplete UI).
- `packages/frontend/src/components/features/inbox/MessageComposer.tsx` — Add trigger logic.
- `packages/frontend/src/App.tsx` — Add route.
- `packages/frontend/src/components/features/inbox/ProjectManagementMenu.tsx` — Add menu item.
- `packages/frontend/src/pages/settings/ProjectSettingsPage.tsx` — Add navigation section.

## 4. Dependencies
- `lucide-react` (Icons: `MessageSquarePlus`, etc.).
- `radix-ui` (Dialogs - assume existing `Dialog` component uses it).

## 5. Risk Assessment
- **Composer Complexity:** Handling caret position and text replacement in `textarea` can be tricky.
    - *Mitigation:* Use simple string manipulation based on `selectionStart`.
    - *Fallback:* If absolute positioning is hard, position fixed at bottom of composer.
