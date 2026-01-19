# ROADMAP.md

> **Current Milestone**: v1.2 - Theme Unification
> **Goal**: Widget and Dashboard use identical CSS color tokens for light/dark modes.

## Must-Haves

- [ ] Shared theme tokens file
- [ ] Widget components refactored to use CSS variables (not inline styles)
- [ ] Dashboard uses same token values
- [ ] Visual parity verified

## Phases

### Phase 1: Define Shared Tokens & Widget CSS Variables

**Status**: ⬜ Not Started
**Objective**:

- Create `packages/frontend/src/theme/tokens.ts` with all color values.
- Update `widget.css` `:host` and `.theme-dark` to use these tokens.

### Phase 2: Refactor Widget Components

**Status**: ⬜ Not Started
**Objective**: Replace all inline `theme === 'light' ? ... : ...` conditionals with CSS variable references (6 components, 26+ instances).

### Phase 3: Align Dashboard CSS

**Status**: ⬜ Not Started
**Objective**: Ensure `index.css` uses same values as shared tokens.

### Phase 4: Verification

**Status**: ⬜ Not Started
**Objective**: Verify visual parity between dashboard and widget in both modes.
