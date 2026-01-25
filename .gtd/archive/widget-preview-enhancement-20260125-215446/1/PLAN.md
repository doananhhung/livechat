---
phase: 1
created: 2026-01-25
---

# Plan: Phase 1 - WYSIWYG Container & Theme Isolation

## Objective

Create a `WidgetPreview` component that accurately mirrors the actual widget's appearance by reusing its core components (`Header`, `MessageList`, `Composer`) and ensuring CSS variable isolation.

## Context

-   `packages/frontend/src/widget/components/` (Source components)
-   `packages/frontend/scripts/generate-widget-css.ts` (CSS Generation)
-   `packages/frontend/src/widget/styles/widget.css` (Base styles)

## Architecture Constraints

-   **Isolation:** Preview styles must use a unique scope (`.widget-preview-root`) to prevent Dashboard theme leakage and allow "Light preview in Dark dashboard" scenarios.
-   **Reusability:** Must use the *exact* same components (`Header`, `MessageList`, `Composer`) as the production widget.
-   **No Shadow DOM in Preview:** To simplify integration with the Dashboard's existing React tree and Tailwind context, we will use scoped CSS classes instead of a Shadow Root.

## Tasks

<task id="1" type="auto">
  <name>Refactor Widget CSS Architecture</name>
  <files>packages/frontend/src/widget/styles/widget.css, packages/frontend/src/widget/styles/widget-base.css, packages/frontend/src/widget/index.css, packages/frontend/src/widget/main.tsx</files>
  <action>
    1.  Extract custom styles (glass-effect, animations, scrollbars) from `widget.css` into a new file `packages/frontend/src/widget/styles/widget-base.css` (NO `@tailwind` directives here).
    2.  Update `packages/frontend/src/widget/styles/widget.css` to import `widget-base.css` and keep the `@tailwind` directives.
    3.  Update `packages/frontend/src/widget/main.tsx` to import `widget-base.css?inline` instead of `widget.css?inline` (since the widget app already gets tailwind via `index.css` or build process? Wait, `main.tsx` injects styles into Shadow DOM. Shadow DOM needs everything. So `main.tsx` should inject `widget.css` (processed) or we ensure `widget-base.css` + `tailwind` are injected.
    -   *Correction*: `widget.css` in `main.tsx` is injected as a string. If it contains `@tailwind`, Vite's inline import might not process it fully if not configured.
    -   *Action*: Leave `widget.css` as the "entry point" for the widget (with `@tailwind`). Create `widget-custom.css` with ONLY the custom classes.
    -   Update `widget.css` to `@import "./widget-custom.css";` (or just keep content).
    -   We need `widget-custom.css` to be importable by the Preview without bringing in `@tailwind` resets.
  </action>
  <done>
    - `widget-custom.css` exists and contains `.glass-effect`, animations, etc.
    - `widget.css` imports `widget-custom.css` and works for the main widget.
  </done>
</task>

<task id="2" type="auto">
  <name>Update CSS Generator for Preview Scope</name>
  <files>packages/frontend/scripts/generate-widget-css.ts</files>
  <action>
    -   Update the script to generate a **second file**: `packages/frontend/src/widget/styles/_generated-preview-vars.css`.
    -   Content should duplicate `_generated-vars.css` but replace selectors:
        -   `:host` -> `.widget-preview-root`
        -   `:host .theme-{name}` -> `.widget-preview-root.theme-{name}`
  </action>
  <done>
    -   Running `npm run generate:widget-css` produces `_generated-preview-vars.css`.
    -   The file contains `.widget-preview-root` selectors.
  </done>
</task>

<task id="3" type="auto">
  <name>Create WidgetPreview Component</name>
  <files>packages/frontend/src/components/features/projects/WidgetPreview.tsx</files>
  <action>
    -   Import `../../../../widget/styles/_generated-preview-vars.css`.
    -   Import `../../../../widget/styles/widget-custom.css`.
    -   Import `Header`, `MessageList`, `Composer` from widget components.
    -   Create a layout container div with class `widget-preview-root theme-{config.theme} relative w-full h-full flex flex-col overflow-hidden rounded-xl border shadow-xl bg-card`.
    -   Render the sub-components with mock props.
    -   Ensure `MessageList` has `flex-1 overflow-y-auto`.
    -   Mock `messages` with 1 visitor and 1 agent message.
  </action>
  <done>
    -   Component renders without crashing.
    -   CSS variables are applied (inspect element to verify `--widget-primary-color` exists on the root).
  </done>
</task>

## Success Criteria

- [ ] `WidgetPreview` renders the full UI (Header, List, Composer).
- [ ] Changing `config.theme` updates the CSS variables locally.
- [ ] No regression in the actual Widget (it still builds and looks correct).
