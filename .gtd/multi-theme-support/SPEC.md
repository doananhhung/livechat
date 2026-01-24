# Specification: Multi-Theme Support

**Status:** FINALIZED
**Created:** 2026-01-24

## Goal

Expand the frontend theme system from 3 modes (light, dark, system) to 13 modes by adding 10 distinct, curated themes. This improves user experience, accessibility, and visual variety.

## Requirements

### Must Have

- [ ] Support for **10 new themes**: OLED Void, Paperback, Nordic Frost, Cyberpunk, Terminal, Matcha, Dracula, Lavender Mist, High Contrast, and Solarized.
- [ ] Persistent theme selection (localStorage).
- [ ] Centralized CSS variable management in `index.css`.
- [ ] Theme selection UI in `UserNav` and `ThemeToggleButton`.
- [ ] Full internationalization (i18n) for all theme names.

### Nice to Have

- [ ] Theme-specific scrollbar styling.
- [ ] Smooth transitions between themes.

### Won't Have

- [ ] Custom theme builder for users (user-defined colors).
- [ ] Theme-specific icons (standard sun/moon will be reused or expanded slightly).

## Constraints

- **Single Source of Truth:** `themeStore.ts` must remain the authoritative source for the active theme.
- **Tailwind Compatibility:** Must continue using Tailwind's semantic classes (e.g., `text-foreground`) by updating their CSS variable values.
- **Performance:** CSS variable switching must be near-instant with no layout thrashing.

## Open Questions

- None identified at this stage.
