"use client";

import Link from "next/link";

export default function StepsShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div 
      className="min-h-screen flex flex-col items-center py-10 transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <div className="max-w-5xl w-full px-4">

        {/* Back to Home */}
        <Link
          href="/wizard/home"
          className="text-xs transition block mb-4 hover:underline"
          style={{ color: "var(--accent)" }}
        >
          ← Back to Radiant Control Panel
        </Link>

        {/* Radiant Card */}
        <div 
          className="rounded-2xl p-6 shadow-xl transition-colors duration-300"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border)",
            borderWidth: "1px",
            borderStyle: "solid"
          }}
        >

          {/* Accent Bar (purple for steps flow) */}
          <div className="mb-4 h-1.5 w-20 rounded-full bg-gradient-to-r from-purple-400 to-purple-700" />

          {/* Title + Subtitle */}
          <h1 
            className="text-xl font-semibold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h1>

          {subtitle && (
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>
          )}

          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
