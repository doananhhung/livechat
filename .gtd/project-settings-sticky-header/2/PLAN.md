phase: 2
created: 2026-02-01
is_tdd: false

---

# Plan: Phase 2 - Page Verification & Refinement

## Objective

Verify the sticky behavior on all three target pages (General, Widget, AI) by inspecting the code structure and ensuring the sticky headers are correctly positioned with appropriate Z-indexing and margins. Since `overflow-visible` was applied in Phase 1, we now focus on visual polish: confirming the negative margins, padding, and background colors create the desired seamless "stuck" effect.

## Verification Strategy

-   **Code Inspection:** Verify that the sticky header components (`ProjectBasicSettingsForm`, `AiResponderSettingsForm`, `ProjectWidgetSettingsPage`) all share the consistent `sticky top-0 z-10 bg-card border-b` classes.
-   **Negative Margin Check:** Confirm `-mx-6 -mt-6` (negative margins) are present to pull the header to the edge of the card container.
-   **Z-Index Check:** Ensure `z-10` is sufficient to sit above form content but below global overlays (which are typically `z-50`).

## Context

-   `packages/frontend/src/components/features/projects/ProjectBasicSettingsForm.tsx` (General)
-   `packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx` (AI)
-   `packages/frontend/src/pages/settings/ProjectWidgetSettingsPage.tsx` (Widget)

## Architecture Constraints

-   **Consistent UX:** All 3 forms must behave identically. The header should look like part of the card when scrolled to top, and a floating toolbar when scrolled down.
-   **Tailwind Classes:** Stick to standard Tailwind utility classes for consistency.

## Tasks

<task id="1" type="auto" complexity="Low">
  <name>Verify & Refine General Settings Sticky Header</name>
  <risk>None</risk>
  <files>packages/frontend/src/components/features/projects/ProjectBasicSettingsForm.tsx</files>
  <action>
    - Inspect the sticky header `div`.
    - Ensure it has: `sticky top-0 z-10 bg-card border-b`.
    - Ensure it has negative margins matching the card padding: `-mx-6 -mt-6`.
    - Ensure it has internal padding: `px-6 py-4`.
    - Confirm background is `bg-card` (opaque) to hide scrolling content behind it.
  </action>
  <done>Header classes are verified correct.</done>
</task>

<task id="2" type="auto" complexity="Low">
  <name>Verify & Refine Widget Settings Sticky Header</name>
  <risk>None</risk>
  <files>packages/frontend/src/pages/settings/ProjectWidgetSettingsPage.tsx</files>
  <action>
    - Inspect the sticky header `div`.
    - Ensure it matches the pattern from Task 1 exactly.
    - Check for any conflicting styles (e.g., specific widths or differing margins).
  </action>
  <done>Header classes match the standard pattern.</done>
</task>

<task id="3" type="auto" complexity="Low">
  <name>Verify & Refine AI Settings Sticky Header</name>
  <risk>None</risk>
  <files>packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx</files>
  <action>
    - Inspect the sticky header `div`.
    - Ensure it matches the pattern from Task 1 exactly.
    - Confirm the `AiResponderSettingsForm` container doesn't introduce its own overflow context.
  </action>
  <done>Header classes match the standard pattern.</done>
</task>

## Success Criteria

- [ ] All 3 settings pages use identical sticky header class patterns.
- [ ] Headers are confirmed to use `z-10` and opaque backgrounds (`bg-card`).
