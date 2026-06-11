"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
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

  // Determine current day0 step if we are on day0 pages
  let currentStep = 0;
  if (pathname.includes("/day0/discovery")) {
    currentStep = 1;
  } else if (pathname.includes("/day0/diff")) {
    currentStep = 2;
  } else if (pathname.includes("/day0/api-usage")) {
    currentStep = 3;
  }

  const isDay0Step = currentStep > 0;

  const steps = [
    { number: 1, label: "Environment Discovery", href: "/wizard/day0/discovery", icon: "🔍" },
    { number: 2, label: "Compare Environments", href: "/wizard/day0/diff", icon: "🔀" },
    { number: 3, label: "Saviynt API Usage", href: "/wizard/day0/api-usage", icon: "⚡" },
  ];

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

          {/* Stepper Progress Bar */}
          {isDay0Step && (
            <div className="mb-8 p-5 rounded-2xl border bg-slate-950/15 backdrop-blur-md" style={{ borderColor: "var(--border)" }}>
              <div className="relative flex items-center justify-between max-w-xl mx-auto">
                {/* Background track line */}
                <div className="absolute left-6 right-6 top-[20px] h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
                {/* Active progress track line */}
                <div className="absolute left-6 right-6 top-[20px] h-0.5 -translate-y-1/2 z-0">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
                  />
                </div>

                {steps.map((s) => {
                  const isActive = currentStep === s.number;
                  const isCompleted = currentStep > s.number;
                  return (
                    <Link
                      key={s.number}
                      href={s.href}
                      className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                    >
                      {/* Circle Node */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300"
                        style={{
                          backgroundColor: isActive 
                            ? "var(--bg-elevated)" 
                            : isCompleted 
                            ? "var(--bg-panel)" 
                            : "var(--bg-base)",
                          borderColor: isActive 
                            ? "var(--accent)" 
                            : isCompleted 
                            ? "var(--success)" 
                            : "var(--border)",
                          boxShadow: isActive 
                            ? "0 0 15px var(--accent-glow)" 
                            : "none",
                          color: isActive 
                            ? "var(--accent)" 
                            : isCompleted 
                            ? "var(--success)" 
                            : "var(--text-muted)",
                        }}
                      >
                        {isCompleted ? "✓" : s.icon}
                      </div>
                      {/* Label */}
                      <span 
                        className="text-[10px] mt-2 font-semibold tracking-wide transition-colors duration-300 whitespace-nowrap"
                        style={{
                          color: isActive 
                            ? "var(--text-primary)" 
                            : isCompleted
                            ? "var(--text-secondary)"
                            : "var(--text-muted)"
                        }}
                      >
                        {s.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Page Content */}
          {children}

          {/* Stepper Navigation Buttons */}
          {isDay0Step && (
            <div className="mt-8 pt-6 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              {currentStep === 1 ? (
                <Link
                  href="/wizard/steps/welcome"
                  className="px-5 py-2.5 rounded-xl border text-xs font-semibold hover:bg-slate-800/20 transition duration-200"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  ← Back to Welcome Hub
                </Link>
              ) : (
                <Link
                  href={steps[currentStep - 2].href}
                  className="px-5 py-2.5 rounded-xl border text-xs font-semibold hover:bg-slate-800/20 transition duration-200"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  ← Back: {steps[currentStep - 2].label}
                </Link>
              )}

              {currentStep === 3 ? (
                <Link
                  href="/wizard/explorer"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg transition duration-200"
                >
                  Continue to Workspace Explorer →
                </Link>
              ) : (
                <Link
                  href={steps[currentStep].href}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg transition duration-200"
                >
                  Next: {steps[currentStep].label} →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
