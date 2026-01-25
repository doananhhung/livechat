---
phase: 4
created: 2026-01-25
---

# Plan: Phase 4 - Polish

## Objective

Improve user experience by adding case reordering capabilities to the Switch Node configuration.

## Context

- ./.gtd/switch-node/ROADMAP.md
- packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx

## Architecture Constraints

- **No New Dependencies:** Implement reordering using standard React state buttons (Up/Down) instead of a heavy DnD library.
- **Robustness:** Ensure bounds checking (can't move first up, can't move last down).
- **Simplicity:** Use Lucide icons for UI.

## Tasks

<task id="1" type="auto">
  <name>Implement case reordering in NodeConfigPanel</name>
  <files>packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx</files>
  <action>
    1. Import `ArrowUp` and `ArrowDown` icons from `lucide-react`.
    2. Add utility function `moveCase(index: number, direction: 'up' | 'down')`:
       - Create copy of cases array
       - Swap element with neighbor
       - call `handleChange`
    3. Update the cases mapping rendering:
       - Add buttons next to the Delete button
       - Disable "Up" for index 0
       - Disable "Down" for last index
  </action>
  <done>
    - Up/Down buttons appear for each case
    - Clicking buttons swaps items correctly
    - Buttons disabled at array boundaries
    - Frontend compiles
  </done>
</task>

## Success Criteria

- [ ] Users can reorder switch cases using UI controls
- [ ] No new npm dependencies introduced
- [ ] Frontend compiles without errors
