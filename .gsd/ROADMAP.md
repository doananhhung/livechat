# ROADMAP.md

> **Current Milestone**: v1.2 - Theme Unification
> **Goal**: Centralize theme management so widget inherits dashboard theme (light/dark) automatically without duplication.

## Must-Haves

- [ ] Dashboard theme change syncs to `widgetSettings.theme` via API
- [ ] Widget continues using backend config (already works)
- [ ] Light/Dark mode parity verified

## Phases

### Phase 1: Dashboard Theme Sync

**Status**: ⬜ Not Started
**Objective**: When dashboard theme toggles, persist the new theme to `widgetSettings.theme` via API call.

### Phase 2: CSS Variable Alignment

**Status**: ⬜ Not Started
**Objective**: Ensure widget CSS variables produce same visual result as dashboard for light/dark modes.

### Phase 3: Verification

**Status**: ⬜ Not Started
**Objective**: Verify visual parity and theme switching capability.
