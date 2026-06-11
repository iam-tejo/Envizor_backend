"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function FaqPage() {
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

  const faqs = [
    {
      q: "What is Envizor and why should I care?",
      a: "Envizor is a specialized orchestration wizard that translates manual configuration settings in cloud portals into declarative Infrastructure-as-Code (IaC) blueprints. This makes your environments auditable, eliminates configuration drift, and allows automated deployments."
    },
    {
      q: "Is the scan completely read-only?",
      a: "Yes. All asset discovery, compliance scans, and drift analyses utilize strictly read-only API calls. Modifications are only executed when you explicitly trigger the DevOps Terraform 'apply' command."
    },
    {
      q: "Do I need to be a Terraform expert to use this wizard?",
      a: "Absolutely not! Envizor handles all HCL modular generation, syntax verification, variable bindings, and workspace alignment behind the scenes, allowing you to govern environments visually."
    },
    {
      q: "What is configuration drift?",
      a: "Configuration drift happens when administrators modify security systems, users, or connections directly in cloud portals without documenting the change in state files. Envizor instantly catches these out-of-band changes and alerts you to merge or revert them."
    }
  ];

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

      <div className="max-w-4xl w-full flex flex-col gap-8 relative z-10">
        
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
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">FAQs</span>
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
            <span className="text-2xl text-white">❓</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            Frequently Asked Questions
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Get quick answers to common questions about the Envizor platform, Access-as-Code, and Terraform provider integrations.
          </p>
        </div>

        {/* TAB 4: FREQUENTLY ASKED QUESTIONS CONTENT */}
        <div className="space-y-4 w-full text-left">
          {faqs.map((item, index) => (
            <div 
              key={index} 
              className="rounded-2xl border p-6 space-y-2 transition-colors duration-300 animate-fadeIn"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <h4 className="text-xs font-black uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                Q: {item.q}
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
