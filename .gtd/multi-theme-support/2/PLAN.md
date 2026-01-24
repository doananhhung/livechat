---
phase: 2
created: 2026-01-24
---

# Plan: Phase 2 - Theme Palette Definition

## Objective

Define the color palettes for all 10 new themes in `index.css` using CSS variables. This ensures each theme has its unique visual identity while maintaining compatibility with Tailwind functional classes.

## Context

- ./.gtd/multi-theme-support/SPEC.md
- ./.gtd/multi-theme-support/ROADMAP.md
- packages/frontend/src/index.css

## Architecture Constraints

- **Single Source:** `index.css` contains all theme variable definitions.
- **Invariants:** Every theme class (e.g., `.theme-oled-void`) must define the full set of variables used by Tailwind (background, foreground, card, primary, secondary, muted, accent, destructive, border, input, ring).
- **Consistency:** Use HSL values (channel-separated like `0 0% 100%`) for standard variables to allow opacity modifiers.

## Tasks

<task id="1" type="auto">
  <name>Define Theme CSS Variables</name>
  <files>
    - [MODIFY] packages/frontend/src/index.css
  </files>
  <action>
    - Add 11 new CSS class selectors to the `@layer base` block: `.theme-oled-void`, `.theme-paperback`, `.theme-nordic-frost`, `.theme-cyberpunk`, `.theme-terminal`, `.theme-matcha`, `.theme-dracula`, `.theme-lavender-mist`, `.theme-high-contrast`, `.theme-solarized-light`, `.theme-solarized-dark`.
    - Define all 11+ variables for each theme based on the SPEC descriptions.
    - Ensure OLED Void uses pure black (`0 0% 0%`).
    - Ensure Terminal uses sharp borders (radius 0).
    - Ensure High Contrast uses absolute black/white.
  </action>
  <done>
    - All 11 theme classes exist in `index.css`.
    - Each class defines the required variables.
    - CSS file remains valid and builds.
  </done>
</task>

## Success Criteria

- [ ] 10 new themes (plus solarized variants) defined in `index.css`.
- [ ] No missing variables in any theme definition.
- [ ] No syntax errors in CSS.
