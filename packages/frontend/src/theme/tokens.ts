/**
 * SINGLE SOURCE OF TRUTH for all theme colors.
 * Update colors HERE — both dashboard and widget will use these values.
 *
 * Run `npm run generate:widget-css` to sync widget.css after changes.
 */

export const themeTokens = {
  light: {
    // Core semantic colors (match dashboard index.css)
    background: "#ffffff",
    foreground: "#0a0a0a",
    card: "#ffffff",
    cardForeground: "#0a0a0a",
    muted: "#f5f5f5",
    mutedForeground: "#737373",
    border: "#e5e5e5",
    input: "#e5e5e5",

    // Widget-specific colors
    textPrimary: "#1f2937",
    textSecondary: "#6b7280",
    textMuted: "#6b7280",
    labelText: "#374151",

    bubbleAgentBg: "#f3f4f6",
    bubbleAgentText: "#1f2937",

    cardBackground: "#ffffff",
    cardBorder: "#e5e7eb",
    inputBackground: "#ffffff",
    inputBorder: "#d1d5db",
    inputText: "#1f2937",

    headerBackground: "rgba(255, 255, 255, 0.85)",
    composerBackground: "#ffffff",

    error: "#ef4444",
    success: "#10b981",
    disabled: "#9ca3af",
    typingDot: "#1f2937",
  },
  dark: {
    // Core semantic colors (match dashboard index.css)
    background: "#0a0a0a",
    foreground: "#fafafa",
    card: "#0a0a0a",
    cardForeground: "#fafafa",
    muted: "#262626",
    mutedForeground: "#a3a3a3",
    border: "#262626",
    input: "#262626",

    // Widget-specific colors
    textPrimary: "#f9fafb",
    textSecondary: "#9ca3af",
    textMuted: "#9ca3af",
    labelText: "#d1d5db",

    bubbleAgentBg: "#374151",
    bubbleAgentText: "#f9fafb",

    cardBackground: "#1f2937",
    cardBorder: "#374151",
    inputBackground: "#374151",
    inputBorder: "#4b5563",
    inputText: "#f3f4f6",

    headerBackground: "rgba(31, 41, 55, 0.9)",
    composerBackground: "#1f2937",

    error: "#ef4444",
    success: "#10b981",
    disabled: "#9ca3af",
    typingDot: "#9ca3af",
  },
} as const;

export type ThemeTokens = typeof themeTokens.light;
