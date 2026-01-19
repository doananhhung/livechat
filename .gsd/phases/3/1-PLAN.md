---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Visual Parity Verification

## Objective

Verify that the widget and dashboard display visually consistent colors in both light and dark modes. This is a checkpoint plan requiring human verification.

## Context

- `packages/frontend/src/theme/tokens.ts` — Source of truth
- `packages/frontend/src/theme/README.md` — Color mapping
- `packages/frontend/src/index.css` — Dashboard theme
- `packages/frontend/src/widget/styles/_generated-vars.css` — Widget theme

## Tasks

<task type="auto">
  <name>Ensure widget build is up to date</name>
  <files>packages/frontend/dist/app/</files>
  <action>
    Run widget build to ensure CSS is generated from latest tokens.
  </action>
  <verify>npm run build:widget --prefix packages/frontend 2>&1 | grep -q "built in" && echo "Build success"</verify>
  <done>Widget build completes without errors</done>
</task>

<task type="checkpoint:human-verify">
  <name>Visual verification of theme parity</name>
  <files>N/A</files>
  <action>
    Ask user to manually verify visual parity using the running dev servers:
    
    **Dashboard (http://localhost:5173):**
    1. Open dashboard in browser
    2. Toggle between light and dark mode using theme button
    3. Note the background, text, and card colors
    
    **Widget (test page):**
    1. Open http://localhost:5173/test.html or embed widget on a test page
    2. Widget should automatically match its configured theme
    3. For theme switching, the widget theme is controlled by backend `widgetSettings.theme`
    
    **What to verify:**
    - Background colors look consistent between dashboard and widget
    - Text colors are readable in both modes
    - Card/container colors feel visually cohesive
    - No jarring color differences when switching modes
    
    **Note:** Colors don't need to be pixel-perfect identical — they should just feel like part of the same design system.
  </action>
  <verify>User confirms visual parity is acceptable</verify>
  <done>User approves theme consistency between dashboard and widget</done>
</task>

## Success Criteria

- [ ] Widget build succeeds
- [ ] User confirms visual parity in light mode
- [ ] User confirms visual parity in dark mode
