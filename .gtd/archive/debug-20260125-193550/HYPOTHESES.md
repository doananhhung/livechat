# Root Cause Hypotheses

**Analyzed:** Sunday, January 25, 2026
**Status:** PENDING VERIFICATION

## Summary

The issue is twofold:
1.  **Dropdown:** The `shared-types` package has been updated in source but not rebuilt. The frontend is consuming an old `dist` version that only contains `LIGHT` and `DARK`.
2.  **Preview:** The Dashboard's global CSS (`index.css`) lacks explicit `.theme-light` and `.theme-dark` classes. This prevents the `WidgetThemePreview` component from forcing a specific theme (Light/Dark) when it differs from the Dashboard's current global theme (e.g., previewing Light mode while Dashboard is in Dark mode).

---

## Hypothesis 1: Stale `shared-types` Build

**Confidence:** High (95%)

**Description:**
The `WidgetTheme` enum in `packages/shared-types/src/widget-settings.types.ts` has been updated with new themes (Cyberpunk, etc.), but the `dist` folder (`packages/shared-types/dist`) still only contains `LIGHT` and `DARK`. The frontend consumes the `dist` files, so it only sees the old values.

**Evidence:**
-   `grep "CYBERPUNK" packages/shared-types/dist/widget-settings.types.js` returns **no results**.
-   `packages/frontend/src/components/features/inbox/ProjectWidgetSettingsDialog.tsx` uses `Object.values(WidgetTheme)`.
-   The frontend `package.json` depends on `"@live-chat/shared-types": "1.0.0"`.

**Location:**
-   `packages/shared-types/dist/` (Stale artifacts)
-   `packages/shared-types/src/widget-settings.types.ts` (Source of truth)

**Verification Method:**
1.  Run `npm run build:shared-types`.
2.  Check if `packages/shared-types/dist/widget-settings.types.js` now contains "cyberpunk".
3.  Restart frontend and check if dropdown populates.

---

## Hypothesis 2: Missing Theme Override Classes in Dashboard CSS

**Confidence:** High (90%)

**Description:**
The `WidgetThemePreview` component relies on applying a class `theme-{themeName}` to scope CSS variables for the preview.
While classes like `.theme-cyberpunk` exist in `index.css`, the classes `.theme-light` and `.theme-dark` are **missing**.
Standard Tailwind/Dashboard setup uses `:root` for Light and `.dark` for Dark. Without explicit `.theme-light` and `.theme-dark` classes that re-declare the variables, the preview cannot override the global context (e.g., showing a Light preview inside a Dark dashboard).

**Evidence:**
-   `packages/frontend/src/components/features/projects/WidgetThemePreview.tsx` applies `theme-${theme}`.
-   `packages/frontend/src/index.css` contains `.theme-oled-void`, etc., but **no** `.theme-light` or `.theme-dark`.
-   Symptom confirms preview "renders based on system theme" for Light/Dark selections.

**Location:**
-   `packages/frontend/src/index.css`

**Verification Method:**
1.  Manually add `.theme-light { ...vars... }` and `.theme-dark { ...vars... }` to `index.css`.
2.  Check if the preview works for Light/Dark selection regardless of Dashboard theme.

---

## Code Analysis Notes

-   **Development Workflow Issue:** The monorepo setup does not seem to automatically rebuild `shared-types` in watch mode for the frontend, or the frontend is not configured to resolve `shared-types` source directly (via `vite.config.ts` alias), leading to this stale dependency issue.
-   **CSS Architecture:** The themes are defined as CSS classes in `index.css`, which is good, but the base themes (Light/Dark) were treated as special cases (Root/Dark Mode) rather than explicit themes that can be applied to sub-trees.
