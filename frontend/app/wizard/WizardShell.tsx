import React from "react";
import Link from "next/link";

export default function WizardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center transition-colors duration-300"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
       {/* ⭐ Back to Hub Button */}
      <div className="w-full max-w-7xl px-6 pt-6 flex flex-row justify-end">
        <Link
          href="/wizard"
          className="px-4 py-2 rounded-lg font-medium border transition cursor-pointer"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          ← Back to Hub
        </Link>
      </div>

      {/* Centered Content Container */}
      <div className="w-full max-w-7xl px-6 py-10">
        {children}
      </div>
    </div>
  );
}
