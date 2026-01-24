---
phase: 4
created: 2026-01-24
---

# Plan: Phase 4 (optional) - Polish & Refinement

## Objective

Enhance the theme experience with smooth color transitions when switching themes and theme-specific scrollbar styling for a more polished feel.

## Context

- ./.gtd/multi-theme-support/SPEC.md
- ./.gtd/multi-theme-support/ROADMAP.md
- packages/frontend/src/index.css

## Architecture Constraints

- **Single Source:** All styling in `index.css`.
- **Invariants:** Transitions must not cause layout thrashing or affect performance.
- **Resilience:** If transitions fail, colors still change correctly (graceful degradation).

## Tasks

<task id="1" type="auto">
  <name>Add smooth theme transitions</name>
  <files>
    - [MODIFY] packages/frontend/src/index.css
  </files>
  <action>
    1. Add a CSS transition rule for `background-color`, `color`, and `border-color` on body and common elements.
    2. Use a short duration (150-200ms) to avoid sluggish feel.
    3. Apply to `:root`, `body`, and common semantic classes.
  </action>
  <done>
    - Theme switching has a visible smooth color transition.
    - No layout shift or jank during transitions.
  </done>
</task>

<task id="2" type="auto">
  <name>Add theme-specific scrollbar styling</name>
  <files>
    - [MODIFY] packages/frontend/src/index.css
  </files>
  <action>
    1. For each theme class, override scrollbar colors to match the theme's palette.
    2. Use the theme's `--muted` or `--border` variables for track/thumb.
    3. Keep existing `.dark` scrollbar overrides as fallback.
  </action>
  <done>
    - Scrollbars match the active theme's color scheme.
    - CSS file remains valid.
  </done>
</task>

## Success Criteria

- [ ] Smooth color transitions visible when switching themes.
- [ ] Scrollbars match each theme's visual identity.
- [ ] No performance issues or layout thrashing.
