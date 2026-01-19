# Theme Tokens

## Purpose

`tokens.ts` is the **single source of truth** for all theme colors used by the widget.

When you need to update theme colors, update this file and run `npm run generate:widget-css` to regenerate the widget CSS variables.

## Format Differences

| System                  | Format     | Why                                    |
| ----------------------- | ---------- | -------------------------------------- |
| Dashboard (`index.css`) | HSL values | Required by Tailwind CSS utilities     |
| Widget (`tokens.ts`)    | Hex values | Simpler for inline styles and CSS vars |

Both formats produce **visually identical colors** when rendered.

## Color Mapping

### Light Mode

| tokens.ts key     | Hex Value | index.css Variable   | HSL Value    | Match |
| ----------------- | --------- | -------------------- | ------------ | ----- |
| `background`      | `#ffffff` | `--background`       | `0 0% 100%`  | ✓     |
| `foreground`      | `#0a0a0a` | `--foreground`       | `0 0% 3.9%`  | ✓     |
| `card`            | `#ffffff` | `--card`             | `0 0% 100%`  | ✓     |
| `muted`           | `#f5f5f5` | `--muted`            | `0 0% 96.1%` | ✓     |
| `mutedForeground` | `#737373` | `--muted-foreground` | `0 0% 45.1%` | ✓     |
| `border`          | `#e5e5e5` | `--border`           | `0 0% 89.8%` | ✓     |
| `input`           | `#e5e5e5` | `--input`            | `0 0% 89.8%` | ✓     |

### Dark Mode

| tokens.ts key     | Hex Value | index.css Variable   | HSL Value    | Match |
| ----------------- | --------- | -------------------- | ------------ | ----- |
| `background`      | `#0a0a0a` | `--background`       | `0 0% 3.9%`  | ✓     |
| `foreground`      | `#fafafa` | `--foreground`       | `0 0% 98%`   | ✓     |
| `card`            | `#0a0a0a` | `--card`             | `0 0% 3.9%`  | ✓     |
| `muted`           | `#262626` | `--muted`            | `0 0% 14.9%` | ✓     |
| `mutedForeground` | `#a3a3a3` | `--muted-foreground` | `0 0% 63.9%` | ✓     |
| `border`          | `#262626` | `--border`           | `0 0% 14.9%` | ✓     |
| `input`           | `#262626` | `--input`            | `0 0% 14.9%` | ✓     |

## Widget-Specific Colors

These colors are used only by the widget and don't have direct dashboard equivalents:

| Key               | Light     | Dark      | Purpose                   |
| ----------------- | --------- | --------- | ------------------------- |
| `textPrimary`     | `#1f2937` | `#f9fafb` | Main text color           |
| `textSecondary`   | `#6b7280` | `#9ca3af` | Secondary text            |
| `bubbleAgentBg`   | `#f3f4f6` | `#374151` | Agent message background  |
| `bubbleAgentText` | `#1f2937` | `#f9fafb` | Agent message text        |
| `cardBackground`  | `#ffffff` | `#1f2937` | Card/container background |
| `cardBorder`      | `#e5e7eb` | `#374151` | Card/container border     |
| `inputBackground` | `#ffffff` | `#374151` | Input field background    |
| `inputBorder`     | `#d1d5db` | `#4b5563` | Input field border        |

## Updating Colors

1. Edit `tokens.ts` with new hex values
2. Run `npm run generate:widget-css`
3. If updating dashboard too, convert hex to HSL and update `index.css`

### Hex to HSL Conversion

Use a converter tool or formula:

- `#ffffff` → `hsl(0, 0%, 100%)`
- `#0a0a0a` → `hsl(0, 0%, 4%)` (approx)

Note: Tailwind uses HSL values without the `hsl()` wrapper, just the numbers.
