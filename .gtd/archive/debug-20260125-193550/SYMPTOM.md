# Bug Symptom

**Reported:** Sunday, January 25, 2026
**Status:** CONFIRMED

## Expected Behavior

1.  **Theme Dropdown:** Should list ALL available themes (Light, Dark, Cyberpunk, Dracula, Matcha, etc.) as defined in `WidgetTheme` enum.
2.  **Widget Preview:** Selecting a theme from the dropdown should immediately update the visual style of the preview to match the selection.

## Actual Behavior

1.  **Theme Dropdown:** Only lists "Light" and "Dark" options.
2.  **Widget Preview:** Ignores the user's selection from the dropdown. Instead, it renders using the current theme of the Dashboard itself (e.g., if Dashboard is in "Dark" mode, preview is Dark).

## Reproduction Steps

1.  Navigate to **Project Settings** > **Widget Settings**.
2.  Locate the **Theme** dropdown.
    -   *Observation:* Click it, and only "Light" and "Dark" options appear.
3.  Select a different option (if possible) or observe the current preview.
    -   *Observation:* The **Widget Preview** component does not reflect the dropdown value. It matches the Dashboard's global theme.

## Environment

-   **Environment:** Local Development
-   **Context:** Recent implementation of "Unified Theme & Optimistic UI" features.

## Additional Context

-   The `WidgetTheme` enum was recently expanded to include 13+ themes.
-   The goal was for the widget to have its own independent theme selection, but it seems coupled to the dashboard's theme or the dropdown logic is outdated.
