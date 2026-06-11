"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function CapabilitiesPage() {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("envizor_view_mode") as any;
      const isMobile = window.innerWidth < 768;
      setViewMode(saved === "mobile" || saved === "desktop" ? saved : (isMobile ? "mobile" : "desktop"));

      const handleViewModeChange = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail === "desktop" || detail === "mobile") {
          setViewMode(detail);
        }
      };
      window.addEventListener("envizorViewModeChange", handleViewModeChange);
      return () => window.removeEventListener("envizorViewModeChange", handleViewModeChange);
    }
  }, []);

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center px-4 md:px-6 py-12 relative overflow-hidden transition-all duration-300 ${
        viewMode === "mobile" ? "view-mode-mobile" : "view-mode-desktop"
      }`}
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* Background Art Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: "var(--accent)" }}
        />
      </div>

      <div className="max-w-6xl w-full flex flex-col gap-8 relative z-10">
        
        {/* Back navigation header */}
        <div className="flex justify-between items-center">
          <Link
            href="/wizard/know-more"
            className="flex items-center gap-2 text-sm font-semibold transition hover:underline"
            style={{ color: "var(--accent)" }}
          >
            <span>←</span> Back to Know More Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Capabilities</span>
          </div>
        </div>

        {/* Hero title block */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 shadow-lg"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              boxShadow: "0 4px 20px var(--accent-glow)"
            }}
          >
            <span className="text-2xl text-white">🛡️</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            Envizor Key Capabilities
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Explore the core features that Envizor provides for managing access governance as code.
          </p>
        </div>

        {/* TAB 3: KEY CAPABILITIES CONTENT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          <div 
            className="rounded-2xl border p-6 space-y-4 flex flex-col justify-between transition-colors duration-300 shadow-md hover:scale-[1.01]"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="space-y-2">
              <span className="text-2xl">🤖</span>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Console Drift Detection</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Monitors and parses live configuration variables constantly. Any change executed directly in portals (bypassing baseline HCL tracking files) is instantly caught, highlighted, and isolated.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider font-mono" style={{ color: "var(--accent)" }}>Continuous Compliance</span>
          </div>

          <div 
            className="rounded-2xl border p-6 space-y-4 flex flex-col justify-between transition-colors duration-300 shadow-md hover:scale-[1.01]"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="space-y-2">
              <span className="text-2xl">🔄</span>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Selective Workspace Sync</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Compares environment configurations side-by-side. Allows administrators to selectively stage specific blocks or individual lines of changes from DEV to PRE with a single click.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider font-mono" style={{ color: "var(--accent)" }}>Granular Merges</span>
          </div>

          <div 
            className="rounded-2xl border p-6 space-y-4 flex flex-col justify-between transition-colors duration-300 shadow-md hover:scale-[1.01]"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="space-y-2">
              <span className="text-2xl">⚡</span>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Modular HCL Synthesis</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Autogenerates dry, robust, and industry-standard compliant HashiCorp Terraform modules including variables, custom provider configurations, and dynamic access bounds ready to deploy.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider font-mono" style={{ color: "var(--accent)" }}>Dry-Run Formatted</span>
          </div>

          <div 
            className="rounded-2xl border p-6 space-y-4 flex flex-col justify-between transition-colors duration-300 shadow-md hover:scale-[1.01]"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="space-y-2">
              <span className="text-2xl">📥</span>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Saviynt API Workspace</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Search EIC endpoints, copy target URLs, validate body JSONs, and upload/import new collection JSON versions dynamically under the **IGA Tenants Explorer** console.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider font-mono" style={{ color: "var(--accent)" }}>API Management</span>
          </div>

          <div 
            className="rounded-2xl border p-6 space-y-4 flex flex-col justify-between transition-colors duration-300 shadow-md hover:scale-[1.01]"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="space-y-2">
              <span className="text-2xl">⚙️</span>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Saviynt Provider Schema Registry</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Configure EIC property attribute maps, edit parameter arguments, and onboard entirely new resource types dynamically inside the **Terraform Workspace Explorer** card dashboard.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider font-mono" style={{ color: "var(--accent)" }}>Schema Customization</span>
          </div>

          <div 
            className="rounded-2xl border p-6 space-y-4 flex flex-col justify-between transition-colors duration-300 shadow-md hover:scale-[1.01]"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="space-y-2">
              <span className="text-2xl">🔌</span>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Disconnected App Onboarding</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Brings legacy, air-gapped, or API-less applications under IGA governance. Securely vaults credentials and supports both scheduled runs and dynamic, API-triggered import and task execution endpoints backed by a local JSON database.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider font-mono" style={{ color: "#f97316" }}>API-Triggered Agent Sync</span>
          </div>

          <div 
            className="rounded-2xl border p-6 space-y-4 flex flex-col justify-between transition-colors duration-300 shadow-md hover:scale-[1.01]"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="space-y-2">
              <span className="text-2xl">📋</span>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Agentic Audit Trail</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Logs every agent scan, file upload, and provisioning task. Utilizes a local JSON database manager that automatically archives completed tasks (&gt;100) and audit runs (&gt;50) to timestamped compliance archives.
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider font-mono" style={{ color: "var(--accent)" }}>Persistent Database &amp; Archiving</span>
          </div>
        </div>

      </div>
    </div>
  );
}
