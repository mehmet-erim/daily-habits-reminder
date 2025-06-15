"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "system";

interface ThemeProviderContext {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "dark" | "light"; // The actual resolved theme
}

const ThemeProviderContext = createContext<ThemeProviderContext | undefined>(
  undefined
);

export function useTheme() {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
}

// Theme utility functions
export const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "dark"; // Default for SSR

  try {
    const stored = localStorage.getItem("wellness-tracker-theme");
    if (stored && ["dark", "light", "system"].includes(stored)) {
      return stored as Theme;
    }
  } catch (error) {
    console.warn("Failed to get stored theme:", error);
  }

  return "dark"; // Default theme
};

export const setStoredTheme = (theme: Theme): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("wellness-tracker-theme", theme);
  } catch (error) {
    console.warn("Failed to store theme:", error);
  }
};

export const getSystemTheme = (): "dark" | "light" => {
  if (typeof window === "undefined") return "dark";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const resolveTheme = (theme: Theme): "dark" | "light" => {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
};

export const applyTheme = (theme: "dark" | "light"): void => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
  }

  // Set data attribute for CSS
  root.setAttribute("data-theme", theme);
};

// Hook for theme management
export const useThemeManager = () => {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [actualTheme, setActualTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const storedTheme = getStoredTheme();
    const resolvedTheme = resolveTheme(storedTheme);

    setThemeState(storedTheme);
    setActualTheme(resolvedTheme);
    applyTheme(resolvedTheme);
    setMounted(true);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        const newResolvedTheme = getSystemTheme();
        setActualTheme(newResolvedTheme);
        applyTheme(newResolvedTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    const resolvedTheme = resolveTheme(newTheme);

    setThemeState(newTheme);
    setActualTheme(resolvedTheme);
    setStoredTheme(newTheme);
    applyTheme(resolvedTheme);
  };

  return {
    theme,
    actualTheme,
    setTheme,
    mounted,
  };
};

// Theme options for UI
export const THEME_OPTIONS = [
  {
    value: "light" as const,
    label: "Light",
    description: "Clean light interface",
    icon: "☀️",
  },
  {
    value: "dark" as const,
    label: "Dark",
    description: "Easy on the eyes dark mode",
    icon: "🌙",
  },
  {
    value: "system" as const,
    label: "System",
    description: "Follow system preference",
    icon: "💻",
  },
] as const;

// Accessibility improvements
export const announceThemeChange = (theme: "dark" | "light"): void => {
  if (typeof document === "undefined") return;

  // Create a temporary element to announce the change to screen readers
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = `Theme changed to ${theme} mode`;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// CSS custom properties for theme
export const getCSSVariables = (theme: "dark" | "light") => {
  const variables = {
    dark: {
      "--background": "224 71% 4%",
      "--foreground": "213 31% 91%",
      "--card": "224 71% 4%",
      "--card-foreground": "213 31% 91%",
      "--popover": "224 71% 4%",
      "--popover-foreground": "215 20% 65%",
      "--primary": "210 40% 98%",
      "--primary-foreground": "222.2 47.4% 11.2%",
      "--secondary": "222.2 84% 4.9%",
      "--secondary-foreground": "210 40% 98%",
      "--muted": "223 47% 11%",
      "--muted-foreground": "215.4 16.3% 56.9%",
      "--accent": "216 34% 17%",
      "--accent-foreground": "210 40% 98%",
      "--destructive": "0 63% 31%",
      "--destructive-foreground": "210 40% 98%",
      "--border": "216 34% 17%",
      "--input": "216 34% 17%",
      "--ring": "263 70% 50%",
    },
    light: {
      "--background": "0 0% 100%",
      "--foreground": "222.2 47.4% 11.2%",
      "--card": "0 0% 100%",
      "--card-foreground": "222.2 47.4% 11.2%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "222.2 47.4% 11.2%",
      "--primary": "222.2 47.4% 11.2%",
      "--primary-foreground": "210 40% 98%",
      "--secondary": "210 40% 96%",
      "--secondary-foreground": "222.2 47.4% 11.2%",
      "--muted": "210 40% 96%",
      "--muted-foreground": "215.4 16.3% 43.9%",
      "--accent": "210 40% 96%",
      "--accent-foreground": "222.2 47.4% 11.2%",
      "--destructive": "0 73% 41%",
      "--destructive-foreground": "210 40% 98%",
      "--border": "214.3 31.8% 91.4%",
      "--input": "214.3 31.8% 91.4%",
      "--ring": "222.2 47.4% 11.2%",
    },
  };

  return variables[theme];
};

// Performance optimization for theme switching
export const preloadTheme = (theme: "dark" | "light"): void => {
  if (typeof document === "undefined") return;

  // Pre-apply CSS variables for smooth transition
  const root = document.documentElement;
  const variables = getCSSVariables(theme);

  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};
