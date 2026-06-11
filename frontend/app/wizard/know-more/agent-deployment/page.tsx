"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function AgentDeploymentPage() {
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
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Agent Deployment Guide</span>
          </div>
        </div>

        {/* Hero Banner */}
        <div
          className="relative overflow-hidden rounded-3xl border p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 shadow-lg"
          style={{
            background: "linear-gradient(135deg, rgba(236,72,153,0.08), rgba(217,70,239,0.04), rgba(0,0,0,0))",
            borderColor: "rgba(236,72,153,0.25)"
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{ background: "radial-gradient(circle at 10% 50%, rgba(236,72,153,0.3) 0%, transparent 60%)" }}
          />
          <div className="relative z-10 flex-1 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <span
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xl"
                style={{ background: "linear-gradient(135deg, #ec4899, #d946ef)", boxShadow: "0 8px 32px rgba(236,72,153,0.4)" }}
              >🤖</span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">Continuous Delivery</span>
                <h2 className="text-2xl font-black text-slate-100">Deploy through Agent (GitOps Pipeline)</h2>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-2xl text-slate-350">
              Managing environments like DEV, PRE, and PROD separately can result in manual setup mismatches. Envizor solves this by providing a fully autonomous, scheduled GitOps deployment pipeline that translates cloud models directly to Git code, runs validation plans, and gates modifications behind an **Ops Team Approval Console**.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {["HCL Harvesting", "Timestamped Branching", "Terraform Init/Plan/Apply", "Ops Approval Gate", "Safety Destroy Rollback"].map(badge => (
                <span
                  key={badge}
                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border"
                  style={{ borderColor: "rgba(236,72,153,0.4)", color: "#f472b6", backgroundColor: "rgba(236,72,153,0.07)" }}
                >{badge}</span>
              ))}
            </div>
          </div>
          <div className="relative z-10 flex-shrink-0 flex flex-col items-center gap-3">
            <div className="relative group overflow-hidden rounded-3xl border-2 border-pink-500/30 bg-slate-950 p-2 shadow-2xl transition-all duration-500 hover:border-pink-500/60 max-w-[260px]">
              <img
                src="/agent_deploy_flow.png"
                alt="Agent Deployment Flow"
                className="w-full rounded-2xl object-cover aspect-square transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 pointer-events-none" />
            </div>
            <span className="text-[10px] font-bold text-pink-400 text-center tracking-wider uppercase">Pipeline Orchestrator Graphic</span>
          </div>
        </div>

        {/* ─── AGENT DEPLOYMENT PIPELINE STEPS ─── */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">Step-by-Step CI/CD Execution</span>
            <h3 className="text-2xl font-black text-slate-100">The 7-Step Deployment Lifecycle</h3>
            <p className="text-xs max-w-2xl mx-auto text-slate-400">
              How the Agent safely processes environments, updates Git repositories, plans changes, and awaits human verification before going live.
            </p>
          </div>

          {/* 3D Infographic Image */}
          <div 
            className="rounded-3xl border overflow-hidden p-6 flex flex-col items-center shadow-2xl transition-all duration-300" 
            style={{ 
              background: "linear-gradient(135deg, #172234 0%, #141f33 50%, #0e1422 100%)", 
              borderColor: "rgba(236, 72, 153, 0.2)",
              boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 20px 0 rgba(236, 72, 153, 0.03)"
            }}
          >
            <img
              src="/agent_deployment_process_flow.png"
              alt="Agent Deployment 7-Step Lifecycle Flowchart"
              className="w-full max-w-4xl object-contain rounded-2xl"
            />
          </div>

          {/* Visual Step Pipeline */}
          <div className="relative text-left">
            {/* Vertical connector line (desktop) */}
            <div className="hidden lg:block absolute left-[39px] top-10 bottom-10 w-[2px] z-0"
              style={{ background: "linear-gradient(to bottom, #ec4899, #d946ef, #a855f7, #6366f1, #3b82f6, #10b981, #ef4444)" }}
            />

            <div className="space-y-3">
              {[
                {
                  step: 1,
                  icon: "🚀",
                  color: "#ec4899",
                  label: "Terraform Initialization (init)",
                  who: "AI Agent",
                  whoColor: "#ec4899",
                  desc: "The agent spins up a secure isolated workspace container and runs 'terraform init' on each tenant's configuration directory, downloading required cloud providers and preparing the remote state backend files.",
                  tags: ["terraform init", "Sandbox Prepare", "Remote State Backend"]
                },
                {
                  step: 2,
                  icon: "🌾",
                  color: "#d946ef",
                  label: "Retrieve Content to HCL Blocks",
                  who: "AI Agent",
                  whoColor: "#d946ef",
                  desc: "The agent crawls and retrieves all active tenant resources from IGA, parsing security settings, database connectors, and application configurations directly into structured HashiCorp Configuration Language (.tf) files.",
                  tags: ["HCL Synthesis", "Metadata Harvesting", "laC Blueprinting"]
                },
                {
                  step: 3,
                  icon: "🌿",
                  color: "#a855f7",
                  label: "Upload Workspace in a New Git Branch",
                  who: "AI Agent",
                  whoColor: "#a855f7",
                  desc: "All compiled Terraform resources are committed to a freshly spawned Git branch. The branch name is tagged with a precise execution timestamp (e.g. deploy-agent-1780799497) and uploaded to the repository.",
                  tags: ["Git Push", "Timestamp Branch", "Audit History"]
                },
                {
                  step: 4,
                  icon: "🔍",
                  color: "#6366f1",
                  label: "Dry-Run Terraform Plan on PRE/PROD",
                  who: "AI Agent",
                  whoColor: "#6366f1",
                  desc: "The agent runs 'terraform plan' against target PRE and PROD cloud configurations, comparing the new Git code against active cloud state to calculate exactly what will be added, changed, or destroyed.",
                  tags: ["terraform plan", "Drift Delta Map", "Target: PRE/PROD"]
                },
                {
                  step: 5,
                  icon: "🛡️",
                  color: "#3b82f6",
                  label: "Ops Team Approval Gate (PAUSE)",
                  who: "Ops Team",
                  whoColor: "#3b82f6",
                  desc: "The pipeline automatically pauses. The plan dry-run output is displayed on the Ops Team Plan Inspector console. Execution halts until manual validation is submitted.",
                  tags: ["Manual Gate", "Plan Inspector", "Zero-Trust Verification"]
                },
                {
                  step: 6,
                  icon: "✓",
                  color: "#10b981",
                  label: "Ops Approves: Terraform Apply to PRE/PROD",
                  who: "AI Agent",
                  whoColor: "#10b981",
                  desc: "If the Ops team clicks 'Approve & Apply', the agent immediately resumes the deployment run, running 'terraform apply' to write variables, roles, and endpoints live to PRE/PROD cloud instances.",
                  tags: ["terraform apply", "Production Release", "Synchronized State"]
                },
                {
                  step: 7,
                  icon: "✕",
                  color: "#ef4444",
                  label: "Ops Rejects: Safety Destroy & Revert",
                  who: "AI Agent",
                  whoColor: "#ef4444",
                  desc: "If the Ops team rejects the plan ('Reject & Destroy'), the agent instantly executes a rollback/destroy routine to safely tear down the staging configurations and restore the original state.",
                  tags: ["Safety Rollback", "State Guard", "Auto-Clean"]
                }
              ].map((s) => (
                <div key={s.step} className="relative flex gap-4 items-start">
                  {/* Step Number Circle */}
                  <div className="relative z-10 flex-shrink-0 w-20 flex flex-col items-center gap-1">
                    <div
                      className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-xl font-black shadow-lg border-2 transition-all duration-300"
                      style={{
                        background: `${s.color}18`,
                        borderColor: `${s.color}60`,
                        boxShadow: `0 0 16px ${s.color}22`
                      }}
                    >
                      {s.icon}
                    </div>
                    <div className="text-[9px] font-black tracking-widest uppercase" style={{ color: s.color }}>Step {s.step}</div>
                  </div>

                  {/* Content Card */}
                  <div
                    className="flex-1 rounded-2xl border p-4 space-y-2 transition-all duration-300 hover:scale-[1.005]"
                    style={{
                      backgroundColor: `${s.color}06`,
                      borderColor: `${s.color}25`
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-100">{s.label}</h4>
                        <span
                          className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border"
                          style={{ borderColor: `${s.whoColor}40`, color: s.whoColor, backgroundColor: `${s.whoColor}10` }}
                        >{s.who}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {s.tags.map(t => (
                          <span
                            key={t}
                            className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                            style={{ borderColor: `${s.color}30`, color: `${s.color}cc`, backgroundColor: `${s.color}08` }}
                          >{t}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-slate-350">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Queue Split Clarification Section */}
        <div
          className="rounded-2xl border p-6 md:p-8 space-y-6 text-left"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">Closed-Loop Auditing</span>
            <h3 className="text-lg font-black text-slate-100">Saviynt Queue Separation Design</h3>
            <p className="text-xs text-slate-400 leading-normal">
              To achieve regulatory compliance and clean operations interfaces, Envizor divides the provisioning lifecycle into two distinct modules:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="border border-amber-500/20 bg-amber-950/5 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <span>⚡</span> 1. Saviynt Provision Operations Queue
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Designed to show **Pending Actions Only** (`status === 'PENDING'`). This table serves as a real-time mailbox of out-of-band updates generated inside Saviynt's analytics engine waiting for the agent to pull and reconcile on schedule.
              </p>
            </div>

            <div className="border border-emerald-500/20 bg-emerald-950/5 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <span>✓</span> 2. Agent Actions on Target Systems
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Designed to show **Completed Actions &amp; Logs** (`status === 'COMPLETED'`). Renders all historically resolved operations, allowing administrators to expand any action to view the detailed agent stdout browser simulation logs.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center pt-2">
          <Link
            href="/wizard/deploy-agent"
            className="px-8 py-3 rounded-xl font-black uppercase tracking-wider text-sm text-white shadow-2xl transition-all duration-300 hover:scale-[1.04] active:scale-95 cursor-pointer border text-center"
            style={{
              background: "linear-gradient(135deg, #ec4899, #d946ef)",
              borderColor: "rgba(236,72,153,0.4)",
              boxShadow: "0 8px 32px rgba(236,72,153,0.35)"
            }}
          >
            🤖 Launch Deployment Agent Dashboard →
          </Link>
        </div>

      </div>
    </div>
  );
}
