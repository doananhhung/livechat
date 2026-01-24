---
phase: 3
created: 2026-01-24
---

# Plan: Phase 3 - UI Integration

## Objective

Update the theme selection UI in `UserNav.tsx` and `ThemeToggleButton.tsx` to display all 14 theme options with proper i18n labels and active state indication.

## Context

- ./.gtd/multi-theme-support/SPEC.md
- ./.gtd/multi-theme-support/ROADMAP.md
- packages/frontend/src/components/layout/UserNav.tsx
- packages/frontend/src/components/ui/ThemeToggleButton.tsx
- packages/frontend/src/stores/themeStore.ts

## Architecture Constraints

- **Single Source:** Theme state comes from `useThemeStore()`.
- **Invariants:** Each `setTheme()` call must use a valid `Theme` value from the union type.
- **Resilience:** Invalid theme strings will be caught by TypeScript at compile time.

## Tasks

<task id="1" type="auto">
  <name>Update UserNav theme submenu</name>
  <files>
    - [MODIFY] packages/frontend/src/components/layout/UserNav.tsx
  </files>
  <action>
    1. Replace the 3 hardcoded theme options with a loop or expanded list of all 14 themes.
    2. Use appropriate icons (Sun for light themes, Moon for dark themes).
    3. Use i18n keys: `t("settings.themeOledVoid")`, etc.
    4. Ensure active theme shows checkmark indicator.
  </action>
  <done>
    - All 14 themes visible in UserNav dropdown.
    - Correct i18n labels displayed.
    - Active theme has checkmark.
    - TypeScript compiles without errors.
  </done>
</task>

<task id="2" type="auto">
  <name>Update ThemeToggleButton dropdown</name>
  <files>
    - [MODIFY] packages/frontend/src/components/ui/ThemeToggleButton.tsx
  </files>
  <action>
    1. Expand the dropdown to show all 14 theme options.
    2. Use i18n keys for labels.
    3. Optionally group themes into "Light", "Dark", and "Special" categories using separators.
  </action>
  <done>
    - All 14 themes visible in ThemeToggleButton dropdown.
    - Correct i18n labels displayed.
    - TypeScript compiles without errors.
  </done>
</task>

## Success Criteria

- [ ] All 14 themes selectable from both UI components.
- [ ] i18n labels display correctly in English and Vietnamese.
- [ ] Active theme indicated with checkmark.
- [ ] TypeScript compiles without errors.
