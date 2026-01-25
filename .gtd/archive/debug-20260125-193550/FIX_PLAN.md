---
created: Sunday, January 25, 2026
root_cause: Stale shared-types build and missing explicit .theme-light/.theme-dark CSS classes.
---

# Fix Plan

## Objective

Fix the Widget Settings Theme Dropdown and Preview by:
1.  Ensuring `shared-types` build artifacts are up-to-date with new themes.
2.  Adding explicit CSS classes for Light/Dark themes to allow localized overriding in previews.

## Context

-   `./.gtd/debug/current/ROOT_CAUSE.md`
-   `packages/shared-types/package.json`
-   `packages/frontend/src/index.css`

## Architecture Constraints

-   **Single Source:** CSS Variables must remain the source of truth for theming.
-   **Scoping:** Themes must be applicable to specific subtrees (e.g., preview component) without affecting the global document.
-   **Build Integrity:** The monorepo dependency graph must be respected; `frontend` cannot run correctly if `shared-types` is stale.

## Tasks

<task id="1" type="auto">
  <name>Rebuild Shared Types</name>
  <files>packages/shared-types</files>
  <action>
    - Execute `npm run build:shared-types` to ensure the `dist/` folder contains the latest enum values (CYBERPUNK, etc.).
    - Note: This was manually done during debugging but should be formalized as part of the fix to ensure state consistency.
  </action>
  <done>
    - `grep "CYBERPUNK" packages/shared-types/dist/widget-settings.types.js` returns a match.
  </done>
</task>

<task id="2" type="auto">
  <name>Implement Explicit Light/Dark CSS Classes</name>
  <files>packages/frontend/src/index.css</files>
  <action>
    - Add `.theme-light` class that explicitly sets CSS variables using the same values as `:root`.
    - Add `.theme-dark` class that explicitly sets CSS variables using the same values as `.dark`.
    - Ensure these are defined alongside other themes (e.g., `.theme-cyberpunk`) to allow the `WidgetThemePreview` component to override the global theme context.
    - **Crucial:** Duplicate the variable definitions rather than using `@apply` if `@apply` behaves unexpectedly with CSS variables in this specific Tailwind setup, OR use `@layer utilities` if appropriate. The safest path is explicit re-declaration or extraction of variables to a shared place, but for this fix, explicit definition in `.theme-*` classes is the most atomic and robust approach.
  </action>
  <done>
    - `grep ".theme-light" packages/frontend/src/index.css` returns a match.
    - `grep ".theme-dark" packages/frontend/src/index.css` returns a match.
  </done>
</task>

## Success Criteria

-   [ ] Dropdown lists all 13+ themes.
-   [ ] Selecting "Light" in the dropdown while Dashboard is "Dark" shows a Light preview (white background).
-   [ ] Selecting "Dark" in the dropdown while Dashboard is "Light" shows a Dark preview (dark background).

## Rollback Plan

-   Revert changes to `packages/frontend/src/index.css`.
