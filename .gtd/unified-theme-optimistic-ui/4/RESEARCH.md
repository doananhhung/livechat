# Research: Phase 4 - Live Preview

**Created:** 2026-01-25

## Findings

### 1. Theme Availability in Dashboard
The dashboard already has all 14 themes defined in `index.css` via classes like `.theme-oled-void`, `.theme-cyberpunk`, etc. These classes correctly set CSS variables like `--primary`, `--muted`, `--background`, and `--foreground`.

### 2. Preview Component Design
A simple "Mock Chat" component can be created that uses standard Tailwind classes (`bg-primary`, `bg-muted`). When wrapped in a div with the `theme-{name}` class, it will automatically reflect the selected theme's colors.

### 3. Integration Points
- **`ProjectWidgetSettingsDialog.tsx`**: Add the preview right after the theme selector.
- **`ProjectSettingsPage.tsx`**: Add the preview right after the theme selector.

### 4. Implementation Strategy
Create a reusable `WidgetThemePreview` component in `packages/frontend/src/components/features/projects/WidgetThemePreview.tsx`.
It will accept `theme: WidgetTheme` as a prop.
It will render:
- A container with `theme-${theme}` class.
- A dummy header.
- A visitor message (Right, Primary).
- An agent message (Left, Muted).
