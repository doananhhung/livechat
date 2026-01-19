# DECISIONS.md

## Phase 1 Decisions

**Date:** 2026-01-19

### Scope

- Widget theme is already centralized via backend `project.widgetSettings.theme`.
- Dashboard theme is stored separately in `localStorage('theme')`.
- **Gap:** Dashboard and Widget themes are independent systems.

### Approach

- Chose **Option C: Safest approach** — Widget continues using backend config.
- Sync mechanism: Dashboard will persist theme to `widgetSettings` on every toggle.

### Findings

- `IWidgetSettingsDto.theme` already exists in `@live-chat/shared-types`.
- Widget reads theme from `config.theme` and applies `theme-${theme}` CSS class.
- Dashboard theme store uses `localStorage('theme')` and applies `.dark`/`.light` classes.
