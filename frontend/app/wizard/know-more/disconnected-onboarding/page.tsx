"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function DisconnectedOnboardingPage() {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  // ── Disconnected API testing states ──
  const [importConn, setImportConn] = useState<string>("Billing_West_Portal");
  const [importRes, setImportRes] = useState<any>(null);
  const [importLoading, setImportLoading] = useState<boolean>(false);

  const [createTaskId, setCreateTaskId] = useState<string>("TASK-1001");
  const [createConn, setCreateConn] = useState<string>("Billing_West_Portal");
  const [createOp, setCreateOp] = useState<string>("CREATE_ACCOUNT");
  const [createAccount, setCreateAccount] = useState<string>("alice@company.com");
  const [createDetails, setCreateDetails] = useState<string>("Role: Developer");
  const [createRes, setCreateRes] = useState<any>(null);
  const [createLoading, setCreateLoading] = useState<boolean>(false);

  const [executeTaskId, setExecuteTaskId] = useState<string>("TASK-1001");
  const [executeConn, setExecuteConn] = useState<string>("Billing_West_Portal");
  const [executeRes, setExecuteRes] = useState<any>(null);
  const [executeLoading, setExecuteLoading] = useState<boolean>(false);
  const [queryTaskId, setQueryTaskId] = useState<string>("TASK-1001");
  const [queryRes, setQueryRes] = useState<any>(null);
  const [queryLoading, setQueryLoading] = useState<boolean>(false);

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

  // ── Disconnected API testing handlers ──
  const handleTestImport = async () => {
    setImportLoading(true);
    setImportRes(null);
    try {
      const res = await fetch("/api/wizard/disconnected/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionName: importConn }),
      });
      const data = await res.json();
      setImportRes(data);
    } catch (err: any) {
      setImportRes({ error: err.message });
    } finally {
      setImportLoading(false);
    }
  };

  const handleTestCreateTask = async () => {
    setCreateLoading(true);
    setCreateRes(null);
    try {
      const res = await fetch("/api/wizard/disconnected/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          taskId: createTaskId,
          connectionName: createConn,
          operation: createOp,
          accountName: createAccount,
          details: createDetails
        }),
      });
      const data = await res.json();
      setCreateRes(data);
    } catch (err: any) {
      setCreateRes({ error: err.message });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleTestExecuteTask = async () => {
    setExecuteLoading(true);
    setExecuteRes(null);
    try {
      const res = await fetch("/api/wizard/disconnected/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          taskId: executeTaskId,
          connectionName: executeConn
        }),
      });
      const data = await res.json();
      setExecuteRes(data);
    } catch (err: any) {
      setExecuteRes({ error: err.message });
    } finally {
      setExecuteLoading(false);
    }
  };

  const handleTestQueryTask = async () => {
    setQueryLoading(true);
    setQueryRes(null);
    try {
      const res = await fetch(`/api/wizard/disconnected/tasks?taskId=${encodeURIComponent(queryTaskId)}`);
      const data = await res.json();
      setQueryRes(data);
    } catch (err: any) {
      setQueryRes({ error: err.message });
    } finally {
      setQueryLoading(false);
    }
  };

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
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Disconnected Apps Guide</span>
          </div>
        </div>

        {/* Hero Banner */}
        <div
          className="relative overflow-hidden rounded-3xl border p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-lg"
          style={{
            background: "linear-gradient(135deg, rgba(234,88,12,0.08), rgba(194,65,12,0.04), rgba(0,0,0,0))",
            borderColor: "rgba(234,88,12,0.25)"
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{ background: "radial-gradient(circle at 10% 50%, rgba(234,88,12,0.3) 0%, transparent 60%)" }}
          />
          <div className="relative z-10 flex-1 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <span
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xl"
                style={{ background: "linear-gradient(135deg, #ea580c, #c2410c)", boxShadow: "0 8px 32px rgba(234,88,12,0.4)" }}
              >🔌</span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-455" style={{ color: "#f97316" }}>Core Ecosystem</span>
                <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Disconnected Application Onboarding</h2>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              Not every application in your enterprise can be connected to Saviynt via a live API. Legacy mainframe systems, on-premises HR databases, and COTS applications behind firewalls often exist outside of direct IGA reach — creating dangerous <strong style={{ color: "#f97316" }}>identity governance blind spots</strong>.
            </p>
            <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              Envizor's Disconnected Application Onboarding module closes this gap with an autonomous background agent that securely vaults credentials, periodically pulls identity data on a per-application schedule, and reconciles it against your Saviynt IGA platform — fully automatically.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {["AES-256 Credential Vaulting", "Per-App Cron Scheduler", "Autonomous Background Agent", "Saviynt Provisioning Reconciliation"].map(badge => (
                <span
                  key={badge}
                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border"
                  style={{ borderColor: "rgba(234,88,12,0.4)", color: "#f97316", backgroundColor: "rgba(234,88,12,0.07)" }}
                >{badge}</span>
              ))}
            </div>
          </div>
          <div className="relative z-10 flex-shrink-0 flex flex-col items-center gap-3">
            <div className="w-32 h-32 rounded-3xl border flex items-center justify-center bg-zinc-950/20"
              style={{ borderColor: "rgba(234,88,12,0.3)" }}>
              <span className="text-6xl">🤖</span>
            </div>
            <span className="text-[10px] font-bold text-orange-400 text-center">Autonomous Sync Agent</span>
          </div>
        </div>

        {/* ─── FULL END-TO-END FLOW DIAGRAM ─── */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-455" style={{ color: "#f97316" }}>End-to-End Autonomous Flow</span>
            <h3 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>How It All Works — 11 Steps</h3>
            <p className="text-xs max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              From registering an app all the way to Saviynt being fully synced and changes in the app reflected back — fully autonomous, on a 15-minute cycle.
            </p>
          </div>

          {/* Visual Step Pipeline & Explanation */}
          <div className="space-y-8">
            <div 
              className="rounded-3xl border overflow-hidden p-6 flex flex-col items-center shadow-2xl transition-all duration-300" 
              style={{ 
                background: "linear-gradient(135deg, #283345 0%, #182130 50%, #101825 100%)", 
                borderColor: "rgba(234, 88, 12, 0.2)",
                boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 20px 0 rgba(234, 88, 12, 0.03)"
              }}
            >
              <img
                src="/disconnected_onboarding_process_flow.png"
                alt="Disconnected Onboarding 11-Step Process Flowchart"
                className="w-full max-w-4xl object-contain rounded-2xl"
              />
            </div>

            {/* 3-Column Phase Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              {/* Phase 1 */}
              <div className="space-y-5 p-6 rounded-2xl border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "rgba(234,88,12,0.2)" }}>
                <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <span className="text-xl">⚙️</span>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Steps 1 - 3</span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-400">Phase 1: Setup &amp; Discovery</h4>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[10px] font-bold text-orange-400">1</span>
                      <strong className="text-xs text-slate-200">Register App &amp; Import API</strong>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400 pl-7">
                      Define the app connection properties (URL, vaulted credentials) and schedule settings, or call the dynamic on-demand import API to trigger onboarding scrapes instantly.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[10px] font-bold text-orange-400">2</span>
                      <strong className="text-xs text-slate-200">Auto-Onboard in Saviynt</strong>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400 pl-7">
                      Envizor dynamically provisions the application profile in Saviynt, generating security systems, endpoints, and import profiles without manual administrative overhead.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[10px] font-bold text-orange-400">3</span>
                      <strong className="text-xs text-slate-200">Extract Identity Data</strong>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400 pl-7">
                      The browser scraping agent logs into target systems using vaulted credentials, extracts users, roles, and access parameters, and normalizes it to import CSV files.
                    </p>
                  </div>
                </div>
              </div>

              {/* Phase 2 */}
              <div className="space-y-5 p-6 rounded-2xl border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "rgba(6,182,212,0.2)" }}>
                <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <span className="text-xl">🛡️</span>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Steps 4 - 6</span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400">Phase 2: Governance &amp; Decision</h4>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-400">4</span>
                      <strong className="text-xs text-slate-200">Upload CSV to Saviynt</strong>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400 pl-7">
                      The agent uploads normalized identity CSVs to Saviynt using file transfer APIs to trigger administrative ingestion and sync.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-400">5</span>
                      <strong className="text-xs text-slate-200">Saviynt Active Governance</strong>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400 pl-7">
                      Saviynt ingests the data, bringing the legacy application under active enterprise identity governance, compliance rules, and active certifications.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-400">6</span>
                      <strong className="text-xs text-slate-200">Requests &amp; Decisions</strong>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400 pl-7">
                      Access reviews, self-service access requests, SOD policies, or lifecycle processes (mover, leaver, joiner) inside Saviynt produce approved access change decisions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Phase 3 */}
              <div className="space-y-5 p-6 rounded-2xl border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "rgba(139,92,246,0.2)" }}>
                <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <span className="text-xl">⚡</span>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Steps 7 - 11</span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-violet-400">Phase 3: Execution &amp; Sync</h4>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-400">7</span>
                      <strong className="text-xs text-slate-200">Push Tasks to Queue</strong>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400 pl-7">
                      Approved changes are pushed to Envizor's Tasks API to register pending provisioning tickets in the queue (`disconnected_tasks.json`).
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-400">8 &amp; 9</span>
                      <strong className="text-xs text-slate-200">Trigger Agent &amp; Emulate Write Ops</strong>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400 pl-7">
                      Calling Envizor's execute API invokes the browser emulator to log in to target systems and perform write actions (e.g. creating or deactivating accounts) automatically.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-400">10 &amp; 11</span>
                      <strong className="text-xs text-slate-200">Verification Scan &amp; Complete</strong>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400 pl-7">
                      A post-operation extraction scan pulls the latest state to verify changes. The delta CSV is uploaded to Saviynt, completing the cycle and resolving the ticket.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Architecture Summary */}
        <div
          className="rounded-2xl border p-6 md:p-8 space-y-6"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-455" style={{ color: "#f97316" }}>Architecture</span>
            <h3 className="text-lg font-black text-slate-100">How the Autonomous Agent Works Under the Hood</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Browser Vault", icon: "🔐", desc: "Credentials vaulted in browser storage via AES-256 encryption. Zero-trust security.", color: "#f97316" },
              { label: "API-Triggered", icon: "⚡", desc: "Exposes HTTP endpoints (/import, /tasks) for Saviynt and other systems to trigger actions dynamically.", color: "#8b5cf6" },
              { label: "Persistent JSON", icon: "💾", desc: "Active tasks queue and run logs are stored in a persistent local JSON database, keeping state across reloads.", color: "#06b6d4" },
              { label: "Auto-Archiving", icon: "📦", desc: "Automatically rotates completed tasks (>100) and execution logs (>50 runs) to timestamped archive folders.", color: "#10b981" }
            ].map((item, i) => (
              <div key={item.label} className="relative flex flex-col items-center text-center gap-3">
                {i < 3 && (
                  <div
                    className="hidden md:block absolute top-6 right-0 translate-x-1/2 z-10 text-xs font-bold"
                    style={{ color: "var(--text-muted)" }}
                  >&rarr;</div>
                )}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                  style={{ background: `${item.color}15`, border: `1.5px solid ${item.color}40` }}
                >{item.icon}</div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: item.color }}>{item.label}</div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive API Testing Console */}
        <div
          className="rounded-2xl border p-6 md:p-8 space-y-6 text-left"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "rgba(234,88,12,0.3)" }}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#ea580c" }}>Developer Playground</span>
            <h3 className="text-lg font-black text-slate-100">🔌 Live API Testing Console</h3>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Test the new external integration endpoints in real time. Executions will modify the local JSON database, trigger the Saviynt client emulator, and populate active tasks/audit logs!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. IMPORT API */}
            <div className="p-5 rounded-xl border space-y-4" style={{ background: "rgba(234,88,12,0.02)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <span className="text-base">📥</span>
                <div className="flex-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-orange-455" style={{ color: "#f97316" }}>Trigger App Import</h4>
                  <code className="text-[10px] font-mono text-slate-400">POST /api/wizard/disconnected/import</code>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400">Connection / Application Name</label>
                <input
                  type="text"
                  value={importConn}
                  onChange={(e) => setImportConn(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border text-xs font-mono bg-slate-950 text-slate-200"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <button
                onClick={handleTestImport}
                disabled={importLoading}
                className="w-full py-2 rounded-lg font-black uppercase tracking-wider text-xs text-white bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 transition-colors duration-200 cursor-pointer"
              >
                {importLoading ? "Executing Scrape..." : "Trigger Import Scrape"}
              </button>
              {importRes && (
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-500">Response</span>
                  <pre className="text-[10px] font-mono rounded-lg p-3 overflow-x-auto max-h-40" style={{ background: "#0a0a12", color: "#34d399", border: "1px solid rgba(234,88,12,0.15)" }}>
                    <code>{JSON.stringify(importRes, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* 2. REGISTER TASK (TICKET) API */}
            <div className="p-5 rounded-xl border space-y-4" style={{ background: "rgba(139,92,246,0.02)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <span className="text-base">🎫</span>
                <div className="flex-1">
                  <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: "#a78bfa" }}>Register Provisioning Ticket</h4>
                  <code className="text-[10px] font-mono text-slate-400">POST /api/wizard/disconnected/tasks (create)</code>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400">Task ID</label>
                  <input
                    type="text"
                    value={createTaskId}
                    onChange={(e) => setCreateTaskId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono bg-slate-950 text-slate-200"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400">Connection Name</label>
                  <input
                    type="text"
                    value={createConn}
                    onChange={(e) => setCreateConn(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono bg-slate-950 text-slate-200"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400">Operation</label>
                  <select
                    value={createOp}
                    onChange={(e) => setCreateOp(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono bg-slate-950 text-slate-200"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <option value="CREATE_ACCOUNT">CREATE_ACCOUNT</option>
                    <option value="ADD_ACCESS">ADD_ACCESS</option>
                    <option value="DISABLE_ACCOUNT">DISABLE_ACCOUNT</option>
                    <option value="REMOVE_ACCESS">REMOVE_ACCESS</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400">Account Name</label>
                  <input
                    type="text"
                    value={createAccount}
                    onChange={(e) => setCreateAccount(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono bg-slate-950 text-slate-200"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400">Details</label>
                <input
                  type="text"
                  value={createDetails}
                  onChange={(e) => setCreateDetails(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border text-xs bg-slate-950 text-slate-200"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <button
                onClick={handleTestCreateTask}
                disabled={createLoading}
                className="w-full py-2 rounded-lg font-black uppercase tracking-wider text-xs text-white bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 transition-colors duration-200 cursor-pointer"
              >
                {createLoading ? "Registering..." : "Register Ticket"}
              </button>
              {createRes && (
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-500">Response</span>
                  <pre className="text-[10px] font-mono rounded-lg p-3 overflow-x-auto max-h-40" style={{ background: "#0a0a12", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.15)" }}>
                    <code>{JSON.stringify(createRes, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* 3. EXECUTE TASK API */}
            <div className="p-5 rounded-xl border space-y-4" style={{ background: "rgba(6,182,212,0.02)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <span className="text-base">⚡</span>
                <div className="flex-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400">Execute Provisioning Task</h4>
                  <code className="text-[10px] font-mono text-slate-400">POST /api/wizard/disconnected/tasks (execute)</code>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400">Task ID to Run</label>
                  <input
                    type="text"
                    value={executeTaskId}
                    onChange={(e) => setExecuteTaskId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border text-xs font-mono bg-slate-950 text-slate-200"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400">Connection Name</label>
                  <input
                    type="text"
                    value={executeConn}
                    onChange={(e) => setExecuteConn(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border text-xs font-mono bg-slate-950 text-slate-200"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
              </div>
              <button
                onClick={handleTestExecuteTask}
                disabled={executeLoading}
                className="w-full py-2 rounded-lg font-black uppercase tracking-wider text-xs text-white bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 transition-colors duration-200 cursor-pointer"
              >
                {executeLoading ? "Executing Task..." : "Execute Task on Legacy App"}
              </button>
              {executeRes && (
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-500">Response &amp; Logs</span>
                  <pre className="text-[10px] font-mono rounded-lg p-3 overflow-x-auto max-h-40" style={{ background: "#0a0a12", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.15)" }}>
                    <code>{JSON.stringify(executeRes, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* 4. QUERY TASK API */}
            <div className="p-5 rounded-xl border space-y-4" style={{ background: "rgba(16,185,129,0.02)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <span className="text-base">🔍</span>
                <div className="flex-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">Query Task Status</h4>
                  <code className="text-[10px] font-mono text-slate-400">GET /api/wizard/disconnected/tasks?taskId=...</code>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400">Task ID to Query</label>
                <input
                  type="text"
                  value={queryTaskId}
                  onChange={(e) => setQueryTaskId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border text-xs font-mono bg-slate-950 text-slate-200"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <button
                onClick={handleTestQueryTask}
                disabled={queryLoading}
                className="w-full py-2 rounded-lg font-black uppercase tracking-wider text-xs text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 transition-colors duration-200 cursor-pointer"
              >
                {queryLoading ? "Querying..." : "Check Task Status"}
              </button>
              {queryRes && (
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-500">Response</span>
                  <pre className="text-[10px] font-mono rounded-lg p-3 overflow-x-auto max-h-40" style={{ background: "#0a0a12", color: "#10b981", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <code>{JSON.stringify(queryRes, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center pt-2">
          <Link
            href="/wizard/disconnected-onboarding"
            className="px-8 py-3 rounded-xl font-black uppercase tracking-wider text-sm text-white shadow-2xl transition-all duration-300 hover:scale-[1.04] active:scale-95 cursor-pointer border text-center"
            style={{
              background: "linear-gradient(135deg, #ea580c, #c2410c)",
              borderColor: "rgba(234,88,12,0.4)",
              boxShadow: "0 8px 32px rgba(234,88,12,0.35)"
            }}
          >
            🔌 Open Disconnected Onboarding Console →
          </Link>
        </div>

      </div>
    </div>
  );
}
