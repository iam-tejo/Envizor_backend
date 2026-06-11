"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function VsManualPage() {
  const [activeManualStep, setActiveManualStep] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  // ── Drift Sandbox Simulator States ──
  const [simState, setSimState] = useState<"idle" | "scanning" | "scanned" | "reconciling" | "reconciled" | "synthesizing" | "synthesized" | "deploying" | "deployed">("idle");
  const [simLogs, setSimLogs] = useState<string>(
    `[SYSTEM] Standby. Pipeline idle.\n🔴 ALERT: Saviynt Dev connection parameters out-of-sync! (1 Access Drift Found)\n========================================================================\nClick "1. Trigger Discovery Scan" above to initialize crawler analysis.`
  );

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

  const handleTriggerScan = () => {
    if (simState !== "idle") return;
    setSimState("scanning");
    setSimLogs(`[SYSTEM] Initializing metadata crawler...
[SYSTEM] Connecting to Saviynt SaaS API Endpoint: https://saviynt.dev.internal/api/v1...
[SCANNER] Connecting securely via TLS 1.3...
[SCANNER] Querying active administrative roles & user access permissions...`);

    setTimeout(() => {
      setSimState("scanned");
      setSimLogs((prev) => `${prev}
[SCANNER] Downloading active security policies (158 parsed successfully)...
[SUCCESS] Metadata crawling completed!
⚠️ 1 Security Access policy mismatch identified inside Dev workspace (dev_read_access).
========================================================================
Click "2. Run Reconciler Diff" below to compare SaaS state against Git baseline.`);
    }, 1200);
  };

  const handleRunDiff = () => {
    if (simState !== "scanned") return;
    setSimState("reconciling");
    setSimLogs((prev) => `${prev}

[SYSTEM] Loading current HCL baseline configurations from Git repository...
[RECONCILER] Querying file://git/workspace/governance/dev_access.tf
[RECONCILER] Running semantic comparison: Cloud SaaS Metadata <---> Local Git Workspace HCL...`);

    setTimeout(() => {
      setSimState("reconciled");
      setSimLogs((prev) => `${prev}
[DIFF FOUND] 1 structural deviation detected:
------------------------------------------------------------------------
- Git Baseline (dev_access.tf):
  saviynt_access_rule "dev_read_access" {
    max_lease = 8
  }

+ Live SaaS Configuration:
  saviynt_access_rule "dev_read_access" {
    max_lease = 24
  }
------------------------------------------------------------------------
[SUCCESS] Reconciler comparison completed! Out-of-band change identified.
========================================================================
Click "3. Auto-Compile HCL" to generate standard HCL code to synchronize state.`);
    }, 1200);
  };

  const handleCompileHCL = () => {
    if (simState !== "reconciled") return;
    setSimState("synthesizing");
    setSimLogs((prev) => `${prev}

[SYSTEM] Activating Envizor HCL Code Compiler v2.4.0...
[COMPILER] Analyzing access mismatch attributes...
[COMPILER] Synthesizing declarative HCL structures for dev_read_access...`);

    setTimeout(() => {
      setSimState("synthesized");
      setSimLogs((prev) => `${prev}
[SUCCESS] Declarative HCL baseline generated successfully!
[COMPILER] HCL preview written to temporary buffer memory.
========================================================================
Click "4. Safe DevOps Deploy" to test code and push back up to production.`);
    }, 1200);
  };

  const handleDeployDevOps = () => {
    if (simState !== "synthesized") return;
    setSimState("deploying");
    setSimLogs((prev) => `${prev}

[SYSTEM] Spinning up isolated DevOps deployment container...
[DEVOPS] Initializing Saviynt provider...
[DEVOPS] Running terraform plan --out=tfplan...
[DEVOPS] Plan: 0 to add, 1 to change, 0 to destroy.
[DEVOPS] Pushing HCL commit to Git repository branch main...`);

    setTimeout(() => {
      setSimState("deployed");
      setSimLogs((prev) => `${prev}
[DEVOPS] Running terraform apply tfplan...
[SUCCESS] Deployment complete! State file synchronized with main branch.
🟢 STATUS: 100% Synced. Access Governance-as-Code is healthy!
========================================================================
Drift Resolution Complete! Click "Reset Simulation" to run again.`);
    }, 1500);
  };

  const handleResetSim = () => {
    setSimState("idle");
    setSimLogs(`[SYSTEM] Standby. Pipeline idle.
🔴 ALERT: Saviynt Dev connection parameters out-of-sync! (1 Access Drift Found)
========================================================================
Click "1. Trigger Discovery Scan" above to initialize crawler analysis.`);
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center px-4 md:px-6 py-12 relative overflow-hidden transition-all duration-300 ${
        viewMode === "mobile" ? "view-mode-mobile" : "view-mode-desktop"
      }`}
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <style>{`
        @keyframes pulse-warning-glow {
          0%, 100% { opacity: 0.35; filter: drop-shadow(0 0 2px var(--warning)); }
          50% { opacity: 1; filter: drop-shadow(0 0 10px var(--warning)); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.35; filter: drop-shadow(0 0 2px var(--accent)); }
          50% { opacity: 1; filter: drop-shadow(0 0 10px var(--accent)); }
        }
        .svg-container-responsive {
          width: 100%;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .svg-container-responsive::-webkit-scrollbar {
          display: none;
        }
        .svg-element-wide {
          min-width: 800px;
        }
      `}</style>

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
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Manual vs. Envizor</span>
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
            <span className="text-2xl text-white">⚖️</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            Manual vs. Envizor IaC Comparison
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Discover the cost of direct manual administration and run the interactive drift reconciler simulator.
          </p>
        </div>

        {/* TAB: MANUAL VS ENVIZOR */}
        <div className="space-y-12 animate-fadeIn">
          {/* Introductory Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest border border-rose-500/20 px-3 py-1 rounded-full bg-rose-500/5 text-rose-400">
              ⚠️ Operational Risk Comparison
            </span>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              The Heavy Cost of Manual Administration
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              What happens if Envizor is not present? Trace the multi-day, manual access governance pipeline. See the visual layout of human bottlenecks, structural drift, and the lockout risks that Envizor eliminates.
            </p>
          </div>

          {/* Stepper Navigation for Manual Blocks */}
          <div className="flex flex-col gap-6">
            <div 
              className="flex justify-center border-b p-1 rounded-xl max-w-4xl mx-auto w-full transition-colors duration-300 shadow-md"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-panel)" }}
            >
              {[
                { id: 1, label: "Block 1: Scraping", icon: "🔌" },
                { id: 2, label: "Block 2: Drift Compare", icon: "🔍" },
                { id: 3, label: "Block 3: Coding HCL", icon: "⚙️" },
                { id: 4, label: "Block 4: Direct Deploy", icon: "🚀" }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveManualStep(s.id)}
                  className="flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                  style={
                    activeManualStep === s.id
                      ? { backgroundColor: "var(--warning)", color: "#000000" }
                      : { color: "var(--text-secondary)" }
                  }
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* BLOCK STAGE 1: MANUAL API DISCOVERY */}
          {activeManualStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
              <div 
                className="lg:col-span-7 rounded-2xl border p-6 flex flex-col gap-6"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
              >
                <div className="space-y-1">
                  <span className="text-[9px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-wide text-rose-400" style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}>
                    Manual Block 01 • High Latency Scraping
                  </span>
                  <h3 className="text-xl font-black mt-2" style={{ color: "var(--text-primary)" }}>
                    Manual API Data Extraction &amp; Excel Exports
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Administrators must configure custom API calls via Postman or manually run table exports inside the Saviynt SaaS browser console to retrieve raw JSON configurations.
                  </p>
                </div>

                <div className="rounded-xl border p-4 flex flex-col items-center justify-center relative transition-colors duration-300" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                  <svg className="w-full h-36" viewBox="0 0 500 130">
                    <defs>
                      <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 0 2 L 8 5 L 0 8 z" fill="rgba(239, 68, 68, 1)" />
                      </marker>
                    </defs>

                    <rect x="20" y="35" width="110" height="60" rx="12" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="75" y="63" fill="var(--text-primary)" fontSize="10" fontWeight="extrabold" textAnchor="middle">☁️ Saviynt Cloud</text>
                    <text x="75" y="79" fill="var(--text-muted)" fontSize="8" textAnchor="middle">API Interface</text>
                    <rect x="25" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                    <text x="75" y="20" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">☁️ TARGET: Active Tenant</text>

                    <path d="M 370 50 L 138 50" stroke="var(--border)" strokeWidth="1" fill="none" strokeDasharray="3,3" markerEnd="url(#arrow-red)" />
                    <path d="M 370 50 L 138 50" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="1.5" fill="none" strokeDasharray="5,15" className="animate-flow-rev" markerEnd="url(#arrow-red)" />
                    <text x="250" y="44" fill="var(--warning)" fontSize="7.5" fontWeight="bold" textAnchor="middle">1. Manual curl/Postman request (Human-invoked)</text>

                    <path d="M 130 80 L 362 80" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-red)" />
                    <path d="M 130 80 L 362 80" stroke="rgba(239, 68, 68, 0.8)" strokeWidth="2.5" fill="none" strokeDasharray="8,20" className="animate-flow" markerEnd="url(#arrow-red)" />
                    <text x="250" y="93" fill="var(--warning)" fontSize="7.5" fontWeight="bold" textAnchor="middle">2. Raw JSON download (to messy spreadsheet)</text>
                  </svg>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11.5px] font-bold" style={{ color: "var(--text-primary)" }}>Manual Pain Point</h4>
                  <span className="text-[9px] border px-2 py-0.5 rounded font-bold uppercase tracking-widest text-rose-450" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                    Excel Scraping
                  </span>
                </div>
                <div className="p-4 rounded-xl border text-xs leading-relaxed space-y-2" style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)" }}>
                  <p className="font-bold text-rose-400">⏱️ Typical Delay: 2-4 Hours</p>
                  <p style={{ color: "var(--text-secondary)" }}>
                    Instead of continuous scans, files are pulled manually during off-hours, resulting in immediately outdated views of active rules.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* BLOCK STAGE 2: DRIFT COMPARISON */}
          {activeManualStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
              <div 
                className="lg:col-span-7 rounded-2xl border p-6 flex flex-col gap-6"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
              >
                <div className="space-y-1">
                  <span className="text-[9px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-wide text-rose-400" style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}>
                    Manual Block 02 • Visually Blind Comparison
                  </span>
                  <h3 className="text-xl font-black mt-2" style={{ color: "var(--text-primary)" }}>
                    Line-by-Line Visual Reconciliations
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Admins open baseline code on one side and raw spreadsheet data on the other, scanning thousands of lines manually. Highly error-prone and slow.
                  </p>
                </div>

                {/* HIGH-FIDELITY ANIMATED SVG */}
                <div className="rounded-xl border p-4 flex flex-col items-center justify-center relative transition-colors duration-300" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                  <svg className="w-full h-40" viewBox="0 0 500 150">
                    <defs>
                      <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 0 2 L 8 5 L 0 8 z" fill="rgba(239, 68, 68, 1)" />
                      </marker>
                    </defs>

                    <rect x="20" y="20" width="125" height="40" rx="8" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="82.5" y="44" fill="var(--text-secondary)" fontSize="9" fontWeight="bold" textAnchor="middle">📄 Raw Excel Export</text>
                    <rect x="32.5" y="5" width="100" height="12" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                    <text x="82.5" y="13" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">☁️ SOURCE A (Excel)</text>

                    <rect x="20" y="90" width="125" height="40" rx="8" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="82.5" y="114" fill="var(--text-secondary)" fontSize="9" fontWeight="bold" textAnchor="middle">📦 Code Baseline</text>
                    <rect x="32.5" y="75" width="100" height="12" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                    <text x="82.5" y="83" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">💾 SOURCE B (Manual HCL)</text>

                    <path d="M 145 40 L 230 40 L 275 75" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-red)" />
                    <path d="M 145 40 L 230 40 L 275 75" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-red)" />

                    <path d="M 145 110 L 230 110 L 275 75" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-red)" />
                    <path d="M 145 110 L 230 110 L 275 75" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-red)" />

                    <circle cx="310" cy="75" r="30" fill="var(--bg-surface)" stroke="rgba(239, 68, 68, 1)" strokeWidth="2" style={{ animation: "pulse-warning-glow 2s infinite" }} />
                    <text x="310" y="71" fill="rgba(239, 68, 68, 1)" fontSize="8" fontWeight="black" textAnchor="middle" style={{ letterSpacing: "0.1em" }}>Visual</text>
                    <text x="310" y="83" fill="rgba(239, 68, 68, 1)" fontSize="8" fontWeight="black" textAnchor="middle" style={{ letterSpacing: "0.1em" }}>RECONCILE</text>
                    <rect x="260" y="115" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="rgba(239, 68, 68, 1)" strokeWidth="1" />
                    <text x="310" y="125" fill="rgba(239, 68, 68, 1)" fontSize="7" fontWeight="black" textAnchor="middle">⚠️ HUMAN EYES</text>

                    <path d="M 340 75 L 394 75" stroke="var(--border)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-red)" />
                    <path d="M 340 75 L 394 75" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-red)" />

                    <rect x="400" y="50" width="85" height="50" rx="8" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="442.5" y="74" fill="var(--text-primary)" fontSize="8.5" fontWeight="bold" textAnchor="middle">🧠 Mental Strain</text>
                    <text x="442.5" y="86" fill="rgba(239, 68, 68, 1)" fontSize="7.5" fontWeight="bold" textAnchor="middle">(High Fatigue)</text>
                    <rect x="392.5" y="35" width="100" height="12" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                    <text x="442.5" y="43" fill="rgba(239, 68, 68, 1)" fontSize="7" fontWeight="bold" textAnchor="middle">🚨 OVERLOOKS DRIFT</text>
                  </svg>
                  <span className="text-[9px] uppercase tracking-wider font-bold block mt-1" style={{ color: "var(--warning)" }}>
                    ▲ Visual inspection misses nested drifts in configurations, creating operational exposures
                  </span>
                </div>
              </div>

              {/* Left Side: Payload / Code Block */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11.5px] font-bold" style={{ color: "var(--text-primary)" }}>Typical visual comparison headache</h4>
                  <span className="text-[9px] border px-2 py-0.5 rounded font-bold uppercase tracking-widest text-rose-455" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                    Manual Text Diff
                  </span>
                </div>
                <pre 
                  className="p-4 rounded-xl border font-mono text-[10.5px] leading-relaxed shadow-inner max-h-[380px] overflow-auto transition-colors duration-300 w-full"
                  style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--warning)" }}
                >
                  <code>{`# Manual terminal text file compare:
# Left: live_scanned_v3.json | Right: workspace_baseline.tf
# Admin must scroll and scan differences:

< "connection_timeout": 300,
---
> connection_timeout = 600

< "auth_method": "saml2_endpoint_api",
---
> auth_method = "saml2_old_deprecated"  # DRIFT! Easy to miss!`}</code>
                </pre>
              </div>
            </div>
          )}

          {/* BLOCK STAGE 3: MANUAL HCL CODING */}
          {activeManualStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
              <div 
                className="lg:col-span-7 rounded-2xl border p-6 flex flex-col gap-6"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
              >
                <div className="space-y-1">
                  <span className="text-[9px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-wide text-rose-400" style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}>
                    Manual Block 03 • Error-Prone Code Synthesis
                  </span>
                  <h3 className="text-xl font-black mt-2" style={{ color: "var(--text-primary)" }}>
                    Manual HCL Writing &amp; Parameter Mapping
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Administrators must manually write `.tf` declarative files, copy-pasting API tokens and user IDs, leading to invalid structure and simple typos.
                  </p>
                </div>

                {/* HIGH-FIDELITY ANIMATED SVG */}
                <div className="rounded-xl border p-4 flex flex-col items-center justify-center relative transition-colors duration-300" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                  <svg className="w-full h-36" viewBox="0 0 500 130">
                    <defs>
                      <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 0 2 L 8 5 L 0 8 z" fill="rgba(239, 68, 68, 1)" />
                      </marker>
                    </defs>

                    <rect x="20" y="35" width="110" height="60" rx="12" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="75" y="63" fill="var(--text-secondary)" fontSize="10" fontWeight="bold" textAnchor="middle">🧠 Manual Memory</text>
                    <text x="75" y="79" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Draft Ideas</text>
                    <rect x="25" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                    <text x="75" y="20" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">🧠 SOURCE: Human Intellect</text>

                    <path d="M 130 65 L 214 65" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-red)" />
                    <path d="M 130 65 L 214 65" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-red)" />

                    <polygon points="220,40 280,65 220,90" fill="var(--bg-panel)" stroke="rgba(239, 68, 68, 1)" strokeWidth="2" />
                    <text x="245" y="68" fill="rgba(239, 68, 68, 1)" fontSize="8" fontWeight="black" textAnchor="middle">KEYBOARD</text>
                    <rect x="195" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="rgba(239, 68, 68, 1)" strokeWidth="1" />
                    <text x="245" y="20" fill="rgba(239, 68, 68, 1)" fontSize="7.5" fontWeight="black" textAnchor="middle">⚠️ MANUAL TYPING</text>

                    <path d="M 280 65 L 364 65" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-red)" />
                    <path d="M 280 65 L 364 65" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-red)" />

                    <rect x="370" y="35" width="110" height="60" rx="12" fill="var(--bg-surface)" stroke="rgba(239, 68, 68, 1)" strokeWidth="1.5" />
                    <text x="425" y="63" fill="rgba(239, 68, 68, 1)" fontSize="9.5" fontWeight="extrabold" textAnchor="middle">📝 Typo HCL File</text>
                    <text x="425" y="79" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Syntax Errors Inside</text>
                    <rect x="375" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="rgba(239, 68, 68, 1)" strokeWidth="1" />
                    <text x="425" y="20" fill="rgba(239, 68, 68, 1)" fontSize="7.5" fontWeight="bold" textAnchor="middle">🚨 HIGH SYNTAX RISK</text>
                  </svg>
                  <span className="text-[9px] uppercase tracking-wider font-bold block mt-1" style={{ color: "var(--warning)" }}>
                    ▲ Typing .tf files manually invites formatting typos and invalid block references
                  </span>
                </div>
              </div>

              {/* Left Side: Payload / Code Block */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11.5px] font-bold" style={{ color: "var(--text-primary)" }}>Typical manual HCL typing typo</h4>
                  <span className="text-[9px] border px-2 py-0.5 rounded font-bold uppercase tracking-widest text-rose-400" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                    Invalid HCL
                  </span>
                </div>
                <pre 
                  className="p-4 rounded-xl border font-mono text-[10.5px] leading-relaxed shadow-inner max-h-[380px] overflow-auto transition-colors duration-300 w-full"
                  style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--warning)" }}
                >
                  <code>{`# Manual typing mistake:
resource "saviynt_connection" "dev" {
  connection_name = "dev-connection"
  timeout         = "600s" # Typo: should be integer 600!
  
  # Error: Mismatched brace - missing closing bracket!
  # This causes compiler crash on run!
  auth_config {
    client_id     = "dev-client-id"
    # missing endpoint definition
  
}`}</code>
                </pre>
              </div>
            </div>
          )}

          {/* BLOCK STAGE 4: DEVOPS PIPELINE */}
          {activeManualStep === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
              <div 
                className="lg:col-span-7 rounded-2xl border p-6 flex flex-col gap-6"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
              >
                <div className="space-y-1">
                  <span className="text-[9px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-wide text-rose-400" style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}>
                    Manual Block 04 • Unsecured Deploy Prompt
                  </span>
                  <h3 className="text-xl font-black mt-2" style={{ color: "var(--text-primary)" }}>
                    Direct Terminal Deployments &amp; Lockout Risks
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Administrators invoke `terraform apply` straight from their local terminal, bypassing continuous integration pipelines, state locking safeguards, or validation protocols.
                  </p>
                </div>

                {/* HIGH-FIDELITY ANIMATED SVG */}
                <div className="rounded-xl border p-4 flex flex-col items-center justify-center relative transition-colors duration-300" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                  <svg className="w-full h-40" viewBox="0 0 500 150">
                    <defs>
                      <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 0 2 L 8 5 L 0 8 z" fill="rgba(239, 68, 68, 1)" />
                      </marker>
                    </defs>

                    <rect x="15" y="45" width="100" height="60" rx="10" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="65" y="73" fill="var(--text-primary)" fontSize="9" font-weight="bold" textAnchor="middle">Admin Laptop</text>
                    <text x="65" y="87" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Unsecured Prompt</text>
                    <rect x="20" y="20" width="90" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                    <text x="65" y="30" fill="var(--text-muted)" fontSize="7.5" fontWeight="bold" textAnchor="middle">⚠️ UNTRACKED APPLY</text>

                    <path d="M 115 75 L 172 75" stroke="var(--border)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-red)" />
                    <path d="M 115 75 L 172 75" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-red)" />

                    <circle cx="230" cy="75" r="45" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                    <circle cx="230" cy="75" r="45" fill="none" stroke="rgba(239, 68, 68, 1)" strokeWidth="3" strokeDasharray="20,130" strokeDashoffset="0" className="animate-flow" />

                    <circle cx="230" cy="30" r="13" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="230" y="33" fill="rgba(239, 68, 68, 1)" fontSize="6.5" fontWeight="black" textAnchor="middle">BYPASS</text>

                    <circle cx="275" cy="75" r="13" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="275" y="78" fill="rgba(239, 68, 68, 1)" fontSize="6.5" fontWeight="black" textAnchor="middle">CRASH</text>

                    <circle cx="230" cy="120" r="13" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="230" y="123" fill="rgba(239, 68, 68, 1)" fontSize="6.5" fontWeight="black" textAnchor="middle">LOCK</text>

                    <circle cx="185" cy="75" r="13" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="185" y="78" fill="rgba(239, 68, 68, 1)" fontSize="6.5" fontWeight="black" textAnchor="middle">DRIFT</text>

                    <rect x="180" y="2" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="rgba(239, 68, 68, 1)" strokeWidth="1" />
                    <text x="230" y="12" fill="rgba(239, 68, 68, 1)" fontSize="7.5" fontWeight="black" textAnchor="middle">🔥 DIRECT CLS</text>

                    <path d="M 288 75 L 370 75" stroke="var(--border)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-red)" />
                    <path d="M 288 75 L 370 75" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-red)" />

                    <rect x="375" y="45" width="110" height="60" rx="10" fill="var(--bg-surface)" stroke="rgba(239, 68, 68, 1)" strokeWidth="2" style={{ animation: "pulse-warning-glow 2s infinite" }} />
                    <text x="430" y="73" fill="rgba(239, 68, 68, 1)" fontSize="9.5" fontWeight="extrabold" textAnchor="middle">☁️ Lockout Cloud</text>
                    <text x="430" y="87" fill="var(--text-muted)" fontSize="8" textAnchor="middle">No verification checks</text>
                    <rect x="380" y="20" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="rgba(239, 68, 68, 1)" strokeWidth="1" />
                    <text x="430" y="30" fill="rgba(239, 68, 68, 1)" fontSize="7" fontWeight="bold" textAnchor="middle">💥 STATE CORRUPTION</text>
                  </svg>
                  <span className="text-[9px] uppercase tracking-wider font-bold block mt-1" style={{ color: "var(--warning)" }}>
                    ▲ Running untracked deployments bypasses safety compliance, risking lockout disasters and state mismatches
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11.5px] font-bold" style={{ color: "var(--text-primary)" }}>Untracked Terminal Apply Crash</h4>
                  <span className="text-[9px] border px-2 py-0.5 rounded font-bold uppercase tracking-widest text-rose-400" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                    Terminal Out
                  </span>
                </div>
                <pre 
                  className="p-4 rounded-xl border font-mono text-[10.5px] leading-relaxed shadow-inner max-h-[380px] overflow-auto transition-colors duration-300 w-full"
                  style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--warning)" }}
                >
                  <code>{`$ terraform apply -auto-approve

Error: Resource creation failed
  SaaS endpoint returned HTTP 403 Forbidden:
  "Client account locked out due to invalid variables"

# State file is corrupted!
# Access rules are out-of-sync!
# Multi-hour downtime recovery active.`}</code>
                </pre>
              </div>
            </div>
          )}

          {/* HIGH-FIDELITY SIDE-BY-SIDE COMPARISON TABLE */}
          <div 
            className="rounded-2xl border p-6 shadow-lg space-y-6"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="space-y-1">
              <h4 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>⚖️ Envizor Automation vs. Manual Pain Comparison</h4>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Compare the metrics, timeline, and risk profiles of Envizor Access-as-Code automation side-by-side with manual, visual administration.
              </p>
            </div>

            {viewMode === "mobile" && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 self-start px-1 animate-pulse">
                <span>📱</span> Swipe horizontally to compare full metrics
              </div>
            )}

            <div className="overflow-x-auto w-full scrollbar-none">
              <table 
                className="w-full text-left text-xs border-collapse border rounded-xl overflow-hidden transition-all duration-300" 
                style={{ 
                  borderColor: "var(--border)",
                  minWidth: viewMode === "mobile" ? "620px" : "auto"
                }}
              >
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-base)" }}>
                    <th className="p-3 font-bold uppercase border-r text-[10px] tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Operational Metric</th>
                    <th className="p-3 font-bold uppercase border-r text-[10px] tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>🔌 Manual Operations</th>
                    <th className="p-3 font-bold uppercase text-[10px] tracking-wider" style={{ color: "var(--text-secondary)" }}>🚀 Envizor Pipeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {[
                    {
                      metric: "⏱️ Speed to Value",
                      manual: "3 to 5 Days (Postman setup, spreadsheets, typing)",
                      envizor: "Under 3 Seconds (Automated discovery)"
                    },
                    {
                      metric: "🔍 Drift Resolution Accuracy",
                      manual: "Visual scanning (Misses nested properties, high fatigue)",
                      envizor: "Automated engine scan (100% accurate lines)"
                    },
                    {
                      metric: "📝 Code Synthesis Quality",
                      manual: "Typed from scratch (Formatting typos, invalid loops)",
                      envizor: "Auto-Synthesized HCL (Valid structures, zero typos)"
                    },
                    {
                      metric: "🛡️ Deployment Safety Guard",
                      manual: "Direct terminal run (Locks out accounts, out of sync states)",
                      envizor: "Enforced CI Plan/Apply (Peer reviews, auto-verification)"
                    },
                    {
                      metric: "🌐 Audit Trail & Compliance logs",
                      manual: "Bypassed (Messy slack links, local temporary folders)",
                      envizor: "100% Git-logged (Transparent enterprise auditable changes)"
                    }
                  ].map((row, idx) => (
                    <tr key={idx} className="transition-all hover:bg-black/[0.08]" style={{ borderColor: "var(--border)" }}>
                      <td className="p-3.5 font-bold border-r text-xs" style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}>
                        {row.metric}
                      </td>
                      <td className="p-3.5 border-r text-[11px]" style={{ borderColor: "var(--border)" }}>
                        <span 
                          className="px-2.5 py-1 rounded text-[9.5px] font-bold uppercase tracking-wider block text-center border"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.08)",
                            borderColor: "rgba(239, 68, 68, 0.25)",
                            color: "var(--warning)"
                          }}
                        >
                          {row.manual}
                        </span>
                      </td>
                      <td className="p-3.5 text-[11px]">
                        <span 
                          className="px-2.5 py-1 rounded text-[9.5px] font-bold uppercase tracking-wider block text-center border"
                          style={{
                            backgroundColor: "rgba(16, 185, 129, 0.08)",
                            borderColor: "rgba(16, 185, 129, 0.25)",
                            color: "var(--success)"
                          }}
                        >
                          {row.envizor}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* INTERACTIVE DRIFT SANDBOX SIMULATOR */}
          <div 
            className="rounded-2xl border p-6 flex flex-col gap-6 relative overflow-hidden transition-colors duration-300"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            {/* Header block with glowing status indicator */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6" style={{ borderColor: "var(--border)" }}>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎮</span>
                  <span className="text-[10px] font-black uppercase tracking-wider border px-2 py-0.5 rounded-full" 
                    style={{ 
                      backgroundColor: simState === "deployed" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)", 
                      borderColor: simState === "deployed" ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)",
                      color: simState === "deployed" ? "var(--success)" : "var(--warning)"
                    }}
                  >
                    Interactive Playpen Sandbox
                  </span>
                </div>
                <h3 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
                  Interactive Drift Sandbox Simulator
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Experience the real-time Envizor state alignment engine resolving cloud drift. Click the steps to proceed.
                </p>
              </div>

              {/* Pulse Status Hub */}
              <div 
                className="px-4 py-2.5 rounded-xl border flex items-center gap-3 w-full md:w-auto transition-all"
                style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
              >
                <div className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    simState === "deployed" ? "bg-emerald-400" :
                    simState === "idle" ? "bg-rose-400" : "bg-amber-400"
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${
                    simState === "deployed" ? "bg-emerald-500" :
                    simState === "idle" ? "bg-rose-500" : "bg-amber-500"
                  }`}></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Pipeline Status</span>
                  <span className="text-xs font-black font-mono" style={{ 
                    color: simState === "deployed" ? "var(--success)" : 
                           simState === "idle" ? "var(--warning)" : "var(--accent)"
                  }}>
                    {simState === "idle" && "🔴 1 Drift Detected"}
                    {simState === "scanning" && "🟡 Crawling Tenant API..."}
                    {simState === "scanned" && "🟡 Metadata Loaded"}
                    {simState === "reconciling" && "🟡 Generating Diff..."}
                    {simState === "reconciled" && "🟡 Diff Calculated"}
                    {simState === "synthesizing" && "🟡 Compiling HCL..."}
                    {simState === "synthesized" && "🟡 HCL Compiled"}
                    {simState === "deploying" && "🚀 Releasing HCL..."}
                    {simState === "deployed" && "🟢 100% Synced"}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full rounded-xl border p-4 flex flex-col items-center relative svg-container-responsive" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
              {viewMode === "mobile" && (
                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest self-start mb-1 animate-pulse">📱 Swipe horizontally to view full pipeline</span>
              )}
              <span className="text-[9px] font-bold uppercase tracking-wider mb-3 block self-start" style={{ color: "var(--text-secondary)" }}>
                Dynamic Pipeline Visualizer
              </span>
              
              <svg className="w-full max-w-4xl h-24 svg-element-wide" viewBox="0 0 800 80">
                <defs>
                  <marker id="arrow-gray" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#4B5563" />
                  </marker>
                  <marker id="arrow-glow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
                  </marker>
                  <linearGradient id="grad-active" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="var(--warning)" />
                  </linearGradient>
                </defs>

                <line 
                  x1="115" y1="40" x2="265" y2="40" 
                  stroke={simState !== "idle" && simState !== "scanning" ? "var(--accent)" : "#4B5563"} 
                  strokeWidth="2.5" 
                  strokeDasharray={simState === "scanning" ? "6, 4" : "none"}
                  className={simState === "scanning" ? "animate-[dash_1s_linear_infinite]" : ""}
                  markerEnd={simState !== "idle" && simState !== "scanning" ? "url(#arrow-glow)" : "url(#arrow-gray)"}
                />

                <line 
                  x1="335" y1="40" x2="465" y2="40" 
                  stroke={["reconciled", "synthesizing", "synthesized", "deploying", "deployed"].includes(simState) ? "var(--accent)" : "#4B5563"} 
                  strokeWidth="2.5" 
                  strokeDasharray={simState === "reconciling" ? "6, 4" : "none"}
                  className={simState === "reconciling" ? "animate-[dash_1s_linear_infinite]" : ""}
                  markerEnd={["reconciled", "synthesizing", "synthesized", "deploying", "deployed"].includes(simState) ? "url(#arrow-glow)" : "url(#arrow-gray)"}
                />

                <line 
                  x1="535" y1="40" x2="665" y2="40" 
                  stroke={["synthesized", "deploying", "deployed"].includes(simState) ? "var(--accent)" : "#4B5563"} 
                  strokeWidth="2.5" 
                  strokeDasharray={simState === "synthesizing" ? "6, 4" : "none"}
                  className={simState === "synthesizing" ? "animate-[dash_1s_linear_infinite]" : ""}
                  markerEnd={["synthesized", "deploying", "deployed"].includes(simState) ? "url(#arrow-glow)" : "url(#arrow-gray)"}
                />

                <g transform="translate(80, 40)" className="cursor-pointer" onClick={handleTriggerScan}>
                  <circle 
                    r="30" 
                    fill="var(--bg-surface)" 
                    stroke={simState === "scanning" ? "url(#grad-active)" : ["scanned", "reconciling", "reconciled", "synthesizing", "synthesized", "deploying", "deployed"].includes(simState) ? "var(--success)" : "var(--border)"} 
                    strokeWidth={simState === "scanning" ? "3" : "2"} 
                    className={simState === "scanning" ? "animate-[pulse_1.5s_infinite]" : ""}
                  />
                  <text textAnchor="middle" y="-2" className="text-[10px] font-black" fill={simState !== "idle" ? "var(--text-primary)" : "var(--text-secondary)"}>1. SCAN</text>
                  <text textAnchor="middle" y="12" className="text-[8px] font-mono" fill={["scanned", "reconciling", "reconciled", "synthesizing", "synthesized", "deploying", "deployed"].includes(simState) ? "var(--success)" : "var(--text-secondary)"}>
                    {["scanned", "reconciling", "reconciled", "synthesizing", "synthesized", "deploying", "deployed"].includes(simState) ? "✓ Done" : "SaaS API"}
                  </text>
                </g>

                <g transform="translate(300, 40)" className="cursor-pointer" onClick={handleRunDiff}>
                  <circle 
                    r="30" 
                    fill="var(--bg-surface)" 
                    stroke={simState === "reconciling" ? "url(#grad-active)" : ["reconciled", "synthesizing", "synthesized", "deploying", "deployed"].includes(simState) ? "var(--success)" : "var(--border)"} 
                    strokeWidth={simState === "reconciling" ? "3" : "2"} 
                    className={simState === "reconciling" ? "animate-[pulse_1.5s_infinite]" : ""}
                  />
                  <text textAnchor="middle" y="-2" className="text-[10px] font-black" fill={["reconciled", "synthesizing", "synthesized", "deploying", "deployed", "reconciling"].includes(simState) ? "var(--text-primary)" : "var(--text-secondary)"}>2. DIFF</text>
                  <text textAnchor="middle" y="12" className="text-[8px] font-mono" fill={["reconciled", "synthesizing", "synthesized", "deploying", "deployed"].includes(simState) ? "var(--success)" : "var(--text-secondary)"}>
                    {["reconciled", "synthesizing", "synthesized", "deploying", "deployed"].includes(simState) ? "✓ Calculated" : "Reconcile"}
                  </text>
                </g>

                <g transform="translate(500, 40)" className="cursor-pointer" onClick={handleCompileHCL}>
                  <circle 
                    r="30" 
                    fill="var(--bg-surface)" 
                    stroke={simState === "synthesizing" ? "url(#grad-active)" : ["synthesized", "deploying", "deployed"].includes(simState) ? "var(--success)" : "var(--border)"} 
                    strokeWidth={simState === "synthesizing" ? "3" : "2"} 
                    className={simState === "synthesizing" ? "animate-[pulse_1.5s_infinite]" : ""}
                  />
                  <text textAnchor="middle" y="-2" className="text-[10px] font-black" fill={["synthesized", "deploying", "deployed", "synthesizing"].includes(simState) ? "var(--text-primary)" : "var(--text-secondary)"}>3. HCL</text>
                  <text textAnchor="middle" y="12" className="text-[8px] font-mono" fill={["synthesized", "deploying", "deployed"].includes(simState) ? "var(--success)" : "var(--text-secondary)"}>
                    {["synthesized", "deploying", "deployed"].includes(simState) ? "✓ Compiled" : "Synthesis"}
                  </text>
                </g>

                <g transform="translate(700, 40)" className="cursor-pointer" onClick={handleDeployDevOps}>
                  <circle 
                    r="30" 
                    fill="var(--bg-surface)" 
                    stroke={simState === "deploying" ? "url(#grad-active)" : simState === "deployed" ? "var(--success)" : "var(--border)"} 
                    strokeWidth={simState === "deploying" ? "3" : "2"} 
                    className={simState === "deploying" ? "animate-[pulse_1.5s_infinite]" : ""}
                  />
                  <text textAnchor="middle" y="-2" className="text-[10px] font-black" fill={simState === "deployed" ? "var(--text-primary)" : "var(--text-secondary)"}>4. DEPLOY</text>
                  <text textAnchor="middle" y="12" className="text-[8px] font-mono" fill={simState === "deployed" ? "var(--success)" : "var(--text-secondary)"}>
                    {simState === "deployed" ? "✓ Synced" : "Release"}
                  </text>
                </g>
              </svg>

              <style dangerouslySetInnerHTML={{__html: `
                @keyframes dash {
                  to {
                    stroke-dashoffset: -20;
                  }
                }
              `}} />
            </div>

            {/* Playground Control Center / Step Triggers */}
            <div className={`grid gap-3 ${viewMode === "mobile" ? "grid-cols-2" : "grid-cols-2 md:grid-cols-5"}`}>
              <button
                onClick={handleTriggerScan}
                disabled={simState !== "idle"}
                className="py-2.5 px-3 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: simState === "idle" ? "var(--accent)" : "transparent",
                  color: simState === "idle" ? "#ffffff" : "var(--text-secondary)",
                  borderColor: simState === "idle" ? "var(--accent)" : "var(--border)"
                }}
              >
                <span>📡</span>
                <span>1. Trigger Scan</span>
              </button>

              <button
                onClick={handleRunDiff}
                disabled={simState !== "scanned"}
                className="py-2.5 px-3 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: simState === "scanned" ? "var(--warning)" : "transparent",
                  color: simState === "scanned" ? "#000000" : "var(--text-secondary)",
                  borderColor: simState === "scanned" ? "var(--warning)" : "var(--border)"
                }}
              >
                <span>🔍</span>
                <span>2. Run Diff</span>
              </button>

              <button
                onClick={handleCompileHCL}
                disabled={simState !== "reconciled"}
                className="py-2.5 px-3 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: simState === "reconciled" ? "var(--accent)" : "transparent",
                  color: simState === "reconciled" ? "#ffffff" : "var(--text-secondary)",
                  borderColor: simState === "reconciled" ? "var(--accent)" : "var(--border)"
                }}
              >
                <span>📝</span>
                <span>3. Compile HCL</span>
              </button>

              <button
                onClick={handleDeployDevOps}
                disabled={simState !== "synthesized"}
                className="py-2.5 px-3 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: simState === "synthesized" ? "var(--success)" : "transparent",
                  color: simState === "synthesized" ? "#ffffff" : "var(--text-secondary)",
                  borderColor: simState === "synthesized" ? "var(--success)" : "var(--border)"
                }}
              >
                <span>🚀</span>
                <span>4. Deploy</span>
              </button>

              <button
                onClick={handleResetSim}
                className="col-span-2 md:col-span-1 py-2.5 px-3 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: "transparent",
                  color: "var(--text-primary)",
                  borderColor: "var(--border)"
                }}
              >
                <span>🔄</span>
                <span>Reset Sim</span>
              </button>
            </div>

            {/* Playground Terminal & Editor Visuals */}
            <div className={`grid gap-6 ${viewMode === "mobile" ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
              {/* Left Pane: Retro Console Terminal */}
              <div className="flex flex-col rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <div className="flex justify-between items-center px-4 py-2 bg-black/45 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-bold font-mono tracking-wider ml-1 text-zinc-400">bash • Envizor CLI Terminal</span>
                  </div>
                  <span className="text-[8px] font-mono uppercase bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">SIMULATOR ACTIVE</span>
                </div>

                <div className="p-4 bg-[#0B0F19] text-zinc-300 font-mono text-[10.5px] leading-relaxed h-64 overflow-y-auto whitespace-pre-wrap select-all relative">
                  {simLogs}
                  <span className="animate-ping inline-block w-1.5 h-3 ml-0.5 bg-zinc-300 align-middle">_</span>
                </div>
              </div>

              {/* Right Pane: Auto-Generated HCL Code Editor Block */}
              <div className="flex flex-col rounded-xl border overflow-hidden relative" style={{ borderColor: "var(--border)" }}>
                {!["synthesizing", "synthesized", "deploying", "deployed"].includes(simState) && (
                  <div className="absolute inset-0 bg-[#0F172A]/75 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
                    <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-3">
                      <span className="text-lg">🔒</span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-200">HCL Target Editor Locked</h4>
                    <p className="text-[10px] text-zinc-400 max-w-[240px] mt-1.5">
                      Trigger **Step 1 (Scan)** and **Step 2 (Diff)** first. The compiler will generate the HCL block in **Step 3**.
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center px-4 py-2 bg-black/45 border-b border-white/5 z-20">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">💻</span>
                    <span className="text-[10px] font-bold font-mono tracking-wider text-zinc-400">dev_access.tf</span>
                  </div>
                  {["deployed", "deploying"].includes(simState) ? (
                    <span className="text-[8px] font-mono uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                      <span>✓</span> PUSHED &amp; COMPILED
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono uppercase bg-amber-950/80 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                      {simState === "synthesizing" ? "COMPILING..." : "AWAITING CODE"}
                    </span>
                  )}
                </div>

                <div className="p-4 bg-[#0F172A] text-zinc-300 font-mono text-[10.5px] leading-relaxed h-64 overflow-y-auto z-0 select-all">
                  <div className="text-zinc-500 italic mb-2"># Auto-generated by Envizor Access-as-Code Engine</div>
                  <div className="text-zinc-500 italic"># Source: Saviynt Dev Workspace Drift Reconciler</div>
                  <br />
                  <div>
                    <span className="text-indigo-400">resource</span>{" "}
                    <span className="text-emerald-400">"saviynt_access_rule"</span>{" "}
                    <span className="text-amber-400">"dev_read_access"</span> {"{"}
                  </div>
                  <div className="pl-4">
                    <span className="text-sky-400">name</span> = <span className="text-emerald-400">"Dev Read Access Rule"</span>
                  </div>
                  <div className="pl-4">
                    <span className="text-sky-400">description</span> = <span className="text-emerald-400">"Managed role for temporary database read privileges"</span>
                  </div>
                  <div className="pl-4">
                    <span className="text-sky-400">max_lease</span> = <span className="text-amber-400">24</span> <span className="text-zinc-500 italic"># Unified with Live SaaS</span>
                  </div>
                  <div className="pl-4">
                    <span className="text-sky-400">approval_workflow</span> = <span className="text-emerald-400">"auto-approve"</span>
                  </div>
                  <div className="pl-4">
                    <span className="text-sky-400">policy_tier</span> = <span className="text-emerald-400">"standard-dev"</span>
                  </div>
                  <div>{"}"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
