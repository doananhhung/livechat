# Specification

**Status:** FINALIZED
**Created:** 2026-02-01

## Synopsis

The "Save Changes" button on Project Settings pages (General, Widget, AI) is currently scrolling out of view, making it difficult for users to save long forms. This task will fix the layout to ensure the header containing the save button remains sticky at the top of the viewport.

## Goal

Ensure the "Save Changes" header is always visible (sticky) at the top of the General, Widget, and AI Project Settings pages.

## Requirements

### Must Have

- [ ] The header containing the "Save" button must stick to the top of the viewport when scrolling down.
- [ ] Fix the CSS/Layout issue preventing the existing `sticky top-0` implementation from working (likely caused by `overflow` properties on parent containers).
- [ ] Verify and ensure functionality on:
    - [ ] General Settings (`ProjectBasicSettingsForm`)
    - [ ] Widget Settings (`ProjectWidgetSettingsPage`)
    - [ ] AI Settings (`AiResponderSettingsForm`)

### Nice to Have

- [ ] Consistent shadow or border effect when stuck (visual feedback).

### Won't Have

- Major redesign of the settings pages beyond the sticky behavior.

## Constraints

- Must not break the scrolling behavior of the main content area.
- Must work within the existing `ProjectSettingsLayout`.

## Open Questions

- None.
