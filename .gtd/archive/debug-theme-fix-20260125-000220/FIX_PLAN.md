---
created: Saturday, January 24, 2026
root_cause: Tailwind JIT purging dynamic theme classes and missing logic for nordic-frost theme.
---

# Fix Plan

## Objective

Enable correct application of custom themes by preventing Tailwind from purging their CSS classes and fixing logic errors in theme classification.

## Context

- ./.gtd/debug/current/ROOT_CAUSE.md
- `packages/frontend/tailwind.config.js`
- `packages/frontend/src/stores/themeStore.ts`

## Architecture Constraints

- **Single Source:** Theme class names must be available to Tailwind JIT during build.
- **Invariants:** Every theme defined in `index.css` must have a corresponding CSS class in the output bundle.
- **Resilience:** The system should handle any theme string gracefully, falling back to safe defaults if undefined, but defined themes must work.

## Tasks

<task id="1" type="auto">
  <name>Configure Tailwind Safelist and Dark Mode</name>
  <files>packages/frontend/tailwind.config.js</files>
  <action>
    1. Update `tailwind.config.js` to include a `safelist` property.
    2. Add a pattern regex to safelist all classes starting with `theme-` (e.g., `pattern: /^theme-/`).
    3. Correct the invalid `darkMode` configuration from `["class", "class"]` to the standard `"class"`.
  </action>
  <done>
    - `safelist` property exists in config.
    - `darkMode` is set to "class".
    - `grep` on built CSS confirms existence of `.theme-oled-void`.
  </done>
</task>

<task id="2" type="auto">
  <name>Fix Theme Logic in Store</name>
  <files>packages/frontend/src/stores/themeStore.ts</files>
  <action>
    1. Update the `isDark` logic in `applyTheme` function.
    2. Explicitly include `theme === "nordic-frost"` in the boolean expression.
    3. Ensure no other dark themes from `index.css` are missing.
  </action>
  <done>
    - `nordic-frost` is correctly identified as a dark theme.
  </done>
</task>

## Success Criteria

- [ ] Select "OLED Void" -> Background becomes pure black (class `theme-oled-void` applied and valid).
- [ ] Select "Nordic Frost" -> UI renders in dark mode (class `dark` applied).
- [ ] No regressions in standard Light/Dark modes.

## Rollback Plan

Revert changes to `packages/frontend/tailwind.config.js` and `packages/frontend/src/stores/themeStore.ts` using git.
