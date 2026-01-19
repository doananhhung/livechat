# Plan 1.4 Summary

## What Was Done

- Refactored `Composer.tsx` — replaced 4 inline conditionals (`charCount`, `offlineText`, `container` border)
- Refactored `ChatWindow.tsx` — replaced solid background conditional with CSS variable, kept rgba logic for background image overlay

## Verification

- `grep -c "theme === 'light'" Composer.tsx` → 0 ✓
- ChatWindow now uses `var(--widget-card-background)` for solid backgrounds

## Note

ChatWindow still has `WidgetTheme.LIGHT` check for background image overlay opacity calculation. This is intentional — rgba values cannot use CSS variables for the color component.
