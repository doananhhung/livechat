---
phase: 1
plan: 3
wave: 2
---

# Plan 1.3: Refactor Remaining Widget Components

## Objective

Replace inline style conditionals in the remaining 5 widget components with CSS variable references.

## Context

- `.gsd/phases/1/1-PLAN.md` — CSS variables from Plan 1.1
- Target components listed below

## Tasks

<task type="auto">
  <name>Refactor FormSubmissionMessage.tsx</name>
  <files>packages/frontend/src/widget/components/FormSubmissionMessage.tsx</files>
  <action>
    Replace 4 inline conditionals:
    - `isLight ? '#f3f4f6' : '#374151'` → `var(--widget-bubble-agent-background)`
    - `isLight ? '#1f2937' : '#e5e7eb'` → `var(--widget-bubble-agent-text)`
    - `isLight ? '1px solid #e5e7eb' : '1px solid #4b5563'` → `var(--widget-card-border)`
    
    Note: Keep `isFromVisitor` conditional for visitor messages (uses primaryColor).
  </action>
  <verify>grep -c "isLight ?" packages/frontend/src/widget/components/FormSubmissionMessage.tsx</verify>
  <done>Count returns 0 or only visitor-specific conditionals remain</done>
</task>

<task type="auto">
  <name>Refactor Message.tsx</name>
  <files>packages/frontend/src/widget/components/Message.tsx</files>
  <action>
    Replace 3 inline conditionals in `bubbleStyle`:
    - `theme === "light" ? "#f3f4f6" : "#374151"` → `var(--widget-bubble-agent-background)`
    - `theme === "light" ? "#1f2937" : "#e5e7eb"` → `var(--widget-bubble-agent-text)`
    - `theme === "light" ? "1px solid #e5e7eb" : "none"` → conditional based on theme class, or use CSS variable
    
    Keep visitor bubble styles (already using CSS variables).
  </action>
  <verify>grep -c 'theme === "light"' packages/frontend/src/widget/components/Message.tsx</verify>
  <done>Count returns 0</done>
</task>

<task type="auto">
  <name>Refactor MessageList.tsx</name>
  <files>packages/frontend/src/widget/components/MessageList.tsx</files>
  <action>
    Replace 5 inline conditionals:
    - `theme === 'light' ? '#6b7280' : '#9ca3af'` → `var(--widget-text-muted)`
    - `theme === 'light' ? '#111827' : '#f9fafb'` → `var(--widget-text-primary)`
    - `theme === 'light' ? '#e5e7eb' : '#374151'` (typing indicator) → `var(--widget-bubble-agent-background)`
    - `theme === 'light' ? '#1f2937' : '#e5e7eb'` (typing indicator text) → `var(--widget-bubble-agent-text)`
  </action>
  <verify>grep -c "theme === 'light'" packages/frontend/src/widget/components/MessageList.tsx</verify>
  <done>Count returns 0</done>
</task>

## Success Criteria

- [ ] FormSubmissionMessage: 0 light/dark conditionals (except visitor-specific)
- [ ] Message: 0 light/dark conditionals
- [ ] MessageList: 0 light/dark conditionals
