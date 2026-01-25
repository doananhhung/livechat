---
phase: 4
created: 2026-01-25
---

# Plan: Phase 4 - Live Preview

## Objective

Add a live visual preview of the selected theme in the project settings UI to provide immediate feedback to managers.

## Context

- ./.gtd/unified-theme-optimistic-ui/SPEC.md
- ./.gtd/unified-theme-optimistic-ui/ROADMAP.md
- ./.gtd/unified-theme-optimistic-ui/4/RESEARCH.md
- `packages/frontend/src/components/features/inbox/ProjectWidgetSettingsDialog.tsx`
- `packages/frontend/src/pages/settings/ProjectSettingsPage.tsx`

## Architecture Constraints

- **Reusability:** The preview logic should be extracted into a standalone component.
- **Visual Accuracy:** The preview MUST use the same corner logic and colors as the actual widget (standardized in Phase 1 & 2).
- **Zero Drift:** By using standard Tailwind classes within a theme-scoped container, the preview will automatically stay in sync with `index.css`.

## Tasks

<task id="1" type="auto">
  <name>Create WidgetThemePreview Component</name>
  <files>packages/frontend/src/components/features/projects/WidgetThemePreview.tsx</files>
  <action>
    Implement a new component `WidgetThemePreview` that:
    1. Accepts a `theme` prop of type `WidgetTheme`.
    2. Renders a div with `theme-${theme}` class.
    3. Inside, renders a simplified chat window with:
       - A visitor bubble (Right aligned, `bg-primary text-primary-foreground`, `rounded-xl rounded-tr-none`).
       - An agent bubble (Left aligned, `bg-muted text-muted-foreground`, `rounded-xl rounded-tl-none`).
    4. Uses standard Tailwind classes to ensure it picks up dashboard theme variables.
  </action>
  <done>
    - `WidgetThemePreview.tsx` exists and renders correctly.
  </done>
</task>

<task id="2" type="auto">
  <name>Integrate Preview into Settings</name>
  <files>
    - packages/frontend/src/components/features/inbox/ProjectWidgetSettingsDialog.tsx
    - packages/frontend/src/pages/settings/ProjectSettingsPage.tsx
  </files>
  <action>
    1. Import `WidgetThemePreview` into both files.
    2. Place the component immediately after the Theme Selection dropdown.
    3. Ensure the preview updates in real-time as the user selects different themes from the dropdown.
    4. Add a descriptive label like "Preview".
  </action>
  <done>
    - Live preview is visible in the Widget Settings dialog.
    - Live preview is visible in the Project Settings page.
  </done>
</task>

## Success Criteria

- [ ] Selecting a theme like "Cyberpunk" immediately updates the preview bubbles to pink/neon colors.
- [ ] Preview bubble shapes perfectly match the implemented widget shapes from Phase 2.
- [ ] No manual color logic is used in the preview (strictly theme-variable driven).
