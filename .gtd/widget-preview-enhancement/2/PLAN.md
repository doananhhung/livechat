---
phase: 2
created: 2026-01-25
---

# Plan: Phase 2 - Configuration Binding & Layout

## Objective

Integrate the new `WidgetPreview` component into the `ProjectWidgetSettingsDialog` and establish a side-by-side layout (WYSIWYG) to allow real-time visual feedback.

## Context

-   `packages/frontend/src/components/features/inbox/ProjectWidgetSettingsDialog.tsx`
-   `packages/frontend/src/components/features/projects/WidgetPreview.tsx`
-   `packages/frontend/src/components/ui/Dialog.tsx`

## Architecture Constraints

-   **Responsive Design:** The dialog must accommodate the large preview on desktop (side-by-side) but degrade gracefully on smaller screens (stacking or hiding preview).
-   **State Flow:** Form state (`settings`) acts as the source of truth; `WidgetPreview` is a pure consumer (controlled component).
-   **Dialog Constraints:** The custom `Dialog` component has a default `max-w-md`. We must override this to `max-w-5xl` to fit the side-by-side layout.

## Tasks

<task id="1" type="auto">
  <name>Refactor ProjectWidgetSettingsDialog Layout</name>
  <files>packages/frontend/src/components/features/inbox/ProjectWidgetSettingsDialog.tsx</files>
  <action>
    -   Update `ProjectWidgetSettingsDialog` to pass `className="max-w-5xl w-full"` to the `<Dialog>` component (to override default `max-w-md`).
    -   Import `WidgetPreview`.
    -   Refactor the `form` content to use a Grid layout:
        -   `grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh] max-h-[700px]`
    -   Left Column: The existing form fields (wrapped in `flex-1 overflow-y-auto pr-2`).
    -   Right Column: The `WidgetPreview` component (wrapped in `hidden lg:flex flex-col justify-center items-center bg-muted/20 rounded-lg p-4`).
    -   Remove the old `<WidgetThemePreview />`.
    -   Ensure `WidgetPreview` receives the full config: `config={{ ...settings, projectId: String(project.id) }}`.
  </action>
  <done>
    -   Dialog is wide (max-w-5xl).
    -   Layout is side-by-side on large screens.
    -   Preview updates when form fields change.
  </done>
</task>

<task id="2" type="auto">
  <name>Remove Legacy Preview Component</name>
  <files>packages/frontend/src/components/features/projects/WidgetThemePreview.tsx</files>
  <action>
    -   Delete `packages/frontend/src/components/features/projects/WidgetThemePreview.tsx` as it is no longer used.
    -   Verify no other files import it (`grep` check).
  </action>
  <done>
    -   File is deleted.
    -   Build verification confirms no broken imports.
  </done>
</task>

## Success Criteria

- [ ] Dialog is significantly wider to accommodate the preview.
- [ ] User sees changes to "Header Text", "Theme", "Colors" instantly in the preview pane.
- [ ] Preview is hidden on mobile/small screens (via `hidden lg:flex`).
