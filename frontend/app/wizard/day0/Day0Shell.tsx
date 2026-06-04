"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";

export default function Day0Shell({
  title,
  subtitle,
  children,
  backTo = "/wizard/home",   // DEFAULT: Radiant Control Panel
  widthClass = "max-w-5xl",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  backTo?: string;
  widthClass?: string;
}) {
  const [settings, setSettings] = useState<{
    locationType: "local" | "remote";
    localPath: string;
    remoteUrl: string;
    remoteRepoName: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/day0/workspace-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.locationType) {
          setSettings(data);
        }
      })
      .catch((err) => console.error("Failed to load workspace settings in Day0Shell", err));
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center py-10"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <div className={`${widthClass} w-full px-4`}>

        {/* Back Button */}
        <Link
          href={backTo}
          className="text-xs transition block mb-4 hover:underline"
          style={{ color: "var(--accent)" }}
        >
          ← Back
        </Link>

        {/* Radiant Card */}
        <div
          className="rounded-2xl p-6 shadow-xl"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >

          {/* Accent Bar */}
          <div className="mb-4 h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />

          {/* Title + Subtitle section with dynamic storage indicator */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-6" style={{ borderColor: "var(--border)" }}>
            <div className="space-y-1">
              <h1
                className="text-lg md:text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {subtitle}
                </p>
              )}
            </div>

            {/* Storage Strategy Status Badge */}
            {settings && (
              <div 
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-[10px] font-semibold transition-all backdrop-blur-md self-start md:self-center"
                style={{ 
                  backgroundColor: "var(--bg-panel)", 
                  borderColor: "var(--border)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                }}
              >
                <span className="text-xs">
                  {settings.locationType === "local" ? "💻" : "☁️"}
                </span>
                <div className="text-left leading-tight">
                  <div className="text-[8px] uppercase tracking-widest font-extrabold" style={{ color: "var(--accent)" }}>
                    {settings.locationType === "local" ? "Local Directory" : "Cloud Git Ops"}
                  </div>
                  <div className="font-mono text-[9.5px] truncate max-w-[180px] mt-0.5" style={{ color: "var(--text-primary)" }} title={settings.locationType === "local" ? settings.localPath : settings.remoteUrl}>
                    {settings.locationType === "local" ? settings.localPath : settings.remoteRepoName || "Git Repository"}
                  </div>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </div>
            )}
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
