# Research: Phase 2 - Theme Expansion & Widget Integration

**Created:** 2026-01-25

## Findings

### 1. Theme Coverage
The dashboard supports 14 themes: `light`, `dark`, `oled-void`, `paperback`, `nordic-frost`, `cyberpunk`, `terminal`, `matcha`, `dracula`, `lavender-mist`, `high-contrast`, `solarized-light`, `solarized-dark`. The `WidgetTheme` enum currently only has `LIGHT` and `DARK`.

### 2. Token Generation Pipeline
- `packages/frontend/src/theme/tokens.ts` is the source of truth for hex colors.
- `packages/frontend/scripts/generate-widget-css.ts` converts these to CSS variables in `packages/frontend/src/widget/styles/_generated-vars.css`.
- The script is hardcoded for `light` and `dark`. It needs to be updated to loop through all themes.

### 3. Widget Theming Logic
- `ChatWindow.tsx` applies a `theme-{name}` class to the main container.
- `Message.tsx` uses `var(--widget-primary-color)` and `var(--widget-bubble-agent-bg)`.
- Currently, `primaryColor` is passed as a prop and used to override the theme primary. This will be deprecated/ignored to enforce parity.

### 4. Visual Parity (Bubbles)
- Phase 1 updated Dashboard bubbles to `rounded-xl` with top-corner square logic (`rounded-tl-none` for left, `rounded-tr-none` for right).
- Widget currently uses `rounded-l-xl rounded-t-xl` for right bubbles (Bottom-Right is square). This needs to be synchronized to `rounded-xl rounded-tr-none`.

## Proposed Mappings (HSL to Hex)
I have extracted HSL values from `index.css`. I will perform the hex conversion during implementation of `tokens.ts`.
Notable additions needed in `tokens.ts`:
- `primary`: Driven by theme's `--primary`.
- `primaryForeground`: Driven by theme's `--primary-foreground`.
- `bubbleVisitorBg` (alias for `primary`).
- `bubbleVisitorText` (alias for `primaryForeground`).
