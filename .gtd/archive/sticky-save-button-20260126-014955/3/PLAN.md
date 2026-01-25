---
phase: 3
created: 2026-01-26
---

# Plan: Phase 3 - Polish & Animation

## Objective

Enhance the `StickyFooter` component with visual polish. Specifically, implement state detection to apply a shadow or distinct border _only_ when the footer is actively "sticking" to the viewport, and blend in seamlessly when it is docked at the bottom of the container.

## Context

- `packages/frontend/src/components/ui/StickyFooter.tsx` (Target)
- `packages/frontend/src/components/ui/StickyFooter.test.tsx` (Update)

## Architecture Constraints

- **Dependency:** `react-intersection-observer` (already in package.json) is the preferred way to handle specific intersection logic, but a raw `IntersectionObserver` or a sentinel element strategy is needed for "sticky" detection.
- **Sentinel Strategy:** For `bottom: 0` sticky:
  - Place a 1px sentinel pixel _after_ the sticky footer.
  - If sentinel is NOT visible (scrolled out of view below), the footer is likely stuck (floating).
  - If sentinel IS visible, the footer is docked at the bottom.
- **Styling:** Use `shadow-lg` or `border-t` transitions.

## Tasks

<task id="1" type="auto">
  <name>Implement Sticky State Detection in StickyFooter</name>
  <files>packages/frontend/src/components/ui/StickyFooter.tsx</files>
  <action>
    - Update `StickyFooter` to maintain an `isStuck` state.
    - Insert a 1px sentinel `div` immediately *after* the sticky element (outside the sticky div but inside the parent flow, or logically placed).
    - *Correction:* `position: sticky` elements are within the flow. To detect if it's "pinned" to the bottom, we usually check if the scroll position is not at the bottom.
    - simpler approach: Add a "sentinel" div *at the bottom of the parent container*. But `StickyFooter` is used inside the form.
    - Let's use the standard "sentinel after" approach.
    - Render `<div ref={sentinelRef} />` immediately after the sticky div.
    - Use `IntersectionObserver` to track sentinel.
    - If sentinel is interacting with viewport (ratio > 0), `isStuck = false`.
    - If sentinel is not interacting (off-screen below), `isStuck = true`.
    - Apply `shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]` or similar when `isStuck`.
    - Ensure smooth transition (`transition-all duration-200`).
  </action>
  <done>StickyFooter toggles classes based on scroll position.</done>
</task>

<task id="2" type="auto">
  <name>Update StickyFooter Tests</name>
  <files>packages/frontend/src/components/ui/StickyFooter.test.tsx</files>
  <action>
    - Update tests to render the component.
    - Since IntersectionObserver is hard to test in JSDOM without mocks, we will Mock `IntersectionObserver`.
    - Verify that the sentinel element is rendered.
    - Verify `className` changes (logic verification might be limited in JSDOM, focus on structure).
  </action>
  <done>Tests pass with new structure.</done>
</task>

## Success Criteria

- [ ] `StickyFooter` applies visual separation (shadow/border) ONLY when floating.
- [ ] Transition is smooth.
- [ ] Tests pass.
