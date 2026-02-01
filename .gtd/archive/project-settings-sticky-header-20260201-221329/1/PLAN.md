phase: 1
created: 2026-02-01
is_tdd: false

---

# Plan: Phase 1 - Core Layout Correction

## Objective

Identify and modify the ancestor layout components (`ProjectSettingsLayout`) and page containers to remove conflicting `overflow` properties, enabling `position: sticky` to function correctly. We will also explicitly set `overflow-visible` on the Card containers to ensure sticky headers can "escape" clipping if default styles impose it.

## Verification Strategy

-   Manual verification via the "Ask" workflow or code review to ensure `overflow-auto` is removed from `main` and `overflow-visible` is applied to cards.
-   Since I cannot run the UI, I rely on code correctness for CSS standard behavior.

## Context

-   `packages/frontend/src/pages/settings/ProjectSettingsLayout.tsx`
-   `packages/frontend/src/pages/settings/ProjectGeneralSettingsPage.tsx`
-   `packages/frontend/src/pages/settings/ProjectWidgetSettingsPage.tsx`
-   `packages/frontend/src/pages/settings/ProjectAiSettingsPage.tsx`

## Architecture Constraints

-   **Scroll Container:** We rely on the `body` (window) being the scroll container for the Project Settings pages. This works with the `min-h-screen` layout.
-   **Sticky Context:** Sticky elements are constrained by their parent. For Phase 1, we accept that the sticky header in General Settings will only stick for the duration of the "Basic Settings" card.

## Tasks

<task id="1" type="auto" complexity="Low">
  <name>Stabilize Scroll Container in ProjectSettingsLayout</name>
  <risk>Removing overflow-auto might affect horizontal overflow handling, but standard responsive pages should be fine.</risk>
  <files>packages/frontend/src/pages/settings/ProjectSettingsLayout.tsx</files>
  <action>
    - Remove `overflow-auto` from the `<main>` element.
    - Add `overflow-visible` to the `<main>` element to explicitly allow sticky children to function without clipping.
    - Ensure the class string is cleaner.
  </action>
  <done>main element has `overflow-visible` and NO `overflow-auto`.</done>
</task>

<task id="2" type="auto" complexity="Low">
  <name>Enforce Overflow Visible on General Settings Card</name>
  <risk>None</risk>
  <files>packages/frontend/src/pages/settings/ProjectGeneralSettingsPage.tsx</files>
  <action>
    - Locate the `div.bg-card` wrapping `ProjectBasicSettingsForm`.
    - Append `overflow-visible` to its className.
  </action>
  <done>Card container has `overflow-visible`.</done>
</task>

<task id="3" type="auto" complexity="Low">
  <name>Enforce Overflow Visible on Widget Settings Card</name>
  <risk>None</risk>
  <files>packages/frontend/src/pages/settings/ProjectWidgetSettingsPage.tsx</files>
  <action>
    - Locate the `div.bg-card` wrapping the form.
    - Append `overflow-visible` to its className.
  </action>
  <done>Card container has `overflow-visible`.</done>
</task>

<task id="4" type="auto" complexity="Low">
  <name>Enforce Overflow Visible on AI Settings Card</name>
  <risk>None</risk>
  <files>packages/frontend/src/pages/settings/ProjectAiSettingsPage.tsx</files>
  <action>
    - Locate the `div.bg-card` wrapping `AiResponderSettingsForm`.
    - Append `overflow-visible` to its className.
  </action>
  <done>Card container has `overflow-visible`.</done>
</task>

## Success Criteria

- [ ] `ProjectSettingsLayout` main element uses `overflow-visible`.
- [ ] All 3 settings pages have `overflow-visible` on their `bg-card` containers.
