import React from "react";

export default function ExplorerShell({
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
      className="min-h-screen w-full flex flex-col items-center px-6 py-16 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
    >

      {/* Soft Blue Radial Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-sky-500/5 rounded-full blur-3xl opacity-40" />
      </div>

      {/* Hero Section */}
      <div className="relative flex flex-col items-center mb-16">
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>

        {subtitle && (
          <p className="text-lg max-w-2xl text-center font-medium" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="w-full max-w-5xl">
        {children}
      </div>
    </div>
  );
}
