---
phase: 2
created: 2026-01-26
---

# Plan: Phase 2 - Application Integration

## Objective

Apply the `StickyFooter` component to the three main forms in Project Settings (Basic, Widget, AI Responder) to ensure the "Save" button remains accessible while scrolling, respecting the section scope managed by the accordion layout.

## Context

- `packages/frontend/src/components/ui/StickyFooter.tsx` (Component)
- `packages/frontend/src/components/features/projects/ProjectBasicSettingsForm.tsx` (Target)
- `packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx` (Target)
- `packages/frontend/src/pages/settings/ProjectSettingsPage.tsx` (Target - Widget Form)

## Architecture Constraints

- **Sticky Scope:** The `StickyFooter` relies on its parent container (the `<form>` or section div) having `position: relative` (default block behavior) and the accordion wrapper having `overflow: visible` (when expanded).
- **Z-Index:** Defined in `StickyFooter` as `z-10`.
- **Styling:** `StickyFooter` includes `border-t` and `bg-card`. We must replace the existing static footer containers (often `div` with `border-t`) to avoid visual duplication.

## Tasks

<task id="1" type="auto">
  <name>Integrate StickyFooter in Basic Settings</name>
  <files>packages/frontend/src/components/features/projects/ProjectBasicSettingsForm.tsx</files>
  <action>
    - Import `StickyFooter` from `../../ui/StickyFooter`.
    - Locate the submit button container: `<div className="flex justify-end pt-4 border-t">`.
    - Replace the container with `<StickyFooter className="flex justify-end">`.
    - Ensure the `Button` remains inside.
  </action>
  <done>Basic Settings form uses StickyFooter.</done>
</task>

<task id="2" type="auto">
  <name>Integrate StickyFooter in AI Responder</name>
  <files>packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx</files>
  <action>
    - Import `StickyFooter` from `../../../ui/StickyFooter`.
    - Locate the submit button container: `<div className="flex justify-end pt-4 border-t">`.
    - Replace the container with `<StickyFooter className="flex justify-end">`.
    - Ensure the `Button` remains inside.
  </action>
  <done>AI Responder form uses StickyFooter.</done>
</task>

<task id="3" type="auto">
  <name>Integrate StickyFooter in Widget Settings</name>
  <files>packages/frontend/src/pages/settings/ProjectSettingsPage.tsx</files>
  <action>
    - Import `StickyFooter` from `../../components/ui/StickyFooter`.
    - Locate the widget form submit button container: `<div className="flex justify-end pt-4 border-t mt-6">`.
    - Replace the container with `<StickyFooter className="flex justify-end mt-6">`. Note: `border-t` is in StickyFooter, so we remove it from here. `mt-6` keeps spacing from content.
    - Ensure the `Button` remains inside.
  </action>
  <done>Widget Settings form uses StickyFooter.</done>
</task>

## Success Criteria

- [ ] All 3 forms use `StickyFooter`.
- [ ] Buttons stick to the bottom of the viewport when content overflows.
- [ ] Buttons scroll away when their respective section is scrolled out of view.
