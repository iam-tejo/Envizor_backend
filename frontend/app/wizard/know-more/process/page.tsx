"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function ProcessPage() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [diagramMode, setDiagramMode] = useState<"topology" | "pipeline">("topology");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  // Access Control & Gating States
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
    const roles = userRole.split(",").map((r) => r.trim().toUpperCase());
    if (roles.includes("ADMINISTRATORS") || roles.includes("SUPERADMIN") || roles.includes("DEV OPS")) {
      return false;
    }
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

    // Also sync to server database
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessRequests: reqs
      })
    }).catch(err => console.error("Error syncing access request to server:", err));

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage("✅ Access request queued! Awaiting SuperAdmin approval.");
      setTimeout(() => {
        setShowAccessModal(false);
      }, 1500);
    }, 800);
  };

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
        @keyframes float-pipe {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
          100% { transform: translateY(0px); }
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
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Process Flow</span>
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
            <span className="text-2xl text-white">📈</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            Envizor Process Walkthrough
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Trace how access-governance data is discovered, reconciled, compiled, and deployed safely inside the Envizor pipeline.
          </p>
        </div>

        {/* TAB 2: INTERACTIVE PROCESS FLOW & TIMELINE */}
        <div className="space-y-8 animate-fadeIn">
          
          <div className="space-y-4">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Governance-as-Code Walkthrough</span>
              <h3 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>Ecosystem Pipeline Walkthrough</h3>
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
                      🌐 <span className="font-bold text-slate-200">High-Level Topology:</span> Outlines user flows, agent components, and environment scopes (DEV → PRE → PROD).
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

                    <rect x="20" y="35" width="110" height="60" rx="12" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="75" y="63" fill="var(--text-primary)" fontSize="10" fontWeight="extrabold" textAnchor="middle">☁️ Saviynt Cloud</text>
                    <text x="75" y="79" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Active Tenant API</text>
                    <rect x="25" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                    <text x="75" y="20" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">☁️ TARGET: Tenant (Read-Only)</text>

                    <path d="M 370 50 L 138 50" stroke="var(--border)" strokeWidth="1" fill="none" strokeDasharray="3,3" markerEnd="url(#arrow-warning)" />
                    <path d="M 370 50 L 138 50" stroke="var(--warning)" strokeWidth="1.5" fill="none" strokeDasharray="5,15" className="animate-flow-rev" markerEnd="url(#arrow-warning)" />
                    <text x="250" y="44" fill="var(--accent)" fontSize="7.5" fontWeight="bold" textAnchor="middle">1. Scan Request (Originates here {"→"})</text>

                    <path d="M 130 80 L 362 80" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-accent)" />
                    <path d="M 130 80 L 362 80" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeDasharray="8,20" className="animate-flow" markerEnd="url(#arrow-accent)" />
                    <text x="250" y="93" fill="var(--accent)" fontSize="7.5" fontWeight="bold" textAnchor="middle">2. Discovered JSON Streams ({"→"} memory buffer)</text>

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
                  className="p-5 rounded-2xl border space-y-4 shadow-md"
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
                  <span className="text-[9px] border px-2 py-0.5 rounded font-bold uppercase tracking-widest text-cyan-400" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}>
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

                    <rect x="20" y="20" width="125" height="40" rx="8" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="82.5" y="44" fill="var(--text-secondary)" fontSize="9" fontWeight="bold" textAnchor="middle"> Live Scanned Tenant</text>
                    <rect x="32.5" y="5" width="100" height="12" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                    <text x="82.5" y="13" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">☁️ SOURCE A (Read-Only)</text>

                    <rect x="20" y="90" width="125" height="40" rx="8" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="82.5" y="114" fill="var(--text-secondary)" fontSize="9" fontWeight="bold" textAnchor="middle">📦 Workspace Baseline</text>
                    <rect x="32.5" y="75" width="100" height="12" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                    <text x="82.5" y="83" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">💾 SOURCE B (Read-Only)</text>

                    <path d="M 145 40 L 230 40 L 275 75" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-warning)" />
                    <path d="M 145 40 L 230 40 L 275 75" stroke="var(--warning)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-warning)" />

                    <path d="M 145 110 L 230 110 L 275 75" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-accent)" />
                    <path d="M 145 110 L 230 110 L 275 75" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-accent)" />

                    <circle cx="310" cy="75" r="30" fill="var(--bg-surface)" stroke="var(--warning)" strokeWidth="2" style={{ animation: "pulse-warning-glow 2s infinite" }} />
                    <text x="310" y="71" fill="var(--warning)" fontSize="8" fontWeight="black" textAnchor="middle" style={{ letterSpacing: "0.1em" }}>Access</text>
                    <text x="310" y="83" fill="var(--warning)" fontSize="8" fontWeight="black" textAnchor="middle" style={{ letterSpacing: "0.1em" }}>DRIFT!</text>
                    <rect x="260" y="115" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--warning)" strokeWidth="1" />
                    <text x="310" y="125" fill="var(--warning)" fontSize="7" fontWeight="black" textAnchor="middle">📡 CALL ORIGIN</text>

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
                  className="p-5 rounded-2xl border space-y-4 shadow-md"
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

                    <rect x="20" y="35" width="110" height="60" rx="12" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="75" y="63" fill="var(--text-secondary)" fontSize="10" fontWeight="bold" textAnchor="middle">📊 Scanned Maps</text>
                    <text x="75" y="79" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Extracted JSON</text>
                    <rect x="25" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                    <text x="75" y="20" fill="var(--text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">🧠 SOURCE: In-Memory JSON</text>

                    <path d="M 130 65 L 214 65" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-accent)" />
                    <path d="M 130 65 L 214 65" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-accent)" />

                    <polygon points="220,40 280,65 220,90" fill="var(--bg-panel)" stroke="var(--accent)" strokeWidth="2" />
                    <text x="245" y="68" fill="var(--accent)" fontSize="8" fontWeight="black" textAnchor="middle">COMPILER</text>
                    <rect x="195" y="10" width="100" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--accent)" strokeWidth="1" />
                    <text x="245" y="20" fill="var(--accent)" fontSize="7.5" fontWeight="black" textAnchor="middle">📡 CALL ORIGIN</text>

                    <path d="M 280 65 L 364 65" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-success)" />
                    <path d="M 280 65 L 364 65" stroke="var(--success)" strokeWidth="2.5" fill="none" strokeDasharray="6,15" className="animate-flow" markerEnd="url(#arrow-success)" />

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
                  className="p-5 rounded-2xl border space-y-4 shadow-md"
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

                    <rect x="15" y="45" width="100" height="60" rx="10" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="65" y="73" fill="var(--text-primary)" fontSize="9" fontWeight="bold" textAnchor="middle">Local Workspace</text>
                    <text x="65" y="87" fill="var(--text-muted)" fontSize="8" textAnchor="middle">.tf HCL Blueprints</text>
                    <rect x="20" y="20" width="90" height="15" rx="3" fill="var(--bg-panel)" stroke="var(--border)" strokeWidth="0.8" />
                    <text x="65" y="30" fill="var(--text-muted)" fontSize="7.5" fontWeight="bold" textAnchor="middle">💾 READ WORKSPACE</text>

                    <path d="M 115 75 L 172 75" stroke="var(--border)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-accent)" />
                    <path d="M 115 75 L 172 75" stroke="var(--accent)" strokeWidth="2" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-accent)" />

                    <circle cx="230" cy="75" r="45" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                    <circle cx="230" cy="75" r="45" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray="20,130" strokeDashoffset="0" className="animate-flow" />

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

                    <path d="M 288 75 L 370 75" stroke="var(--border)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-success)" />
                    <path d="M 288 75 L 370 75" stroke="var(--success)" strokeWidth="2" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-success)" />

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
                  className="p-5 rounded-2xl border space-y-4 shadow-md"
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

                    <rect x="20" y="30" width="140" height="65" rx="10" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="90" y="55" fill="var(--text-primary)" fontSize="9" fontWeight="extrabold" textAnchor="middle">1. API REST Crawler</text>
                    <text x="90" y="70" fill="var(--accent)" fontSize="8" fontWeight="bold" textAnchor="middle">[ Active Extraction ]</text>
                    <text x="90" y="82" fill="var(--text-muted)" fontSize="7.5" textAnchor="middle">Introspects SaaS APIs</text>

                    <path d="M 160 62.5 L 234 62.5" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-accent)" />
                    <path d="M 160 62.5 L 234 62.5" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-accent)" />

                    <rect x="240" y="30" width="140" height="65" rx="10" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="310" y="55" fill="var(--text-primary)" fontSize="9" fontWeight="extrabold" textAnchor="middle">2. Drift Compare</text>
                    <text x="310" y="70" fill="var(--warning)" fontSize="8" fontWeight="bold" textAnchor="middle">[ Delta Reconciler ]</text>
                    <text x="310" y="82" fill="var(--text-muted)" fontSize="7.5" textAnchor="middle">Identifies portal drifts</text>

                    <path d="M 380 62.5 L 430 62.5 L 430 180 L 454 180" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-warning)" />
                    <path d="M 380 62.5 L 430 62.5 L 430 180 L 454 180" stroke="var(--warning)" strokeWidth="2.5" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-warning)" />

                    <rect x="460" y="147.5" width="140" height="65" rx="10" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1.5" />
                    <text x="530" y="172.5" fill="var(--text-primary)" fontSize="9" fontWeight="extrabold" textAnchor="middle">3. HCL Synthesizer</text>
                    <text x="530" y="187.5" fill="var(--accent)" fontSize="8" fontWeight="bold" textAnchor="middle">[ Code Compiler ]</text>
                    <text x="530" y="199.5" fill="var(--text-muted)" fontSize="7.5" textAnchor="middle">Generates Terraform .tf</text>

                    <path d="M 600 180 L 674 180" stroke="var(--border)" strokeWidth="2" fill="none" markerEnd="url(#arrow-success)" />
                    <path d="M 600 180 L 674 180" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeDasharray="5,15" className="animate-flow" markerEnd="url(#arrow-success)" />

                    <rect x="680" y="147.5" width="100" height="65" rx="10" fill="var(--bg-surface)" stroke="var(--success)" strokeWidth="1.5" />
                    <text x="730" y="172.5" fill="var(--text-primary)" fontSize="9" fontWeight="extrabold" textAnchor="middle">4. DevOps Deploy</text>
                    <text x="730" y="187.5" fill="var(--success)" fontSize="8" fontWeight="bold" textAnchor="middle">[ Plan & Apply ]</text>
                    <text x="730" y="199.5" fill="var(--text-muted)" fontSize="7.5" textAnchor="middle">Writes configurations</text>

                    <path d="M 730 147.5 L 730 15 L 90 15 L 90 24" stroke="var(--border)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-success)" />
                    <path d="M 730 147.5 L 730 15 L 90 15 L 90 24" stroke="var(--success)" strokeWidth="2" fill="none" strokeDasharray="5,15" className="animate-flow-rev" markerEnd="url(#arrow-success)" />

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

      </div>

      {/* Access Request Premium Modal */}
      {showAccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-md rounded-2xl border p-6 flex flex-col gap-4 relative shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden text-left"
            style={{
              backgroundColor: "var(--bg-panel)",
              borderColor: "rgba(239, 68, 68, 0.35)",
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full filter blur-[80px] -z-10 bg-red-500/10 pointer-events-none" />

            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">🔒</span>
              <div className="flex flex-col">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-100">Access Restricted</h3>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-0.5">Role Privileges Required</span>
              </div>
            </div>

            <div className="text-xs space-y-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <p>
                Your account role (<strong className="text-slate-100">{userRole}</strong>) is currently restricted from navigating to the <strong>{modalTileLabel}</strong> tier directly.
              </p>
              <p className="text-[11px] text-slate-400">
                Submit an elevated environment access request below. Your request will be queued in the SuperAdmin approval catalog instantly.
              </p>
            </div>

            {successMessage ? (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-450 text-xs font-bold text-center animate-scaleUp">
                {successMessage}
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="flex flex-col gap-3.5 mt-2">
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
