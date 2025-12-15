// src/stores/themeStore.ts
import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const applyTheme = (theme: Theme) => {
  const root = window.document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.remove(isDark ? "light" : "dark");
  root.classList.add(isDark ? "dark" : "light");
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
