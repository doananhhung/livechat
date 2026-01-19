---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Create Shared Theme Tokens (Single Source of Truth)

## Objective

Create ONE TypeScript file that defines all theme colors. Both `index.css` (dashboard) and `widget.css` will reference this single source. When you update colors, you update ONE file.

## Context

- `packages/frontend/src/index.css` — Dashboard CSS (current source)
- `packages/frontend/src/widget/styles/widget.css` — Widget CSS

## Tasks

<task type="auto">
  <name>Create shared theme tokens file</name>
  <files>packages/frontend/src/theme/tokens.ts</files>
  <action>
    Create `packages/frontend/src/theme/tokens.ts`:
    
    ```typescript
    /**
     * SINGLE SOURCE OF TRUTH for all theme colors.
     * Update colors HERE — both dashboard and widget will use these values.
     */
    
    export const themeTokens = {
      light: {
        background: '#ffffff',           // --background
        foreground: '#0a0a0a',            // --foreground (gray-950)
        card: '#ffffff',
        cardForeground: '#0a0a0a',
        muted: '#f5f5f5',                 // gray-100
        mutedForeground: '#737373',       // gray-500
        border: '#e5e5e5',                // gray-200
        input: '#e5e5e5',
        
        // Widget-specific
        textPrimary: '#1f2937',           // gray-800
        textSecondary: '#6b7280',         // gray-500
        textMuted: '#6b7280',
        labelText: '#374151',             // gray-700
        
        bubbleAgentBg: '#f3f4f6',         // gray-100
        bubbleAgentText: '#1f2937',
        
        cardBorder: '#e5e7eb',            // gray-200
        inputBorder: '#d1d5db',           // gray-300
        inputBg: '#ffffff',
        inputText: '#1f2937',
        
        error: '#ef4444',
        success: '#10b981',
        disabled: '#9ca3af',
      },
      dark: {
        background: '#0a0a0a',            // gray-950
        foreground: '#fafafa',            // gray-50
        card: '#0a0a0a',
        cardForeground: '#fafafa',
        muted: '#262626',                 // gray-800
        mutedForeground: '#a3a3a3',       // gray-400
        border: '#262626',
        input: '#262626',
        
        // Widget-specific
        textPrimary: '#f9fafb',           // gray-50
        textSecondary: '#9ca3af',         // gray-400
        textMuted: '#9ca3af',
        labelText: '#d1d5db',             // gray-300
        
        bubbleAgentBg: '#374151',         // gray-700
        bubbleAgentText: '#f9fafb',
        
        cardBorder: '#374151',            // gray-700
        inputBorder: '#4b5563',           // gray-600
        inputBg: '#374151',
        inputText: '#f3f4f6',
        
        error: '#ef4444',
        success: '#10b981',
        disabled: '#9ca3af',
      },
    } as const;
    
    export type ThemeTokens = typeof themeTokens.light;
    ```
  </action>
  <verify>test -f packages/frontend/src/theme/tokens.ts && echo "File exists"</verify>
  <done>tokens.ts created with light/dark color definitions</done>
</task>

<task type="auto">
  <name>Update widget.css to use token values</name>
  <files>packages/frontend/src/widget/styles/widget.css</files>
  <action>
    Update `:host` and `.theme-dark` blocks to match token values exactly.
    Add all missing variables needed by components:
    
    **Add to `:host` (light mode):**
    ```css
    --widget-card-background: #ffffff;
    --widget-card-border: #e5e7eb;
    --widget-input-background: #ffffff;
    --widget-input-border: #d1d5db;
    --widget-input-text: #1f2937;
    --widget-label-text: #374151;
    --widget-text-muted: #6b7280;
    --widget-error: #ef4444;
    --widget-success: #10b981;
    --widget-disabled: #9ca3af;
    ```
    
    **Add to `.theme-dark`:**
    ```css
    --widget-card-background: #0a0a0a;
    --widget-card-border: #374151;
    --widget-input-background: #374151;
    --widget-input-border: #4b5563;
    --widget-input-text: #f3f4f6;
    --widget-label-text: #d1d5db;
    --widget-text-muted: #9ca3af;
    ```
    
    These values MUST match tokens.ts.
  </action>
  <verify>grep -E "widget-card-background|widget-input-background" packages/frontend/src/widget/styles/widget.css</verify>
  <done>widget.css updated with all variables matching tokens.ts</done>
</task>

## Success Criteria

- [ ] `tokens.ts` exists as single source of truth
- [ ] `widget.css` variables match `tokens.ts` values exactly
- [ ] Future changes: update `tokens.ts`, then sync `widget.css` (documented)

## Note

For full automation (no manual sync), a future enhancement could generate widget.css from tokens.ts at build time. For now, manual sync is acceptable with documented process.
