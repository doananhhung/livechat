---
phase: 1
created: 2026-01-24
---

# Plan: Phase 1 - Store & Infrastructure

## Objective

Prepare the frontend infrastructure for multi-theme support by updating the `Theme` type, refactoring the application logic to handle custom classes, and adding internationalization strings for all 10 new themes.

## Context

- ./.gtd/multi-theme-support/SPEC.md
- ./.gtd/multi-theme-support/ROADMAP.md
- packages/frontend/src/stores/themeStore.ts
- packages/frontend/src/i18n/locales/en.json
- packages/frontend/src/i18n/locales/vi.json

## Architecture Constraints

- **Single Source:** `themeStore.ts` is the authoritative source for the active theme string.
- **Invariants:** Every theme must be mapped to either a "light" or "dark" base for Tailwind `dark:` utility compatibility.
- **Resilience:** If a theme class is missing in CSS, the app should fallback gracefully (handled by `.light` base).
- **Testability:** Type safety ensures all 13 possible themes are handled in the selection logic.

## Tasks

<task id="1" type="auto">
  <name>Update Theme Store and Application Logic</name>
  <files>
    - [MODIFY] packages/frontend/src/stores/themeStore.ts
  </files>
  <action>
    1. Update the `Theme` type to include: `light`, `dark`, `system`, `oled-void`, `paperback`, `nordic-frost`, `cyberpunk`, `terminal`, `matcha`, `dracula`, `lavender-mist`, `high-contrast`, `solarized-light`, `solarized-dark`.
    2. Refactor `applyTheme` to:
       - Maintain a list of all theme classes.
       - Remove all theme classes from `documentElement` before applying the new one.
       - Map all themes to either a 'light' or 'dark' base class to ensure Tailwind's `dark:` modifier works correctly with custom themes.
       - Add the specific theme class (e.g., `theme-oled-void`).
  </action>
  <done>
    - `Theme` type contains 14 values.
    - `applyTheme` correctly handles all 14 values.
    - TypeScript compiles without errors in `themeStore.ts`.
  </done>
</task>

<task id="2" type="auto">
  <name>Add i18n keys for all themes</name>
  <files>
    - [MODIFY] packages/frontend/src/i18n/locales/en.json
    - [MODIFY] packages/frontend/src/i18n/locales/vi.json
  </files>
  <action>
    1. Add translation keys `themeOledVoid`, `themePaperback`, etc. under the `settings` namespace.
    2. Ensure both English and Vietnamese locales are updated.
  </action>
  <done>
    - `en.json` contains 11 new theme translations (including split solarized).
    - `vi.json` contains 11 new theme translations.
  </done>
</task>

## Success Criteria

- [ ] `Theme` type expanded and logic refactored.
- [ ] i18n keys present for all new themes.
- [ ] TypeScript compiles without errors.
