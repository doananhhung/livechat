# Phase 1 Summary

**Status:** Complete
**Executed:** 2026-01-25

## What Was Done

Created the foundation for the WYSIWYG Widget Preview by refactoring the widget's CSS architecture and creating a new isolated preview component.

1.  **Refactored CSS:** Split `widget.css` into `widget-custom.css` (utilities/animations) and `widget.css` (entry point with Tailwind). This allows the preview component to import custom widget styles without duplicating Tailwind directives.
2.  **Updated CSS Generation:** Modified `generate-widget-css.ts` to output a second file `_generated-preview-vars.css`. This file duplicates the widget's CSS variables but scopes them to `.widget-preview-root` instead of Shadow DOM's `:host`, enabling theme isolation within the Dashboard.
3.  **Created WidgetPreview:** Implemented the new component that reuses the actual `Header`, `MessageList`, and `Composer` components. It wraps them in a container that applies the new scoped variables, ensuring the preview looks exactly like the widget.

## Behaviour

**Before:**
-   Widget styles were tightly coupled to Shadow DOM (`:host`).
-   No way to render widget components correctly inside the Dashboard without leaking styles or missing variables.

**After:**
-   Widget styles are modular (`widget-custom.css`).
-   Preview-specific variables (`_generated-preview-vars.css`) exist for safe rendering in the Dashboard.
-   `WidgetPreview` component exists and renders a fully styled widget mock.

## Tasks Completed

1.  ✓ Refactor Widget CSS Architecture
    -   Extracted `widget-custom.css`
    -   Updated `widget.css` to import it
    -   Files: `packages/frontend/src/widget/styles/widget-custom.css`, `packages/frontend/src/widget/styles/widget.css`

2.  ✓ Update CSS Generator for Preview Scope
    -   Updated generator script to produce preview vars
    -   Files: `packages/frontend/scripts/generate-widget-css.ts`, `packages/frontend/src/widget/styles/_generated-preview-vars.css`

3.  ✓ Create WidgetPreview Component
    -   Implemented component with mock data and full UI composition
    -   Files: `packages/frontend/src/components/features/projects/WidgetPreview.tsx`

## Deviations

None.

## Success Criteria

-   [x] `WidgetPreview` renders the full UI (Header, List, Composer).
-   [x] Changing `config.theme` updates the CSS variables locally.
-   [x] No regression in the actual Widget (it still builds and looks correct).

## Files Changed

-   `packages/frontend/scripts/generate-widget-css.ts` — Added preview var generation logic.
-   `packages/frontend/src/widget/styles/widget-custom.css` — New file with extracted styles.
-   `packages/frontend/src/widget/styles/widget.css` — Updated to import custom styles.
-   `packages/frontend/src/widget/styles/_generated-preview-vars.css` — New generated file.
-   `packages/frontend/src/components/features/projects/WidgetPreview.tsx` — New component.

## Proposed Commit Message

feat(widget-preview): implement WYSIWYG preview container and style isolation

- Refactor widget CSS to separate custom utilities from Tailwind directives.
- Update CSS generator to create scoped variables for dashboard preview (`.widget-preview-root`).
- Add `WidgetPreview` component reusing actual widget components (`Header`, `MessageList`, `Composer`).
- Enable full fidelity preview of themes and layout without Shadow DOM in the dashboard.
