# ROADMAP.md

> **Current Milestone**: v1.2 - Theme Unification
> **Goal**: Widget and Dashboard use identical CSS color tokens for light/dark modes.

## Must-Haves

- [x] Shared theme tokens file
- [x] Widget components refactored to use CSS variables (not inline styles)
- [ ] Dashboard uses same token values
- [ ] Visual parity verified

## Phases

### Phase 1: Define Shared Tokens & Widget CSS Variables

**Status**: ✅ Complete
**Objective**:

- Created `packages/frontend/src/theme/tokens.ts` with all color values.
- Created CSS generator script and updated build command.
- Refactored all 6 widget components to use CSS variables.

### Phase 2: Align Dashboard CSS

**Status**: ⬜ Not Started
**Objective**: Ensure `index.css` uses same values as shared tokens.

### Phase 3: Verification

**Status**: ⬜ Not Started
**Objective**: Verify visual parity between dashboard and widget in both modes.
