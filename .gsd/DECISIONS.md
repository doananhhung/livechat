# DECISIONS.md

## Phase 1 Decisions

**Date:** 2026-01-19

### Scope

- **NOT about syncing theme selection** — widget theme still comes from backend.
- **About CSS value parity** — when mode is "dark", widget and dashboard show identical colors.

### Approach

- Create shared tokens file (`theme/tokens.ts`).
- Generate CSS variables for both dashboard (`:root`, `.dark`) and widget (`:host`, `.theme-dark`).
- Both consume same color values.

### Findings

- Dashboard: `index.css` uses HSL CSS variables.
- Widget: `widget.css` uses hardcoded hex values.
- These are visually different — needs alignment.
