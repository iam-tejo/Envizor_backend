"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function KnowMorePage() {
  const [activeTab, setActiveTab] = useState<"mission" | "process" | "no-wizard" | "capabilities" | "terraform" | "faq">("mission");
  const [activeTfResource, setActiveTfResource] = useState<string>("security_system");
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeManualStep, setActiveManualStep] = useState<number>(1);
  const [diagramMode, setDiagramMode] = useState<"topology" | "pipeline">("topology");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  // ── Access Control & Gating States ──
  const [userRole, setUserRole] = useState<string>("BasicUser");
  const [userName, setUserName] = useState<string>("admin");
  const [userPermissions, setUserPermissions] = useState<string[]>(["tile-know-more"]);
  const [showAccessModal, setShowAccessModal] = useState<boolean>(false);
  const [modalTileLabel, setModalTileLabel] = useState<string>("");
  const [modalTileId, setModalTileId] = useState<string>("");
  const [justification, setJustification] = useState<string>("");
  const [requestedScope, setRequestedScope] = useState<string>("DEV_Admin");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

      // Hydrate user permissions
      const user = sessionStorage.getItem("envizor_username") || "admin";
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";
      
      setUserRole(latestRole);
      setUserName(user);
      
      try {
        const allPerms = JSON.parse(localStorage.getItem("envizor_user_permissions") || "{}");
        const userPerms = allPerms[user.toLowerCase()] || ["tile-know-more"];
        setUserPermissions(userPerms);
      } catch (err) {
        console.error("Failed to parse user permissions:", err);
      }

      return () => window.removeEventListener("envizorViewModeChange", handleViewModeChange);
    }
  }, []);

  const getPathTileId = (path: string): string => {
    if (path.includes("/wizard/day0-setup")) return "tile-day0-setup";
    if (path.includes("/wizard/day0/diff")) return "tile-iga-explorer";
    if (path.includes("/wizard/pull")) return "tile-terraform-wizard";
    if (path.includes("/wizard/push")) return "tile-terraform-wizard";
    if (path.includes("/wizard/home")) return "tile-terraform-wizard";
    return "";
  };

  const getPathTileLabel = (path: string): string => {
    if (path.includes("/wizard/day0-setup")) return "Day 0 Setup";
    if (path.includes("/wizard/day0/diff")) return "IGA Tenants Explorer (Reconciler Diff)";
    if (path.includes("/wizard/pull")) return "DevOps Terraform Wizard (HCL Compiler)";
    if (path.includes("/wizard/push")) return "DevOps Terraform Wizard (Safe Deploy)";
    if (path.includes("/wizard/home")) return "DevOps Terraform Wizard";
    return "Feature Tile";
  };

  const isTargetLocked = (path: string): boolean => {
    if (userRole === "SuperAdmin") return false;
    const tileId = getPathTileId(path);
    if (!tileId) return false;
    return !userPermissions.includes(tileId);
  };

  const handleTargetLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (isTargetLocked(path)) {
      e.preventDefault();
      setModalTileLabel(getPathTileLabel(path));
      setModalTileId(getPathTileId(path));
      setJustification("");
      setRequestedScope("DEV_Admin");
      setSuccessMessage(null);
      setShowAccessModal(true);
    }
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTileId) return;
    setIsSubmitting(true);

    const existingReqs = localStorage.getItem("envizor_access_requests");
    const reqs = existingReqs ? JSON.parse(existingReqs) : [];

    const newRequest = {
      id: `ACC-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      username: userName,
      tileId: modalTileId,
      tileName: modalTileLabel,
      requestedRole: requestedScope,
      justification: justification.trim(),
      status: "PENDING"
    };

    reqs.push(newRequest);
    localStorage.setItem("envizor_access_requests", JSON.stringify(reqs));

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage("✅ Access request queued! Awaiting SuperAdmin approval.");
      setTimeout(() => {
        setShowAccessModal(false);
      }, 1500);
    }, 800);
  };

  // ── Drift Sandbox Simulator States ──
  const [simState, setSimState] = useState<"idle" | "scanning" | "scanned" | "reconciling" | "reconciled" | "synthesizing" | "synthesized" | "deploying" | "deployed">("idle");
  const [simLogs, setSimLogs] = useState<string>(
    `[SYSTEM] Standby. Pipeline idle.\n🔴 ALERT: Saviynt Dev connection parameters out-of-sync! (1 Access Drift Found)\n========================================================================\nClick "1. Trigger Discovery Scan" above to initialize crawler analysis.`
  );

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
[DEVOPS] Initializing Saviynt Terraform provider...
[DEVOPS] Running terraform plan --out=tfplan...
[DEVOPS] Plan: 0 to add, 1 to change, 0 to destroy.
[DEVOPS] Pushing baseline HCL commit to Git repository branch main...`);

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

  // ── Detailed Data Flows for Individual Blocks ──
  const individualFlows = [
    {
      id: 1,
      title: "Flow Block 1: Active Saviynt Tenant Data Extraction",
      subtitle: "REST API Discovery & Metadata Mining",
      icon: "🔌",
      accent: "var(--accent)",
      summary: "Connects securely to active Saviynt SaaS instances, extracting live connection structures, access permissions, security assets, and endpoints with zero manual effort.",
      origin: "Envizor Web Server (Metadata Crawler)",
      target: "Saviynt Remote Tenant API (Read-Only)",
      location: "Local Web Server Memory Buffer",
      changeType: "No changes made (100% Read-Only scan)",
      steps: [
        {
          name: "1. TLS Authentication Handshake",
          detail: "Establishes a cryptographically secure TLS 1.3 handshake with cloud APIs using admin secrets or OAuth tokens."
        },
        {
          name: "2. Introspection Crawler Scan",
          detail: "Launches read-only background scan processes to query active security schemas, API attributes, and database connections."
        },
        {
          name: "3. Compliance Map Generation",
          detail: "Aggregates extracted structures into a standardized JSON configuration graph representing live environment statuses."
        }
      ],
      payloadTitle: "Extracted JSON Metadata Baseline Output",
      payloadLanguage: "json",
      payloadCode: `{
  "tenant_url": "https://saviynt-dev.identity.cloud",
  "scan_timestamp": "2026-05-29T17:30:00Z",
  "discovered_assets": {
    "security_systems": ["HR_DEV", "PAYROLL_DEV"],
    "endpoints": ["HR_API_DEV", "PAYROLL_API_DEV"],
    "connections": ["DEV_DB_CONN"]
  },
  "status": "ready_for_sync"
}`
    },
    {
      id: 2,
      title: "Flow Block 2: High-Speed Drift Comparison",
      subtitle: "State Reconciler & Difference Engine",
      icon: "🔍",
      accent: "var(--warning)",
      summary: "Scans active workspace variables and compares them line-by-line against standard approved baselines to immediately flag unauthorized console changes.",
      origin: "Envizor Comparison Diff Engine",
      target: "Local Memory Index vs. Live Scanned State",
      location: "UI Diff Pane Display (Browser Session)",
      changeType: "No changes written (Pure comparison analysis)",
      steps: [
        {
          name: "1. Hydrate Approved State",
          detail: "Hydrates your local workspace with the last-approved configuration baselines stored securely in repository directories."
        },
        {
          name: "2. Line-by-Line Match Calculation",
          detail: "Compares current variables in DEV, PRE, and PROD configurations, calculating deviations using rapid diff matching engines."
        },
        {
          name: "3. Delta isolation Warning",
          detail: "Isolates and logs unapproved access changes, displaying them in a split-screen layout with amber visual indicators."
        }
      ],
      payloadTitle: "Isolated Access Console Drift Deltas",
      payloadLanguage: "diff",
      payloadCode: `*** Desired approved state (index.tf)
--- Live console scan state (Saviynt Dev)
***************
*** 12,18 ****
  resource "saviynt_connection" "dev_db" {
    name       = "DEV_DB_CONN"
!   auth_type  = "OAUTH2"
!   server_url = "https://safe-gateway.internal"
  }
--- 12,18 ----
  resource "saviynt_connection" "dev_db" {
    name       = "DEV_DB_CONN"
!   auth_type  = "PASSWORD"  <-- DRIFT WARN: Compliance Risk!
!   server_url = "https://unapproved-direct-portal.external"
  }`
    },
    {
      id: 3,
      title: "Flow Block 3: HCL Modular Terraform Code Synthesis",
      subtitle: "Visual Model to Declarative Code Engine",
      icon: "⚙️",
      accent: "var(--accent)",
      summary: "Translates active JSON scan baselines and staged delta reconciliations into highly robust, structured HashiCorp Terraform modules.",
      origin: "Envizor HCL Synthesizer Compiler",
      target: "Local Project Folder Workspace files (*.tf)",
      location: "Local Disk Project Directories (/terraform-workspaces/)",
      changeType: "Updates Local Files on Disk (No cloud modification yet!)",
      steps: [
        {
          name: "1. Schema Resource Binding",
          detail: "Translates complex API responses and databases into standard cloud provider resource declarations."
        },
        {
          name: "2. Parameter Variable Isolation",
          detail: "Extracts hardcoded parameters into isolated variable files (`variables.tf`) so code blueprints are dynamic and reusable."
        },
        {
          name: "3. HCL Code Synthesizer",
          detail: "Compiles access models into declarative `.tf` configuration files, automatically formatting spacing and lints."
        }
      ],
      payloadTitle: "Synthesized Terraform HCL Module",
      payloadLanguage: "hcl",
      payloadCode: `# Generated by Envizor. Access Configuration.
resource "saviynt_endpoint" "payroll" {
  name        = "PAYROLL_API_DEV"
  description = "Synthesized Payroll Secure Access Endpoint"
  active      = true

  connection_profile = saviynt_connection.dev_db.id
  security_system    = "PAYROLL_DEV"
  
  tags = {
    Environment  = "DEV"
    Orchestrator = "Envizor-Wizard"
  }
}`
    },
    {
      id: 4,
      title: "Flow Block 4: Secure DevOps Pipeline Release Execution",
      subtitle: "Continuous Deployment & Governance Engine",
      icon: "🚀",
      accent: "var(--success)",
      summary: "Executes the continuous integration lifecycle workflow, running dry-run plan checks and applying configurations safely to cloud targets.",
      origin: "Local DevOps Pipeline Runner (Terraform CLI)",
      target: "Saviynt Cloud Tenant APIs & Local .tfstate State Logs",
      location: "Live Cloud SaaS Instance & Local Workspace disk",
      changeType: "Modifies Active Cloud Tenants & writes terraform.tfstate",
      steps: [
        {
          name: "1. Workspace Initialization (`init`)",
          detail: "Initializes local backend workspace directories, prepares tracking logs, and downloads necessary cloud provider plugins."
        },
        {
          name: "2. Dry-Run Configuration Preview (`plan`)",
          detail: "Queries target clouds to map out a safe dry-run preview, identifying exact additions, edits, or deletes prior to execution."
        },
        {
          name: "3. State Write Enforcement (`apply`)",
          detail: "Pushes and writes verified configuration parameters directly to active target APIs, ensuring continuous compliance."
        }
      ],
      payloadTitle: "Terraform CLI Execution Runner Outputs",
      payloadLanguage: "bash",
      payloadCode: `$ terraform init
Initializing target workspace directory...
Successfully configured backend "local" state.

$ terraform plan
saviynt_endpoint.payroll: Refreshing state... [id=payroll-01]

Terraform will perform the following actions:
  # saviynt_endpoint.payroll will be updated in-place
  ~ auth_type = "PASSWORD" -> "OAUTH2"
  ~ server_url = "https://unapproved..." -> "https://safe-gateway..."

Plan: 0 to add, 1 to change, 0 to destroy.

$ terraform apply --auto-approve
saviynt_endpoint.payroll: Modifying... [id=payroll-01]
saviynt_endpoint.payroll: Modifications complete.

Apply complete! Resources: 0 added, 1 changed, 0 destroyed.`
    }
  ];

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center px-4 md:px-6 py-12 relative overflow-hidden transition-all duration-300 ${
        viewMode === "mobile" ? "view-mode-mobile" : "view-mode-desktop"
      }`}
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* ── Dynamic Inline CSS Animations ── */}
      <style>{`
        @keyframes flow-horizontal {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes flow-reverse {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 40; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.35; filter: drop-shadow(0 0 2px var(--accent)); }
          50% { opacity: 1; filter: drop-shadow(0 0 10px var(--accent)); }
        }
        @keyframes pulse-warning-glow {
          0%, 100% { opacity: 0.35; filter: drop-shadow(0 0 2px var(--warning)); }
          50% { opacity: 1; filter: drop-shadow(0 0 10px var(--warning)); }
        }
        @keyframes float-pipe {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
          100% { transform: translateY(0px); }
        }
        @keyframes warning-blink {
          0%, 100% { background-color: rgba(245, 158, 11, 0.05); border-color: rgba(245, 158, 11, 0.2); }
          50% { background-color: rgba(245, 158, 11, 0.12); border-color: rgba(245, 158, 11, 0.45); }
        }
        .animate-flow {
          animation: flow-horizontal 1.6s linear infinite;
        }
        .animate-flow-rev {
          animation: flow-reverse 1.6s linear infinite;
        }
        .animate-float {
          animation: float-pipe 3s ease-in-out infinite;
        }

        /* Mobile Switcher Custom Styling overrides */
        .svg-container-responsive {
          width: 100%;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .svg-container-responsive::-webkit-scrollbar {
          display: none;
        }
        .svg-element-responsive {
          width: 100%;
          transition: all 0.3s ease;
        }
        .view-mode-mobile .svg-element-responsive {
          min-width: 480px;
        }
        .view-mode-mobile .svg-element-wide {
          min-width: 800px;
        }
      `}</style>

      {/* ── Background Art Layer ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src="/bg_terraform_code.png"
          alt=""
          className="absolute -top-10 -left-10 w-[550px] opacity-[0.08] select-none pointer-events-none"
          style={{ mixBlendMode: "screen" }}
        />
        <img
          src="/bg_ai_neural.png"
          alt=""
          className="absolute -bottom-10 -right-10 w-[550px] opacity-[0.08] select-none pointer-events-none"
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
            href="/wizard/steps/welcome"
            className="flex items-center gap-2 text-sm font-semibold transition hover:underline"
            style={{ color: "var(--accent)" }}
          >
            <span>←</span> Back to Envizor Hub
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Ecosystem Guide</span>
          </div>
        </div>

        {/* Persistent Sticky Ecosystem Mini-Map & Quick-Navigation Header */}
        <div 
          className={`sticky top-2 z-[90] backdrop-blur-md border rounded-2xl p-3 flex transition-all duration-300 shadow-lg ${
            viewMode === "mobile" 
              ? "flex-col items-stretch gap-2.5" 
              : "flex-col md:flex-row items-center justify-between gap-4"
          }`}
          style={{ 
            backgroundColor: "var(--bg-surface)", 
            borderColor: "var(--border)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)"
          }}
        >
          {viewMode !== "mobile" && (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-xl">🧭</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Ecosystem Navigator</span>
                <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Envizor Active Pipeline Map</span>
              </div>
            </div>
          )}

          {/* Active Mini-Map Dots & Routers */}
          <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none whitespace-nowrap ${
            viewMode === "mobile" ? "justify-start px-1" : "justify-center"
          }`}>
            <Link 
              href="/wizard/day0-setup" 
              onClick={(e) => handleTargetLinkClick(e, "/wizard/day0-setup")}
              className={`px-2.5 py-1 rounded border transition hover:scale-[1.02] cursor-pointer text-white flex-shrink-0 flex items-center gap-1 ${
                isTargetLocked("/wizard/day0-setup") ? "opacity-65 border-dashed" : ""
              }`} 
              style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)", color: "var(--accent)" }}
            >
              {isTargetLocked("/wizard/day0-setup") ? "🔒 " : ""}1. Scan 📡
            </Link>
            <span className="text-slate-500 flex-shrink-0">➔</span>
            <Link 
              href="/wizard/day0/diff" 
              onClick={(e) => handleTargetLinkClick(e, "/wizard/day0/diff")}
              className={`px-2.5 py-1 rounded border transition hover:scale-[1.02] cursor-pointer text-white flex-shrink-0 flex items-center gap-1 ${
                isTargetLocked("/wizard/day0/diff") ? "opacity-65 border-dashed" : ""
              }`} 
              style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)", color: "var(--warning)" }}
            >
              {isTargetLocked("/wizard/day0/diff") ? "🔒 " : ""}2. Reconcile 🔍
            </Link>
            <span className="text-slate-500 flex-shrink-0">➔</span>
            <Link 
              href="/wizard/pull" 
              onClick={(e) => handleTargetLinkClick(e, "/wizard/pull")}
              className={`px-2.5 py-1 rounded border transition hover:scale-[1.02] cursor-pointer text-white flex-shrink-0 flex items-center gap-1 ${
                isTargetLocked("/wizard/pull") ? "opacity-65 border-dashed" : ""
              }`} 
              style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)", color: "var(--accent)" }}
            >
              {isTargetLocked("/wizard/pull") ? "🔒 " : ""}3. Compile ⚙️
            </Link>
            <span className="text-slate-500 flex-shrink-0">➔</span>
            <Link 
              href="/wizard/push" 
              onClick={(e) => handleTargetLinkClick(e, "/wizard/push")}
              className={`px-2.5 py-1 rounded border transition hover:scale-[1.02] cursor-pointer text-white flex-shrink-0 flex items-center gap-1 ${
                isTargetLocked("/wizard/push") ? "opacity-65 border-dashed" : ""
              }`} 
              style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)", color: "var(--success)" }}
            >
              {isTargetLocked("/wizard/push") ? "🔒 " : ""}4. Release 🚀
            </Link>
          </div>

          {/* Sticky Tab Switcher Shortcut */}
          <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-lg border overflow-x-auto max-w-full scrollbar-none whitespace-nowrap" style={{ borderColor: "var(--border)" }}>
            {[
              { id: "mission", label: "Mission" },
              { id: "process", label: "Process" },
              { id: "no-wizard", label: "VS Manual" },
              { id: "capabilities", label: "Specs" },
              { id: "terraform", label: "Terraform" },
              { id: "faq", label: "FAQs" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id as any);
                  setActiveStep(1);
                  setActiveManualStep(1);
                }}
                className="px-2 py-0.5 rounded text-[9.5px] font-bold uppercase transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
                style={
                  activeTab === t.id
                    ? { backgroundColor: "var(--accent)", color: "#ffffff" }
                    : { color: "var(--text-secondary)" }
                }
              >
                {t.label}
              </button>
            ))}
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
            <span className="text-2xl text-white">⚙️</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            Discover Envizor Orchestration
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Why does Envizor exist? Learn how we bridge the gap between complex enterprise Identity Governance (IGA) and pure DevOps Infrastructure-as-Code (IaC).
          </p>
        </div>

        {/* Interactive Tab Navigation bar */}
        <div 
          className={`flex p-1 rounded-xl max-w-2xl mx-auto w-full border shadow-md transition-all duration-300 ${
            viewMode === "mobile" 
              ? "overflow-x-auto scrollbar-none whitespace-nowrap flex-nowrap justify-start" 
              : "justify-center border-b"
          }`}
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-panel)" }}
        >
          <button
            onClick={() => {
              setActiveTab("mission");
              setActiveStep(1);
            }}
            className={`py-1 px-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
              viewMode === "mobile" ? "whitespace-nowrap flex-shrink-0" : "flex-1"
            }`}
            style={
              activeTab === "mission"
                ? { backgroundColor: "var(--accent)", color: "#ffffff" }
                : { color: "var(--text-secondary)" }
            }
          >
            🚀 Mission
          </button>
          <button
            onClick={() => {
              setActiveTab("process");
              setActiveStep(1);
            }}
            className={`py-1 px-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
              viewMode === "mobile" ? "whitespace-nowrap flex-shrink-0" : "flex-1"
            }`}
            style={
              activeTab === "process"
                ? { backgroundColor: "var(--accent)", color: "#ffffff" }
                : { color: "var(--text-secondary)" }
            }
          >
            📈 Process
          </button>
          <button
            onClick={() => {
              setActiveTab("no-wizard");
              setActiveManualStep(1);
            }}
            className={`py-1 px-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
              viewMode === "mobile" ? "whitespace-nowrap flex-shrink-0" : "flex-1"
            }`}
            style={
              activeTab === "no-wizard"
                ? { backgroundColor: "var(--accent)", color: "#ffffff" }
                : { color: "var(--text-secondary)" }
            }
          >
            ⚠️ VS Manual
          </button>
          <button
            onClick={() => {
              setActiveTab("capabilities");
              setActiveStep(1);
            }}
            className={`py-1 px-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
              viewMode === "mobile" ? "whitespace-nowrap flex-shrink-0" : "flex-1"
            }`}
            style={
              activeTab === "capabilities"
                ? { backgroundColor: "var(--accent)", color: "#ffffff" }
                : { color: "var(--text-secondary)" }
            }
          >
            🛡️ Capabilities
          </button>
          <button
            onClick={() => {
              setActiveTab("terraform");
              setActiveStep(1);
            }}
            className={`py-1 px-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
              viewMode === "mobile" ? "whitespace-nowrap flex-shrink-0" : "flex-1"
            }`}
            style={
              activeTab === "terraform"
                ? { background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#ffffff" }
                : { color: "var(--text-secondary)" }
            }
          >
            🔧 Terraform
          </button>
          <button
            onClick={() => {
              setActiveTab("faq");
              setActiveStep(1);
            }}
            className={`py-1 px-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
              viewMode === "mobile" ? "whitespace-nowrap flex-shrink-0" : "flex-1"
            }`}
            style={
              activeTab === "faq"
                ? { backgroundColor: "var(--accent)", color: "#ffffff" }
                : { color: "var(--text-secondary)" }
            }
          >
            ❓ FAQs
          </button>
        </div>

        {/* TAB 1: THE MISSION */}
        {activeTab === "mission" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch animate-fadeIn">
            <div 
              className="md:col-span-7 rounded-2xl border p-8 space-y-6 flex flex-col justify-between"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                  Core Purpose & Challenge
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
                      <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Audit & Compliance Officers</h4>
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
        )}

        {/* TAB 2: INTERACTIVE PROCESS FLOW & TIMELINE */}
        {activeTab === "process" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Step Selection Tabs: 1 to 4 individually, 5 is Summary */}
            <div className="space-y-4">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Governance-as-Code Walkthrough</span>
                <h3 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Ecosystem Pipeline Walkthrough</h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Step through each functional block one-by-one, and explore the complete unified pipeline hierarchy at the end!
                </p>
              </div>

              {/* Dynamic Diagram Selector Toggler */}
              <div 
                className="rounded-2xl border p-5 space-y-4 shadow-md transition-all duration-300 max-w-3xl mx-auto"
                style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--accent)" }}>🗺️ Global System Reference Diagrams</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Toggle between the high-level architecture topology or the detailed file-level data pipelines.</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setDiagramMode("topology")}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border shadow-sm"
                      style={
                        diagramMode === "topology"
                          ? { backgroundColor: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }
                          : { backgroundColor: "var(--bg-surface)", color: "var(--text-secondary)", borderColor: "var(--border)" }
                      }
                    >
                      System Topology Map
                    </button>
                    <button
                      onClick={() => setDiagramMode("pipeline")}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border shadow-sm"
                      style={
                        diagramMode === "pipeline"
                          ? { backgroundColor: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }
                          : { backgroundColor: "var(--bg-surface)", color: "var(--text-secondary)", borderColor: "var(--border)" }
                      }
                    >
                      Detailed Pipeline Chart
                    </button>
                  </div>
                </div>

                {/* Animated Reference Display Frame */}
                <div 
                  className="relative rounded-xl border overflow-hidden bg-black/20 p-2 flex items-center justify-center min-h-[220px]"
                  style={{ borderColor: "var(--border)" }}
                >
                  {diagramMode === "topology" ? (
                    <div className="w-full flex flex-col items-center justify-center p-2 animate-fadeIn">
                      <img 
                        src="/envizor-flow-diagram.png" 
                        alt="Envizor System Topology Flow Map" 
                        className="max-h-[300px] object-contain rounded-lg shadow-lg hover:scale-[1.01] transition-transform duration-300"
                      />
                      <div className="text-[10px] font-medium text-slate-400 mt-2 text-center">
                        🌐 <span className="font-bold text-slate-200">High-Level Topology:</span> Outlines user flows, agent components, and environment scopes (DEV {"→"} PRE {"→"} PROD).
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center p-2 animate-fadeIn">
                      <img 
                        src="/envizor-flow-detailed.png" 
                        alt="Envizor Detailed Data Pipeline Flow Chart" 
                        className="max-h-[300px] object-contain rounded-lg shadow-lg hover:scale-[1.01] transition-transform duration-300"
                      />
                      <div className="text-[10px] font-medium text-slate-400 mt-2 text-center">
                        ⚙️ <span className="font-bold text-slate-200">Detailed Data Flow Chart:</span> Details REST responses, JSON schema conversion variables, compiled HCL artifacts, and state loops.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Functional block stepper bar */}
              <div className="flex justify-center flex-wrap gap-2.5 max-w-3xl mx-auto pt-4">
                {[
                  { step: 1, label: "Block 1: API Scan Discovery", icon: "🔌" },
                  { step: 2, label: "Block 2: Drift Compare Engine", icon: "🔍" },
                  { step: 3, label: "Block 3: HCL Synthesizer", icon: "⚙️" },
                  { step: 4, label: "Block 4: DevOps Pipeline", icon: "🚀" },
                  { step: 5, label: "Pipeline Summary", icon: "🏆" }
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setActiveStep(s.step)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer border flex items-center gap-2 shadow-sm"
                    style={
                      activeStep === s.step
                        ? {
                            backgroundColor: "var(--bg-surface)",
                            borderColor: s.step === 5 ? "var(--success)" : "var(--accent)",
                            color: s.step === 5 ? "var(--success)" : "var(--accent)",
                            boxShadow: `0 2px 10px var(--accent-glow)`
                          }
                        : {
                            backgroundColor: "var(--bg-panel)",
                            borderColor: "var(--border)",
                            color: "var(--text-secondary)"
                          }
                    }
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* BLOCK STAGE 1: API EXTRACTION */}
            {activeStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
                <div 
                  className="lg:col-span-7 rounded-2xl border p-6 flex flex-col gap-6"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div className="space-y-1">
                    <span className="text-[9px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-wide text-cyan-400" style={{ borderColor: "rgba(14, 165, 233, 0.2)" }}>
                      Block 01 • Active Discovery
                    </span>
                    <h3 className="text-xl font-black mt-2" style={{ color: "var(--text-primary)" }}>
                      Active Saviynt Tenant Data Extraction
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Connects securely to active Saviynt SaaS instances, running read-only crawlers to map users, access systems, and security rules with zero impact.
                    </p>
                  </div>

                  {/* HIGH-FIDELITY ANIMATED SVG */}
                  <div className="rounded-xl border p-4 flex flex-col items-center justify-center relative transition-colors duration-300" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                    <svg className="w-full h-36" viewBox="0 0 500 130">
                      <defs>
                        <marker id="arrow-accent" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--accent)" />
                        </marker>
                        <marker id="arrow-warning" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--warning)" />
                        </marker>
                      </defs>

                      {/* Saviynt Cloud Box */}
                      <rect x="20" y="35" width="110" height="60" rx="12" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="75" y="63" fill="var(--text-primary)" fontSize="10" fontWeight="extrabold" textAnchor="middle">☁️ Saviynt Cloud</text>
                      <text x="75" y="79" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Active Tenant API</text>
                      <rect x="25" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                      <text x="75" y="20" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">☁️ TARGET: Tenant (Read-Only)</text>

                      {/* Connection Pipe (Outward Query - right to left) */}
                      <path d="M 370 50 L 138 50" stroke="var(--border)" strokeWidth="1" fill="none" strokeDasharray="3,3" markerEnd="url(#arrow-warning)" />
                      <path d="M 370 50 L 138 50" stroke="var(--warning)" strokeWidth="1.5" fill="none" strokeDasharray="5,15" className="animate-flow-rev" markerEnd="url(#arrow-warning)" />
                      <text x="250" y="44" fill="var(--accent)" fontSize="7.5" fontWeight="bold" textAnchor="middle">1. Scan Request (Originates here {"→"})</text>

                      {/* Returning Data Pipe (Inward Metadata Stream - left to right) */}
                      <path d="M 130 80 L 362 80" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-accent)" />
                      <path d="M 130 80 L 362 80" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeDasharray="8,20" className="animate-flow" markerEnd="url(#arrow-accent)" />
                      <text x="250" y="93" fill="var(--accent)" fontSize="7.5" fontWeight="bold" textAnchor="middle">2. Discovered JSON Streams ({"→"} memory buffer)</text>

                      {/* Envizor Crawler Box */}
                      <rect x="370" y="35" width="110" height="60" rx="12" fill="var(--bg-surface)" stroke="var(--accent)" strokeWidth="2" style={{ animation: "pulse-glow 2.5s infinite" }} />
                      <text x="425" y="63" fill="var(--accent)" fontSize="10" fontWeight="extrabold" textAnchor="middle">🔌 Envizor Crawler</text>
                      <text x="425" y="79" fill="var(--text-muted)" fontSize="8" textAnchor="middle">JSON Scanner</text>
                      <rect x="375" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--accent)" strokeWidth="1" />
                      <text x="425" y="20" fill="var(--accent)" fontSize="7.5" fontWeight="black" textAnchor="middle">📡 CALL ORIGIN</text>
                    </svg>
                    <span className="text-[9px] uppercase tracking-wider font-bold block mt-1" style={{ color: "var(--accent)" }}>
                      ▲ Neon light pulses signify scan queries originating from our crawler, fetching data 100% read-only
                    </span>
                  </div>

                  {/* DYNAMIC OPERATIONAL GOVERNANCE DASHBOARD */}
                  <div 
                    className="p-5 rounded-2xl border space-y-4 transition-all duration-300 shadow-md"
                    style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                  >
                    <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400">🛡️ Operational Boundary & Change Scope</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📡 Request Origin</span>
                          <span className="text-xs font-bold block mt-1" style={{ color: "var(--text-primary)" }}>{individualFlows[0].origin}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Where the underlying connection crawlers and API queries are triggered.</p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">⚙️ Scope Impacted</span>
                          <div className="flex flex-col gap-1.5 mt-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-300">Saviynt SaaS Tenant:</span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-400">❌ Read-Only</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-300">Terraform Workspace:</span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-400">❌ Unmodified</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Distinguishes updates to Live SaaS Cloud versus files stored in Git repositories.</p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📍 Landing Zone</span>
                          <span className="text-xs font-bold block mt-1 text-cyan-400">🧠 {individualFlows[0].location}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">The physical storage tier: memory buffer cache vs. local disk filesystem vs. remote SaaS cloud.</p>
                      </div>
                    </div>

                    <div 
                      className="p-3 rounded-xl border flex items-center gap-2.5 transition-colors duration-300"
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                    >
                      <span className="text-sm">🛡️</span>
                      <span className="text-[10.5px]" style={{ color: "var(--text-secondary)" }}>
                        <strong className="text-cyan-400">Compliance Scope:</strong> {individualFlows[0].changeType}
                      </span>
                    </div>

                    {/* Quick-Launch Router */}
                    <div className="flex justify-end pt-1">
                      <Link
                        href="/wizard/day0-setup"
                        onClick={(e) => handleTargetLinkClick(e, "/wizard/day0-setup")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer text-white ${
                          isTargetLocked("/wizard/day0-setup") ? "opacity-75 border-dashed border border-red-500/40" : ""
                        }`}
                        style={
                          isTargetLocked("/wizard/day0-setup")
                            ? {
                                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                                boxShadow: "none"
                              }
                            : {
                                background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                                boxShadow: "0 4px 12px var(--accent-glow)"
                              }
                        }
                      >
                        <span>{isTargetLocked("/wizard/day0-setup") ? "🔒 " : "📡 "} Launch Discovery Scan</span>
                        <span>➔</span>
                      </Link>
                    </div>
                  </div>

                  {/* Step explanations */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Procedural Flow Steps</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {individualFlows[0].steps.map((s, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <span className="w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)", color: "var(--accent)" }}>
                            {idx + 1}
                          </span>
                          <div>
                            <h5 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{s.name}</h5>
                            <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Terminal box */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11.5px] font-bold" style={{ color: "var(--text-primary)" }}>{individualFlows[0].payloadTitle}</h4>
                    <span className="text-[9px] border px-2 py-0.5 rounded font-bold uppercase tracking-widest" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                      JSON format
                    </span>
                  </div>
                  <pre 
                    className="p-4 rounded-xl border font-mono text-[10.5px] leading-relaxed shadow-inner max-h-[380px] overflow-auto transition-colors duration-300 w-full"
                    style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--code-text)" }}
                  >
                    <code>{individualFlows[0].payloadCode}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* BLOCK STAGE 2: DRIFT COMPARISON */}
            {activeStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
                <div 
                  className="lg:col-span-7 rounded-2xl border p-6 flex flex-col gap-6"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div className="space-y-1">
                    <span className="text-[9px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-wide text-amber-500" style={{ borderColor: "rgba(245, 158, 11, 0.2)" }}>
                      Block 02 • Reconciliation
                    </span>
                    <h3 className="text-xl font-black mt-2" style={{ color: "var(--text-primary)" }}>
                      High-Speed Drift Comparison
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Scans active parameters in DEV, PRE, and PROD configurations, executing fast line-level comparisons to identify portal deviations immediately.
                    </p>
                  </div>

                  {/* HIGH-FIDELITY ANIMATED SVG */}
                  <div className="rounded-xl border p-4 flex flex-col items-center justify-center relative transition-colors duration-300" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                    <svg className="w-full h-40" viewBox="0 0 500 150">
                      <defs>
                        <marker id="arrow-accent" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--accent)" />
                        </marker>
                        <marker id="arrow-warning" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--warning)" />
                        </marker>
                      </defs>

                      {/* Live Scanned State Node */}
                      <rect x="20" y="20" width="125" height="40" rx="8" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="82.5" y="44" fill="var(--text-secondary)" fontSize="9" fontWeight="bold" textAnchor="middle">📡 Live Scanned Tenant</text>
                      <rect x="32.5" y="5" width="100" height="12" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                      <text x="82.5" y="13" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">☁️ SOURCE A (Read-Only)</text>

                      {/* Baseline State Node */}
                      <rect x="20" y="90" width="125" height="40" rx="8" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="82.5" y="114" fill="var(--text-secondary)" fontSize="9" fontWeight="bold" textAnchor="middle">📦 Workspace Baseline</text>
                      <rect x="32.5" y="75" width="100" height="12" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                      <text x="82.5" y="83" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">💾 SOURCE B (Read-Only)</text>

                      {/* Converging animated paths to Compare Engine */}
                      <path d="M 145 40 L 230 40 L 275 75" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-warning)" />
                      <path d="M 145 40 L 230 40 L 275 75" stroke="var(--warning)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-warning)" />

                      <path d="M 145 110 L 230 110 L 275 75" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-accent)" />
                      <path d="M 145 110 L 230 110 L 275 75" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-accent)" />

                      {/* Flashing Warning Drift Compare Circle */}
                      <circle cx="310" cy="75" r="30" fill="var(--bg-surface)" stroke="var(--warning)" strokeWidth="2" style={{ animation: "pulse-warning-glow 2s infinite" }} />
                      <text x="310" y="71" fill="var(--warning)" fontSize="8" fontWeight="black" textAnchor="middle" style={{ letterSpacing: "0.1em" }}>Access</text>
                      <text x="310" y="83" fill="var(--warning)" fontSize="8" fontWeight="black" textAnchor="middle" style={{ letterSpacing: "0.1em" }}>DRIFT!</text>
                      <rect x="260" y="115" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--warning)" strokeWidth="1" />
                      <text x="310" y="125" fill="var(--warning)" fontSize="7" fontWeight="black" textAnchor="middle">📡 CALL ORIGIN</text>

                      {/* UI Display Node */}
                      <path d="M 340 75 L 394 75" stroke="var(--border)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-warning)" />
                      <path d="M 340 75 L 394 75" stroke="var(--warning)" strokeWidth="2" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-warning)" />

                      <rect x="400" y="50" width="85" height="50" rx="8" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="442.5" y="74" fill="var(--text-primary)" fontSize="8.5" fontWeight="bold" textAnchor="middle">💻 Browser UI</text>
                      <text x="442.5" y="86" fill="var(--warning)" fontSize="7.5" fontWeight="bold" textAnchor="middle">(Memory-Only)</text>
                      <rect x="392.5" y="35" width="100" height="12" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                      <text x="442.5" y="43" fill="var(--warning)" fontSize="7" fontWeight="bold" textAnchor="middle">📍 NO DISK UPDATE</text>
                    </svg>
                    <span className="text-[9px] uppercase tracking-wider font-bold block mt-1" style={{ color: "var(--warning)" }}>
                      ▲ Comparison engine pulls from Live scan and local baselines in real-time, outputting delta data purely in browser memory
                    </span>
                  </div>

                  {/* DYNAMIC OPERATIONAL GOVERNANCE DASHBOARD */}
                  <div 
                    className="p-5 rounded-2xl border space-y-4 transition-all duration-300 shadow-md"
                    style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                  >
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-500">🛡️ Operational Boundary & Change Scope</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📡 Request Origin</span>
                          <span className="text-xs font-bold block mt-1" style={{ color: "var(--text-primary)" }}>{individualFlows[1].origin}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Triggered directly in your browser tab sessions when executing baseline reviews.</p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">⚙️ Scope Impacted</span>
                          <div className="flex flex-col gap-1.5 mt-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-300">Saviynt SaaS Tenant:</span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-400">❌ Read-Only</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-300">Terraform Workspace:</span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-400">❌ Unmodified</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Both source configurations remain completely untouched throughout the review.</p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📍 Landing Zone</span>
                          <span className="text-xs font-bold block mt-1 text-amber-500">💻 {individualFlows[1].location}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">The physical storage tier: processed and rendered strictly inside web browser tab cache buffers.</p>
                      </div>
                    </div>

                    <div 
                      className="p-3 rounded-xl border flex items-center gap-2.5 transition-colors duration-300"
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                    >
                      <span className="text-sm">🛡️</span>
                      <span className="text-[10.5px]" style={{ color: "var(--text-secondary)" }}>
                        <strong className="text-amber-500">Compliance Scope:</strong> {individualFlows[1].changeType}
                      </span>
                    </div>

                    {/* Quick-Launch Router */}
                    <div className="flex justify-end pt-1">
                      <Link
                        href="/wizard/day0/diff"
                        onClick={(e) => handleTargetLinkClick(e, "/wizard/day0/diff")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer text-white ${
                          isTargetLocked("/wizard/day0/diff") ? "opacity-75 border-dashed border border-red-500/40" : ""
                        }`}
                        style={
                          isTargetLocked("/wizard/day0/diff")
                            ? {
                                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                                boxShadow: "none"
                              }
                            : {
                                background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                                boxShadow: "0 4px 12px var(--accent-glow)"
                              }
                        }
                      >
                        <span>{isTargetLocked("/wizard/day0/diff") ? "🔒 " : "🔍 "} Run Drift Reconciler</span>
                        <span>➔</span>
                      </Link>
                    </div>
                  </div>

                  {/* Step explanations */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Procedural Flow Steps</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {individualFlows[1].steps.map((s, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <span className="w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)", color: "var(--warning)" }}>
                            {idx + 1}
                          </span>
                          <div>
                            <h5 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{s.name}</h5>
                            <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Terminal box */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11.5px] font-bold" style={{ color: "var(--text-primary)" }}>{individualFlows[1].payloadTitle}</h4>
                    <span className="text-[9px] border px-2 py-0.5 rounded font-bold uppercase tracking-widest text-amber-500" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                      Diff Delta
                    </span>
                  </div>
                  <pre 
                    className="p-4 rounded-xl border font-mono text-[10.5px] leading-relaxed shadow-inner max-h-[380px] overflow-auto transition-colors duration-300 w-full"
                    style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--warning)" }}
                  >
                    <code>{individualFlows[1].payloadCode}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* BLOCK STAGE 3: HCL SYNTHESIS */}
            {activeStep === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
                <div 
                  className="lg:col-span-7 rounded-2xl border p-6 flex flex-col gap-6"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div className="space-y-1">
                    <span className="text-[9px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-wide text-cyan-400" style={{ borderColor: "rgba(14, 165, 233, 0.2)" }}>
                      Block 03 • Code Synthesizer
                    </span>
                    <h3 className="text-xl font-black mt-2" style={{ color: "var(--text-primary)" }}>
                      HCL Modular Terraform Code Synthesis
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Translates complex access scans and staged corrections into clean, optimized HashiCorp Terraform (.tf) declarative configuration blocks.
                    </p>
                  </div>

                  {/* HIGH-FIDELITY ANIMATED SVG */}
                  <div className="rounded-xl border p-4 flex flex-col items-center justify-center relative transition-colors duration-300" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                    <svg className="w-full h-36" viewBox="0 0 500 130">
                      <defs>
                        <marker id="arrow-accent" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--accent)" />
                        </marker>
                        <marker id="arrow-success" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--success)" />
                        </marker>
                      </defs>

                      {/* JSON scan node */}
                      <rect x="20" y="35" width="110" height="60" rx="12" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="75" y="63" fill="var(--text-secondary)" fontSize="10" fontWeight="bold" textAnchor="middle">📊 Scanned Maps</text>
                      <text x="75" y="79" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Extracted JSON</text>
                      <rect x="25" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                      <text x="75" y="20" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">🧠 SOURCE: In-Memory JSON</text>

                      {/* Connection Pipe */}
                      <path d="M 130 65 L 214 65" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-accent)" />
                      <path d="M 130 65 L 214 65" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-accent)" />

                      {/* Compiler Diamond Node */}
                      <polygon points="220,40 280,65 220,90" fill="var(--bg-panel)" stroke="var(--accent)" strokeWidth="2" />
                      <text x="245" y="68" fill="var(--accent)" fontSize="8" fontWeight="black" textAnchor="middle">COMPILER</text>
                      <rect x="195" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--accent)" strokeWidth="1" />
                      <text x="245" y="20" fill="var(--accent)" fontSize="7.5" fontWeight="black" textAnchor="middle">📡 CALL ORIGIN</text>

                      {/* Connection Pipe Out */}
                      <path d="M 280 65 L 364 65" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-success)" />
                      <path d="M 280 65 L 364 65" stroke="var(--success)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-success)" />

                      {/* Synthesized HCL Module Node */}
                      <rect x="370" y="35" width="110" height="60" rx="12" fill="var(--bg-surface)" stroke="var(--success)" strokeWidth="1.5" />
                      <text x="425" y="63" fill="var(--success)" fontSize="9.5" fontWeight="extrabold" textAnchor="middle">📝 HCL Code Module</text>
                      <text x="425" y="79" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Optimized .tf Files</text>
                      <rect x="375" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--success)" strokeWidth="1" />
                      <text x="425" y="20" fill="var(--success)" fontSize="7" fontWeight="bold" textAnchor="middle">💾 UPDATES WORKSPACE</text>
                    </svg>
                    <span className="text-[9px] uppercase tracking-wider font-bold block mt-1" style={{ color: "var(--accent)" }}>
                      ▲ The Synthesizer writes out HCL files directly onto local project workspace files, securing states in code
                    </span>
                  </div>

                  {/* DYNAMIC OPERATIONAL GOVERNANCE DASHBOARD */}
                  <div 
                    className="p-5 rounded-2xl border space-y-4 transition-all duration-300 shadow-md"
                    style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                  >
                    <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400">🛡️ Operational Boundary & Change Scope</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📡 Request Origin</span>
                          <span className="text-xs font-bold block mt-1" style={{ color: "var(--text-primary)" }}>{individualFlows[2].origin}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Triggered via backend compilation threads when you click the sync compile button.</p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">⚙️ Scope Impacted</span>
                          <div className="flex flex-col gap-1.5 mt-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-300">Saviynt SaaS Tenant:</span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-400">❌ Read-Only</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-300">Terraform Workspace:</span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">✅ Yes (Writes Disk)</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Safely modifies infrastructure workspaces locally on disk without touching cloud environments.</p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📍 Landing Zone</span>
                          <span className="text-xs font-bold block mt-1 text-cyan-400">💾 {individualFlows[2].location}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">The physical storage tier: writes directly to `/terraform-workspaces/` files on the local disk.</p>
                      </div>
                    </div>

                    <div 
                      className="p-3 rounded-xl border flex items-center gap-2.5 transition-colors duration-300"
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                    >
                      <span className="text-sm">🛡️</span>
                      <span className="text-[10.5px]" style={{ color: "var(--text-secondary)" }}>
                        <strong className="text-emerald-400">Compliance Scope:</strong> {individualFlows[2].changeType}
                      </span>
                    </div>

                    {/* Quick-Launch Router */}
                    <div className="flex justify-end pt-1">
                      <Link
                        href="/wizard/pull"
                        onClick={(e) => handleTargetLinkClick(e, "/wizard/pull")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer text-white ${
                          isTargetLocked("/wizard/pull") ? "opacity-75 border-dashed border border-red-500/40" : ""
                        }`}
                        style={
                          isTargetLocked("/wizard/pull")
                            ? {
                                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                                boxShadow: "none"
                              }
                            : {
                                background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                                boxShadow: "0 4px 12px var(--accent-glow)"
                              }
                        }
                      >
                        <span>{isTargetLocked("/wizard/pull") ? "🔒 " : "📝 "} Write Workspace HCL</span>
                        <span>➔</span>
                      </Link>
                    </div>
                  </div>

                  {/* Step explanations */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Procedural Flow Steps</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {individualFlows[2].steps.map((s, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <span className="w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)", color: "var(--accent)" }}>
                            {idx + 1}
                          </span>
                          <div>
                            <h5 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{s.name}</h5>
                            <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Terminal box */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11.5px] font-bold" style={{ color: "var(--text-primary)" }}>{individualFlows[2].payloadTitle}</h4>
                    <span className="text-[9px] border px-2 py-0.5 rounded font-bold uppercase tracking-widest text-cyan-400" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                      HCL Syntax
                    </span>
                  </div>
                  <pre 
                    className="p-4 rounded-xl border font-mono text-[10.5px] leading-relaxed shadow-inner max-h-[380px] overflow-auto transition-colors duration-300 w-full"
                    style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--accent)" }}
                  >
                    <code>{individualFlows[2].payloadCode}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* BLOCK STAGE 4: DEVOPS PIPELINE */}
            {activeStep === 4 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
                <div 
                  className="lg:col-span-7 rounded-2xl border p-6 flex flex-col gap-6"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div className="space-y-1">
                    <span className="text-[9px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-wide text-emerald-400" style={{ borderColor: "rgba(16, 185, 129, 0.2)" }}>
                      Block 04 • Continuous Delivery
                    </span>
                    <h3 className="text-xl font-black mt-2" style={{ color: "var(--text-primary)" }}>
                      Secure DevOps Pipeline Execution
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Runs declarative release checks (init ➔ plan ➔ apply) to securely push and enforce verified infrastructure updates.
                    </p>
                  </div>

                  {/* HIGH-FIDELITY ANIMATED SVG */}
                  <div className="rounded-xl border p-4 flex flex-col items-center justify-center relative transition-colors duration-300" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                    <svg className="w-full h-40" viewBox="0 0 500 150">
                      <defs>
                        <marker id="arrow-accent" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--accent)" />
                        </marker>
                        <marker id="arrow-success" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--success)" />
                        </marker>
                      </defs>

                      {/* Left: Input Git Push HCL */}
                      <rect x="15" y="45" width="100" height="60" rx="10" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="65" y="73" fill="var(--text-primary)" fontSize="9" fontWeight="bold" textAnchor="middle">Local Workspace</text>
                      <text x="65" y="87" fill="var(--text-muted)" fontSize="8" textAnchor="middle">.tf HCL Blueprints</text>
                      <rect x="20" y="20" width="90" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                      <text x="65" y="30" fill="var(--text-muted)" fontSize="7.5" fontWeight="bold" textAnchor="middle">💾 READ WORKSPACE</text>

                      {/* Connection Pipe to Loop */}
                      <path d="M 115 75 L 172 75" stroke="var(--border)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-accent)" />
                      <path d="M 115 75 L 172 75" stroke="var(--accent)" strokeWidth="2" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-accent)" />

                      {/* Continuous deployment loop circle */}
                      <circle cx="230" cy="75" r="45" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                      <circle cx="230" cy="75" r="45" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray="20,130" strokeDashoffset="0" className="animate-flow" />

                      {/* Loop nodes */}
                      <circle cx="230" cy="30" r="13" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="230" y="33" fill="var(--text-primary)" fontSize="6.5" fontWeight="black" textAnchor="middle">INIT</text>

                      <circle cx="275" cy="75" r="13" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="275" y="78" fill="var(--text-primary)" fontSize="6.5" fontWeight="black" textAnchor="middle">PLAN</text>

                      <circle cx="230" cy="120" r="13" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="230" y="123" fill="var(--text-primary)" fontSize="6.5" fontWeight="black" textAnchor="middle">APPLY</text>

                      <circle cx="185" cy="75" r="13" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="185" y="78" fill="var(--text-primary)" fontSize="6.5" fontWeight="black" textAnchor="middle">STATE</text>

                      <rect x="180" y="2" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--accent)" strokeWidth="1" />
                      <text x="230" y="12" fill="var(--accent)" fontSize="7.5" fontWeight="black" textAnchor="middle">📡 CALL ORIGIN (CLI)</text>

                      {/* Sync Target Output */}
                      <path d="M 288 75 L 370 75" stroke="var(--border)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-success)" />
                      <path d="M 288 75 L 370 75" stroke="var(--success)" strokeWidth="2" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-success)" />

                      {/* Remote Tenant Target Box */}
                      <rect x="375" y="45" width="110" height="60" rx="10" fill="var(--bg-surface)" stroke="var(--success)" strokeWidth="2" style={{ animation: "pulse-glow 2.5s infinite" }} />
                      <text x="430" y="73" fill="var(--success)" fontSize="9.5" fontWeight="extrabold" textAnchor="middle">☁️ Saviynt Tenant</text>
                      <text x="430" y="87" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Live Cloud API Sync</text>
                      <rect x="380" y="20" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--success)" strokeWidth="1" />
                      <text x="430" y="30" fill="var(--success)" fontSize="7" fontWeight="bold" textAnchor="middle">🔥 UPDATES TENANT</text>
                    </svg>
                    <span className="text-[9px] uppercase tracking-wider font-bold block mt-1" style={{ color: "var(--success)" }}>
                      ▲ Enforce step triggers Terraform apply, which executes secure live writes to cloud tenant endpoints
                    </span>
                  </div>

                  {/* DYNAMIC OPERATIONAL GOVERNANCE DASHBOARD */}
                  <div 
                    className="p-5 rounded-2xl border space-y-4 transition-all duration-300 shadow-md"
                    style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                  >
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">🛡️ Operational Boundary & Change Scope</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📡 Request Origin</span>
                          <span className="text-xs font-bold block mt-1" style={{ color: "var(--text-primary)" }}>{individualFlows[3].origin}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Initiated via pipeline execution commands inside the CLI binary shell runner.</p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">⚙️ Scope Impacted</span>
                          <div className="flex flex-col gap-1.5 mt-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-300">Saviynt SaaS Tenant:</span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-950 border border-rose-800 text-rose-400 font-bold">✅ Yes (Active Write)</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-300">Terraform Workspace:</span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">✅ Yes (Writes State)</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">This is the critical release loop. Both SaaS API resources and local state log sheets are modified.</p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📍 Landing Zone</span>
                          <span className="text-xs font-bold block mt-1 text-emerald-400">🌐 {individualFlows[3].location.split(" & ")[0]}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">The physical storage tiers: live Saviynt SaaS cloud endpoints AND local `terraform.tfstate` files.</p>
                      </div>
                    </div>

                    <div 
                      className="p-3 rounded-xl border flex items-center gap-2.5 transition-colors duration-300"
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                    >
                      <span className="text-sm">⚠️</span>
                      <span className="text-[10.5px]" style={{ color: "var(--text-secondary)" }}>
                        <strong className="text-amber-500">Compliance Scope:</strong> {individualFlows[3].changeType}
                      </span>
                    </div>

                    {/* Quick-Launch Router */}
                    <div className="flex justify-end pt-1">
                      <Link
                        href="/wizard/push"
                        onClick={(e) => handleTargetLinkClick(e, "/wizard/push")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer text-white ${
                          isTargetLocked("/wizard/push") ? "opacity-75 border-dashed border border-red-500/40" : ""
                        }`}
                        style={
                          isTargetLocked("/wizard/push")
                            ? {
                                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                                boxShadow: "none"
                              }
                            : {
                                background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                                boxShadow: "0 4px 12px var(--accent-glow)"
                              }
                        }
                      >
                        <span>{isTargetLocked("/wizard/push") ? "🔒 " : "🚀 "} Launch DevOps Runner</span>
                        <span>➔</span>
                      </Link>
                    </div>
                  </div>

                  {/* Step explanations */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Procedural Flow Steps</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {individualFlows[3].steps.map((s, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <span className="w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)", color: "var(--success)" }}>
                            {idx + 1}
                          </span>
                          <div>
                            <h5 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{s.name}</h5>
                            <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Terminal box */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11.5px] font-bold" style={{ color: "var(--text-primary)" }}>{individualFlows[3].payloadTitle}</h4>
                    <span className="text-[9px] border px-2 py-0.5 rounded font-bold uppercase tracking-widest text-emerald-400" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                      Pipeline CLI
                    </span>
                  </div>
                  <pre 
                    className="p-4 rounded-xl border font-mono text-[10.5px] leading-relaxed shadow-inner max-h-[380px] overflow-auto transition-colors duration-300 w-full"
                    style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--success)" }}
                  >
                    <code>{individualFlows[3].payloadCode}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* BLOCK STAGE 5: UNIFIED LIFECYCLE SUMMARY */}
            {activeStep === 5 && (
              <div className="space-y-8 animate-fadeIn">
                <div 
                  className="rounded-2xl border p-6 md:p-8 space-y-8 shadow-xl animate-fadeIn"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div className="space-y-2 max-w-3xl">
                    <span className="text-[9px] border px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest text-emerald-400" style={{ borderColor: "rgba(16, 185, 129, 0.2)", backgroundColor: "rgba(16, 185, 129, 0.05)" }}>
                      Complete Pipeline Overview
                    </span>
                    <h2 className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>
                      Unified Access-Governance-as-Code Pipeline
                    </h2>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      Below is the complete architectural hierarchy. Review how raw API data flows dynamically from active extraction processes, reconciles drift delta risks, translates into modular, auditable Terraform code blocks, and executes DevOps deploys to secure compliance posture in continuous loop cycles.
                    </p>
                  </div>

                  {/* DETAILED ACHIEVED OUTCOMES DASHBOARD */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">🏆 Key Achievements & Pipeline Milestones</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Milestone 1 */}
                      <div 
                        className="p-5 rounded-2xl border space-y-3 transition-all duration-300"
                        style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xl">🔌</span>
                          <span className="text-[9px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-900 border-slate-800 text-cyan-400">Block 01 Discovered</span>
                        </div>
                        <h4 className="text-xs font-black uppercase text-slate-200">Discovered & Codified SaaS Environments</h4>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          Eliminated manual configurations. We transitioned active SaaS security settings, permissions, endpoints, and connections into a standardized machine-readable JSON structure.
                        </p>
                        <div className="border-t pt-2 mt-1 border-slate-850 flex items-center justify-between text-[10.5px]">
                          <span className="text-slate-400">Target Level:</span>
                          <span className="font-semibold text-cyan-400">SaaS Tenants mapped in-memory</span>
                        </div>
                      </div>

                      {/* Milestone 2 */}
                      <div 
                        className="p-5 rounded-2xl border space-y-3 transition-all duration-300"
                        style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xl">🔍</span>
                          <span className="text-[9px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-900 border-slate-800 text-amber-500">Block 02 Reconciled</span>
                        </div>
                        <h4 className="text-xs font-black uppercase text-slate-200">Reconciled Console Drift Delta Risks</h4>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          Identified unauthorized portal updates line-by-line. Reconciled and isolated unapproved configuration changes in seconds, establishing a complete audit trail.
                        </p>
                        <div className="border-t pt-2 mt-1 border-slate-850 flex items-center justify-between text-[10.5px]">
                          <span className="text-slate-400">Compliance Win:</span>
                          <span className="font-semibold text-amber-500">0% unauthorized access leaks</span>
                        </div>
                      </div>

                      {/* Milestone 3 */}
                      <div 
                        className="p-5 rounded-2xl border space-y-3 transition-all duration-300"
                        style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xl">⚙️</span>
                          <span className="text-[9px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-900 border-slate-800 text-cyan-400">Block 03 Compiled</span>
                        </div>
                        <h4 className="text-xs font-black uppercase text-slate-200">Automated Modular HCL Synthesis</h4>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          Compiled raw scan JSON models into dry, dynamic HashiCorp Terraform modules. Spacing and bindings are automatically formatted with isolated variable definitions.
                        </p>
                        <div className="border-t pt-2 mt-1 border-slate-850 flex items-center justify-between text-[10.5px]">
                          <span className="text-slate-400">HCL Output:</span>
                          <span className="font-semibold text-cyan-400">Git-Auditable workspaces on disk</span>
                        </div>
                      </div>

                      {/* Milestone 4 */}
                      <div 
                        className="p-5 rounded-2xl border space-y-3 transition-all duration-300"
                        style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xl">🚀</span>
                          <span className="text-[9px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-900 border-slate-800 text-emerald-400">Block 04 Released</span>
                        </div>
                        <h4 className="text-xs font-black uppercase text-slate-200">Enforced Zero-Trust DevOps Release Loops</h4>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          Automated deployments safely (`plan` before `apply`). Access governance updates are validated and securely written back to active environments with state tracking.
                        </p>
                        <div className="border-t pt-2 mt-1 border-slate-850 flex items-center justify-between text-[10.5px]">
                          <span className="text-slate-400">Release Execution:</span>
                          <span className="font-semibold text-emerald-400">Saviynt SaaS API State write</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div 
                    className="rounded-2xl border p-6 flex flex-col items-center justify-center relative transition-colors duration-300 shadow-inner svg-container-responsive"
                    style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                  >
                    {viewMode === "mobile" && (
                      <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest self-start mb-1 animate-pulse">📱 Swipe horizontally to view full flowchart</span>
                    )}
                    <svg className="w-full max-w-4xl h-80 svg-element-wide" viewBox="0 0 800 280">
                      <defs>
                        <marker id="arrow-accent" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--accent)" />
                        </marker>
                        <marker id="arrow-warning" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--warning)" />
                        </marker>
                        <marker id="arrow-success" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--success)" />
                        </marker>
                      </defs>

                      {/* Flow 1 Box */}
                      <rect x="20" y="30" width="140" height="65" rx="10" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="90" y="55" fill="var(--text-primary)" fontSize="9" fontWeight="extrabold" textAnchor="middle">1. API REST Crawler</text>
                      <text x="90" y="70" fill="var(--accent)" fontSize="8" fontWeight="bold" textAnchor="middle">[ Active Extraction ]</text>
                      <text x="90" y="82" fill="var(--text-muted)" fontSize="7.5" textAnchor="middle">Introspects SaaS APIs</text>

                      {/* Connection Pipe 1 to 2 */}
                      <path d="M 160 62.5 L 234 62.5" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-accent)" />
                      <path d="M 160 62.5 L 234 62.5" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-accent)" />

                      {/* Flow 2 Box */}
                      <rect x="240" y="30" width="140" height="65" rx="10" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="310" y="55" fill="var(--text-primary)" fontSize="9" fontWeight="extrabold" textAnchor="middle">2. Drift Compare</text>
                      <text x="310" y="70" fill="var(--warning)" fontSize="8" fontWeight="bold" textAnchor="middle">[ Delta Reconciler ]</text>
                      <text x="310" y="82" fill="var(--text-muted)" fontSize="7.5" textAnchor="middle">Identifies portal drifts</text>

                      {/* Connection Pipe 2 to 3 */}
                      <path d="M 380 62.5 L 430 62.5 L 430 180 L 454 180" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-warning)" />
                      <path d="M 380 62.5 L 430 62.5 L 430 180 L 454 180" stroke="var(--warning)" strokeWidth="2.5" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-warning)" />

                      {/* Flow 3 Box */}
                      <rect x="460" y="147.5" width="140" height="65" rx="10" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="530" y="172.5" fill="var(--text-primary)" fontSize="9" fontWeight="extrabold" textAnchor="middle">3. HCL Synthesizer</text>
                      <text x="530" y="187.5" fill="var(--accent)" fontSize="8" fontWeight="bold" textAnchor="middle">[ Code Compiler ]</text>
                      <text x="530" y="199.5" fill="var(--text-muted)" fontSize="7.5" textAnchor="middle">Generates Terraform .tf</text>

                      {/* Connection Pipe 3 to 4 */}
                      <path d="M 600 180 L 674 180" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-success)" />
                      <path d="M 600 180 L 674 180" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-success)" />

                      {/* Flow 4 Box */}
                      <rect x="680" y="147.5" width="100" height="65" rx="10" fill="var(--bg-surface)" stroke="var(--success)" strokeWidth="1.5" />
                      <text x="730" y="172.5" fill="var(--text-primary)" fontSize="9" fontWeight="extrabold" textAnchor="middle">4. DevOps Deploy</text>
                      <text x="730" y="187.5" fill="var(--success)" fontSize="8" fontWeight="bold" textAnchor="middle">[ Plan & Apply ]</text>
                      <text x="730" y="199.5" fill="var(--text-muted)" fontSize="7.5" textAnchor="middle">Writes configurations</text>

                      {/* Feedback Loop back to Saviynt APIs */}
                      <path d="M 730 147.5 L 730 15 L 90 15 L 90 24" stroke="var(--border)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-success)" />
                      <path d="M 730 147.5 L 730 15 L 90 15 L 90 24" stroke="var(--success)" strokeWidth="2" fill="none" strokeDasharray="5,15" className="animate-flow-rev" markerEnd="url(#arrow-success)" />

                      {/* Graphic labels */}
                      <rect x="290" y="120" width="220" height="20" rx="4" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="1" />
                      <text x="400" y="132" fill="var(--text-secondary)" fontSize="7.5" textAnchor="middle">Continuous access compliance sync cycle loops</text>
                    </svg>
                    <span className="text-[10px] uppercase font-bold tracking-wider mt-1 text-emerald-400">
                      🔄 Continuous Feedback Governance Architecture Loop Active
                    </span>
                  </div>

                  {/* COHESIVE SYSTEM CHANGE HIERARCHY MATRIX TABLE */}
                  <div 
                    className="rounded-2xl border p-5 shadow-lg space-y-4"
                    style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                  >
                    <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400">🌐 Ecosystem Call Origin & Update Matrix</h4>
                    
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs border-collapse border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
                        <thead>
                          <tr className="border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-base)" }}>
                            <th className="p-3 font-bold uppercase border-r text-[10px] tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Operational Flow Block</th>
                            <th className="p-3 font-bold uppercase border-r text-[10px] tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>📡 Call Originates From</th>
                            <th className="p-3 font-bold uppercase border-r text-[10px] tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>☁️ Updates Tenant?</th>
                            <th className="p-3 font-bold uppercase border-r text-[10px] tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>💾 Updates Workspace?</th>
                            <th className="p-3 font-bold uppercase border-r text-[10px] tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>📍 Physical Landing Zone</th>
                            <th className="p-3 font-bold uppercase text-[10px] tracking-wider" style={{ color: "var(--text-secondary)" }}>🛡️ Risk & Scope</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                          {[
                            {
                              id: 1,
                              name: "🔌 Block 1: Active Discovery",
                              origin: "Envizor Web Server (Crawler Service)",
                              updatesTenant: "❌ Read-Only (0% risk)",
                              updatesWorkspace: "❌ Unmodified",
                              landingZone: "🧠 Local Web Server Cache Memory Buffer",
                              scope: "Safe Audit Scan"
                            },
                            {
                              id: 2,
                              name: "🔍 Block 2: Drift Compare",
                              origin: "Envizor Comparison Engine (Browser Client)",
                              updatesTenant: "❌ Read-Only (0% risk)",
                              updatesWorkspace: "❌ Unmodified",
                              landingZone: "💻 Web Browser Tab session Cache",
                              scope: "Visual Comparison"
                            },
                            {
                              id: 3,
                              name: "⚙️ Block 3: HCL Synthesizer",
                              origin: "Envizor HCL Synthesizer Compiler",
                              updatesTenant: "❌ No Cloud Changes (0% risk)",
                              updatesWorkspace: "✅ Yes (Writes .tf modular files)",
                              landingZone: "💾 Local Hard Disk File Directories",
                              scope: "Writes local HCL files"
                            },
                            {
                              id: 4,
                              name: "🚀 Block 4: DevOps Pipeline",
                              origin: "Local DevOps Pipeline Runner (Terraform CLI)",
                              updatesTenant: "✅ Yes (Active SaaS resource writes)",
                              updatesWorkspace: "✅ Yes (Writes terraform.tfstate records)",
                              landingZone: "🌐 Remote Cloud APIs & Local Disk",
                              scope: "Deploys configurations"
                            }
                          ].map((row) => (
                            <tr key={row.id} className="transition-all hover:bg-black/[0.08] border-b" style={{ borderColor: "var(--border)" }}>
                              <td className="p-3.5 font-bold border-r text-xs" style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}>
                                {row.name}
                              </td>
                              <td className="p-3.5 font-semibold text-[11px] border-r" style={{ color: row.id === 2 ? "var(--warning)" : "var(--accent)", borderColor: "var(--border)" }}>
                                {row.origin}
                              </td>
                              <td className="p-3.5 text-[11px] border-r" style={{ borderColor: "var(--border)" }}>
                                <span 
                                  className="px-2.5 py-1 rounded text-[9.5px] font-bold uppercase tracking-wider block text-center border"
                                  style={{
                                    backgroundColor: row.updatesTenant.startsWith("❌") ? "var(--bg-base)" : "rgba(239, 68, 68, 0.08)",
                                    borderColor: row.updatesTenant.startsWith("❌") ? "var(--border)" : "rgba(239, 68, 68, 0.25)",
                                    color: row.updatesTenant.startsWith("❌") ? "var(--text-muted)" : "var(--warning)"
                                  }}
                                >
                                  {row.updatesTenant}
                                </span>
                              </td>
                              <td className="p-3.5 text-[11px] border-r" style={{ borderColor: "var(--border)" }}>
                                <span 
                                  className="px-2.5 py-1 rounded text-[9.5px] font-bold uppercase tracking-wider block text-center border"
                                  style={{
                                    backgroundColor: row.updatesWorkspace.startsWith("❌") ? "var(--bg-base)" : "rgba(16, 185, 129, 0.08)",
                                    borderColor: row.updatesWorkspace.startsWith("❌") ? "var(--border)" : "rgba(16, 185, 129, 0.25)",
                                    color: row.updatesWorkspace.startsWith("❌") ? "var(--text-muted)" : "var(--success)"
                                  }}
                                >
                                  {row.updatesWorkspace}
                                </span>
                              </td>
                              <td className="p-3.5 font-semibold text-[11px] border-r" style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}>
                                {row.landingZone}
                              </td>
                              <td className="p-3.5">
                                <span 
                                  className="text-[9.5px] border px-2 py-1 rounded-full font-bold uppercase tracking-wider block text-center"
                                  style={{
                                    backgroundColor: row.id === 4 ? "rgba(16, 185, 129, 0.08)" : row.id === 3 ? "rgba(14, 165, 233, 0.08)" : "var(--bg-base)",
                                    borderColor: row.id === 4 ? "var(--success)" : row.id === 2 ? "var(--warning)" : "var(--border)",
                                    color: row.id === 4 ? "var(--success)" : row.id === 2 ? "var(--warning)" : "var(--text-secondary)"
                                  }}
                                >
                                  {row.scope}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary Pipeline Tables */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Block Level Hierarchy</h4>
                      <div className="space-y-3">
                        {individualFlows.map((flow) => (
                          <div 
                            key={flow.id}
                            className="p-4 rounded-xl border flex items-start gap-3 transition-colors duration-300"
                            style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                          >
                            <span className="text-xl">{flow.icon}</span>
                            <div>
                              <h5 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{flow.title}</h5>
                              <p className="text-[10.5px] leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>{flow.summary}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--success)" }}>Pipeline Governance Summary</h4>
                      <div 
                        className="p-5 rounded-2xl border flex flex-col justify-between h-[310px]"
                        style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                      >
                        <div className="space-y-3.5">
                          <div className="flex gap-2">
                            <span className="text-emerald-400">✓</span>
                            <p className="text-xs text-slate-300 leading-normal">
                              <strong>Declarative Blueprint Blueprints:</strong> Security states are maintained as dynamic version-controlled HCL codes on disk.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-emerald-400">✓</span>
                            <p className="text-xs text-slate-300 leading-normal">
                              <strong>Real-Time Auditing:</strong> Captures direct admin configuration drifts instantly, removing unapproved console access.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-emerald-400">✓</span>
                            <p className="text-xs text-slate-300 leading-normal">
                              <strong>DevOps Release Velocity:</strong> Standardizes deployments (`plan` ➔ `apply`) in local workspace pipelines in seconds.
                            </p>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg border text-center transition-colors duration-300" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                          <span className="text-[9.5px] uppercase font-bold tracking-widest block" style={{ color: "var(--text-muted)" }}>Platform Value</span>
                          <span className="text-xs font-bold block mt-0.5" style={{ color: "var(--text-primary)" }}>Continuous Compliance Enforcement Loop</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: MANUAL VS ENVIZOR */}
        {activeTab === "no-wizard" && (
          <div className="space-y-12 animate-fadeIn">
            {/* Introductory Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest border border-rose-500/20 px-3 py-1 rounded-full bg-rose-500/5 text-rose-400">
                ⚠️ Operational Risk Comparison
              </span>
              <h2 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                The Heavy Cost of Manual Administration
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
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
                      Manual API Data Extraction & Excel Exports
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Administrators must configure custom API calls via Postman or manually run table exports inside the Saviynt SaaS browser console to retrieve raw JSON configurations.
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

                      {/* Saviynt Cloud Box */}
                      <rect x="20" y="35" width="110" height="60" rx="12" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="75" y="63" fill="var(--text-primary)" fontSize="10" fontWeight="extrabold" textAnchor="middle">☁️ Saviynt Cloud</text>
                      <text x="75" y="79" fill="var(--text-muted)" fontSize="8" textAnchor="middle">API Interface</text>
                      <rect x="25" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                      <text x="75" y="20" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">☁️ TARGET: Active Tenant</text>

                      {/* Connection Pipe (Outward Query - right to left) */}
                      <path d="M 370 50 L 138 50" stroke="var(--border)" strokeWidth="1" fill="none" strokeDasharray="3,3" markerEnd="url(#arrow-red)" />
                      <path d="M 370 50 L 138 50" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="1.5" fill="none" strokeDasharray="5,15" className="animate-flow-rev" markerEnd="url(#arrow-red)" />
                      <text x="250" y="44" fill="var(--warning)" fontSize="7.5" fontWeight="bold" textAnchor="middle">1. Manual curl/Postman request (Human-invoked)</text>

                      {/* Returning Data Pipe (Inward Metadata Stream - left to right) */}
                      <path d="M 130 80 L 362 80" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-red)" />
                      <path d="M 130 80 L 362 80" stroke="rgba(239, 68, 68, 0.8)" strokeWidth="2.5" fill="none" strokeDasharray="8,20" className="animate-flow" markerEnd="url(#arrow-red)" />
                      <text x="250" y="93" fill="var(--warning)" fontSize="7.5" fontWeight="bold" textAnchor="middle">2. Raw JSON download (to messy spreadsheet)</text>

                      {/* Human Operator Box */}
                      <rect x="370" y="35" width="110" height="60" rx="12" fill="var(--bg-surface)" stroke="var(--warning)" strokeWidth="2" />
                      <text x="425" y="63" fill="var(--warning)" fontSize="10" fontWeight="extrabold" textAnchor="middle">👨‍💻 Human Admin</text>
                      <text x="425" y="79" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Postman Runner</text>
                      <rect x="375" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--warning)" strokeWidth="1" />
                      <text x="425" y="20" fill="var(--warning)" fontSize="7.5" fontWeight="black" textAnchor="middle">⚠️ OPERATIONAL RISK</text>
                    </svg>
                    <span className="text-[9px] uppercase tracking-wider font-bold block mt-1" style={{ color: "var(--warning)" }}>
                      ▲ Lag and human delay: Data extraction requires manual logins, scripts, and exports, creating multi-day blindspots
                    </span>
                  </div>

                  {/* DYNAMIC OPERATIONAL GOVERNANCE DASHBOARD */}
                  <div 
                    className="p-5 rounded-2xl border space-y-4 transition-all duration-300 shadow-md"
                    style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                  >
                    <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">🛡️ Manual Operational Bottleneck & Change Scope</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📡 Request Origin</span>
                          <span className="text-xs font-bold block mt-1" style={{ color: "var(--text-primary)" }}>Human Admin (Manual trigger)</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-2 leading-relaxed">
                          Requires visual validation of credentials, manual browser tokens, or unsafe locally stored scripts.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">⚙️ Scope Impacted</span>
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-rose-950/45 border border-rose-800 text-rose-400">
                              Tenant: Outdated Scan
                            </span>
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-400">
                              Workspace: Untracked
                            </span>
                          </div>
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-2 leading-relaxed">
                          No version logs or audit trail is created. Access snapshots exist only on local developer desktops.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📍 Landing Zone</span>
                          <span className="text-xs font-bold block mt-1" style={{ color: "var(--text-primary)" }}>Messy Temp Folders</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-2 leading-relaxed">
                          Stored on local admin hard drives, shared folders, or messy Excel sheets. Zero enterprise security backing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Left Side: Payload / Code Block */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11.5px] font-bold" style={{ color: "var(--text-primary)" }}>Typical Fragmented Excel/JSON Output</h4>
                    <span className="text-[9px] border px-2 py-0.5 rounded font-bold uppercase tracking-widest text-rose-400" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
                      Manual Sheet
                    </span>
                  </div>
                  <pre 
                    className="p-4 rounded-xl border font-mono text-[10.5px] leading-relaxed shadow-inner max-h-[380px] overflow-auto transition-colors duration-300 w-full"
                    style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--warning)" }}
                  >
                    <code>{`// Outdated manual dump (stored locally)
{
  "crawler_status": "inconsistent",
  "run_by": "admin-laptop-04",
  "extracted_at": "2026-05-24T10:14:02Z", 
  "drift_warning": "17 rules unmatched",
  "notes": "Extracted manually via Postman collections",
  "user_connections": [
    { "user": "t.jones", "conn": "dev-saviynt-endpoint" },
    { "user": "m.smith", "conn": "prod-saviynt-endpoint" }
  ]
}`}</code>
                  </pre>
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

                      {/* Live Scanned State Node */}
                      <rect x="20" y="20" width="125" height="40" rx="8" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="82.5" y="44" fill="var(--text-secondary)" fontSize="9" fontWeight="bold" textAnchor="middle">📄 Raw Excel Export</text>
                      <rect x="32.5" y="5" width="100" height="12" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                      <text x="82.5" y="13" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">☁️ SOURCE A (Excel)</text>

                      {/* Baseline State Node */}
                      <rect x="20" y="90" width="125" height="40" rx="8" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="82.5" y="114" fill="var(--text-secondary)" fontSize="9" fontWeight="bold" textAnchor="middle">📦 Code Baseline</text>
                      <rect x="32.5" y="75" width="100" height="12" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                      <text x="82.5" y="83" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">💾 SOURCE B (Manual HCL)</text>

                      {/* Converging animated paths to Compare Engine */}
                      <path d="M 145 40 L 230 40 L 275 75" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-red)" />
                      <path d="M 145 40 L 230 40 L 275 75" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-red)" />

                      <path d="M 145 110 L 230 110 L 275 75" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-red)" />
                      <path d="M 145 110 L 230 110 L 275 75" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-red)" />

                      {/* Flashing Warning Drift Compare Circle */}
                      <circle cx="310" cy="75" r="30" fill="var(--bg-surface)" stroke="rgba(239, 68, 68, 1)" strokeWidth="2" style={{ animation: "pulse-warning-glow 2s infinite" }} />
                      <text x="310" y="71" fill="rgba(239, 68, 68, 1)" fontSize="8" fontWeight="black" textAnchor="middle" style={{ letterSpacing: "0.1em" }}>Visual</text>
                      <text x="310" y="83" fill="rgba(239, 68, 68, 1)" fontSize="8" fontWeight="black" textAnchor="middle" style={{ letterSpacing: "0.1em" }}>RECONCILE</text>
                      <rect x="260" y="115" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="rgba(239, 68, 68, 1)" strokeWidth="1" />
                      <text x="310" y="125" fill="rgba(239, 68, 68, 1)" fontSize="7" fontWeight="black" textAnchor="middle">⚠️ HUMAN EYES</text>

                      {/* UI Display Node */}
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

                  {/* DYNAMIC OPERATIONAL GOVERNANCE DASHBOARD */}
                  <div 
                    className="p-5 rounded-2xl border space-y-4 transition-all duration-300 shadow-md"
                    style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                  >
                    <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">🛡️ Manual Operational Bottleneck & Change Scope</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📡 Request Origin</span>
                          <span className="text-xs font-bold block mt-1" style={{ color: "var(--text-primary)" }}>Visual Scan (Human Eyes)</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-2 leading-relaxed">
                          Extremely slow. Scanning complex systems line-by-line leads to fatigue and ignored differences.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">⚙️ Scope Impacted</span>
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-rose-950/45 border border-rose-800 text-rose-400">
                              Tenant: Drift Unchecked
                            </span>
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-400">
                              Workspace: Unchanged
                            </span>
                          </div>
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-2 leading-relaxed">
                          No audit tracking or verification logs. Real-world configuration parameters remain unaligned.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📍 Landing Zone</span>
                          <span className="text-xs font-bold block mt-1" style={{ color: "var(--text-primary)" }}>Admin Memory Cache</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-2 leading-relaxed">
                          Reconciliation reports are only stored in emails, local text diff blocks, or slack threads.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Left Side: Payload / Code Block */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11.5px] font-bold" style={{ color: "var(--text-primary)" }}>Typical visual comparison headache</h4>
                    <span className="text-[9px] border px-2 py-0.5 rounded font-bold uppercase tracking-widest text-rose-400" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
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
                      Manual HCL Writing & Parameter Mapping
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

                      {/* Admin Brain Node */}
                      <rect x="20" y="35" width="110" height="60" rx="12" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="75" y="63" fill="var(--text-secondary)" fontSize="10" fontWeight="bold" textAnchor="middle">🧠 Manual Memory</text>
                      <text x="75" y="79" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Draft Ideas</text>
                      <rect x="25" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                      <text x="75" y="20" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">🧠 SOURCE: Human Intellect</text>

                      {/* Connection Pipe */}
                      <path d="M 130 65 L 214 65" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-red)" />
                      <path d="M 130 65 L 214 65" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-red)" />

                      {/* Keyboard Typing Node */}
                      <polygon points="220,40 280,65 220,90" fill="var(--bg-panel)" stroke="rgba(239, 68, 68, 1)" strokeWidth="2" />
                      <text x="245" y="68" fill="rgba(239, 68, 68, 1)" fontSize="8" fontWeight="black" textAnchor="middle">KEYBOARD</text>
                      <rect x="195" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="rgba(239, 68, 68, 1)" strokeWidth="1" />
                      <text x="245" y="20" fill="rgba(239, 68, 68, 1)" fontSize="7.5" fontWeight="black" textAnchor="middle">⚠️ MANUAL TYPING</text>

                      {/* Connection Pipe Out */}
                      <path d="M 280 65 L 364 65" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-red)" />
                      <path d="M 280 65 L 364 65" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-red)" />

                      {/* Typed Code Node */}
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

                  {/* DYNAMIC OPERATIONAL GOVERNBOARD */}
                  <div 
                    className="p-5 rounded-2xl border space-y-4 transition-all duration-300 shadow-md"
                    style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                  >
                    <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">🛡️ Manual Operational Bottleneck & Change Scope</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📡 Request Origin</span>
                          <span className="text-xs font-bold block mt-1" style={{ color: "var(--text-primary)" }}>Manual IDE Text Editor</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-2 leading-relaxed">
                          Relies purely on human memory and manually configured variables, with no automatic lint validation.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">⚙️ Scope Impacted</span>
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-400">
                              Tenant: Unchanged
                            </span>
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-rose-950/45 border border-rose-800 text-rose-400">
                              Workspace: Syntax Errors
                            </span>
                          </div>
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-2 leading-relaxed">
                          Creates non-standardized declarative files that fail syntax checks during critical deployment loops.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📍 Landing Zone</span>
                          <span className="text-xs font-bold block mt-1" style={{ color: "var(--text-primary)" }}>Local Desktop Folder</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-2 leading-relaxed">
                          Config blocks are saved directly onto untracked hard disk partitions. Highly prone to source control mismatch.
                        </p>
                      </div>
                    </div>
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
                      Direct Terminal Deployments & Lockout Risks
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

                      {/* Left Laptop */}
                      <rect x="15" y="45" width="100" height="60" rx="10" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="65" y="73" fill="var(--text-primary)" fontSize="9" fontWeight="bold" textAnchor="middle">Admin Laptop</text>
                      <text x="65" y="87" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Unsecured Prompt</text>
                      <rect x="20" y="20" width="90" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                      <text x="65" y="30" fill="var(--text-muted)" fontSize="7.5" fontWeight="bold" textAnchor="middle">⚠️ UNTRACKED APPLY</text>

                      {/* Pipe */}
                      <path d="M 115 75 L 172 75" stroke="var(--border)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-red)" />
                      <path d="M 115 75 L 172 75" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-red)" />

                      {/* Chaotic loop */}
                      <circle cx="230" cy="75" r="45" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                      <circle cx="230" cy="75" r="45" fill="none" stroke="rgba(239, 68, 68, 1)" strokeWidth="3" strokeDasharray="20,130" strokeDashoffset="0" className="animate-flow" />

                      {/* Loop nodes */}
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

                      {/* Sync Target Output */}
                      <path d="M 288 75 L 370 75" stroke="var(--border)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-red)" />
                      <path d="M 288 75 L 370 75" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="2" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-red)" />

                      {/* Remote Tenant Target Box */}
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

                  {/* DYNAMIC OPERATIONAL GOVERNANCE DASHBOARD */}
                  <div 
                    className="p-5 rounded-2xl border space-y-4 transition-all duration-300 shadow-md"
                    style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                  >
                    <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">🛡️ Manual Operational Bottleneck & Change Scope</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📡 Request Origin</span>
                          <span className="text-xs font-bold block mt-1" style={{ color: "var(--text-primary)" }}>Local Shell Prompt Binary</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-2 leading-relaxed">
                          Executed directly from developer laptops. No pipeline verification or secondary peer review.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">⚙️ Scope Impacted</span>
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-rose-950/45 border border-rose-800 text-rose-400">
                              Tenant: Active Outage Risk
                            </span>
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-rose-950/45 border border-rose-800 text-rose-400">
                              Workspace: State Drift
                            </span>
                          </div>
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-2 leading-relaxed">
                          Bypassing checks introduces active risks to SaaS environments and results in corrupted local state records.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">📍 Landing Zone</span>
                          <span className="text-xs font-bold block mt-1" style={{ color: "var(--text-primary)" }}>Active SaaS Production</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-2 leading-relaxed">
                          Directly modifies active directory rules on remote SaaS APIs. High danger of misconfiguration locks.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Left Side: Payload / Code Block */}
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
                
                {/* SVG diagram illustrating directional arrows */}
                <svg className="w-full max-w-4xl h-24 svg-element-wide" viewBox="0 0 800 80">
                  <defs>
                    <marker id="arrow-gray" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#4B5563" />
                    </marker>
                    <marker id="arrow-glow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
                    </marker>
                    <marker id="arrow-success" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--success)" />
                    </marker>
                    <linearGradient id="grad-active" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--accent)" />
                      <stop offset="100%" stopColor="var(--warning)" />
                    </linearGradient>
                  </defs>

                  {/* Flow Lines */}
                  {/* Line 1 (Scan -> Diff) */}
                  <line 
                    x1="115" y1="40" x2="265" y2="40" 
                    stroke={simState !== "idle" && simState !== "scanning" ? "var(--accent)" : "#4B5563"} 
                    strokeWidth="2.5" 
                    strokeDasharray={simState === "scanning" ? "6, 4" : "none"}
                    className={simState === "scanning" ? "animate-[dash_1s_linear_infinite]" : ""}
                    markerEnd={simState !== "idle" && simState !== "scanning" ? "url(#arrow-glow)" : "url(#arrow-gray)"}
                  />

                  {/* Line 2 (Diff -> Compile) */}
                  <line 
                    x1="335" y1="40" x2="465" y2="40" 
                    stroke={["reconciled", "synthesizing", "synthesized", "deploying", "deployed"].includes(simState) ? "var(--accent)" : "#4B5563"} 
                    strokeWidth="2.5" 
                    strokeDasharray={simState === "reconciling" ? "6, 4" : "none"}
                    className={simState === "reconciling" ? "animate-[dash_1s_linear_infinite]" : ""}
                    markerEnd={["reconciled", "synthesizing", "synthesized", "deploying", "deployed"].includes(simState) ? "url(#arrow-glow)" : "url(#arrow-gray)"}
                  />

                  {/* Line 3 (Compile -> Deploy) */}
                  <line 
                    x1="535" y1="40" x2="665" y2="40" 
                    stroke={["synthesized", "deploying", "deployed"].includes(simState) ? "var(--accent)" : "#4B5563"} 
                    strokeWidth="2.5" 
                    strokeDasharray={simState === "synthesizing" ? "6, 4" : "none"}
                    className={simState === "synthesizing" ? "animate-[dash_1s_linear_infinite]" : ""}
                    markerEnd={["synthesized", "deploying", "deployed"].includes(simState) ? "url(#arrow-glow)" : "url(#arrow-gray)"}
                  />

                  {/* Nodes */}
                  {/* Node 1: Scan */}
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

                  {/* Node 2: Diff */}
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

                  {/* Node 3: Compile */}
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

                  {/* Node 4: Deploy */}
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

                {/* Moving Arrow animation helper stylesheet inject */}
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes dash {
                    to {
                      stroke-dashoffset: -20;
                    }
                  }
                `}} />
              </div>

              {/* Step 2: Playground Control Center / Step Triggers */}
              <div className={`grid gap-3 ${viewMode === "mobile" ? "grid-cols-2" : "grid-cols-2 md:grid-cols-5"}`}>
                <button
                  onClick={handleTriggerScan}
                  disabled={simState !== "idle"}
                  className="py-2.5 px-3 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    backgroundColor: simState === "idle" ? "var(--accent)" : "transparent",
                    color: simState === "idle" ? "#ffffff" : "var(--text-secondary)",
                    borderColor: simState === "idle" ? "var(--accent)" : "var(--border)",
                    boxShadow: simState === "idle" ? "0 4px 12px rgba(99, 102, 241, 0.25)" : "none"
                  }}
                >
                  <span>📡</span>
                  <span>1. Trigger Scan</span>
                </button>

                <button
                  onClick={handleRunDiff}
                  disabled={simState !== "scanned"}
                  className="py-2.5 px-3 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    backgroundColor: simState === "scanned" ? "var(--warning)" : "transparent",
                    color: simState === "scanned" ? "#000000" : "var(--text-secondary)",
                    borderColor: simState === "scanned" ? "var(--warning)" : "var(--border)",
                    boxShadow: simState === "scanned" ? "0 4px 12px rgba(245, 158, 11, 0.25)" : "none"
                  }}
                >
                  <span>🔍</span>
                  <span>2. Run Diff</span>
                </button>

                <button
                  onClick={handleCompileHCL}
                  disabled={simState !== "reconciled"}
                  className="py-2.5 px-3 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    backgroundColor: simState === "reconciled" ? "var(--accent)" : "transparent",
                    color: simState === "reconciled" ? "#ffffff" : "var(--text-secondary)",
                    borderColor: simState === "reconciled" ? "var(--accent)" : "var(--border)",
                    boxShadow: simState === "reconciled" ? "0 4px 12px rgba(99, 102, 241, 0.25)" : "none"
                  }}
                >
                  <span>📝</span>
                  <span>3. Compile HCL</span>
                </button>

                <button
                  onClick={handleDeployDevOps}
                  disabled={simState !== "synthesized"}
                  className="py-2.5 px-3 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    backgroundColor: simState === "synthesized" ? "var(--success)" : "transparent",
                    color: simState === "synthesized" ? "#ffffff" : "var(--text-secondary)",
                    borderColor: simState === "synthesized" ? "var(--success)" : "var(--border)",
                    boxShadow: simState === "synthesized" ? "0 4px 12px rgba(16, 185, 129, 0.25)" : "none"
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

              {/* Step 3: Dual-Pane Sandbox Terminal & Editor Visuals */}
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
                  {/* Locked/Blurred overlay during steps 1 and 2 */}
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
                        <span>✓</span> PUSHED & COMPILED
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
        )}

        {/* TAB 3: KEY CAPABILITIES */}
        {activeTab === "capabilities" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            <div 
              className="rounded-2xl border p-6 space-y-4 flex flex-col justify-between transition-colors duration-300"
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
              className="rounded-2xl border p-6 space-y-4 flex flex-col justify-between transition-colors duration-300"
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
              className="rounded-2xl border p-6 space-y-4 flex flex-col justify-between transition-colors duration-300"
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
              className="rounded-2xl border p-6 space-y-4 flex flex-col justify-between transition-colors duration-300"
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
              className="rounded-2xl border p-6 space-y-4 flex flex-col justify-between transition-colors duration-300"
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
          </div>
        )}

        {/* TAB 5: TERRAFORM PROVIDER REFERENCE */}
        {activeTab === "terraform" && (() => {
          const TF_RESOURCES = [
            {
              key: "security_system",
              label: "Security System",
              icon: "🛡️",
              tfType: "saviynt_security_system",
              category: "Core Infrastructure",
              description: "Defines and manages top-level EIC Security Systems — the root containers for all endpoints, connections, and access policies.",
              apiEndpoint: "GET /ECM/api/v5/getSecuritySystems",
              hcl: `resource "saviynt_security_system" "hr_system" {
  name        = "HR_SYSTEM_DEV"
  description = "HR Security System for Development"
}`,
              attrs: ["name", "description"]
            },
            {
              key: "endpoint",
              label: "Endpoint",
              icon: "🔌",
              tfType: "saviynt_endpoint",
              category: "Core Infrastructure",
              description: "Manages EIC Endpoints — the secure API or database connection targets attached to a parent Security System.",
              apiEndpoint: "POST /ECM/api/v5/getEndpoints",
              hcl: `resource "saviynt_endpoint" "hr_endpoint" {
  name               = "HR_API_ENDPOINT"
  security_system_id = saviynt_security_system.hr_system.id
  description        = "HR API Endpoint"
}`,
              attrs: ["name", "security_system_id", "description"]
            },
            {
              key: "dynamic_attribute",
              label: "Dynamic Attribute",
              icon: "🏷️",
              tfType: "saviynt_dynamic_attribute",
              category: "Configuration",
              description: "Creates and manages custom schema dynamic attributes that extend EIC object definitions with additional metadata fields.",
              apiEndpoint: "POST /ECM/api/v5/getDynamicAttributes",
              hcl: `resource "saviynt_dynamic_attribute" "department_code" {
  name        = "department_code"
  value       = "HR-DEV"
  description = "Department code dynamic attribute"
}`,
              attrs: ["name", "value", "description"]
            },
            {
              key: "entitlement_type",
              label: "Entitlement Type",
              icon: "📋",
              tfType: "saviynt_entitlement_type",
              category: "Access Control",
              description: "Defines the classification type for entitlements — e.g. Active Directory Group, Database Role, or SAP Profile.",
              apiEndpoint: "POST /ECM/api/v5/getEntitlementTypes",
              hcl: `resource "saviynt_entitlement_type" "ad_group" {
  name        = "AD_Group"
  description = "Active Directory Group Entitlement"
}`,
              attrs: ["name", "description"]
            },
            {
              key: "enterprise_role",
              label: "Enterprise Role",
              icon: "👔",
              tfType: "saviynt_enterprise_role",
              category: "Access Control",
              description: "Business-level role bundles that group multiple fine-grained entitlements under a single organisational access construct.",
              apiEndpoint: "POST /ECM/api/v5/getEnterpriseRoles",
              hcl: `resource "saviynt_enterprise_role" "dev_engineer" {
  name        = "Enterprise_Dev_Engineer"
  description = "General Enterprise Role for dev engineers"
}`,
              attrs: ["name", "description"]
            },
            {
              key: "entitlement",
              label: "Entitlements",
              icon: "🎫",
              tfType: "saviynt_entitlement",
              category: "Access Control",
              description: "Fine-grained access permissions — the atomic unit of EIC access control — mapped to endpoints and security systems.",
              apiEndpoint: "POST /ECM/api/v5/getEntitlements",
              hcl: `resource "saviynt_entitlement" "read_access" {
  name              = "Dev_Read_Access"
  entitlement_value = "read-only"
  description       = "Read-only access entitlement"
}`,
              attrs: ["name", "entitlement_value", "description"]
            },
            {
              key: "privilege",
              label: "Privileges",
              icon: "⚡",
              tfType: "saviynt_privilege",
              category: "Access Control",
              description: "Elevated administrator or super-user privileges granted to power users above standard entitlement tiers.",
              apiEndpoint: "POST /ECM/api/v5/getPrivileges",
              hcl: `resource "saviynt_privilege" "admin_access" {
  name        = "admin_dashboard_access"
  description = "Access to admin developer portal"
}`,
              attrs: ["name", "description"]
            },
            {
              key: "file_upload",
              label: "File Upload",
              icon: "📁",
              tfType: "saviynt_file_upload",
              category: "Data Management",
              description: "Manages secure file upload operations — e.g. bulk user provisioning spreadsheets or SAP HR export CSV files.",
              apiEndpoint: "POST /ECM/api/v5/getFileUploads",
              hcl: `resource "saviynt_file_upload" "sap_users" {
  file_name = "sap_users_baseline.xlsx"
  file_size = 1048576
  status    = "SUCCESS"
}`,
              attrs: ["file_name", "file_size", "status"]
            },
            {
              key: "connection",
              label: "Connections",
              icon: "🔗",
              tfType: "saviynt_connection",
              category: "Core Infrastructure",
              description: "Defines and manages the underlying database, LDAP, REST, SAP, or Salesforce connection profiles used by endpoints.",
              apiEndpoint: "POST /ECM/api/v5/getConnections",
              hcl: `resource "saviynt_connection" "dev_db" {
  name        = "DEV_DB_CONN"
  type        = "Database"
  description = "Development DB Connection"
}`,
              attrs: ["name", "type", "description"]
            },
            {
              key: "job",
              label: "Jobs",
              icon: "⚙️",
              tfType: "saviynt_*_job_resource",
              category: "Automation",
              description: "Configures automated reconciliation, synchronisation, and data import jobs. Each application maps to a specific EIC job resource block type.",
              apiEndpoint: "GET /ECM/api/v5/jobs",
              hcl: `# Per-application job blocks — type is resolved generically:
resource "saviynt_application_data_import_job_resource" "hr_import" {
  name        = "HR_Data_Import"
  status      = "SUCCESS"
  description = "Daily HR data import reconcile job"
}

resource "saviynt_accounts_import_full_job_resource" "finance_accounts" {
  name        = "Finance_Accounts_Full_Sync"
  status      = "SUCCESS"
  description = "Full finance accounts synchronisation"
}

resource "saviynt_user_import_job_resource" "user_sync" {
  name        = "User_Identity_Sync"
  status      = "SUCCESS"
  description = "User identity synchronisation job"
}`,
              attrs: ["name", "status", "description", "jobType"]
            },
            {
              key: "transport_package",
              label: "Transport Packages",
              icon: "📦",
              tfType: "saviynt_export/import_transport_package_resource",
              category: "Deployment",
              description: "Cross-environment configuration promotion packages. Exports bundle EIC configs from source and Imports deploy them to target environments (DEV → PRE → PROD).",
              apiEndpoint: "POST /ECM/api/v5/getTransportPackages",
              hcl: `# EXPORT from source environment:
resource "saviynt_export_transport_package_resource" "billing_module_export" {
  name        = "Billing_Module_DEV"
  version     = "1.0.0"
  description = "Billing access configurations export package"
}

# IMPORT into target environment:
resource "saviynt_import_transport_package_resource" "billing_module_import" {
  name         = "Billing_Module_PRE"
  package_path = "./packages/Billing_Module_DEV.zip"
  description  = "Billing access configurations import into PRE"
}`,
              attrs: ["name", "version", "package_path", "description", "actionType"]
            }
          ];

          const JOB_TYPES = [
            { block: "saviynt_application_data_import_job_resource", use: "Import data from connected apps (SAP, Workday, etc.)" },
            { block: "saviynt_user_import_job_resource", use: "Synchronise user identities from HR or LDAP sources" },
            { block: "saviynt_accounts_import_full_job_resource", use: "Full account import — rebuilds entire account state" },
            { block: "saviynt_accounts_import_incremental_job_resource", use: "Incremental delta sync — only changed accounts" },
            { block: "saviynt_ecm_job_resource", use: "Enterprise Connection Manager generalised jobs" },
            { block: "saviynt_ecm_sap_user_job_resource", use: "SAP-specific ECM user provisioning jobs" },
            { block: "saviynt_schema_user_job_resource", use: "User schema reconciliation and normalisation" },
            { block: "saviynt_schema_account_job_resource", use: "Account schema reconciliation jobs" },
            { block: "saviynt_schema_role_job_resource", use: "Role schema reconciliation jobs" },
            { block: "saviynt_file_transfer_job_resource", use: "Secure file transfer and processing operations" },
            { block: "saviynt_ws_retry_job_resource", use: "Web service call retry handler" },
            { block: "saviynt_job_control_resource", use: "Global job scheduling and control configuration" }
          ];

          const selected = TF_RESOURCES.find(r => r.key === activeTfResource) || TF_RESOURCES[0];
          const categoryColors: Record<string,string> = {
            "Core Infrastructure": "#06b6d4",
            "Configuration": "#a78bfa",
            "Access Control": "#34d399",
            "Data Management": "#f59e0b",
            "Automation": "#f97316",
            "Deployment": "#ec4899"
          };

          return (
            <div className="space-y-8 animate-fadeIn">
              {/* Header banner */}
              <div className="rounded-2xl border p-6 text-center space-y-2" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(79,70,229,0.08))", borderColor: "rgba(124,58,237,0.3)" }}>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">🔧</span>
                  <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Saviynt Terraform Provider Reference</h2>
                </div>
                <p className="text-xs max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
                  The official <strong style={{color:"#a78bfa"}}>saviynt/saviynt</strong> Terraform provider manages <strong style={{color:"#34d399"}}>11 EIC resource types</strong> via declarative HCL blocks. Envizor autogenerates all these blocks from live tenant discovery.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  {[
                    { label: "Provider", val: "saviynt/saviynt" },
                    { label: "Version", val: "≥ 0.3.4" },
                    { label: "Terraform", val: "≥ 1.11" },
                    { label: "Auth", val: "Ephemeral (5 min)" }
                  ].map(b => (
                    <div key={b.label} className="px-3 py-1.5 rounded-lg border text-[10px] font-mono" style={{ borderColor: "rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.08)", color: "#a78bfa" }}>
                      <span className="text-slate-400">{b.label}: </span>{b.val}
                    </div>
                  ))}
                </div>
              </div>

              {/* Provider config block */}
              <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">⚙️</span>
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "#a78bfa" }}>Provider Configuration</h3>
                </div>
                <pre className="text-[11px] leading-relaxed rounded-xl p-4 overflow-x-auto" style={{ background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", border: "1px solid rgba(124,58,237,0.2)" }}><code><span style={{color:"#7c3aed"}}>terraform</span> {"{"}{
                "\n"}<span style={{color:"#a78bfa"}}>  required_providers</span> {"{"}{
                "\n"}    <span style={{color:"#34d399"}}>saviynt</span> = {"{"}{
                "\n"}      <span style={{color:"#06b6d4"}}>source</span>  = <span style={{color:"#fbbf24"}}>&quot;saviynt/saviynt&quot;</span>{
                "\n"}      <span style={{color:"#06b6d4"}}>version</span> = <span style={{color:"#fbbf24"}}>&quot;~&gt; 0.3&quot;</span>{
                "\n"}    {"}"}{
                "\n"}  {"}"}{
                "\n"}{"}"}{
                "\n"}{
                "\n"}<span style={{color:"#7c3aed"}}>provider</span> <span style={{color:"#fbbf24"}}>&quot;saviynt&quot;</span> {"{"}{
                "\n"}  <span style={{color:"#06b6d4"}}>server_url</span> = <span style={{color:"#fbbf24"}}>var.saviynt_url</span>{
                "\n"}  <span style={{color:"#06b6d4"}}>username</span>   = <span style={{color:"#fbbf24"}}>var.saviynt_username</span>  <span style={{color:"#475569"}}># Ephemeral — rotated every 5 min</span>{
                "\n"}  <span style={{color:"#06b6d4"}}>password</span>   = <span style={{color:"#fbbf24"}}>var.saviynt_password</span>  <span style={{color:"#475569"}}># Never hardcoded</span>{
                "\n"}{"}"}{
                "\n"}</code></pre>
                <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <span className="text-sm">🔐</span>
                  <p className="text-[11px]" style={{ color: "#fbbf24" }}><strong>Zero-Trust Ephemeral Auth:</strong> Envizor enforces a strict 5-minute session lifetime on all authentication tokens. Credentials are never hardcoded — they rotate automatically via environment variables or a secrets manager.</p>
                </div>
              </div>

              {/* Resource Browser */}
              <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <div className="p-4 border-b" style={{ borderColor: "var(--border)", background: "rgba(0,0,0,0.2)" }}>
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>📚 Interactive Resource Browser — 11 Supported EIC Resources</h3>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>Click any resource to see its Terraform block, attributes, and API endpoint.</p>
                </div>
                <div className={`flex ${viewMode === "mobile" ? "flex-col" : ""}`}>
                  {/* Sidebar resource list */}
                  <div className={`flex ${viewMode === "mobile" ? "flex-row overflow-x-auto scrollbar-none gap-1 p-2" : "flex-col w-52 flex-shrink-0 border-r p-2 gap-1"}`} style={{ borderColor: "var(--border)" }}>
                    {TF_RESOURCES.map(r => (
                      <button
                        key={r.key}
                        onClick={() => setActiveTfResource(r.key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold text-left transition-all duration-200 cursor-pointer ${viewMode === "mobile" ? "whitespace-nowrap flex-shrink-0" : "w-full"}`}
                        style={activeTfResource === r.key
                          ? { background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.35)" }
                          : { color: "var(--text-secondary)", border: "1px solid transparent" }
                        }
                      >
                        <span>{r.icon}</span>
                        <span>{r.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Detail panel */}
                  <div className="flex-1 p-5 space-y-4 min-w-0">
                    {/* Resource header */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{selected.icon}</span>
                          <h4 className="text-base font-black" style={{ color: "var(--text-primary)" }}>{selected.label}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase" style={{ background: `${categoryColors[selected.category]}22`, color: categoryColors[selected.category], border: `1px solid ${categoryColors[selected.category]}44` }}>{selected.category}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{selected.description}</p>
                      </div>
                    </div>

                    {/* Terraform resource type pill */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Terraform type:</span>
                      <code className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold" style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.25)" }}>{selected.tfType}</code>
                      <span className="text-[10px] font-bold uppercase text-slate-400">API:</span>
                      <code className="px-2.5 py-1 rounded-lg text-[11px] font-mono" style={{ background: "rgba(6,182,212,0.08)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)" }}>{selected.apiEndpoint}</code>
                    </div>

                    {/* Attributes */}
                    <div className="flex flex-wrap gap-1.5">
                      {selected.attrs.map(a => (
                        <span key={a} className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: "rgba(52,211,153,0.08)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>{a}</span>
                      ))}
                    </div>

                    {/* HCL code block */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--accent)" }}>Generated HCL Block</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}>✓ Production Ready</span>
                      </div>
                      <pre className="text-[11px] leading-relaxed rounded-xl p-4 overflow-x-auto" style={{ background: "#0a0a12", color: "#e2e8f0", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", border: "1px solid rgba(124,58,237,0.2)", maxHeight: "280px" }}>
                        <code>{selected.hcl}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Types Reference Table */}
              <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚙️</span>
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "#f97316" }}>Supported Job Resource Block Types</h3>
                </div>
                <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Jobs are created <strong style={{color:"var(--text-primary)"}}>per-application</strong>. The <code style={{color:"#a78bfa"}}>jobType</code> field resolves generically to the correct EIC block. Each application maps to one of the following Terraform resource types:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]" style={{ borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th className="text-left p-2.5 font-black text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Terraform Block</th>
                        <th className="text-left p-2.5 font-black text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Use Case</th>
                      </tr>
                    </thead>
                    <tbody>
                      {JOB_TYPES.map((j, i) => (
                        <tr key={j.block} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                          <td className="p-2.5">
                            <code className="text-[10px] font-mono" style={{ color: "#a78bfa" }}>{j.block}</code>
                          </td>
                          <td className="p-2.5" style={{ color: "var(--text-secondary)" }}>{j.use}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transport Package flow */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "rgba(236,72,153,0.3)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📤</span>
                    <h3 className="text-sm font-black" style={{ color: "#ec4899" }}>Export Transport Package</h3>
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Packages EIC configuration from a source environment (e.g. DEV) into a versioned <code>.zip</code> artifact.</p>
                  <pre className="text-[11px] rounded-xl p-3 overflow-x-auto" style={{ background: "#0a0a12", color: "#e2e8f0", fontFamily: "monospace", border: "1px solid rgba(236,72,153,0.2)" }}><code>{`resource "saviynt_export_transport_package_resource" "billing_dev" {
  name        = "Billing_Module_DEV"
  version     = "1.0.0"
  description = "Export billing config from DEV"
}`}</code></pre>
                </div>
                <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "rgba(34,211,153,0.3)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📥</span>
                    <h3 className="text-sm font-black" style={{ color: "#34d399" }}>Import Transport Package</h3>
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Deploys a packaged artifact into a target environment (e.g. PRE or PROD). Uses <code>package_path</code> to locate the <code>.zip</code>.</p>
                  <pre className="text-[11px] rounded-xl p-3 overflow-x-auto" style={{ background: "#0a0a12", color: "#e2e8f0", fontFamily: "monospace", border: "1px solid rgba(34,211,153,0.2)" }}><code>{`resource "saviynt_import_transport_package_resource" "billing_pre" {
  name         = "Billing_Module_PRE"
  package_path = "./packages/Billing_Module_DEV.zip"
  description  = "Deploy billing config to PRE"
}`}</code></pre>
                </div>
              </div>

              {/* How Terraform behaves with Saviynt */}
              <div className="rounded-2xl border p-6 space-y-5" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>🧠 How Terraform Behaves with Saviynt EIC</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { icon: "🔍", title: "Plan Phase", color: "#06b6d4", desc: "Terraform queries the live EIC tenant via REST APIs, compares state with your \`.tfstate\` file, and prints a dry-run diff of what will change — zero modifications made." },
                    { icon: "✅", title: "Apply Phase", color: "#34d399", desc: "After plan approval, Terraform calls EIC write APIs to create, update, or delete resources. State is written back to \`.tfstate\` for future drift detection." },
                    { icon: "🔄", title: "State Drift", color: "#f59e0b", desc: "If someone modifies EIC directly via portal, the next \`terraform plan\` shows the drift. Envizor catches this before Terraform even runs and flags it visually." }
                  ].map(item => (
                    <div key={item.title} className="p-4 rounded-xl border space-y-2" style={{ background: `${item.color}08`, borderColor: `${item.color}22` }}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-xs font-black" style={{ color: item.color }}>{item.title}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl border" style={{ background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.2)" }}>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    <strong style={{color:"#a78bfa"}}>Lifecycle summary:</strong> <code style={{color:"#06b6d4"}}>terraform init</code> → downloads the saviynt provider plugin → <code style={{color:"#06b6d4"}}>terraform plan</code> → reads live EIC state and diffs against baseline → <code style={{color:"#34d399"}}>terraform apply</code> → writes approved changes to EIC → <code style={{color:"#f59e0b"}}>terraform destroy</code> → removes managed resources. Envizor automates the init→plan→apply loop inside its DevOps pipeline wizard.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 4: FREQUENTLY ASKED QUESTIONS */}
        {activeTab === "faq" && (
          <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn w-full">
            {[
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
            ].map((item, index) => (
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
        )}

        {/* Call to action panel at bottom */}
        <div 
          className="rounded-2xl p-6 border text-center flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn"
          style={{ 
            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(99, 102, 241, 0.05))",
            borderColor: "var(--border)" 
          }}
        >
          <div className="text-left">
            <h4 className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
              Ready to orchestrate your cloud environments?
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Begin by exploring Day 0 Workspace Setup, or launch the automated DevOps Terraform Wizard to generate code packages.
            </p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/wizard/day0-setup" 
              onClick={(e) => handleTargetLinkClick(e, "/wizard/day0-setup")}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 flex items-center gap-1 ${
                isTargetLocked("/wizard/day0-setup") ? "opacity-65 border-dashed" : ""
              }`}
            >
              {isTargetLocked("/wizard/day0-setup") ? "🔒 " : ""}Day 0 Setup
            </Link>
            <Link 
              href="/wizard/home" 
              onClick={(e) => handleTargetLinkClick(e, "/wizard/home")}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-white shadow-md hover:scale-[1.02] flex items-center gap-1 ${
                isTargetLocked("/wizard/home") ? "opacity-75 border-dashed border border-red-500/40" : ""
              }`}
              style={
                isTargetLocked("/wizard/home")
                  ? {
                      background: "linear-gradient(135deg, #1e293b, #0f172a)",
                      boxShadow: "none"
                    }
                  : {
                      background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                      boxShadow: "0 4px 14px var(--accent-glow)"
                    }
              }
            >
              {isTargetLocked("/wizard/home") ? "🔒 " : ""}Launch DevOps Wizard
            </Link>
          </div>
        </div>

      </div>

      {/* ── Access Request Premium Modal ── */}
      {showAccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-md rounded-2xl border p-6 flex flex-col gap-4 relative shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden text-left"
            style={{
              backgroundColor: "var(--bg-panel)",
              borderColor: "rgba(239, 68, 68, 0.35)",
            }}
          >
            {/* Ambient Background Glow Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full filter blur-[80px] -z-10 bg-red-500/10 pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">🔒</span>
              <div className="flex flex-col">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-100">Access Restricted</h3>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-0.5">Role Privileges Required</span>
              </div>
            </div>

            {/* Description */}
            <div className="text-xs space-y-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <p>
                Your account role (<strong className="text-slate-100">{userRole}</strong>) is currently restricted from navigating to the <strong>{modalTileLabel}</strong> tier directly.
              </p>
              <p className="text-[11px] text-slate-400">
                Submit an elevated environment access request below. Your request will be queued in the SuperAdmin approval catalog instantly.
              </p>
            </div>

            {/* Request Form */}
            {successMessage ? (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-450 text-xs font-bold text-center animate-scaleUp">
                {successMessage}
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="flex flex-col gap-3.5 mt-2">
                {/* Select Environment Tier */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Select Target Security Role
                  </label>
                  <select
                    value={requestedScope}
                    onChange={(e) => setRequestedScope(e.target.value)}
                    className="w-full text-xs font-semibold rounded-lg p-2 border bg-black/45 text-slate-100 outline-none focus:border-red-500/40 transition"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <option value="DEV_Admin">🛠️ DEV Admin (DEV Workspace Read-Write)</option>
                    <option value="PRE_Admin">✨ PRE Admin (PRE Workspace Read-Write)</option>
                    <option value="PROD_Admin">🚀 PROD Admin (PROD Workspace Read-Write)</option>
                  </select>
                </div>

                {/* Justification Textbox */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Business Justification
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide a business justification for this environment role elevation request..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="w-full text-xs font-semibold rounded-lg p-2.5 border bg-black/45 text-slate-250 outline-none focus:border-red-500/40 transition placeholder:text-slate-500 resize-none leading-relaxed"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAccessModal(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition hover:bg-white/5 border border-slate-850 text-slate-350 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition text-white hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                      boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)"
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Queuing...</span>
                      </>
                    ) : (
                      <span>Request Access</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
