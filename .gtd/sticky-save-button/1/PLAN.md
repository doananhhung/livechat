---
phase: 1
created: 2026-01-26
---

# Plan: Phase 1 - Foundation & Component Logic

## Objective

Establish the technical foundation for the sticky save button by creating the `StickyFooter` component and resolving layout constraints (specifically `overflow: hidden`) in the Project Settings page to enable sticky positioning relative to the viewport.

## Context

- `packages/frontend/src/components/ui/StickyFooter.tsx` (New)
- `packages/frontend/src/pages/settings/ProjectSettingsPage.tsx` (Modify)
- `packages/frontend/src/components/ui/StickyFooter.test.tsx` (New)

## Architecture Constraints

- **CSS Stacking Context:** `position: sticky` requires that no ancestor has `overflow: hidden` (or `auto`/`scroll` unless intentional) that would trap the sticky element within a small scroll box. We must remove `overflow: hidden` from the Accordion wrappers when expanded.
- **Visual Consistency:** The footer should mimic the design of the existing card (`bg-card`, border-t) and handle negative margins to bleed to the edges if inside a padded container.

## Tasks

<task id="1" type="auto">
  <name>Create StickyFooter Component</name>
  <files>packages/frontend/src/components/ui/StickyFooter.tsx</files>
  <action>
    Create a functional component `StickyFooter` that:
    - Accepts `children`, `className`.
    - Uses `position: sticky` and `bottom-0`.
    - Includes default styling: `z-10`, `bg-card`, `border-t` (optional via prop/class), and backdrop blur if desired.
    - Exports the component.
  </action>
  <done>Component exists and exports correct semantics.</done>
</task>

<task id="2" type="auto">
  <name>Create StickyFooter Test</name>
  <files>packages/frontend/src/components/ui/StickyFooter.test.tsx</files>
  <action>
    Create a unit test for `StickyFooter`:
    - Render the component.
    - Verify it renders children.
    - Verify it applies the `sticky` class.
  </action>
  <done>Tests pass.</done>
</task>

<task id="3" type="auto">
  <name>Refactor ProjectSettingsPage Accordion</name>
  <files>packages/frontend/src/pages/settings/ProjectSettingsPage.tsx</files>
  <action>
    Modify `ProjectSettingsPage` to conditionally apply `overflow-hidden`.
    - Current: `<div className="bg-card border rounded-lg overflow-hidden">`
    - Change to: Remove `overflow-hidden` when the section is expanded, OR only apply `overflow-hidden` to the collapsed state/header if needed.
    - Recommended: Apply `overflow-hidden` only when `!expandedState`. When expanded, we need `overflow: visible` (default) for sticky to work relative to viewport.
    - Apply this pattern to all 3 accordion sections (basic, widget, ai).
  </action>
  <done>Accordion containers have conditional overflow classes.</done>
</task>

## Success Criteria

- [ ] `StickyFooter` component is created.
- [ ] `StickyFooter` basic unit tests pass.
- [ ] `ProjectSettingsPage` accordion logic is updated to support sticky children.
