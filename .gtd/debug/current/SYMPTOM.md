# Bug Symptom

**Reported:** Saturday, January 24, 2026
**Status:** CONFIRMED

## Expected Behavior

When a specific theme (e.g., "OLED Void", "Paperback") is selected from the theme switcher, the application should reflect the unique color variables defined for that theme in `index.css`. For example, "OLED Void" should display a pure black background (`0 0% 0%`), and "Paperback" should display a warm cream background.

## Actual Behavior

When selecting any of the new themes, the UI reverts to the standard "Dark" or "Light" appearance.
- Selecting "OLED Void" (dark theme) looks identical to the standard "Dark" theme (background `0 0% 3.9%`).
- Selecting "Paperback" (light theme) looks identical to the standard "Light" theme.
- The specific theme classes (e.g., `.theme-oled-void`) appear to be ineffective despite being toggled.

## Reproduction Steps

1. Open the application.
2. Navigate to the theme switcher (via User Profile Dropdown or Theme Toggle Button).
3. Select "OLED Void".
4. Observe the background color.
   - **Expected:** Pure Black (`#000000`).
   - **Actual:** Dark Grey (Standard Dark Theme color).
5. Select "Paperback".
6. Observe the background color.
   - **Expected:** Warm Cream.
   - **Actual:** Standard White/Grey (Standard Light Theme color).

## Conditions

- Affects all newly implemented themes (approx 10) in `packages/frontend/src/index.css`.
- Standard "Light" and "Dark" themes function correctly.
- `nordic-frost` is notably missing from the `isDark` logic in `packages/frontend/src/stores/themeStore.ts`.

## Environment

- **Environment:** Local Development (Linux)
- **Frontend Stack:** React, Tailwind CSS 3.4.17
- **Key Files:**
    - `packages/frontend/src/index.css` (Theme definitions)
    - `packages/frontend/src/stores/themeStore.ts` (Theme switching logic)
