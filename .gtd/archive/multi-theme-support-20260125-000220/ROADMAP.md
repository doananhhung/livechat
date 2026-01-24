# Roadmap: Multi-Theme Support

**Spec:** ./.gtd/multi-theme-support/SPEC.md
**Goal:** Expand the frontend theme system from 3 modes to 13 modes by adding 10 distinct, curated themes.
**Created:** 2026-01-24

## Must-Haves

- [ ] Support for **10 new themes**: OLED Void, Paperback, Nordic Frost, Cyberpunk, Terminal, Matcha, Dracula, Lavender Mist, High Contrast, and Solarized.
- [ ] Persistent theme selection (localStorage).
- [ ] Centralized CSS variable management in `index.css`.
- [ ] Theme selection UI in `UserNav` and `ThemeToggleButton`.
- [ ] Full internationalization (i18n) for all theme names.

## Nice-To-Haves

- [ ] Theme-specific scrollbar styling.
- [ ] Smooth transitions between themes.

## Phases

<must-have>

### Phase 1: Store & Infrastructure

**Status**: ✅ Complete
**Objective**: Update the internal `Theme` type in `themeStore.ts`, modify the theme application logic to support arbitrary theme strings, and add i18n keys for all new themes.

### Phase 2: Theme Palette Definition

**Status**: ✅ Complete
**Objective**: Define the CSS variable sets for all 10 new themes in `index.css`. This involves creating 10 new CSS class blocks (e.g., `.theme-oled-void`) with their respective HSL values.

### Phase 3: UI Integration

**Status**: ✅ Complete
**Objective**: Update `UserNav.tsx` and `ThemeToggleButton.tsx` to display the new theme options in their dropdown menus. Ensure the active theme is indicated with a checkmark.

</must-have>

<nice-to-have>

### Phase 4 (optional): Polish & Refinement

**Status**: ✅ Complete
**Objective**: Implement theme-specific scrollbar styling and add global CSS transitions to ensure smooth color shifting when switching themes.
</nice-to-have>
