---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Extend Widget CSS Variables

## Objective

Add missing theme-aware CSS variables to `widget.css` that match the values currently hardcoded in widget components. This creates a complete set of variables that components can reference.

## Context

- `.gsd/DECISIONS.md` — Widget analysis findings
- `packages/frontend/src/widget/styles/widget.css` — Existing CSS variables
- `packages/frontend/src/index.css` — Dashboard theme reference

## Tasks

<task type="auto">
  <name>Add missing widget CSS variables</name>
  <files>packages/frontend/src/widget/styles/widget.css</files>
  <action>
    Add the following CSS variables to `:host` (light mode):
    
    ```css
    /* Card/Container colors */
    --widget-card-background: #ffffff;
    --widget-card-border: #e5e7eb;
    
    /* Input colors */
    --widget-input-background: #ffffff;
    --widget-input-border: #d1d5db;
    --widget-input-text: #1f2937;
    
    /* Label colors */
    --widget-label-text: #374151;
    
    /* Muted text (timestamps, descriptions) */
    --widget-text-muted: #6b7280;
    
    /* Error color */
    --widget-error: #ef4444;
    
    /* Success color */
    --widget-success: #10b981;
    
    /* Disabled state */
    --widget-disabled: #9ca3af;
    
    /* Typing indicator dot */
    --widget-typing-dot: #1f2937;
    ```
    
    Add corresponding dark mode values to `.theme-dark`:
    
    ```css
    --widget-card-background: #1f2937;
    --widget-card-border: #374151;
    
    --widget-input-background: #374151;
    --widget-input-border: #4b5563;
    --widget-input-text: #f3f4f6;
    
    --widget-label-text: #d1d5db;
    
    --widget-text-muted: #9ca3af;
    
    --widget-typing-dot: #9ca3af;
    ```
    
    Update `.typing-indicator span` to use `var(--widget-typing-dot)`.
  </action>
  <verify>grep -E "widget-card-background|widget-input-background" packages/frontend/src/widget/styles/widget.css</verify>
  <done>All new CSS variables present in both `:host` and `.theme-dark` blocks</done>
</task>

<task type="auto">
  <name>Verify Tailwind builds successfully</name>
  <files>packages/frontend/src/widget/styles/widget.css</files>
  <action>
    Run the widget build to ensure CSS is valid.
  </action>
  <verify>npm run build:widget --prefix packages/frontend 2>&1 | tail -20</verify>
  <done>Build completes without CSS errors</done>
</task>

## Success Criteria

- [ ] 12 new CSS variables added to `:host`
- [ ] 7 dark mode overrides added to `.theme-dark`
- [ ] `.typing-indicator span` uses CSS variable
- [ ] Widget build succeeds
