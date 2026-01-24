// src/stores/themeStore.ts
import { create } from "zustand";

type Theme =
  | "light"
  | "dark"
  | "system"
  | "oled-void"
  | "paperback"
  | "nordic-frost"
  | "cyberpunk"
  | "terminal"
  | "matcha"
  | "dracula"
  | "lavender-mist"
  | "high-contrast"
  | "solarized-light"
  | "solarized-dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const themeClasses: Theme[] = [
  "oled-void",
  "paperback",
  "nordic-frost",
  "cyberpunk",
  "terminal",
  "matcha",
  "dracula",
  "lavender-mist",
  "high-contrast",
  "solarized-light",
  "solarized-dark",
];

const applyTheme = (theme: Theme) => {
  const root = window.document.documentElement;

  // 1. Determine if the theme should be considered "dark" or "light" for utility classes
  const isDark =
    theme === "dark" ||
    theme === "oled-void" ||
    theme === "nordic-frost" ||
    theme === "cyberpunk" ||
    theme === "terminal" ||
    theme === "dracula" ||
    theme === "solarized-dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // 2. Clear all theme-related classes
  root.classList.remove("light", "dark");
  themeClasses.forEach((t) => root.classList.remove(`theme-${t}`));

  // 3. Apply base (light/dark) and specific theme class
  root.classList.add(isDark ? "dark" : "light");

  if (theme !== "light" && theme !== "dark" && theme !== "system") {
    root.classList.add(`theme-${theme}`);
  }
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "system", // Default value
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem("theme", theme);
    applyTheme(theme);
  },
}));

// This function will be called once when the application loads
export const initializeTheme = () => {
  const storedTheme = localStorage.getItem("theme") as Theme | null;
  const initialTheme = storedTheme || "system";
  useThemeStore.getState().setTheme(initialTheme);
};