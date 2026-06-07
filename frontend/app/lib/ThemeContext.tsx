"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeId = "dark" | "light" | "ocean" | "cyberpunk" | "forest" | "sunset" | "lavender";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  accent: string;   // preview swatch color
  emoji: string;
}

export const THEMES: ThemeMeta[] = [
{ id: "dark",      label: "Dark",      accent: "#1e293b", emoji: "🌑" },
  { id: "light",     label: "Light",     accent: "#f8fafc", emoji: "☀️"  },
  { id: "ocean",     label: "Ocean",     accent: "#0c4a6e", emoji: "🌊" },
  { id: "cyberpunk", label: "Cyberpunk", accent: "#18011a", emoji: "⚡" },
  { id: "forest",    label: "Forest",    accent: "#052e16", emoji: "🌿" },
  { id: "sunset",    label: "Sunset",    accent: "#781a08", emoji: "🌇" },    { id: "lavender", label: "Lavender", accent: "#8b5cf6", emoji: "🪻" },
];

const STORAGE_KEY = "envizor_theme";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  meta: ThemeMeta;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  meta: THEMES[0],
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("dark");

  // On mount: read from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    const valid = THEMES.find((t) => t.id === stored);
    const initial = valid ? valid.id : "dark";
    setThemeState(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    document.documentElement.setAttribute("data-theme", t);
  };

  const meta = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, meta }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
