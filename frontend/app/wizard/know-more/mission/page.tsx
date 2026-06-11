"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function MissionPage() {
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
        <img
          src="/bg_terraform_code.png"
          alt=""
          className="absolute -top-10 -left-10 w-[550px] opacity-[0.08] select-none pointer-events-none"
          style={{ mixBlendMode: "screen" }}
        />
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
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Mission Blueprint</span>
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
            <span className="text-2xl text-white">🚀</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            Envizor Mission &amp; Purpose
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Why does Envizor exist? Learn how we bridge the gap between complex enterprise Identity Governance (IGA) and pure DevOps Infrastructure-as-Code (IaC).
          </p>
        </div>

        {/* TAB 1: THE MISSION CONTENT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch animate-fadeIn">
          <div 
            className="md:col-span-7 rounded-2xl border p-8 space-y-6 flex flex-col justify-between"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                Core Purpose &amp; Challenge
              </span>
              <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                What is Envizor and why was it built?
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                In modern enterprise networks, Identity Governance and Administration (IGA) platforms are managed entirely via manual web portals. Access controls, secure endpoints, user mappings, and security integrations have to be manually configured, step-by-step.
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                This manual configuration process poses three major threats:
              </p>
              <ul className="text-xs space-y-2.5 pl-4 list-disc" style={{ color: "var(--text-secondary)" }}>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Undetected Environment Drift:</strong> Manual modifications in DEV, PRE, or PROD naturally diverge over time, leading to security compliance gaps.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Untraceable Operations:</strong> Changes made directly inside admin consoles leave no version history or change-management records.
                </li>
                <li>
                  <strong style={{ color: "var(--text-primary)" }}>Human Error:</strong> Setting up variables, SQL configurations, and JSON specifications manually is slow and prone to catastrophic validation mistakes.
                </li>
              </ul>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <strong>Envizor solves this</strong> by mapping cloud metadata, discovering configuration deltas in real-time, and compiling them into clean, structured **Infrastructure-as-Code (IaC)** using HashiCorp Terraform modules.
              </p>
            </div>

            <div 
              className="p-4 rounded-xl border flex items-start gap-3 transition-colors duration-300"
              style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
            >
              <span className="text-xl">🎯</span>
              <div>
                <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>The IaC Blueprint Vision</h4>
                <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
                  Instead of pushing buttons, administrators deploy, audit, and trace their entire Saviynt governance footprint through pure declarative code files.
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col gap-6 justify-between">
            <div 
              className="rounded-2xl border p-6 space-y-4 flex-1"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Who Envizor Is For</h3>
              <div className="space-y-4 pt-2">
                <div className="flex gap-3">
                  <span className="text-lg">🛡️</span>
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Security Administrators</h4>
                    <p className="text-[11px] leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>
                      Standardize client setups, enforce baseline compliance checks, and roll out security rules with zero manual friction.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-lg">🛠️</span>
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>DevOps Engineers</h4>
                    <p className="text-[11px] leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>
                      Integrate enterprise access stacks directly into automated CI/CD deployment pipelines, managing assets like any code framework.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-lg">📊</span>
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Audit &amp; Compliance Officers</h4>
                    <p className="text-[11px] leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>
                      Track modifications on Git repositories with clear diff streams, satisfying regulatory requirements with a continuous audit history.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div 
              className="rounded-2xl border p-6 text-center"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <div className="text-2xl font-black" style={{ color: "var(--accent)" }}>100%</div>
              <div className="text-[10px] uppercase font-bold tracking-wider mt-1" style={{ color: "var(--text-secondary)" }}>Git-Auditable Governance Blueprints</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
