# Root Cause Hypotheses

**Analyzed:** Saturday, January 24, 2026
**Status:** PENDING VERIFICATION

## Summary

The most likely root cause is **Tailwind JIT Purging**. The specific theme classes (e.g., `.theme-oled-void`) are defined within `@layer base` in `index.css`, making them subject to tree-shaking. Since the application applies these classes dynamically (`` `theme-${theme}` ``) and the full class strings (e.g., "theme-oled-void") do not exist explicitly in the scanned source files, Tailwind removes these styles from the final output.

Additionally, a logic error in `themeStore.ts` incorrectly misidentifies `nordic-frost` as a light theme, and the `tailwind.config.js` contains a potentially invalid `darkMode` configuration.

---

## Hypothesis 1: Tailwind JIT Purging of Dynamic Classes

**Confidence:** High (90%)

**Description:**
Tailwind's JIT engine scans source files for class names to generate/keep CSS. Styles defined in `@layer` directives are effectively treated as "custom utilities" or "base styles" that are purged if unused.
The application constructs theme classes dynamically in `themeStore.ts`: `root.classList.add(\`theme-${theme}\`)`.
The source files only contain the theme IDs (e.g., "oled-void"), not the full class names (e.g., "theme-oled-void").
Consequently, Tailwind sees `.theme-oled-void` in `index.css` as "unused" and strips it from the generated CSS, causing the browser to fall back to standard `.dark` or `:root` variables.

**Evidence:**
- `packages/frontend/src/index.css` wraps theme definitions in `@layer base`.
- `packages/frontend/src/stores/themeStore.ts` constructs classes dynamically: `root.classList.add(\`theme-${theme}\`)`.
- `packages/frontend/src/components/layout/UserNav.tsx` uses raw strings like "oled-void".
- `packages/frontend/tailwind.config.js` does NOT have a `safelist` for these patterns.
- `grep` for "safelist" returned no results.

**Location:**
- File: `packages/frontend/src/index.css` (The definition)
- File: `packages/frontend/src/stores/themeStore.ts` (The dynamic usage)
- File: `packages/frontend/tailwind.config.js` (Missing safelist)

**Verification Method:**
- **Check 1:** Inspect the browser's "Styles" tab for the `<html>` element. If `class="theme-oled-void"` is present but the corresponding CSS rule `.theme-oled-void { ... }` is missing from the stylesheet, this is confirmed.
- **Check 2:** Add `safelist: [{ pattern: /theme-.+/ }]` to `tailwind.config.js` and restart the dev server. If themes appear, the hypothesis is correct.

---

## Hypothesis 2: Missing Theme Logic for 'Nordic Frost'

**Confidence:** High (100% for this specific theme)

**Description:**
The `nordic-frost` theme is missing from the `isDark` logic check in `themeStore.ts`. This causes the application to apply the `.light` class instead of `.dark` when `nordic-frost` is selected. While this is a definitive bug, it is likely secondary to Hypothesis 1 (the variables would still be missing).

**Evidence:**
- `packages/frontend/src/stores/themeStore.ts`: `nordic-frost` is absent from the `isDark` boolean expression, unlike `oled-void`, `dracula`, etc.

**Location:**
- File: `packages/frontend/src/stores/themeStore.ts`, Line 42-51.

**Verification Method:**
- Visual code inspection (Already confirmed).
- Verify if `nordic-frost` behaves differently than other dark themes (e.g., using light mode UI components vs dark mode ones).

---

## Hypothesis 3: Invalid Tailwind Dark Mode Configuration

**Confidence:** Medium (50%)

**Description:**
`tailwind.config.js` specifies `darkMode: ["class", "class"]`. This is a non-standard configuration. Standard is `darkMode: 'class'`. This confusing configuration might cause unpredictable behavior with the `.dark` class, potentially breaking how standard dark mode overrides work, or reverting to system preferences (`media`).

**Evidence:**
- `packages/frontend/tailwind.config.js`: `darkMode: ["class", "class"]`.

**Location:**
- File: `packages/frontend/tailwind.config.js`

**Verification Method:**
- Change config to `darkMode: 'class'` and observe if behavior improves (unlikely to fix the missing variables, but improves correctness).

---

## Code Analysis Notes

- The project relies heavily on CSS variables for theming, which is good.
- The `nordic-frost` logic error is a simple oversight.
- The `darkMode` config looks like a copy-paste error.
- The primary issue is almost certainly the disconnect between dynamic class generation and Tailwind's static analysis.
