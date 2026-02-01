# Roadmap

**Spec:** ./.gtd/project-settings-sticky-header/SPEC.md
**Goal:** Ensure the "Save Changes" header is always visible (sticky) at the top of the General, Widget, and AI Project Settings pages.
**Created:** 2026-02-01

## Strategy

The strategy focuses on a "Fix Parent, Verify Children" approach. `position: sticky` fails if any ancestor has `overflow` set to anything other than `visible`. We will first identify and modify the layout container to support sticky positioning, then verify and refine the individual settings pages to ensure they render correctly within the updated layout.

## Must-Haves

- [ ] Fix the CSS/Layout issue preventing the existing `sticky top-0` implementation from working (likely caused by `overflow` properties on parent containers).
- [ ] The header containing the "Save" button must stick to the top of the viewport when scrolling down.
- [ ] Verify and ensure functionality on General Settings (`ProjectBasicSettingsForm`).
- [ ] Verify and ensure functionality on Widget Settings (`ProjectWidgetSettingsPage`).
- [ ] Verify and ensure functionality on AI Settings (`AiResponderSettingsForm`).

## Nice-To-Haves

- [ ] Consistent shadow or border effect when stuck (visual feedback).

## Phases

<must-have>

### Phase 1: Core Layout Correction

**Status**: ✅ Complete
**Objective**: Identify and modify the ancestor layout components (`SettingsLayout` or `ProjectSettingsLayout`) to remove conflicting `overflow` properties, enabling `position: sticky` to function for child pages.

### Phase 2: Page Verification & Refinement

**Status**: ✅ Complete
**Objective**: Verify the sticky behavior on all three target pages (General, Widget, AI), ensuring the header sits correctly (margins, z-index) and visually indicates its sticky state.

</must-have>
