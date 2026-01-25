---
phase: 3
created: 2026-01-25
---

# Plan: Phase 3 - Configuration & Final Unification

## Objective

Expose all 14 dashboard themes in the project settings UI, remove the deprecated primary color picker, and finalize the unified visual experience.

## Context

- ./.gtd/unified-theme-optimistic-ui/SPEC.md
- ./.gtd/unified-theme-optimistic-ui/ROADMAP.md
- ./.gtd/unified-theme-optimistic-ui/3/RESEARCH.md
- `packages/shared-types/src/widget-settings.types.ts`
- `packages/shared-dtos/src/widget-settings.dto.ts`
- `packages/frontend/src/components/features/inbox/ProjectWidgetSettingsDialog.tsx`
- `packages/frontend/src/pages/settings/ProjectSettingsPage.tsx`

## Architecture Constraints

- **Single Source:** Use `WidgetTheme` enum as the authoritative list of supported themes.
- **Invariants:** The widget primary color MUST be derived from the active theme.
- **Resilience:** Gracefully handle legacy projects that might still have `primaryColor` in their database record (it will be ignored by the UI/DTO).
- **Testability:** Verify all 14 themes render correctly in the dropdown with translated names.

## Tasks

<task id="1" type="auto">
  <name>Remove Deprecated Primary Color</name>
  <files>
    - packages/shared-types/src/widget-settings.types.ts
    - packages/shared-dtos/src/widget-settings.dto.ts
  </files>
  <action>
    1. Remove `primaryColor` property from `IWidgetSettingsDto` interface.
    2. Remove `primaryColor` property and its decorators (`@IsHexColor`, `@ValidateIf`, etc.) from `WidgetSettingsDto` class.
    3. Update `WidgetSettingsDto` documentation/Swagger properties to reflect the removal.
  </action>
  <done>
    - `primaryColor` is no longer part of the project settings data model.
  </done>
</task>

<task id="2" type="auto">
  <name>Expand Theme Settings UI</name>
  <files>
    - packages/frontend/src/components/features/inbox/ProjectWidgetSettingsDialog.tsx
    - packages/frontend/src/pages/settings/ProjectSettingsPage.tsx
  </files>
  <action>
    1. Update both files to remove all `primaryColor` state, input fields, and logic.
    2. Implement a dynamic theme selection list using `Object.values(WidgetTheme)`.
    3. Create a helper to map `WidgetTheme` values to their i18n keys (e.g., `oled-void` -> `settings.themeOledVoid`).
    4. Ensure the dropdown displays the translated theme names.
  </action>
  <done>
    - No color picker is visible in settings.
    - All 14 themes are available in the dropdown.
    - Theme names are correctly translated.
  </done>
</task>

## Success Criteria

- [ ] Project Settings (both page and dialog) allow selecting all dashboard themes.
- [ ] Primary Color picker is removed from the codebase.
- [ ] Widget inherits theme colors perfectly without override options.
