"use client";

import * as React from "react";

type Theme = "light" | "dark";

type ThemeProviderProps = React.PropsWithChildren<{
  defaultTheme?: Theme;
  storageKey?: string;
}>;

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  themes: Theme[];
};

const FALLBACK_THEME: Theme = "light";

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: FALLBACK_THEME,
  resolvedTheme: FALLBACK_THEME,
  setTheme: () => {
    // noop fallback for safety outside provider
  },
  themes: ["light", "dark"],
});

const normalizeTheme = (value: unknown): Theme => {
  return value === "dark" ? "dark" : "light";
};

const applyThemeToDocument = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.style.colorScheme = theme;
};

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      const nextTheme = normalizeTheme(saved ?? defaultTheme);
      setTheme(nextTheme);
      applyThemeToDocument(nextTheme);
    } catch {
      const nextTheme = normalizeTheme(defaultTheme);
      setTheme(nextTheme);
      applyThemeToDocument(nextTheme);
    }
  }, [defaultTheme, storageKey]);

  React.useEffect(() => {
    applyThemeToDocument(theme);
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // ignore persistence issues
    }
  }, [theme, storageKey]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: theme,
      setTheme,
      themes: ["light", "dark"],
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => React.useContext(ThemeContext);
