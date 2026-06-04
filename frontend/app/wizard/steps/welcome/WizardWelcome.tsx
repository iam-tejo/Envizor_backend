"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./WizardWelcome.css";

type LockedModalInfo = {
  id: string;
  name: string;
};

export default function WizardWelcome() {
  const router = useRouter();

  // User identities and custom permissions state
  const [userName, setUserName] = useState("user");
  const [userRole, setUserRole] = useState("BasicUser");
  const [userPermissions, setUserPermissions] = useState<string[]>(["tile-know-more"]);

  // Modal triggers and input tracking
  const [targetTile, setTargetTile] = useState<LockedModalInfo | null>(null);
  const [requestedScope, setRequestedScope] = useState("DEV_Admin");
  const [justification, setJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Access Duration Strategy (JIT vs Permanent)
  const [isJit, setIsJit] = useState(true);
  const [jitDuration, setJitDuration] = useState(240); // default to 4 hours (240 mins)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("envizor_username") || "user";
      
      // Load user latest role from central custom roles map
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";
      
      // Update session storage immediately
      sessionStorage.setItem("envizor_user_role", latestRole);
      
      setUserRole(latestRole);
      setUserName(user);

      // Load user tile permissions from localStorage
      const allPerms = localStorage.getItem("envizor_user_permissions");
      const permsMap = allPerms ? JSON.parse(allPerms) : {};
      let userPerms = permsMap[user.toLowerCase()] || ["tile-know-more"];

      // Self-healing mechanism: If role is BasicUser, reset permissions back to know-more strictly
      const rNormalized = latestRole.replace(/\s+|_/g, "").toUpperCase();
      if (rNormalized === "BASICUSER") {
        userPerms = ["tile-know-more"];
        permsMap[user.toLowerCase()] = userPerms;
        localStorage.setItem("envizor_user_permissions", JSON.stringify(permsMap));
      }

      setUserPermissions(userPerms);
    }
  }, []);

  // 3D tilt effect for tiles
  useEffect(() => {
    const tiles = document.querySelectorAll(
      ".feature-tile:not(.locked-tile)"
    ) as NodeListOf<HTMLElement>;

    tiles.forEach((tile) => {
      const handleMove = (e: MouseEvent) => {
        const rect = tile.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        tile.style.transform = `
          perspective(1000px)
          rotateX(${(-y / 20)}deg)
          rotateY(${x / 20}deg)
          scale(1.03)
        `;
      };

      const reset = () => {
        tile.style.transform =
          "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
      };

      tile.addEventListener("mousemove", handleMove);
      tile.addEventListener("mouseleave", reset);
    });
  }, [userPermissions, userRole]);

  // Verification if specific tile is locked for the user
  function isTileLocked(tileId: string) {
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();

    if (r === "SUPERADMIN") return false;
    if (tileId === "tile-know-more") return false;

    if (r === "BASICUSER") {
      return !userPermissions.includes(tileId);
    }

    if (r === "DEVADMIN" || r === "PREADMIN" || r === "PRODADMIN") {
      return false; // All environment admins have full access to all premium tiles
    }

    return true;
  }

  const handleTileClick = (tileId: string, tileName: string, href: string) => {
    if (tileId === "tile-request-role") {
      setTargetTile({ id: "tile-day0-setup", name: "Premium Workspace Environment" });
      setJustification("");
      setRequestedScope("DEV_Admin");
      setIsJit(true);
      setJitDuration(240);
      setSuccessMessage(null);
    } else if (isTileLocked(tileId)) {
      setTargetTile({ id: tileId, name: tileName });
      setJustification("");
      setRequestedScope("DEV_Admin");
      setIsJit(true);
      setJitDuration(240);
      setSuccessMessage(null);
    } else {
      router.push(href);
    }
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTile) return;

    setIsSubmitting(true);

    const existingReqs = localStorage.getItem("envizor_access_requests");
    const reqs = existingReqs ? JSON.parse(existingReqs) : [];

    const newRequest = {
      id: `ACC-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      username: userName,
      tileId: targetTile.id,
      tileName: targetTile.name,
      requestedRole: requestedScope,
      justification: justification.trim(),
      status: "PENDING",
      isJit: isJit,
      jitDuration: isJit ? jitDuration : undefined
    };

    reqs.push(newRequest);
    localStorage.setItem("envizor_access_requests", JSON.stringify(reqs));

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage("✅ Access request queued! Awaiting SuperAdmin approval.");
      setTimeout(() => {
        setTargetTile(null);
      }, 1500);
    }, 800);
  };

  const tileBase = `
    feature-tile themed-card
    relative overflow-hidden
    shadow-lg p-6
    transition-all duration-300 flex flex-col select-none
  `;

  const tilesData = [
    {
      id: "tile-know-more",
      name: "Know More about Envizor",
      href: "/wizard/know-more",
      gradient: "from-cyan-400 via-sky-400 to-blue-500",
      description: "Interactive walkthrough of the AI-driven IGA & Terraform process, environment pipelines, and why Envizor is used."
    },
    {
      id: "tile-day0-setup",
      name: "Day 0 Setup",
      href: "/wizard/day0-setup",
      gradient: "from-indigo-500 via-purple-500 to-indigo-500",
      description: "Configure workspaces, edit Saviynt tenant details, and pull baseline configuration HCL assets."
    },
    {
      id: "tile-iga-explorer",
      name: "IGA Tenants Explorer",
      gradient: "from-indigo-400 to-indigo-600",
      href: "/wizard/day0",
      description: "Import existing Saviynt artefacts and bootstrap Terraform state for any environment."
    },
    {
      id: "tile-workspace-explorer",
      name: "Terraform Workspace Explorer",
      gradient: "from-sky-400 to-sky-600",
      href: "/wizard/explorer",
      description: "Browse Terraform workspaces and inspect generated files directly in the Hub."
    },
    {
      id: "tile-terraform-wizard",
      name: "DevOps Terraform Wizard",
      gradient: "from-blue-400 to-blue-600",
      href: "/wizard/home",
      description: "Configure your workspace, select operations, and generate Terraform packages with ease."
    },
    {
      id: "tile-connected-app",
      name: "Connected App JSON Generator",
      gradient: "from-purple-400 to-purple-600",
      href: "/wizard/connected-app",
      description: "Generate and onboard SCIM, REST, Database, and File application integration JSON configurations."
    },
    {
      id: "tile-analytics",
      name: "Analytics & Insights",
      gradient: "from-emerald-400 to-emerald-600",
      href: "/wizard/analytics",
      description: "Execute SQL database queries on Saviynt schema guidelines to discover and visualize user operational stats."
    },
    {
      id: "tile-ai-agent",
      name: "🧠 AI Agent Console",
      gradient: "from-amber-400 via-orange-500 to-red-500",
      href: "/wizard/agent",
      description: "Chat directly with Envizor's agentic brain, inspect the local filesystem, stage and apply live code modifications."
    }
  ];

  const visibleTiles = tilesData.filter((tile) => {
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();

    // AI Agent Console tile is strictly visible ONLY for SuperAdmin
    if (tile.id === "tile-ai-agent") {
      return r === "SUPERADMIN";
    }

    if (r === "SUPERADMIN") return true;
    if (tile.id === "tile-know-more") return true;

    // Basic Users see ALL tiles (rendered as locked/gated except 'Know More')
    if (r === "BASICUSER") return true;

    // DEV, PRE, and PROD Admins see all premium tiles
    if (r === "DEVADMIN" || r === "PREADMIN" || r === "PRODADMIN") return true;

    return false;
  });

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-6 py-8 relative overflow-hidden"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* ── Background Art Layer ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Terraform mesh — bottom-left anchor */}
        <img
          src="/terraform_bg.png"
          alt=""
          aria-hidden="true"
          className="absolute -bottom-10 -left-20 w-[600px] opacity-[0.13] blur-[2px] rotate-[-12deg] select-none"
          style={{ mixBlendMode: "screen" }}
        />

        {/* IGA identity web — top-right anchor */}
        <img
          src="/iga_bg.png"
          alt=""
          aria-hidden="true"
          className="absolute -top-16 -right-20 w-[550px] opacity-[0.12] blur-[2px] rotate-[10deg] select-none"
          style={{ mixBlendMode: "screen" }}
        />

        {/* Centre radial glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl opacity-20"
          style={{ background: "var(--accent)" }}
        />

        {/* Vignette darkener */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, var(--bg-base) 85%)",
          }}
        />
      </div>

      {/* Welcome Banner Informer */}
      <div className="w-full max-w-6xl mb-6 z-10">
        <div className="rounded-2xl border border-sky-900/35 bg-sky-950/15 backdrop-blur-md p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">👤</span>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Logged in as: <strong className="text-sky-400 font-extrabold">{userName}</strong>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Current Role Profile: <span className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-400 border border-amber-800/40 text-[9px] font-extrabold">{userRole}</span>
              </p>
            </div>
          </div>

          {userRole === "BasicUser" && (
            <div className="text-[11px] text-amber-300 leading-normal max-w-md bg-amber-955/20 border border-amber-800/40 rounded-xl p-2.5">
              ⚠️ <strong>Basic User Mode:</strong> Access is restricted to basic pages. Click the role activation tile below to request permissions from the SuperAdmin.
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative flex flex-col items-center mb-8 z-10">
        <div
          className="relative mb-3"
          style={{ filter: "drop-shadow(0 0 18px var(--accent-glow))" }}
        >
          <img
            src="/envizor-logo.png"
            alt="Envizor Logo"
            className="w-20 h-20 object-contain select-none"
          />
        </div>

        <h1
          className="text-2xl font-extrabold mb-1 tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Envizor
        </h1>

        <p
          className="text-sm max-w-xl text-center"
          style={{ color: "var(--text-secondary)" }}
        >
          Where Terraform Meets Intelligent Governance
        </p>
      </div>

      {/* Feature Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full z-10">
        
        {visibleTiles.map((tile) => {
          const locked = isTileLocked(tile.id);
          return (
            <div
              key={tile.id}
              onClick={() => handleTileClick(tile.id, tile.name, tile.href)}
              className={`${tileBase} cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                locked
                  ? "locked-tile opacity-70 border-dashed border-red-500/20 hover:opacity-90 hover:border-red-400/40 hover:bg-red-950/5"
                  : "hover:shadow-2xl"
              }`}
              id={tile.id}
            >
              <div className={`h-1.5 w-full rounded-full bg-gradient-to-r ${tile.gradient} mb-4`} />
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                  {tile.name}
                </h2>
                {locked && (
                  <span className="text-xs bg-slate-950 px-2 py-0.5 rounded border border-red-500/25 text-red-400 font-extrabold flex items-center gap-1 uppercase select-none">
                    <span>🔒</span> Gated
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {tile.description}
              </p>
            </div>
          );
        })}

        {/* 🔑 Request Premium Role Activation for BasicUser */}
        {userRole === "BasicUser" && (
          <div
            onClick={() => handleTileClick("tile-request-role", "Request Role Activation", "")}
            className={`${tileBase} cursor-pointer border border-dashed border-amber-500/30 bg-amber-955/15 hover:bg-amber-955/25 hover:border-amber-400/50 transition-all`}
            id="tile-request-role"
            style={{ boxShadow: "0 0 15px rgba(245, 158, 11, 0.05)" }}
          >
            <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 mb-4 animate-pulse" />
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-amber-400">
                🔑 Request Role Activation
              </h2>
            </div>
            <p className="text-sm text-slate-350 leading-relaxed">
              Apply for administrative environment role privileges (**DEV Admin**, **PRE Admin**, or **PROD Admin**) to access active Terraform and IGA explorer workspaces.
            </p>
          </div>
        )}

        {/* Reports & Dashboards — coming soon */}
        {userRole !== "BasicUser" && (
          <>
            <div className={`${tileBase} opacity-30 cursor-not-allowed`} id="tile-reports">
              <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 mb-4" />
              <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Reports &amp; Dashboards
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Coming soon — generate and view operational and compliance reports.
              </p>
            </div>

            <div className={`${tileBase} opacity-30 cursor-not-allowed`} id="tile-automation">
              <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 mb-4" />
              <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Automation Tools
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Coming soon — build workflows, triggers, and automated identity operations.
              </p>
            </div>
          </>
        )}
      </div>

      {/* ACCESS REQUEST MODAL */}
      {targetTile && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn p-4" style={{ backgroundColor: "rgba(0,0,0,0.65)" }}>
          <div 
            className="border rounded-2xl max-w-2xl w-full shadow-2xl relative flex flex-col transition-colors max-h-[90vh] overflow-hidden"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            {/* Header — fixed, never scrolls */}
            <div className="flex justify-between items-center border-b pb-3 mb-0 px-6 pt-6 flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <div className="space-y-1">
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                  <span>🛡️</span> Security Access Restriction
                </div>
                <h3 className="text-base font-bold text-slate-100">
                  Request Access to: {targetTile.name}
                </h3>
              </div>
              <button 
                onClick={() => setTargetTile(null)}
                className="text-xs hover:text-white transition cursor-pointer text-slate-400 font-bold border rounded-full h-6 w-6 flex items-center justify-center hover:bg-slate-900"
                style={{ borderColor: "var(--border)" }}
              >
                ✕
              </button>
            </div>

            {successMessage ? (
              <div className="py-6 px-6 text-center space-y-4 animate-fadeIn">
                <div className="text-3xl">📥</div>
                <p className="text-sm font-semibold text-emerald-400">{successMessage}</p>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Your request has been filed in the SuperAdmin approval registry. Check back once approved.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
                {/* Scrollable form body */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You currently possess the <strong className="text-slate-200">BasicUser</strong> role, which restricts access to this premium operational tile. Select an environment scope below to request activation:
                  </p>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Choose Desired Role (Select to see what each serves)
                    </label>
                    
                    {/* Premium Stacked Interactive Role Cards */}
                    <div className="grid grid-cols-1 gap-3">
                      {/* DEV Admin Card */}
                      <div
                        onClick={() => setRequestedScope("DEV_Admin")}
                        className={`cursor-pointer border p-3 rounded-xl transition-all duration-200 flex items-start gap-3 select-none ${
                          requestedScope === "DEV_Admin"
                            ? "border-sky-500 bg-sky-950/20 shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                            : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700"
                        }`}
                      >
                        <div className="text-xl mt-0.5">🛠️</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs font-bold ${requestedScope === "DEV_Admin" ? "text-sky-400" : "text-slate-200"}`}>
                              DEV Admin
                            </h4>
                            {requestedScope === "DEV_Admin" && (
                              <span className="text-[8px] bg-sky-500/20 text-sky-400 font-extrabold px-1.5 py-0.5 rounded border border-sky-400/30 uppercase tracking-wider">Selected</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Serves: Integration Development &amp; Sandbox Testing</p>
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal">Configures dynamic tenant parameters, bootstraps baseline schemas, and tests REST/SCIM custom API endpoints.</p>
                        </div>
                      </div>

                      {/* PRE Admin Card */}
                      <div
                        onClick={() => setRequestedScope("PRE_Admin")}
                        className={`cursor-pointer border p-3 rounded-xl transition-all duration-200 flex items-start gap-3 select-none ${
                          requestedScope === "PRE_Admin"
                            ? "border-amber-500 bg-amber-950/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                            : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700"
                        }`}
                      >
                        <div className="text-xl mt-0.5">✨</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs font-bold ${requestedScope === "PRE_Admin" ? "text-amber-400" : "text-slate-200"}`}>
                              PRE Admin
                            </h4>
                            {requestedScope === "PRE_Admin" && (
                              <span className="text-[8px] bg-amber-500/20 text-amber-400 font-extrabold px-1.5 py-0.5 rounded border border-amber-400/30 uppercase tracking-wider">Selected</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Serves: Pre-Production Staging &amp; Drift Audit</p>
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal">Compares environment configurations, runs delta validations, reviews draft states, and stages upcoming deployments.</p>
                        </div>
                      </div>

                      {/* PROD Admin Card */}
                      <div
                        onClick={() => setRequestedScope("PROD_Admin")}
                        className={`cursor-pointer border p-3 rounded-xl transition-all duration-200 flex items-start gap-3 select-none ${
                          requestedScope === "PROD_Admin"
                            ? "border-emerald-500 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                            : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700"
                        }`}
                      >
                        <div className="text-xl mt-0.5">🚀</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs font-bold ${requestedScope === "PROD_Admin" ? "text-emerald-400" : "text-slate-200"}`}>
                              PROD Admin
                            </h4>
                            {requestedScope === "PROD_Admin" && (
                              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded border border-emerald-400/30 uppercase tracking-wider">Selected</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Serves: Live Production Transport &amp; Commits</p>
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal">Authorizes and executes live Terraform workspace transfers, builds package promotions, and triggers live pipeline workflows.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Zero-Trust JIT Access Duration Block */}
                  <div className="space-y-3 border-t border-slate-800/60 pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Access Duration Strategy
                      </label>
                      <span className="text-[8px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider select-none">
                        🔒 Zero-Trust Compliant
                      </span>
                    </div>

                    {/* JIT vs Permanent toggle */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div
                        onClick={() => setIsJit(true)}
                        className={`cursor-pointer border p-2.5 rounded-xl transition-all duration-200 flex flex-col items-center text-center select-none ${
                          isJit
                            ? "border-sky-500 bg-sky-950/20"
                            : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-700"
                        }`}
                      >
                        <span className="text-base">🕒</span>
                        <span className={`text-[10.5px] font-bold mt-1 ${isJit ? "text-sky-400" : "text-slate-400"}`}>Temporary (JIT)</span>
                        <span className="text-[8px] text-slate-500 mt-0.5">Auto-expires, fast approval</span>
                      </div>
                      <div
                        onClick={() => setIsJit(false)}
                        className={`cursor-pointer border p-2.5 rounded-xl transition-all duration-200 flex flex-col items-center text-center select-none ${
                          !isJit
                            ? "border-amber-500 bg-amber-950/15"
                            : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-700"
                        }`}
                      >
                        <span className="text-base">♾️</span>
                        <span className={`text-[10.5px] font-bold mt-1 ${!isJit ? "text-amber-400" : "text-slate-400"}`}>Permanent Role</span>
                        <span className="text-[8px] text-slate-500 mt-0.5">Manual audit review</span>
                      </div>
                    </div>

                    {/* JIT duration pills */}
                    {isJit && (
                      <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-900/30 border border-slate-800/60">
                        <div className="flex justify-between items-center">
                          <span className="text-[9.5px] text-slate-400 font-extrabold">Select Activation Window:</span>
                          <span className="text-[9.5px] text-sky-400 font-mono font-bold">
                            {jitDuration >= 60 ? `${jitDuration / 60} ${jitDuration / 60 === 1 ? "Hour" : "Hours"}` : `${jitDuration} Mins`}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[{label: "1 Hr", value: 60}, {label: "4 Hrs", value: 240}, {label: "8 Hrs", value: 480}, {label: "24 Hrs", value: 1440}].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setJitDuration(opt.value)}
                              className={`py-1 rounded-lg text-[9.5px] font-bold border transition cursor-pointer ${
                                jitDuration === opt.value
                                  ? "bg-sky-500/20 text-sky-400 border-sky-400/40"
                                  : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Advisory Banner */}
                    <div className={`p-2.5 rounded-xl border flex items-start gap-2 text-[9.5px] leading-relaxed ${
                      isJit ? "border-sky-500/20 bg-sky-950/10 text-sky-300" : "border-amber-500/20 bg-amber-950/10 text-amber-300"
                    }`}>
                      <span className="flex-shrink-0 mt-0.5">{isJit ? "💡" : "⚠️"}</span>
                      <p>
                        {isJit ? (
                          <><strong>Zero-Trust Fast-Track:</strong> Time-bounded <strong>JIT</strong> privileges auto-expire and are fast-tracked by SuperAdmins. Ideal for urgent, short-lived access needs.</>
                        ) : (
                          <><strong>Mandatory Security Review:</strong> Permanent assignments require quarterly re-certification and a robust business justification before approval.</>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Justification */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Request Justification
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Describe why you need this administrative environment role..."
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 leading-normal resize-none"
                    />
                  </div>
                </div>

                {/* Footer — always visible, never scrolls */}
                <div className="flex-shrink-0 border-t px-6 py-4 flex justify-end gap-3" style={{ borderColor: "var(--border)" }}>
                  <button
                    type="button"
                    onClick={() => setTargetTile(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 border hover:bg-slate-900 text-slate-300 transition cursor-pointer"
                    style={{ borderColor: "var(--border)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-sky-500 to-sky-600 hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-sky-500/20 border border-sky-400 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Queueing..." : "Submit Access Request"}
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