# Specification - Unified Theme & Optimistic UI

**Status:** FINALIZED
**Created:** 2026-01-25

## Goal

Create a seamless, visually identical messaging experience between the Dashboard and the Chat Widget while synchronizing real-time feedback for agents.

## Requirements

### Must Have

#### 1. Unified Visual Identity
- [ ] **Bubble Parity:** "Me" bubbles (Right-aligned) in both platforms must use the Theme's Primary color. "Them" bubbles (Left-aligned) must use the Theme's Muted color.
- [ ] **Style Sync:** Synchronize border-radius (`rounded-lg` with corner cuts), padding, and typography across `MessagePane.tsx` (Dashboard) and `Message.tsx` (Widget).
- [ ] **Removal of Primary Color Picker:** Remove `primaryColor` from `WidgetSettingsDto` and the Project Settings UI. The widget will now strictly inherit the selected theme's primary color.

#### 2. Agent Optimistic UI
- [ ] **In-flight Visualization:** Agent messages in `MessagePane.tsx` must display immediately with a "sending" state (opacity reduction or spinner) using the existing `MessageStatus.SENDING` from `inboxApi.ts`.
- [ ] **Error Handling:** Visualize `MessageStatus.FAILED` in the Dashboard with a retry or error icon.

#### 3. Full Theme Support
- [ ] **Expanded Theme Library:** Update `WidgetTheme` enum to include all dashboard themes (Cyberpunk, Dracula, Matcha, etc.).
- [ ] **Token Mapping:** Update the widget's CSS variable generation to map all 14+ themes from `themeStore.ts` into the Shadow DOM.
- [ ] **Settings Integration:** Update the Project Widget Settings dialog to allow selection of any available theme from a dropdown.

### Nice to Have
- [ ] Live theme preview in the settings dialog that reflects the actual CSS variables of the selected theme.

### Won't Have
- [ ] Custom user-defined CSS overrides.
- [ ] Per-message alignment customization (Agent is always right in Dashboard, Visitor always right in Widget).

## Constraints
- **Shadow DOM:** The widget must continue to use Shadow DOM for style isolation; themes must be injected via CSS variables.
- **i18n:** All new selection labels must be translated in `en.json` and `vi.json`.
- **Backward Compatibility:** Existing projects with a `primaryColor` set should default to the theme's primary color.

## Open Questions
- None.
