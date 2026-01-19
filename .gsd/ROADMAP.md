# ROADMAP.md

> **Current Milestone**: v1.2 - Theme Unification
> **Goal**: Widget and Dashboard use identical CSS color tokens for light/dark modes.

## Must-Haves

- [ ] Single source of truth for theme tokens
- [ ] Dashboard CSS uses shared tokens
- [ ] Widget CSS uses shared tokens
- [ ] Visual parity verified

## Phases

### Phase 1: Extract Shared Theme Tokens

**Status**: ⬜ Not Started
**Objective**: Create `packages/frontend/src/theme/tokens.ts` with all color values. Generate CSS variables from it.

### Phase 2: Refactor Dashboard CSS

**Status**: ⬜ Not Started
**Objective**: Update `index.css` to use generated tokens.

### Phase 3: Refactor Widget CSS

**Status**: ⬜ Not Started
**Objective**: Update `widget.css` to use same tokens (injected into `:host`).

### Phase 4: Verification

**Status**: ⬜ Not Started
**Objective**: Verify visual parity between dashboard and widget in both modes.
