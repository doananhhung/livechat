# DECISIONS.md

## Phase 1 Decisions

**Date:** 2026-01-19

### Scope

- **NOT about syncing theme selection** — widget theme still comes from backend.
- **About CSS value parity** — when mode is "dark", widget and dashboard show identical colors.

### Approach

- Create shared tokens file (`theme/tokens.ts`).
- Generate CSS variables for both dashboard (`:root`, `.dark`) and widget (`:host`, `.theme-dark`).
- Both consume same color values.

### Findings — Widget Analysis

**Dashboard:**

- Uses Tailwind CSS with HSL CSS variables in `index.css`
- Variables: `--background`, `--foreground`, `--card`, `--primary`, etc.
- Theme applied via `.dark` class on `<html>`

**Widget:**

- Uses Tailwind for utility classes (flex, py-2, rounded-xl, etc.)
- **PROBLEM:** Theme colors are INLINE STYLES with hardcoded hex values
- Pattern: `theme === 'light' ? '#ffffff' : '#1f2937'`
- Found in 6 components:
  - `FormRequestMessage.tsx` — 8 inline conditionals
  - `FormSubmissionMessage.tsx` — 4 inline conditionals
  - `Message.tsx` — 3 inline conditionals
  - `MessageList.tsx` — 5 inline conditionals
  - `Composer.tsx` — 4 inline conditionals
  - `ChatWindow.tsx` — 2 inline conditionals

**Implication:**

- Cannot just unify CSS variables — must refactor widget components to use CSS vars instead of inline styles
- `widget.css` already defines CSS variables in `:host` and `.theme-dark`, but components don't use them
