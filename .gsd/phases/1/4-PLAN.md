---
phase: 1
plan: 4
wave: 2
---

# Plan 1.4: Refactor Composer and ChatWindow Components

## Objective

Complete the component refactoring by updating Composer and ChatWindow.

## Context

- `.gsd/phases/1/1-PLAN.md` — CSS variables from Plan 1.1

## Tasks

<task type="auto">
  <name>Refactor Composer.tsx</name>
  <files>packages/frontend/src/widget/components/Composer.tsx</files>
  <action>
    Replace 4 inline conditionals in `getStyles()`:
    - `theme === 'light' ? '1px solid #f3f4f6' : '1px solid rgba(255,255,255,0.1)'` 
      → `1px solid var(--widget-card-border)`
    - `theme === 'light' ? '#9ca3af' : '#6b7280'` → `var(--widget-text-muted)`
    - `theme === 'light' ? '#6b7280' : '#9ca3af'` → `var(--widget-text-muted)`
    - `theme === 'light' ? '#f3f4f6' : '#374151'` → `var(--widget-bubble-agent-background)`
  </action>
  <verify>grep -c "theme === 'light'" packages/frontend/src/widget/components/Composer.tsx</verify>
  <done>Count returns 0</done>
</task>

<task type="auto">
  <name>Refactor ChatWindow.tsx</name>
  <files>packages/frontend/src/widget/components/ChatWindow.tsx</files>
  <action>
    Replace 2 inline conditionals in `windowStyles`:
    - `theme === WidgetTheme.LIGHT ? lightBg : darkBg` → `var(--widget-background-color)`
    - `theme === WidgetTheme.LIGHT ? lightRgb : darkRgb` → Handle with CSS variable for rgba
    
    The rgba handling: Add new CSS variable `--widget-background-rgb` for use in rgba().
    
    Note: Keep the `theme-${theme}` class application — this is what triggers the CSS variable overrides.
  </action>
  <verify>grep -c "WidgetTheme.LIGHT" packages/frontend/src/widget/components/ChatWindow.tsx</verify>
  <done>Count returns 0 or 1 (only for class application)</done>
</task>

## Success Criteria

- [ ] Composer: 0 light/dark conditionals
- [ ] ChatWindow: Only theme class application remains
- [ ] All 6 components refactored
