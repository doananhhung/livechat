# Specification

**Status:** FINALIZED
**Created:** 2026-01-26

## Goal

Improve the usability of Project Settings forms by ensuring the "Save" action is always visible and accessible, particularly on long forms where the bottom of the content may be off-screen.

## Requirements

### Must Have

- [ ] **Sticky Positioning:** The "Save" button (and its container) must stick to the bottom of the viewport when scrolling through a form that exceeds the viewport height.
- [ ] **Natural Docking:** The button must unstick and sit in its natural position at the end of the form when the user scrolls to the bottom of the form section.
- [ ] **Section Scope:** The sticky behavior must be constrained to the active form section. If the user scrolls past the form (up or down outside the section), the button scrolls away with the content.
- [ ] **Unified Application:** Apply this behavior to:
  - Basic Settings Form
  - Widget Settings Form (Inline in `ProjectSettingsPage`)
  - AI Responder Settings Form
- [ ] **Visual Consistency:** The sticky container should probably have a background/border to separate it from the content behind it when in sticky mode (e.g., slight blur or solid background).

### Nice to Have

- [ ] Transition animation when snapping in/out of sticky state.

### Won't Have

- Floating Action Button (FAB) style (it remains a block-level bar).

## Constraints

- **Layout Structure:** Must work within the existing `ProjectSettingsPage` accordion layout.
- **CSS Limitations:** `position: sticky` behavior may be affected by `overflow: hidden` on parent containers (currently present on accordion cards). May need refactoring of the accordion expansion logic or CSS to enable sticky behavior.

## Open Questions

- None.
