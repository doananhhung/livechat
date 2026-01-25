# Roadmap

**Spec:** ./.gtd/sticky-save-button/SPEC.md
**Goal:** Improve usability of Project Settings forms by making the "Save" button sticky.
**Created:** 2026-01-26

## Must-Haves

- [ ] Sticky Positioning (bottom of viewport)
- [ ] Natural Docking (bottom of form)
- [ ] Section Scope (constrained to section)
- [ ] Unified Application (Basic, Widget, AI)
- [ ] Visual Consistency (background/border)

## Nice-To-Haves

- [ ] Transition animation

## Phases

### Phase 1: Foundation & Component Logic

**Status**: ✅ Complete
**Objective**: Create the reusable `StickyFooter` component and resolve CSS constraints within the accordion layout.

**Criteria**:

- [ ] Create `StickyFooter` component in `packages/frontend/src/components/ui/StickyFooter.tsx`.
- [ ] Implement `position: sticky` logic with `bottom-0` and `z-index`.
- [ ] Address Accordion `overflow: hidden` constraint to ensure sticky works.
- [ ] Implement conditional styling (border/background/shadow) when sticky vs docked.
- [ ] Verify behavior in a standalone or test environment.

### Phase 2: Application Integration

**Status**: ✅ Complete
**Objective**: Apply the `StickyFooter` to all target Project Settings forms.

**Criteria**:

- [ ] Integrate into `ProjectBasicSettingsForm`.
- [ ] Integrate into `WidgetSettings` section of `ProjectSettingsPage`.
- [ ] Integrate into `AiResponderSettingsForm`.
- [ ] Verify "Section Scope" ensures buttons don't bleed between accordion sections.

### Phase 3: Polish & Animation (Optional)

**Status**: ✅ Complete
**Objective**: Add visual polish and smooth transitions.

**Criteria**:

- [ ] Add `transition-all` for smooth entry/exit of sticky state (if using IntersectionObserver).
- [ ] Ensure dark/light mode visual consistency.
