# Root Cause

**Found:** Saturday, January 24, 2026
**Status:** CONFIRMED

## Root Cause 1: Tailwind JIT Purging (Primary)

The application constructs theme class names dynamically in `packages/frontend/src/stores/themeStore.ts`:
```typescript
root.classList.add(`theme-${theme}`);
```
Tailwind's JIT compiler scans source files for full class name strings to determine which styles to generate. Since the full strings (e.g., `theme-oled-void`, `theme-paperback`) do not appear explicitly in the source code (only the theme IDs like `oled-void` do), Tailwind purges these classes from the final CSS bundle. This results in the browser falling back to the base styles.

## Root Cause 2: Missing Theme Logic (Secondary)

The `nordic-frost` theme is missing from the `isDark` determination logic in `packages/frontend/src/stores/themeStore.ts`.
```typescript
const isDark =
  theme === "dark" ||
  theme === "oled-void" ||
  // ... nordic-frost is missing ...
  theme === "dracula" ||
  // ...
```
This causes the application to apply the `.light` class to the `<html>` element when "Nordic Frost" is selected, even if the CSS variables were present (which they aren't due to Root Cause 1).

## Verified Hypothesis

**Original Hypothesis 1:** Tailwind JIT Purging of Dynamic Classes
**Confidence:** 90% → **Confirmed**

**Original Hypothesis 2:** Missing Theme Logic for 'Nordic Frost'
**Confidence:** 100% → **Confirmed**

## Evidence

**Debug logs/Build Artifacts showed:**
- `grep "theme-oled-void" packages/frontend/dist/assets/index-*.css` returned no results (Exit Code 1).
- `packages/frontend/src/index.css` contains the definitions.
- `packages/frontend/tailwind.config.js` has no `safelist` for these dynamic patterns.

## Location

- **Files:**
  - `packages/frontend/tailwind.config.js` (Missing safelist)
  - `packages/frontend/src/stores/themeStore.ts` (Dynamic usage & missing logic)

## Why It Causes The Symptom

1. User selects "OLED Void".
2. JS adds class `theme-oled-void` to `<html>`.
3. Browser looks for `.theme-oled-void` CSS rule.
4. **Failure:** Rule does not exist in loaded CSS because Tailwind removed it.
5. Browser falls back to inherited styles (which are likely the default or standard dark mode variables if `.dark` is also present).

## Rejected Hypotheses

- **Hypothesis 3 (Invalid Dark Mode Config):** While `darkMode: ["class", "class"]` is weird, it's not the reason the specific theme variables are missing. Fixing it is good practice but won't solve the missing classes.
