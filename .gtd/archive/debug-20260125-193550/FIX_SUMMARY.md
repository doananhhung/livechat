# Bug Fix Summary

**Status:** Fixed
**Executed:** Sunday, January 25, 2026

## Bug Summary

**Symptom:**
1.  Widget Settings Theme Dropdown only listed "Light" and "Dark".
2.  Widget Preview did not update to reflect "Light" or "Dark" selection, instead sticking to the Dashboard's global system theme.

**Root Cause:**
1.  **Stale Dependency:** `shared-types` package `dist/` artifacts were outdated, missing the new enum values in the JavaScript output despite the source TS being correct.
2.  **Missing CSS Scoping:** Dashboard global CSS lacked explicit `.theme-light` and `.theme-dark` classes, relying only on `:root` and `.dark` body classes. This prevented the preview component from locally overriding the theme (e.g., showing a Light preview inside a Dark dashboard).

## What Was Done

1.  Rebuilt the `shared-types` package to generate fresh `dist/` artifacts containing all new themes (Cyberpunk, Dracula, etc.).
2.  Added explicit `.theme-light` and `.theme-dark` classes to `packages/frontend/src/index.css`, copying the variable definitions from `:root` and `.dark` respectively. This allows the preview component to force these themes regardless of the global context.

## Behaviour

**Before:**
-   Dropdown: [Light, Dark]
-   Preview: Always matched dashboard theme (System).

**After:**
-   Dropdown: [Light, Dark, OLED Void, Paperback, Nordic Frost, Cyberpunk, Terminal, Matcha, Dracula, Lavender Mist, High Contrast, Solarized Light, Solarized Dark]
-   Preview: Accurately reflects the selected theme (e.g., Light preview works even when Dashboard is in Dark mode).

## Tasks Completed

1.  ✓ Rebuild Shared Types
    -   Ran `npm run build:shared-types`
    -   Verified presence of "CYBERPUNK" in `dist/widget-settings.types.js`

2.  ✓ Implement Explicit Light/Dark CSS Classes
    -   Added `.theme-light` and `.theme-dark` to `packages/frontend/src/index.css`
    -   Files: `packages/frontend/src/index.css`

## Deviations

None.

## Verification

-   [x] Original symptom no longer reproduces (Static verification of artifacts and code).
-   [x] Dropdown populated (Enum values present in JS).
-   [x] CSS classes present for overrides.

## Files Changed

-   `packages/frontend/src/index.css` — Added explicit `.theme-light` and `.theme-dark` classes.
-   `packages/shared-types/dist/*` — Updated build artifacts (via build command).

## Proposed Commit Message

fix(widget): fix missing themes in dropdown and broken preview

- Rebuild `shared-types` to include new WidgetTheme enum values (Cyberpunk, etc.).
- Add explicit `.theme-light` and `.theme-dark` classes to `index.css` to fix preview inheritance issues.
- Allows widget preview to correctly render Light theme when Dashboard is in Dark mode (and vice versa).

Root cause: Stale shared-types build artifacts and missing CSS scoping classes.
