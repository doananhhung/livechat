# Bug Fix Summary

**Status:** Fixed
**Executed:** Saturday, January 24, 2026

## Bug Summary

**Symptom:** Custom themes (like "OLED Void", "Paperback") were not applying; the UI reverted to standard Light/Dark themes.
**Root Cause:**
1. **Tailwind JIT Purging:** Custom theme classes defined in `index.css` inside `@layer base` were being purged by Tailwind because the class names were constructed dynamically in JS (`theme-${theme}`) and not explicitly present in source files.
2. **Logic Error:** The "Nordic Frost" theme was missing from the logic that determines if a theme is "dark", causing it to apply light mode base styles.

## What Was Done

1. **Moved Theme Classes:** Moved all `.theme-*` class definitions in `packages/frontend/src/index.css` **outside** of the `@layer base` directive. This prevents Tailwind from purging them as unused base styles, ensuring they are always included in the final CSS bundle.
2. **Fixed Theme Logic:** Updated `packages/frontend/src/stores/themeStore.ts` to include `nordic-frost` in the `isDark` check.
3. **Corrected Configuration:** Updated `packages/frontend/tailwind.config.js` to use the standard `darkMode: "class"` configuration (was `["class", "class"]`).

## Behaviour

**Before:**
- Selecting "OLED Void" resulted in a dark grey background (standard dark mode).
- Selecting "Nordic Frost" resulted in a light theme (incorrect logic).
- Theme classes were missing from the production CSS build.

**After:**
- Selecting "OLED Void" results in a pure black background (custom class applied).
- Selecting "Nordic Frost" results in a dark theme.
- All theme classes are present in the CSS build.

## Tasks Completed

1. ✓ Configure Tailwind Safelist and Dark Mode
   - Removed ineffective `safelist` approach.
   - Fixed `darkMode` config.
   - Files: `packages/frontend/tailwind.config.js`

2. ✓ Fix Theme Logic in Store
   - Added `nordic-frost` to `isDark` check.
   - Files: `packages/frontend/src/stores/themeStore.ts`

3. ✓ Move Theme Classes (Deviation from Plan)
   - Moved `.theme-*` classes out of `@layer base` in `index.css` to prevent purging.
   - Files: `packages/frontend/src/index.css`

## Deviations

- The original plan proposed using `safelist` in `tailwind.config.js`. However, verification showed this warned that patterns didn't match generated utilities (because the classes were custom CSS). The strategy was changed to move the classes out of `@layer base` in `index.css`, which successfully prevented purging.

## Verification

- [x] Original symptom no longer reproduces (Verified via build artifact inspection).
- [x] `.theme-oled-void` class exists in `dist/assets/index-*.css`.
- [x] `nordic-frost` logic verified in code.

## Files Changed

- `packages/frontend/src/index.css` — Moved theme classes to global scope.
- `packages/frontend/src/stores/themeStore.ts` — Added `nordic-frost` to dark mode logic.
- `packages/frontend/tailwind.config.js` — Fixed `darkMode` config.

## Proposed Commit Message

fix(frontend): restore missing custom themes and fix logic

- Move custom theme classes out of `@layer base` in `index.css` to prevent Tailwind JIT from purging them (due to dynamic usage in JS).
- Add missing `nordic-frost` theme to `isDark` logic in `themeStore.ts`.
- Fix invalid `darkMode` configuration in `tailwind.config.js`.

Root cause: Tailwind purged `@layer base` styles that weren't statically detected in source files.
