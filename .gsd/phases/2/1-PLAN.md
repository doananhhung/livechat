---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Document Color Mapping & Verify Alignment

## Objective

Document the mapping between dashboard CSS variables (HSL) and tokens.ts (hex). Ensure the rendered colors are visually equivalent. No major refactoring of Tailwind config.

## Context

- `packages/frontend/src/theme/tokens.ts` — Hex values
- `packages/frontend/src/index.css` — HSL values for Tailwind

## Tasks

<task type="auto">
  <name>Create color mapping documentation</name>
  <files>packages/frontend/src/theme/README.md</files>
  <action>
    Create a README.md that documents:
    
    1. Purpose of tokens.ts as single source
    2. Mapping between tokens.ts colors and index.css variables
    3. Why they use different formats (hex for widget, HSL for Tailwind)
    4. How to keep them aligned when updating
    
    Include a table showing the color correspondences:
    | tokens.ts key | tokens.ts value | index.css variable | Visual match |
    |---------------|-----------------|-------------------|--------------|
    | background    | #ffffff         | --background      | ✓            |
    | foreground    | #0a0a0a         | --foreground      | ✓            |
    | ...           | ...             | ...               | ...          |
  </action>
  <verify>test -f packages/frontend/src/theme/README.md && echo "README exists"</verify>
  <done>README.md exists with color mapping documentation</done>
</task>

<task type="auto">
  <name>Align tokens.ts core colors with index.css values</name>
  <files>packages/frontend/src/theme/tokens.ts</files>
  <action>
    Verify and update tokens.ts core colors to match index.css rendered values:
    
    **Light mode mapping (HSL → Hex):**
    - `--background: 0 0% 100%` → `hsl(0, 0%, 100%)` → `#ffffff` ✓
    - `--foreground: 0 0% 3.9%` → `hsl(0, 0%, 3.9%)` → `#0a0a0a` ✓
    - `--muted: 0 0% 96.1%` → `hsl(0, 0%, 96.1%)` → `#f5f5f5` ✓
    - `--muted-foreground: 0 0% 45.1%` → `hsl(0, 0%, 45.1%)` → `#737373` ✓
    - `--border: 0 0% 89.8%` → `hsl(0, 0%, 89.8%)` → `#e5e5e5` ✓
    
    **Dark mode mapping (HSL → Hex):**
    - `--background: 0 0% 3.9%` → `hsl(0, 0%, 3.9%)` → `#0a0a0a` ✓
    - `--foreground: 0 0% 98%` → `hsl(0, 0%, 98%)` → `#fafafa` ✓
    - `--muted: 0 0% 14.9%` → `hsl(0, 0%, 14.9%)` → `#262626` ✓
    - `--muted-foreground: 0 0% 63.9%` → `hsl(0, 0%, 63.9%)` → `#a3a3a3` ✓
    - `--border: 0 0% 14.9%` → `hsl(0, 0%, 14.9%)` → `#262626` ✓
    
    These already match. No changes needed if verification passes.
    
    Run CSS generator to ensure widget CSS is up to date.
  </action>
  <verify>npm run generate:widget-css --prefix packages/frontend && echo "CSS generated"</verify>
  <done>tokens.ts values verified to match index.css HSL equivalents</done>
</task>

## Success Criteria

- [ ] README.md created with color mapping
- [ ] tokens.ts core colors verified against index.css
- [ ] CSS generator runs successfully
