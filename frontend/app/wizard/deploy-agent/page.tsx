"use client";

import { useState, useEffect, useRef } from "react";
import Day0Shell from "../day0/Day0Shell";

type AuditLog = {
  id: string;
  timestamp: string;
  flow: string;
  branch: string;
  status: "SUCCESS" | "REJECTED" | "RUNNING" | "PENDING_APPROVAL";
  durationMs: number;
  logs: string[];
};

type ActiveRun = {
  id: string;
  flow: "DEV -> PRE" | "PRE -> PROD";
  status: "idle" | "running" | "pending_approval" | "applying" | "destroying" | "success" | "rejected";
  step: "init" | "retrieve" | "upload" | "plan" | "approval" | "apply" | "destroy" | "completed";
  branch: string;
  logs: string[];
  planOutput: string;
  timestamp: string;
  durationMs: number;
};

export default function DeployThroughAgent() {
  const [schedules, setSchedules] = useState({ devToPre: "*/15 * * * *", preToProd: "0 0 * * *" });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  
  // Local state form tracking
  const [selectedFlow, setSelectedFlow] = useState<"DEV -> PRE" | "PRE -> PROD">("DEV -> PRE");
  const [devToPreCron, setDevToPreCron] = useState("*/15 * * * *");
  const [preToProdCron, setPreToProdCron] = useState("0 0 * * *");
  
  // UI status feedbacks
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [modalLog, setModalLog] = useState<AuditLog | null>(null);
  
  const [guideExpanded, setGuideExpanded] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("envizor_guide_deploy");
      if (stored === "false") {
        setGuideExpanded(false);
      }
    }
  }, []);

  const toggleGuide = () => {
    const newVal = !guideExpanded;
    setGuideExpanded(newVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("envizor_guide_deploy", String(newVal));
    }
  };
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load backend state on mount and set polling interval
  const loadState = async () => {
    try {
      const res = await fetch("/api/wizard/deploy-agent");
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules);
        setAuditLogs(data.auditLogs);
        setActiveRun(data.activeRun);
        
        // Populate local form controls if not dirty
        if (data.schedules) {
          setDevToPreCron(data.schedules.devToPre);
          setPreToProdCron(data.schedules.preToProd);
        }
      }
    } catch (err) {
      console.error("Failed to load deploy agent state:", err);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  // Polling loop: poll faster (1s) when agent is active, slower (5s) when idle
  useEffect(() => {
    const isRunning = activeRun && ["running", "applying", "destroying"].includes(activeRun.status);
    const intervalTime = isRunning ? 1000 : 4000;
    
    const interval = setInterval(() => {
      loadState();
    }, intervalTime);

    return () => clearInterval(interval);
  }, [activeRun]);

  // Scroll active terminal to bottom when new logs append
  useEffect(() => {
    if (activeRun && activeRun.logs.length > 0) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeRun?.logs?.length]);

  // Action Handlers
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/wizard/deploy-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "configure_schedule",
          devToPre: devToPreCron,
          preToProd: preToProdCron
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        loadState();
      }
    } catch (err) {
      console.error("Failed to save schedule:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTriggerDeploy = async () => {
    setTriggerLoading(true);
    try {
      const res = await fetch("/api/wizard/deploy-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trigger",
          flow: selectedFlow
        })
      });
      if (res.ok) {
        loadState();
      }
    } catch (err) {
      console.error("Failed to trigger deploy agent:", err);
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const res = await fetch("/api/wizard/deploy-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" })
      });
      if (res.ok) {
        loadState();
      }
    } catch (err) {
      console.error("Failed to approve plan:", err);
    }
  };

  const handleReject = async () => {
    try {
      const res = await fetch("/api/wizard/deploy-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" })
      });
      if (res.ok) {
        loadState();
      }
    } catch (err) {
      console.error("Failed to reject plan:", err);
    }
  };

  const handleResetRun = async () => {
    try {
      const res = await fetch("/api/wizard/deploy-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_run" })
      });
      if (res.ok) {
        loadState();
      }
    } catch (err) {
      console.error("Failed to reset run:", err);
    }
  };

  // Helper translate crons to UI readable schedules
  const getCronDescription = (cron: string) => {
    if (cron === "none" || !cron) return "No Schedule (Ad-hoc / Manual Only)";
    if (cron === "*/15 * * * *") return "Every 15 Minutes";
    if (cron === "0 * * * *") return "Hourly Sync Cycle";
    if (cron === "0 0 * * *") return "Daily Sync at Midnight";
    if (cron === "0 0 * * 0") return "Weekly Sync on Sundays";
    return `Custom Cron: ${cron}`;
  };

  return (
    <Day0Shell
      title="Deploy through Agent"
      subtitle="AI Agent orchestrator: running Terraform plans/applies on DEV -> PRE and PRE -> PROD tenants with built-in Ops controls."
      backTo="/wizard/steps/welcome"
      widthClass="max-w-6xl"
    >
      <div className="space-y-6">
        
        {/* Interactive DevOps Walkthrough Guide */}
        <div className="rounded-2xl border border-pink-500/20 bg-slate-900/40 overflow-hidden shadow-lg transition-all duration-300">
          <div 
            onClick={toggleGuide}
            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-850/50 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📖</span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400">
                  DevOps GitOps Orchestrator Guide
                </h3>
                <p className="text-[10px] text-slate-450 mt-0.5">
                  Follow this guide to configure automation pipelines, trigger Terraform deployments, and inspect approval gates.
                </p>
              </div>
            </div>
            <button 
              type="button" 
              className="text-xs text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1 transition-all"
            >
              {guideExpanded ? "Collapse Guide ▴" : "Expand Guide ▾"}
            </button>
          </div>

          {guideExpanded && (
            <div className="border-t border-slate-850 p-5 bg-slate-950/20 space-y-4 animate-fadeIn">
              <div className="grid md:grid-cols-4 gap-4">
                
                {/* Step 1 */}
                <div className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl p-4 space-y-2.5 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded">
                      Step 1
                    </span>
                    <span className="text-lg">⚙️</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Set Transport Schedules</h4>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    Set automation schedule intervals for transport loops. Click <strong className="text-slate-350">Save Schedule Configurations</strong>.
                  </p>
                  <div className="text-[9px] text-slate-505 pt-1 border-t border-slate-850">
                    <span className="text-pink-400 font-bold">Action:</span> Use inputs under <strong>1. Deployment Flow Schedule Configurations</strong>.
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl p-4 space-y-2.5 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                      Step 2
                    </span>
                    <span className="text-lg">🤖</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Select Flow &amp; Trigger</h4>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    Choose your target deployment flow (e.g. <strong className="text-slate-350">DEV ➔ PRE</strong>) and click <strong className="text-slate-350">Run Deploying Agent 🤖</strong>.
                  </p>
                  <div className="text-[9px] text-slate-505 pt-1 border-t border-slate-850">
                    <span className="text-pink-400 font-bold">Action:</span> Initiate deployment loop under <strong>2. Run Deploying Agent</strong>.
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl p-4 space-y-2.5 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                      Step 3
                    </span>
                    <span className="text-lg">🔍</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Plan Inspector Gate</h4>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    The agent stages HCL configurations in Git and runs a plan dry-run. Inspect proposed changes in the approval console.
                  </p>
                  <div className="text-[9px] text-slate-505 pt-1 border-t border-slate-850">
                    <span className="text-pink-400 font-bold">Action:</span> Click <strong className="text-emerald-400 font-bold">✓ Approve &amp; Apply</strong> or <strong className="text-rose-400 font-bold">✕ Reject</strong>.
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl p-4 space-y-2.5 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Step 4
                    </span>
                    <span className="text-lg">📋</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Terminal &amp; Audit Logs</h4>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    Watch the live progress of Terraform apply in stdout console terminal, and verify run metrics under past logs archive.
                  </p>
                  <div className="text-[9px] text-slate-505 pt-1 border-t border-slate-850">
                    <span className="text-pink-400 font-bold">Action:</span> Scroll terminal or open archives in <strong>3. Deployment Audit Logs</strong>.
                  </div>
                </div>

              </div>

              <div className="rounded-xl border border-pink-500/20 bg-pink-950/15 p-3 flex items-start gap-2.5">
                <span className="text-lg leading-none mt-0.5">💡</span>
                <div className="text-[11px] text-slate-350 leading-relaxed">
                  <strong>Behind the Scenes:</strong> The Envizor GitOps agent handles infrastructure-as-code updates automatically. It clones the Terraform configuration, prepares candidate branches, executes plans, and applies changes securely after approval. This reduces drift, tracks configurations, and preserves security boundaries.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scheduler Configurations Block */}
        <form onSubmit={handleSaveSchedule} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400">1. Deployment Flow Schedule Configurations</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Define synchronization frequencies for automated tenant configuration transport loops.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-1">
            <div className="space-y-1.5">
              <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">DEV ➔ PRE Automation Schedule</label>
              <select
                value={devToPreCron}
                onChange={(e) => setDevToPreCron(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                <option value="none">🚫 No Schedule (Ad-hoc / Manual Only)</option>
                <option value="*/15 * * * *">⏱️ Every 15 minutes</option>
                <option value="0 * * * *">⏱️ Every 1 hour</option>
                <option value="0 0 * * *">📅 Daily (Midnight)</option>
                <option value="0 0 * * 0">📅 Weekly (Sunday)</option>
              </select>
              <span className="text-[10px] text-slate-500 block font-mono pl-1">
                Active Interval: <strong className="text-pink-400/80">{getCronDescription(devToPreCron)}</strong>
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">PRE ➔ PROD Automation Schedule</label>
              <select
                value={preToProdCron}
                onChange={(e) => setPreToProdCron(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                <option value="none">🚫 No Schedule (Ad-hoc / Manual Only)</option>
                <option value="*/15 * * * *">⏱️ Every 15 minutes</option>
                <option value="0 * * * *">⏱️ Every 1 hour</option>
                <option value="0 0 * * *">📅 Daily (Midnight)</option>
                <option value="0 0 * * 0">📅 Weekly (Sunday)</option>
              </select>
              <span className="text-[10px] text-slate-500 block font-mono pl-1">
                Active Interval: <strong className="text-pink-400/80">{getCronDescription(preToProdCron)}</strong>
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saveLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-400 hover:to-indigo-400 shadow-md shadow-pink-500/10 cursor-pointer active:scale-95 transition-all border border-pink-400/30"
            >
              {saveLoading ? "Saving Configuration..." : "Save Schedule Configurations"}
            </button>
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-bold animate-fadeIn">✓ Schedule settings persisted successfully!</span>
            )}
          </div>
        </form>

        {/* Deploy Agent Execution console */}
        <div className="grid md:grid-cols-12 gap-6 items-stretch">
          
          {/* Agent Trigger configuration panel */}
          <div className="md:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg flex flex-col justify-between">
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-pink-400">2. Run Deploying Agent</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Manually trigger a full GitOps deployment loop. The agent will discover tenant metadata, compile HCL files, run terraform plan on target systems, and await approval.
              </p>

              <div className="space-y-1.5">
                <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Select Deployment Target Flow</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "DEV ➔ PRE", value: "DEV -> PRE" },
                    { label: "PRE ➔ PROD", value: "PRE -> PROD" },
                  ].map((flow) => (
                    <button
                      key={flow.value}
                      type="button"
                      disabled={!!activeRun && activeRun.status !== "idle" && activeRun.status !== "success" && activeRun.status !== "rejected"}
                      onClick={() => setSelectedFlow(flow.value as any)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
                        selectedFlow === flow.value
                          ? "bg-pink-500/15 border-pink-500/50 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.15)]"
                          : "bg-slate-950 border-slate-850 text-slate-450 hover:border-slate-700 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      }`}
                    >
                      {flow.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-850 mt-6 space-y-3">
              <button
                type="button"
                disabled={triggerLoading || (!!activeRun && activeRun.status !== "idle" && activeRun.status !== "success" && activeRun.status !== "rejected")}
                onClick={handleTriggerDeploy}
                className="w-full py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-purple-500/15 border border-purple-400/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {triggerLoading ? "Contacting Agent..." : "Run Deploying Agent 🤖"}
              </button>
              
              {activeRun && activeRun.status !== "idle" && (
                <button
                  type="button"
                  onClick={handleResetRun}
                  className="w-full py-2 rounded-xl text-[10px] font-bold uppercase border border-slate-800 bg-slate-950 text-slate-450 hover:bg-slate-900 hover:text-slate-200 transition cursor-pointer"
                >
                  🧹 Reset Run State Console
                </button>
              )}
            </div>
          </div>

          {/* stdout terminal output console */}
          <div className="md:col-span-8 flex flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-lg overflow-hidden min-h-[350px]">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </span>
                <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest ml-2">
                  AI Deploying Agent Stdout console
                </span>
              </div>
              {activeRun && ["running", "applying", "destroying"].includes(activeRun.status) && (
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-pink-400 animate-pulse flex items-center gap-1.5">
                  <span className="animate-spin text-[8px]">⟳</span> Agent Executing...
                </span>
              )}
              {activeRun?.status === "pending_approval" && (
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-400 animate-pulse flex items-center gap-1">
                  ⚠️ Awaiting Ops Approval
                </span>
              )}
            </div>

            <div className="flex-1 p-4 font-mono text-[10.5px] leading-relaxed text-slate-350 overflow-y-auto space-y-1.5 select-text select-all min-h-[220px]">
              {(!activeRun || activeRun.logs.length === 0) ? (
                <div className="text-slate-600 italic select-none">
                  No active execution trace. Click "Run Deploying Agent" above to start the GitOps IaC automation workflow.
                </div>
              ) : (
                activeRun.logs.map((log, idx) => {
                  let cls = "text-slate-300";
                  if (log.startsWith("[ERROR]")) cls = "text-red-400 font-bold";
                  else if (log.startsWith("[SUCCESS]")) cls = "text-emerald-400 font-bold";
                  else if (log.startsWith("[WARN]")) cls = "text-amber-400 font-bold";
                  else if (log.includes("git checkout") || log.includes("git push") || log.includes("terraform plan")) cls = "text-sky-300";
                  
                  return (
                    <div key={idx} className={cls}>
                      {log}
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>

            {/* Simulated Git Staging Branch Indicator */}
            {activeRun && activeRun.branch && (
              <div className="bg-slate-900 border-t border-slate-850 px-4 py-2 text-[10px] text-slate-450 font-mono flex items-center justify-between">
                <span> Staging Git Branch: <strong className="text-slate-200">{activeRun.branch}</strong></span>
                <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400 font-bold">Git Pushed ✓</span>
              </div>
            )}
          </div>
        </div>

        {/* Awaiting Ops approval Plan Inspector modal element */}
        {activeRun && activeRun.status === "pending_approval" && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-955/5 p-5 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-amber-500/20 pb-3 gap-3">
              <div>
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <span>⚠️</span> Staged Plan Approval Request (Request ID: <span className="font-mono text-slate-100">{activeRun.id}</span>)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">The Deploying Agent has staged HCL changes in Git and run a dry-run plan. Ops Team review is required before apply.</p>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer active:scale-95 shadow-md shadow-emerald-500/10 border border-emerald-400"
                >
                  ✓ Approve &amp; Apply
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-2 border border-rose-800 bg-rose-950/20 hover:bg-rose-900/20 text-rose-400 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer active:scale-95"
                >
                  ✕ Reject &amp; Destroy
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Simulated Terraform Plan Stdout</label>
              <pre className="p-4 bg-slate-950 border border-slate-850 rounded-xl font-mono text-[10.5px] leading-relaxed text-slate-300 max-h-[260px] overflow-y-auto shadow-inner select-text select-all">
                {activeRun.planOutput.split("\n").map((line, idx) => {
                  let cls = "text-slate-350";
                  if (line.trim().startsWith("+")) cls = "text-emerald-450 font-semibold";
                  else if (line.trim().startsWith("-")) cls = "text-rose-400";
                  else if (line.trim().startsWith("#")) cls = "text-slate-500";
                  else if (line.includes("Plan:")) cls = "text-amber-400 font-bold";
                  
                  return (
                    <div key={idx} className={cls}>
                      {line}
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        )}

        {/* Audit Logs History */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400">3. Deployment Audit Logs (Last 10 Runs)</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Auditing trace of all automated scheduled syncs and manual agent deployments.</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950/60 shadow-inner">
            <table className="w-full border-collapse text-left text-[11px]">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950 text-slate-450 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Run ID</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Deployment Flow</th>
                  <th className="px-4 py-3">Git Branch</th>
                  <th className="px-4 py-3">Execution Status</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3 text-right">Logs Archive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-medium text-slate-200">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      No past deployment logs found in the audit database.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const isSuccess = log.status === "SUCCESS";
                    return (
                      <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-pink-400">{log.id}</td>
                        <td className="px-4 py-3 text-slate-350 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-slate-200">{log.flow}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[10px]">{log.branch}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                            isSuccess
                              ? "bg-emerald-950/40 text-emerald-450 border-emerald-800/40"
                              : "bg-rose-950/40 text-rose-400 border-rose-800/40"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isSuccess ? "bg-emerald-400" : "bg-rose-500"}`} />
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono font-bold">{Math.round(log.durationMs / 1000)}s</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setModalLog(log)}
                            className="px-2.5 py-1 rounded-lg text-[9.5px] font-bold uppercase bg-slate-900 hover:bg-slate-800 text-slate-350 border border-slate-800 transition cursor-pointer"
                          >
                            Open Stdout
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Stdout Console modal overlay */}
      {modalLog && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn p-4" style={{ backgroundColor: "rgba(0,0,0,0.65)" }}>
          <div className="border border-slate-800 rounded-2xl max-w-3xl w-full bg-slate-950 shadow-2xl relative flex flex-col max-h-[80vh] overflow-hidden animate-scaleIn">
            <div className="flex justify-between items-center bg-slate-900 border-b border-slate-850 px-6 py-4">
              <div className="space-y-0.5">
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-pink-400 font-mono">
                  Stdout Console Archive · {modalLog.id}
                </div>
                <h3 className="text-sm font-bold text-slate-100 uppercase">
                  Flow: {modalLog.flow} ({modalLog.status})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalLog(null)}
                className="text-xs hover:text-white transition cursor-pointer text-slate-450 font-bold border border-slate-800 rounded-full h-7 w-7 flex items-center justify-center hover:bg-slate-900"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 font-mono text-[10.5px] leading-relaxed text-slate-350 space-y-1.5 flex-1 bg-slate-950 select-text select-all">
              {modalLog.logs.map((logLine, idx) => {
                let cls = "text-slate-300";
                if (logLine.startsWith("[ERROR]")) cls = "text-red-400 font-bold";
                else if (logLine.startsWith("[SUCCESS]")) cls = "text-emerald-400 font-bold";
                else if (logLine.startsWith("[WARN]")) cls = "text-amber-400 font-bold";
                return (
                  <div key={idx} className={cls}>
                    {logLine}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-850 bg-slate-900 px-6 py-3 text-[10px] text-slate-450 font-mono flex items-center justify-between select-none">
              <span>Execution branch: <strong className="text-slate-205">{modalLog.branch}</strong></span>
              <button
                type="button"
                onClick={() => setModalLog(null)}
                className="px-4 py-1.5 border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold uppercase rounded-lg text-[9px] transition cursor-pointer"
              >
                Close Output
              </button>
            </div>
          </div>
        </div>
      )}
    </Day0Shell>
  );
}
