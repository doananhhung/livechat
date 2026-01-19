---
phase: 1
plan: 2
wave: 2
---

# Plan 1.2: Refactor FormRequestMessage to Use CSS Variables

## Objective

Replace all inline style conditionals in `FormRequestMessage.tsx` with CSS variable references. This is the largest component with 8 inline theme conditionals.

## Context

- `.gsd/phases/1/1-PLAN.md` — CSS variables from Plan 1.1
- `packages/frontend/src/widget/components/FormRequestMessage.tsx` — Target file

## Tasks

<task type="auto">
  <name>Refactor FormRequestMessage styles</name>
  <files>packages/frontend/src/widget/components/FormRequestMessage.tsx</files>
  <action>
    Replace the following inline style conditionals with CSS variable references:

    **containerStyle:**
    - `backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937'`
      → `backgroundColor: 'var(--widget-card-background)'`
    - `border: theme === 'light' ? '2px solid #e5e7eb' : '2px solid #374151'`
      → `border: '2px solid var(--widget-card-border)'`

    **labelStyle:**
    - `color: theme === 'light' ? '#374151' : '#d1d5db'`
      → `color: 'var(--widget-label-text)'`

    **inputStyle:**
    - `border: theme === 'light' ? '1px solid #d1d5db' : '1px solid #4b5563'`
      → `border: '1px solid var(--widget-input-border)'`
    - `backgroundColor: theme === 'light' ? '#ffffff' : '#374151'`
      → `backgroundColor: 'var(--widget-input-background)'`
    - `color: theme === 'light' ? '#1f2937' : '#f3f4f6'`
      → `color: 'var(--widget-input-text)'`

    **h3 style (line 233):**
    - `color: theme === 'light' ? '#1f2937' : '#f3f4f6'`
      → `color: 'var(--widget-text-primary)'`

    **p style (line 241):**
    - `color: theme === 'light' ? '#6b7280' : '#9ca3af'`
      → `color: 'var(--widget-text-muted)'`

    Remove `theme` from useMemo dependency arrays where no longer used.
    Keep `theme` prop for any remaining usages.

  </action>
  <verify>grep -c "theme === 'light'" packages/frontend/src/widget/components/FormRequestMessage.tsx</verify>
  <done>Count returns 0 — all inline conditionals removed</done>
</task>

## Success Criteria

- [ ] All 8 inline theme conditionals replaced
- [ ] Component renders correctly in both themes (verified in Phase 4)
