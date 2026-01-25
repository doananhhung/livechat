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

export interface ThemeTokenSet {
  primary: string;
  primaryForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;

  // Widget semantic aliases
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  labelText: string;

  bubbleAgentBg: string;
  bubbleAgentText: string;

  cardBackground: string;
  cardBorder: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;

  headerBackground: string;
  composerBackground: string;

  error: string;
  success: string;
  disabled: string;
  typingDot: string;
}

export const themeTokens: Record<string, ThemeTokenSet> = {
  light: {
    primary: "#171717",
    primaryForeground: "#fafafa",
    background: "#ffffff",
    foreground: "#0a0a0a",
    card: "#ffffff",
    cardForeground: "#0a0a0a",
    muted: "#f5f5f5",
    mutedForeground: "#737373",
    border: "#e5e5e5",
    input: "#e5e5e5",

    textPrimary: "#0a0a0a",
    textSecondary: "#737373",
    textMuted: "#737373",
    labelText: "#0a0a0a",

    bubbleAgentBg: "#f5f5f5",
    bubbleAgentText: "#0a0a0a",

    cardBackground: "#ffffff",
    cardBorder: "#e5e5e5",
    inputBackground: "#ffffff",
    inputBorder: "#e5e5e5",
    inputText: "#0a0a0a",

    headerBackground: "rgba(255, 255, 255, 0.85)",
    composerBackground: "#ffffff",

    error: "#ef4444",
    success: "#22c55e",
    disabled: "#a3a3a3",
    typingDot: "#737373",
  },
  dark: {
    primary: "#fafafa",
    primaryForeground: "#171717",
    background: "#0a0a0a",
    foreground: "#fafafa",
    card: "#0a0a0a",
    cardForeground: "#fafafa",
    muted: "#262626",
    mutedForeground: "#a3a3a3",
    border: "#262626",
    input: "#262626",

    textPrimary: "#fafafa",
    textSecondary: "#a3a3a3",
    textMuted: "#a3a3a3",
    labelText: "#fafafa",

    bubbleAgentBg: "#262626",
    bubbleAgentText: "#fafafa",

    cardBackground: "#0a0a0a",
    cardBorder: "#262626",
    inputBackground: "#262626",
    inputBorder: "#262626",
    inputText: "#fafafa",

    headerBackground: "rgba(10, 10, 10, 0.9)",
    composerBackground: "#0a0a0a",

    error: "#ef4444",
    success: "#22c55e",
    disabled: "#a3a3a3",
    typingDot: "#a3a3a3",
  },
  "oled-void": {
    primary: "#2563eb",
    primaryForeground: "#ffffff",
    background: "#000000",
    foreground: "#fafafa",
    card: "#0d0d0d",
    cardForeground: "#fafafa",
    muted: "#1f1f1f",
    mutedForeground: "#999999",
    border: "#262626",
    input: "#262626",

    textPrimary: "#fafafa",
    textSecondary: "#999999",
    textMuted: "#999999",
    labelText: "#fafafa",

    bubbleAgentBg: "#1f1f1f",
    bubbleAgentText: "#fafafa",

    cardBackground: "#0d0d0d",
    cardBorder: "#262626",
    inputBackground: "#1f1f1f",
    inputBorder: "#262626",
    inputText: "#fafafa",

    headerBackground: "rgba(0, 0, 0, 0.9)",
    composerBackground: "#000000",

    error: "#ef4444",
    success: "#22c55e",
    disabled: "#a3a3a3",
    typingDot: "#a3a3a3",
  },
  paperback: {
    primary: "#7d4d35",
    primaryForeground: "#fcf8f0",
    background: "#f9f1e4",
    foreground: "#32241b",
    card: "#f5ebd8",
    cardForeground: "#32241b",
    muted: "#ede2d5",
    mutedForeground: "#7a6652",
    border: "#ccc1b3",
    input: "#ccc1b3",

    textPrimary: "#32241b",
    textSecondary: "#7a6652",
    textMuted: "#7a6652",
    labelText: "#32241b",

    bubbleAgentBg: "#ede2d5",
    bubbleAgentText: "#32241b",

    cardBackground: "#f5ebd8",
    cardBorder: "#ccc1b3",
    inputBackground: "#f9f1e4",
    inputBorder: "#ccc1b3",
    inputText: "#32241b",

    headerBackground: "rgba(249, 241, 228, 0.85)",
    composerBackground: "#f9f1e4",

    error: "#ef4444",
    success: "#22c55e",
    disabled: "#a3a3a3",
    typingDot: "#7a6652",
  },
  "nordic-frost": {
    primary: "#88c0d0",
    primaryForeground: "#2e3440",
    background: "#2e3440",
    foreground: "#eceff4",
    card: "#3b4252",
    cardForeground: "#eceff4",
    muted: "#3b4252",
    mutedForeground: "#8e96a4",
    border: "#4c566a",
    input: "#4c566a",

    textPrimary: "#eceff4",
    textSecondary: "#8e96a4",
    textMuted: "#8e96a4",
    labelText: "#eceff4",

    bubbleAgentBg: "#3b4252",
    bubbleAgentText: "#eceff4",

    cardBackground: "#3b4252",
    cardBorder: "#4c566a",
    inputBackground: "#2e3440",
    inputBorder: "#4c566a",
    inputText: "#eceff4",

    headerBackground: "rgba(46, 52, 64, 0.9)",
    composerBackground: "#2e3440",

    error: "#ef4444",
    success: "#22c55e",
    disabled: "#a3a3a3",
    typingDot: "#a3a3a3",
  },
  cyberpunk: {
    primary: "#ff00aa",
    primaryForeground: "#ffffff",
    background: "#0d0514",
    foreground: "#00ffff",
    card: "#1a0a29",
    cardForeground: "#00ffff",
    muted: "#211933",
    mutedForeground: "#ff66cc",
    border: "#ff00aa",
    input: "#1a0a29",

    textPrimary: "#00ffff",
    textSecondary: "#ff66cc",
    textMuted: "#ff66cc",
    labelText: "#00ffff",

    bubbleAgentBg: "#211933",
    bubbleAgentText: "#00ffff",

    cardBackground: "#1a0a29",
    cardBorder: "#ff00aa",
    inputBackground: "#1a0a29",
    inputBorder: "#ff00aa",
    inputText: "#00ffff",

    headerBackground: "rgba(13, 5, 20, 0.9)",
    composerBackground: "#0d0514",

    error: "#ef4444",
    success: "#00ffff",
    disabled: "#a3a3a3",
    typingDot: "#ff66cc",
  },
  terminal: {
    primary: "#00ff00",
    primaryForeground: "#000000",
    background: "#000000",
    foreground: "#00ff00",
    card: "#080808",
    cardForeground: "#00ff00",
    muted: "#001a00",
    mutedForeground: "#009900",
    border: "#00ff00",
    input: "#000000",

    textPrimary: "#00ff00",
    textSecondary: "#009900",
    textMuted: "#009900",
    labelText: "#00ff00",

    bubbleAgentBg: "#001a00",
    bubbleAgentText: "#00ff00",

    cardBackground: "#080808",
    cardBorder: "#00ff00",
    inputBackground: "#000000",
    inputBorder: "#00ff00",
    inputText: "#00ff00",

    headerBackground: "rgba(0, 0, 0, 0.9)",
    composerBackground: "#000000",

    error: "#ef4444",
    success: "#00ff00",
    disabled: "#a3a3a3",
    typingDot: "#009900",
  },
  matcha: {
    primary: "#3e6a3e",
    primaryForeground: "#f5f9f5",
    background: "#eef4ee",
    foreground: "#1f331f",
    card: "#e8f0e8",
    cardForeground: "#1f331f",
    muted: "#ccdbcc",
    mutedForeground: "#477347",
    border: "#b0c2b0",
    input: "#b0c2b0",

    textPrimary: "#1f331f",
    textSecondary: "#477347",
    textMuted: "#477347",
    labelText: "#1f331f",

    bubbleAgentBg: "#ccdbcc",
    bubbleAgentText: "#1f331f",

    cardBackground: "#e8f0e8",
    cardBorder: "#b0c2b0",
    inputBackground: "#eef4ee",
    inputBorder: "#b0c2b0",
    inputText: "#1f331f",

    headerBackground: "rgba(238, 244, 238, 0.85)",
    composerBackground: "#eef4ee",

    error: "#ef4444",
    success: "#22c55e",
    disabled: "#a3a3a3",
    typingDot: "#477347",
  },
  dracula: {
    primary: "#ff79c6",
    primaryForeground: "#282a36",
    background: "#282a36",
    foreground: "#f8f8f2",
    card: "#343746",
    cardForeground: "#f8f8f2",
    muted: "#44475a",
    mutedForeground: "#bd93f9",
    border: "#44475a",
    input: "#44475a",

    textPrimary: "#f8f8f2",
    textSecondary: "#bd93f9",
    textMuted: "#bd93f9",
    labelText: "#f8f8f2",

    bubbleAgentBg: "#44475a",
    bubbleAgentText: "#f8f8f2",

    cardBackground: "#343746",
    cardBorder: "#44475a",
    inputBackground: "#282a36",
    inputBorder: "#44475a",
    inputText: "#f8f8f2",

    headerBackground: "rgba(40, 42, 54, 0.9)",
    composerBackground: "#282a36",

    error: "#ef4444",
    success: "#50fa7b",
    disabled: "#a3a3a3",
    typingDot: "#bd93f9",
  },
  "lavender-mist": {
    primary: "#b399ff",
    primaryForeground: "#331a66",
    background: "#f7f5ff",
    foreground: "#331a66",
    card: "#ffffff",
    cardForeground: "#331a66",
    muted: "#e1d9f5",
    mutedForeground: "#8066b3",
    border: "#ddd6f0",
    input: "#ddd6f0",

    textPrimary: "#331a66",
    textSecondary: "#8066b3",
    textMuted: "#8066b3",
    labelText: "#331a66",

    bubbleAgentBg: "#e1d9f5",
    bubbleAgentText: "#331a66",

    cardBackground: "#ffffff",
    cardBorder: "#ddd6f0",
    inputBackground: "#f7f5ff",
    inputBorder: "#ddd6f0",
    inputText: "#331a66",

    headerBackground: "rgba(247, 245, 255, 0.85)",
    composerBackground: "#f7f5ff",

    error: "#ef4444",
    success: "#22c55e",
    disabled: "#a3a3a3",
    typingDot: "#8066b3",
  },
  "high-contrast": {
    primary: "#000000",
    primaryForeground: "#ffffff",
    background: "#ffffff",
    foreground: "#000000",
    card: "#ffffff",
    cardForeground: "#000000",
    muted: "#e5e5e5",
    mutedForeground: "#333333",
    border: "#000000",
    input: "#000000",

    textPrimary: "#000000",
    textSecondary: "#333333",
    textMuted: "#333333",
    labelText: "#000000",

    bubbleAgentBg: "#e5e5e5",
    bubbleAgentText: "#000000",

    cardBackground: "#ffffff",
    cardBorder: "#000000",
    inputBackground: "#ffffff",
    inputBorder: "#000000",
    inputText: "#000000",

    headerBackground: "rgba(255, 255, 255, 0.9)",
    composerBackground: "#ffffff",

    error: "#ff0000",
    success: "#008000",
    disabled: "#666666",
    typingDot: "#333333",
  },
  "solarized-light": {
    primary: "#cb4b16",
    primaryForeground: "#fdf6e3",
    background: "#fdf6e3",
    foreground: "#586e75",
    card: "#eee8d5",
    cardForeground: "#586e75",
    muted: "#eee8d5",
    mutedForeground: "#657b83",
    border: "#eee8d5",
    input: "#eee8d5",

    textPrimary: "#586e75",
    textSecondary: "#657b83",
    textMuted: "#657b83",
    labelText: "#586e75",

    bubbleAgentBg: "#eee8d5",
    bubbleAgentText: "#586e75",

    cardBackground: "#eee8d5",
    cardBorder: "#eee8d5",
    inputBackground: "#fdf6e3",
    inputBorder: "#eee8d5",
    inputText: "#586e75",

    headerBackground: "rgba(253, 246, 227, 0.85)",
    composerBackground: "#fdf6e3",

    error: "#dc322f",
    success: "#859900",
    disabled: "#93a1a1",
    typingDot: "#657b83",
  },
  "solarized-dark": {
    primary: "#2aa198",
    primaryForeground: "#002b36",
    background: "#002b36",
    foreground: "#839496",
    card: "#073642",
    cardForeground: "#839496",
    muted: "#073642",
    mutedForeground: "#657b83",
    border: "#073642",
    input: "#073642",

    textPrimary: "#839496",
    textSecondary: "#657b83",
    textMuted: "#657b83",
    labelText: "#839496",

    bubbleAgentBg: "#073642",
    bubbleAgentText: "#839496",

    cardBackground: "#073642",
    cardBorder: "#073642",
    inputBackground: "#002b36",
    inputBorder: "#073642",
    inputText: "#839496",

    headerBackground: "rgba(0, 43, 54, 0.9)",
    composerBackground: "#002b36",

    error: "#dc322f",
    success: "#859900",
    disabled: "#586e75",
    typingDot: "#657b83",
  },
} as const;

export type ThemeTokens = typeof themeTokens.light;