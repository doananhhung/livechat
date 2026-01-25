# Research: Phase 3 - Configuration & Final Unification

**Created:** 2026-01-25

## Findings

### 1. Theme Configuration in UI
- Both `ProjectWidgetSettingsDialog.tsx` and `ProjectSettingsPage.tsx` have hardcoded theme selections (Light/Dark).
- Both have a `Primary Color` picker that needs to be removed.
- Theme labels are already present in i18n files (`settings.themeOledVoid`, etc.).

### 2. DTO and Type System
- `IWidgetSettingsDto` (shared-types) and `WidgetSettingsDto` (shared-dtos) still contain `primaryColor`.
- Removing this property ensures that the backend and frontend are strictly driven by the theme's primary color, preventing visual drift.

### 3. Localization
- `en.json` and `vi.json` already have keys for all 14 dashboard themes in the `settings` namespace.
- I will map the `WidgetTheme` enum values to these keys (e.g., `oled-void` -> `themeOledVoid`).

### 4. Implementation Strategy
- Use `Object.values(WidgetTheme)` to dynamically generate the theme dropdown options.
- Create a helper function `getThemeLabelKey(theme: string)` to map enum values to i18n keys.
- Strip all `primaryColor` logic from the forms and DTOs.
