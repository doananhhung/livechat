# ROADMAP.md

> **Current Milestone**: v1.2 - Theme Unification
> **Goal**: Widget and Dashboard use identical CSS color tokens for light/dark modes.

## Must-Haves

- [x] Shared theme tokens file
- [x] Widget components refactored to use CSS variables (not inline styles)
- [x] Dashboard CSS values documented and aligned
- [ ] Visual parity verified

## Phases

### Phase 1: Define Shared Tokens & Widget CSS Variables

**Status**: ✅ Complete
**Objective**: Created tokens.ts, CSS generator, refactored all widget components.

### Phase 2: Align Dashboard CSS

**Status**: ✅ Complete
**Objective**: Documented color mapping between tokens.ts (hex) and index.css (HSL). Verified visual equivalence.

### Phase 3: Verification

**Status**: ⬜ Not Started
**Objective**: Verify visual parity between dashboard and widget in both modes.
