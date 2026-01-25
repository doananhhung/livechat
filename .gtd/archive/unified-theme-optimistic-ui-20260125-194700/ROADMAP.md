# Roadmap

**Spec:** ./.gtd/unified-theme-optimistic-ui/SPEC.md
**Goal:** Create a seamless, visually identical messaging experience between the Dashboard and the Chat Widget while synchronizing real-time feedback for agents.
**Created:** 2026-01-25

## Must-Haves

- [ ] **Bubble Parity:** "Me" bubbles (Right-aligned) in both platforms must use the Theme's Primary color. "Them" bubbles (Left-aligned) must use the Theme's Muted color.
- [ ] **Style Sync:** Synchronize border-radius (`rounded-lg` with corner cuts), padding, and typography across `MessagePane.tsx` (Dashboard) and `Message.tsx` (Widget).
- [ ] **Removal of Primary Color Picker:** Remove `primaryColor` from `WidgetSettingsDto` and the Project Settings UI. The widget will now strictly inherit the selected theme's primary color.
- [ ] **In-flight Visualization:** Agent messages in `MessagePane.tsx` must display immediately with a "sending" state (opacity reduction or spinner) using the existing `MessageStatus.SENDING` from `inboxApi.ts`.
- [ ] **Error Handling:** Visualize `MessageStatus.FAILED` in the Dashboard with a retry or error icon.
- [ ] **Expanded Theme Library:** Update `WidgetTheme` enum to include all dashboard themes (Cyberpunk, Dracula, Matcha, etc.).
- [ ] **Token Mapping:** Update the widget's CSS variable generation to map all 14+ themes from `themeStore.ts` into the Shadow DOM.
- [ ] **Settings Integration:** Update the Project Widget Settings dialog to allow selection of any available theme from a dropdown.

## Nice-To-Haves

- [ ] Live theme preview in the settings dialog that reflects the actual CSS variables of the selected theme.

## Phases

<must-have>

### Phase 1: Dashboard Optimistic UI & Visual Cleanup

**Status**: ✅ Complete
**Objective**: Implement sending/failed states in the dashboard and standardize bubble styles to prepare for unified theming.

**Key Deliverables**:
- Optimistic UI in `MessagePane.tsx` (sending/failed icons).
- Standardized bubble styles (rounded-lg, padding) in Dashboard to match target Widget look.
- Refactored `MessagePane.tsx` to handle `MessageStatus.SENDING` correctly.

### Phase 2: Theme Expansion & Widget Integration

**Status**: ✅ Complete
**Objective**: Enable all dashboard themes in the widget and update the token generation pipeline.

**Key Deliverables**:
- Updated `WidgetTheme` enum with all dashboard themes.
- Updated `tokens.ts` and CSS generation script to map all themes to Widget variables.
- Updated Widget `Message.tsx` to use new theme tokens (primary/muted) instead of hardcoded colors.
- Backward compatibility for existing primary colors (defaulting to theme).

### Phase 3: Configuration & Final Unification

**Status**: ✅ Complete
**Objective**: Expose new themes in settings, remove legacy color picker, and enforce visual parity.

**Key Deliverables**:
- Updated `ProjectWidgetSettingsDialog` with full theme dropdown.
- Removed "Primary Color" picker from UI and DTO validation.
- Validated visual parity between Dashboard and Widget for all themes.
- i18n updates for new theme names.

</must-have>

<nice-to-have>

### Phase 4 (optional): Live Preview

**Status**: ✅ Complete
**Objective**: Add live visual feedback when selecting themes in settings.

**Key Deliverables**:
- Live preview component in `ProjectWidgetSettingsDialog`.
</nice-to-have>
