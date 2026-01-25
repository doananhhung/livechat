---
phase: 2
created: 2026-01-25
---

# Plan: Phase 2 - Theme Expansion & Widget Integration

## Objective

Enable all 14 dashboard themes in the widget by expanding the token system and updating the CSS generation pipeline. Synchronize widget message bubble styles with the dashboard.

## Context

- ./.gtd/unified-theme-optimistic-ui/SPEC.md
- ./.gtd/unified-theme-optimistic-ui/ROADMAP.md
- ./.gtd/unified-theme-optimistic-ui/2/RESEARCH.md
- `packages/shared-types/src/widget-settings.types.ts`
- `packages/frontend/src/theme/tokens.ts`
- `packages/frontend/scripts/generate-widget-css.ts`
- `packages/frontend/src/widget/components/Message.tsx`

## Architecture Constraints

- **Single Source:** `tokens.ts` remains the single source of truth for color values.
- **Invariants:** Every theme in `themeStore.ts` MUST have a corresponding entry in `tokens.ts` and `WidgetTheme` enum.
- **Resilience:** If a theme is missing, it should fallback to `LIGHT`.
- **Testability:** Visual parity check between Dashboard and Widget for high-contrast themes (e.g., Cyberpunk).

## Tasks

<task id="1" type="auto">
  <name>Expand Theme Infrastructure</name>
  <files>
    - packages/shared-types/src/widget-settings.types.ts
    - packages/frontend/src/theme/tokens.ts
    - packages/frontend/scripts/generate-widget-css.ts
  </files>
  <action>
    1. Update `WidgetTheme` enum in `widget-settings.types.ts` to include all dashboard themes (oled-void, cyberpunk, etc.).
    2. Update `tokens.ts` to include Hex mappings for all 14 themes. Add `primary` and `primaryForeground` fields to each theme.
    3. Modify `generate-widget-css.ts` to iterate over all themes in `themeTokens` and generate `.theme-{name}` CSS blocks. Map `primary` to `--widget-primary-color` and `primaryForeground` to `--widget-text-on-primary`.
    4. Execute `npm run generate:widget-css` (or `npx tsx packages/frontend/scripts/generate-widget-css.ts`).
  </action>
  <done>
    - `WidgetTheme` matches `themeStore.ts`.
    - `_generated-vars.css` contains all 14 themes.
  </done>
</task>

<task id="2" type="auto">
  <name>Widget Visual Sync & Parity</name>
  <files>packages/frontend/src/widget/components/Message.tsx</files>
  <action>
    1. Update bubble shape logic:
       - Visitor (Right): `rounded-xl rounded-tr-none`.
       - Agent (Left): `rounded-xl rounded-tl-none`.
    2. Synchronize colors:
       - Visitor (Right): Use `var(--widget-primary-color)` and `var(--widget-text-on-primary)`.
       - Agent (Left): Use `var(--widget-bubble-agent-bg)` and `var(--widget-bubble-agent-text)`.
    3. Ignore `primaryColor` prop to ensure theme consistency as per SPEC.
  </action>
  <done>
    - Widget bubbles match Dashboard shapes (Phase 1).
    - Widget bubbles use theme colors instead of hardcoded/prop colors.
  </done>
</task>

## Success Criteria

- [ ] `_generated-vars.css` contains variables for all themes (Cyberpunk, Dracula, etc.).
- [ ] Widget Visitor bubbles use the theme's primary color.
- [ ] Widget bubbles use `rounded-xl` with top-corner square logic.
