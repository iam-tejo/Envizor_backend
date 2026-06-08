"use client";

import { useState } from "react";
import { useTheme, THEMES, ThemeId } from "@/app/lib/ThemeContext";

const ICON_MAP: Record<ThemeId, string> = {
  dark:      "🌑",
  light:     "☀️",
  ocean:     "🌊",
  cyberpunk: "⚡",
  forest:    "🌿",
  sunset:    "🌇",
  lavender:  "🪻",
};

const PALETTE_MAP: Record<ThemeId, string[]> = {
  dark:      ["#0a0f1e", "#1e293b", "#3b82f6"],
  light:     ["#f8fafc", "#e2e8f0", "#2563eb"],
  ocean:     ["#060d1a", "#102844", "#06b6d4"],
  cyberpunk: ["#0a0010", "#1a0030", "#e040fb"],
  forest:    ["#030f07", "#064e28", "#10b981"],
  sunset:    ["#1a0b08", "#2e120d", "#f97316"],
  lavender:  ["#0f0b1a", "#1a122e", "#8b5cf6"],
};

export default function ThemeToggle() {
  const { theme, setTheme, meta } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-50" id="theme-toggle-container">
      {/* Trigger pill */}
      <button
        id="theme-toggle-btn"
        onClick={() => setOpen((v) => !v)}
        title="Switch theme"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
        }}
        className="
          flex items-center gap-2 px-3 py-1.5 rounded-full
          text-sm font-medium
          hover:border-[var(--accent)] transition-all duration-200
          shadow-lg
        "
      >
        <span className="text-base">{ICON_MAP[theme]}</span>
        <span className="hidden sm:inline">{meta.label}</span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ color: "var(--text-secondary)" }}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Click-away backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div
            id="theme-dropdown"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
            className="
              absolute top-10 left-0 z-50
              rounded-2xl p-3 w-56
              flex flex-col gap-1
              animate-fade-in
            "
          >
            <p
              style={{ color: "var(--text-muted)" }}
              className="text-xs font-semibold uppercase tracking-wider px-2 pb-1"
            >
              Choose Theme
            </p>

            {THEMES.map((t) => {
              const active = t.id === theme;
              return (
                <button
                  key={t.id}
                  id={`theme-option-${t.id}`}
                  onClick={() => { setTheme(t.id); setOpen(false); }}
                  style={{
                    background: active ? "var(--accent-glow)" : "transparent",
                    border: active ? "1px solid var(--accent)" : "1px solid transparent",
                    color: active ? "var(--accent)" : "var(--text-primary)",
                  }}
                  className="
                    flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm
                    hover:bg-[var(--bg-surface)] transition-all duration-150
                    text-left group
                  "
                >
                  {/* Palette swatches */}
                  <div className="flex gap-1 flex-shrink-0">
                    {PALETTE_MAP[t.id].map((color, i) => (
                      <span
                        key={i}
                        style={{
                          background: color,
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          border: "1px solid rgba(255,255,255,0.15)",
                          display: "inline-block",
                        }}
                      />
                    ))}
                  </div>

                  <span className="flex-1 font-medium">
                    {t.emoji} {t.label}
                  </span>

                  {active && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
