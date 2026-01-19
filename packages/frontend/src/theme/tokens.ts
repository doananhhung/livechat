/**
 * SINGLE SOURCE OF TRUTH for theme colors.
 * These values are manually derived from dashboard's index.css HSL values.
 *
 * Dashboard uses HSL format: "0 0% 100%" for Tailwind
 * Widget uses hex format: "#ffffff"
 *
 * When updating colors, update BOTH this file AND index.css.
 * Run `npm run generate:widget-css` after changes.
 */

// HSL to Hex conversions from dashboard index.css
// Light mode (:root)
// --background: 0 0% 100% → #ffffff
// --foreground: 0 0% 3.9% → #0a0a0a
// --card: 0 0% 100% → #ffffff
// --muted: 0 0% 96.1% → #f5f5f5
// --muted-foreground: 0 0% 45.1% → #737373
// --border: 0 0% 89.8% → #e5e5e5

// Dark mode (.dark)
// --background: 0 0% 3.9% → #0a0a0a
// --foreground: 0 0% 98% → #fafafa
// --card: 0 0% 3.9% → #0a0a0a
// --muted: 0 0% 14.9% → #262626
// --muted-foreground: 0 0% 63.9% → #a3a3a3
// --border: 0 0% 14.9% → #262626

export const themeTokens = {
  light: {
    // Derived from dashboard index.css :root
    background: "#ffffff", // --background: 0 0% 100%
    foreground: "#0a0a0a", // --foreground: 0 0% 3.9%
    card: "#ffffff", // --card: 0 0% 100%
    cardForeground: "#0a0a0a", // --card-foreground: 0 0% 3.9%
    muted: "#f5f5f5", // --muted: 0 0% 96.1%
    mutedForeground: "#737373", // --muted-foreground: 0 0% 45.1%
    border: "#e5e5e5", // --border: 0 0% 89.8%
    input: "#e5e5e5", // --input: 0 0% 89.8%

    // Widget semantic aliases (using dashboard values)
    textPrimary: "#0a0a0a", // Same as foreground
    textSecondary: "#737373", // Same as mutedForeground
    textMuted: "#737373", // Same as mutedForeground
    labelText: "#0a0a0a", // Same as foreground

    bubbleAgentBg: "#f5f5f5", // Same as muted
    bubbleAgentText: "#0a0a0a", // Same as foreground

    cardBackground: "#ffffff", // Same as card
    cardBorder: "#e5e5e5", // Same as border
    inputBackground: "#ffffff", // Same as background
    inputBorder: "#e5e5e5", // Same as border
    inputText: "#0a0a0a", // Same as foreground

    headerBackground: "rgba(255, 255, 255, 0.85)",
    composerBackground: "#ffffff",

    error: "#ef4444",
    success: "#22c55e", // --success: hsl(142 76% 36%) ≈ green-500
    disabled: "#a3a3a3", // Using mutedForeground
    typingDot: "#737373", // Using mutedForeground
  },
  dark: {
    // Derived from dashboard index.css .dark
    background: "#0a0a0a", // --background: 0 0% 3.9%
    foreground: "#fafafa", // --foreground: 0 0% 98%
    card: "#0a0a0a", // --card: 0 0% 3.9%
    cardForeground: "#fafafa", // --card-foreground: 0 0% 98%
    muted: "#262626", // --muted: 0 0% 14.9%
    mutedForeground: "#a3a3a3", // --muted-foreground: 0 0% 63.9%
    border: "#262626", // --border: 0 0% 14.9%
    input: "#262626", // --input: 0 0% 14.9%

    // Widget semantic aliases (using dashboard values)
    textPrimary: "#fafafa", // Same as foreground
    textSecondary: "#a3a3a3", // Same as mutedForeground
    textMuted: "#a3a3a3", // Same as mutedForeground
    labelText: "#fafafa", // Same as foreground

    bubbleAgentBg: "#262626", // Same as muted
    bubbleAgentText: "#fafafa", // Same as foreground

    cardBackground: "#0a0a0a", // Same as card
    cardBorder: "#262626", // Same as border
    inputBackground: "#262626", // Same as muted (inputs have bg in dark)
    inputBorder: "#262626", // Same as border
    inputText: "#fafafa", // Same as foreground

    headerBackground: "rgba(10, 10, 10, 0.9)",
    composerBackground: "#0a0a0a",

    error: "#ef4444",
    success: "#22c55e",
    disabled: "#a3a3a3",
    typingDot: "#a3a3a3",
  },
} as const;

export type ThemeTokens = typeof themeTokens.light;
