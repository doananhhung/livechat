# Root Cause

**Found:** Sunday, January 25, 2026
**Status:** CONFIRMED

## Root Cause

Two independent issues were causing the reported symptoms:

1.  **Stale Build Artifacts (Dropdown Issue):** The `shared-types` package had updated source code (including new `WidgetTheme` enum values like `CYBERPUNK`), but the `dist/` folder was outdated. The frontend was consuming the stale JavaScript files which only contained `LIGHT` and `DARK`.
2.  **Missing CSS Scoping Classes (Preview Issue):** The Dashboard's global CSS (`index.css`) relies on Tailwind's `:root` (for light) and `.dark` (for dark) selectors. It completely lacks explicit `.theme-light` and `.theme-dark` classes. The `WidgetThemePreview` component attempts to force a theme using `<div className="theme-{selectedTheme}">`, but since `.theme-light` and `.theme-dark` don't exist, the preview falls back to inheriting the global Dashboard variables (e.g., system theme).

## Verified Hypotheses

**Hypothesis 1:** Stale `shared-types` Build
**Confidence:** 95% → **Confirmed**
-   **Evidence:** `grep "CYBERPUNK" packages/shared-types/dist/widget-settings.types.js` returned nothing initially. After running `npm run build:shared-types`, the string appeared in the output.

**Hypothesis 2:** Missing Theme Override Classes
**Confidence:** 90% → **Confirmed**
-   **Evidence:** `grep -E "\.theme-light|\.theme-dark" packages/frontend/src/index.css` returned "Classes not found".

## Location

-   **Build:** `packages/shared-types/dist/`
-   **CSS:** `packages/frontend/src/index.css`

## Why It Causes The Symptom

1.  **Dropdown:** The frontend iterates over `Object.values(WidgetTheme)`. Since the imported JS object only had `{ LIGHT: 'light', DARK: 'dark' }`, the dropdown only rendered those two options.
2.  **Preview:** When user selects "Light" (or "Dark"), the component renders `<div className="theme-light">`. Since `.theme-light` is undefined in CSS, the browser uses the variables from `:root` or parent scopes. If the user's Dashboard is in Dark mode (applied via body class `.dark`), the "Light" preview inherits those Dark mode variables, making the preview look wrong.

## Rejected Hypotheses

None. Both hypotheses were correct and necessary to explain the full symptom.
