// app/wizard/day0-setup/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Day0Shell from "../day0/Day0Shell";

interface EnvStatus {
  exists: boolean;
  hasProvider: boolean;
  hasBackend: boolean;
  hasVars: boolean;
  assetCount: number;
  files: string[];
  loading: boolean;
}

export default function Day0SetupPage() {
  const [activeGuideTab, setActiveGuideTab] = useState<"flow" | "workspaces" | "tenants" | "commands">("flow");
  const [selectedEnvTab, setSelectedEnvTab] = useState<"DEV" | "PRE" | "PROD">("DEV");
  
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [successEnv, setSuccessEnv] = useState<string | null>(null);

  const [envStatus, setEnvStatus] = useState<Record<"DEV" | "PRE" | "PROD", EnvStatus>>({
    DEV: { exists: false, hasProvider: false, hasBackend: false, hasVars: false, assetCount: 0, files: [], loading: true },
    PRE: { exists: false, hasProvider: false, hasBackend: false, hasVars: false, assetCount: 0, files: [], loading: true },
    PROD: { exists: false, hasProvider: false, hasBackend: false, hasVars: false, assetCount: 0, files: [], loading: true },
  });

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Workspace Settings States
  const [locationType, setLocationType] = useState<"local" | "remote">("local");
  const [localPath, setLocalPath] = useState("/Users/tejov/Documents/IGA-Saviynt");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [remoteRepoName, setRemoteRepoName] = useState("");
  const [remoteToken, setRemoteToken] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // User privileges & session states
  const [userRole, setUserRole] = useState<string>("BasicUser");
  const [userName, setUserName] = useState<string>("admin");

  // Remote Repository Dialog Modal States
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [remoteFolders, setRemoteFolders] = useState<string[]>([]);
  const [remoteModalLoading, setRemoteModalLoading] = useState(false);
  const [remoteModalError, setRemoteModalError] = useState<string | null>(null);

  // Staged production bootstrap states
  const [showStagedModal, setShowStagedModal] = useState<boolean>(false);
  const [stagedReqId, setStagedReqId] = useState<string>("");
  const [filesToPublish, setFilesToPublish] = useState<Record<string, string>>({});

  // Sync success banner and user details on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("envizor_username") || "admin";
      
      // Load user latest role from central custom roles overrides
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";
      
      // Update session storage immediately
      sessionStorage.setItem("envizor_user_role", latestRole);
      
      setUserRole(latestRole);
      setUserName(user);

      const rNorm = latestRole.replace(/\s+|_/g, "").toUpperCase();
      if (rNorm === "PRODADMIN") {
        setSelectedEnvTab("PROD");
      } else if (rNorm === "PREADMIN") {
        setSelectedEnvTab("PRE");
      } else {
        setSelectedEnvTab("DEV");
      }

      const params = new URLSearchParams(window.location.search);
      if (params.get("publish_success") === "true") {
        setPublishSuccess(true);
        const env = params.get("env");
        setSuccessEnv(env);
        if (env === "DEV" || env === "PRE" || env === "PROD") {
          setSelectedEnvTab(env);
        }
      }
    }
  }, []);

  function hasWriteAccess(envName: string): boolean {
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (r === "SUPERADMIN") return true;
    if (r === `${envName.toUpperCase()}ADMIN`) return true;
    if (r === "PREADMIN" && envName === "DEV") return true;
    if (r === "PRODADMIN" && (envName === "DEV" || envName === "PRE")) return true;
    return false;
  }

  function canResetWorkspace(envName: string): boolean {
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (envName === "PROD") {
      return r === "SUPERADMIN";
    }
    return hasWriteAccess(envName);
  }

  const r = userRole.replace(/\s+|_/g, "").toUpperCase();
  const isGlobalWriter = r === "SUPERADMIN" || r.endsWith("ADMIN");

  // Fetch workspace coordinates on mount
  useEffect(() => {
    if (!userName) return;
    const loadUserSpecificSettings = async () => {
      // 1. First, check user-scoped local storage settings
      const userSettingsKey = `envizor_day0_settings_${userName.toLowerCase()}`;
      const cached = localStorage.getItem(userSettingsKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.locationType) setLocationType(parsed.locationType);
          if (parsed.localPath) setLocalPath(parsed.localPath);
          if (parsed.remoteUrl) setRemoteUrl(parsed.remoteUrl);
          if (parsed.remoteRepoName) setRemoteRepoName(parsed.remoteRepoName);
          if (parsed.remoteToken) setRemoteToken(parsed.remoteToken);
          
          // Sync with backend API
          await fetch("/api/day0/workspace-settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed),
          });
          return;
        } catch (e) {
          console.error("Failed to parse cached user settings", e);
        }
      }

      // 2. Fallback to default global settings
      try {
        const res = await fetch("/api/day0/workspace-settings");
        if (res.ok) {
          const data = await res.json();
          if (data.locationType) setLocationType(data.locationType);
          if (data.localPath) setLocalPath(data.localPath);
          if (data.remoteUrl) setRemoteUrl(data.remoteUrl);
          if (data.remoteRepoName) setRemoteRepoName(data.remoteRepoName);
          if (data.remoteToken) setRemoteToken(data.remoteToken);
        }
      } catch (err) {
        console.error("Failed to load workspace settings", err);
      }
    };
    loadUserSpecificSettings();
  }, [userName]);

  const scanEnvironments = async () => {
    const envs = ["DEV", "PRE", "PROD"] as const;
    for (const env of envs) {
      try {
        const res = await fetch(`/api/env/${env}`);
        
        let localExists = false;
        let localProvider = false;
        let localBackend = false;
        let localVars = false;
        let localAssetCount = 0;

        if (typeof window !== "undefined") {
          localExists = localStorage.getItem(`envizor_${env}_exists`) === "true";
          localProvider = localStorage.getItem(`envizor_${env}_hasProvider`) === "true";
          localBackend = localStorage.getItem(`envizor_${env}_hasBackend`) === "true";
          localVars = localStorage.getItem(`envizor_${env}_hasVars`) === "true";
          const count = localStorage.getItem(`envizor_${env}_assetCount`);
          if (count) localAssetCount = parseInt(count, 10);
        }

        if (res.status === 404) {
          const actualExists = locationType === "remote" ? false : localExists;
          const actualProvider = locationType === "remote" ? false : localProvider;
          const actualBackend = locationType === "remote" ? false : localBackend;
          const actualVars = locationType === "remote" ? false : localVars;
          const actualAssetCount = locationType === "remote" ? 0 : localAssetCount;

          setEnvStatus((prev) => ({
            ...prev,
            [env]: {
              exists: actualExists,
              hasProvider: actualProvider,
              hasBackend: actualBackend,
              hasVars: actualVars,
              assetCount: actualAssetCount,
              files: [],
              loading: false,
            },
          }));
        } else {
          const json = await res.json();
          const files: string[] = json.files ?? [];

          let hasProvider = files.some((f) => f.toLowerCase() === "provider.tf");
          let hasBackend = files.some((f) => f.toLowerCase() === "backend.tf");
          let hasVars = files.some((f) => f.toLowerCase() === `${env.toLowerCase()}.tfvars`);
          let exists = true;

          // Merge local backups (critical for Vercel/ephemeral serverless instances)
          if (locationType !== "remote") {
            if (!hasProvider && localProvider) hasProvider = true;
            if (!hasBackend && localBackend) hasBackend = true;
            if (!hasVars && localVars) hasVars = true;
          }

          let assetCount = files.filter((f) => {
            const low = f.toLowerCase();
            return (
              low !== "provider.tf" &&
              low !== "backend.tf" &&
              low !== `${env.toLowerCase()}.tfvars` &&
              low.endsWith(".tf")
            );
          }).length;

          if (assetCount > 0 && typeof window !== "undefined") {
            localStorage.setItem(`envizor_${env}_assetCount`, String(assetCount));
          } else if (assetCount === 0 && localAssetCount > 0 && locationType !== "remote") {
            assetCount = localAssetCount;
          }

          setEnvStatus((prev) => ({
            ...prev,
            [env]: {
              exists: true,
              hasProvider,
              hasBackend,
              hasVars,
              assetCount,
              files,
              loading: false,
            },
          }));
        }
      } catch (err) {
        console.error(`Failed to scan env ${env}`, err);
        setEnvStatus((prev) => ({
          ...prev,
          [env]: { ...prev[env], loading: false },
        }));
      }
    }
  };

  useEffect(() => {
    scanEnvironments();
  }, []);

  // Helper actions to complete Day 0 onboarding
  const handleCreateFolder = async (env: "DEV" | "PRE" | "PROD") => {
    if (!hasWriteAccess(env)) {
      alert(`🔒 Access Restricted\n\nYour account role (${userRole}) is not authorized to create workspace directories in the ${env} environment.`);
      return;
    }
    setActionLoading(`folder-${env}`);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`envizor_${env}_exists`, "true");
      }
      await fetch(`/api/env/${env}`, { method: "POST" });
      await scanEnvironments();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBootstrapCredentials = async (env: "DEV" | "PRE" | "PROD") => {
    if (!hasWriteAccess(env)) {
      alert(`🔒 Access Restricted\n\nYour account role (${userRole}) is not authorized to write credentials in the ${env} environment.`);
      return;
    }

    const rNorm = userRole.replace(/\s+|_/g, "").toUpperCase();
    const bootstrapFiles = {
      "provider.tf": `terraform {\n  required_providers {\n    saviynt = {\n      source = "saviynt/saviynt"\n    }\n  }\n}`,
      "backend.tf": `terraform {\n  backend "local" {}\n}`,
      [`${env.toLowerCase()}.tfvars`]: `environment = "${env}"\nclient_id   = "saviynt_client_id"\nclient_secret = "saviynt_secret_key"\nendpoint    = "https://${env.toLowerCase()}.saviyntcloud.com"`,
    };

    if (env === "PROD" && rNorm !== "SUPERADMIN") {
      setActionLoading(`bootstrap-${env}`);
      try {
        const reqId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
        const approvalRequest = {
          id: reqId,
          timestamp: new Date().toISOString(),
          username: userName,
          env: "PROD",
          files: bootstrapFiles,
          status: "PENDING" as const
        };

        const existingReqs = localStorage.getItem("envizor_approval_requests");
        const reqs = existingReqs ? JSON.parse(existingReqs) : [];
        reqs.push(approvalRequest);
        localStorage.setItem("envizor_approval_requests", JSON.stringify(reqs));
        window.dispatchEvent(new CustomEvent("storage"));

        setFilesToPublish(bootstrapFiles);
        setStagedReqId(reqId);
        setShowStagedModal(true);
      } catch (err) {
        console.error(err);
        alert("Failed to stage production bootstrap credentials approval request.");
      } finally {
        setActionLoading(null);
      }
      return;
    }

    setActionLoading(`bootstrap-${env}`);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`envizor_${env}_exists`, "true");
        localStorage.setItem(`envizor_${env}_hasProvider`, "true");
        localStorage.setItem(`envizor_${env}_hasBackend`, "true");
        localStorage.setItem(`envizor_${env}_hasVars`, "true");
      }

      const writeTf = async (fullPath: string, content: string) => {
        await fetch(`/api/env/${env}/write`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullPath, content }),
        });
      };

      await Promise.all([
        writeTf("provider.tf", bootstrapFiles["provider.tf"]),
        writeTf("backend.tf", bootstrapFiles["backend.tf"]),
        writeTf(`${env.toLowerCase()}.tfvars`, bootstrapFiles[`${env.toLowerCase()}.tfvars`]),
      ]);

      // Stage, commit, and push bootstrapped files to GitHub in GitOps mode
      if (locationType === "remote") {
        try {
          await fetch("/api/day0/workspace-settings/push", { method: "POST" });
        } catch (gitErr) {
          console.error("Failed to automatically push credentials to remote repository:", gitErr);
        }
      }

      await scanEnvironments();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetWorkspace = async (env: "DEV" | "PRE" | "PROD") => {
    if (!canResetWorkspace(env)) {
      alert(`🔒 Access Restricted\n\nClearing and resetting the ${env} workspace is a high-security operation. ${env === "PROD" ? "Only a SuperAdmin is authorized to reset the PROD workspace." : `Your account role (${userRole}) is not authorized to clear or delete this workspace.`}`);
      return;
    }
    const confirm = window.confirm(`Are you absolutely sure you want to clear the ${env} workspace? This will delete all generated .tf files, provider configurations, and variables files, resetting it to a blank workspace.`);
    if (!confirm) return;
    
    setActionLoading(`reset-${env}`);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`envizor_${env}_hasProvider`);
        localStorage.removeItem(`envizor_${env}_hasBackend`);
        localStorage.removeItem(`envizor_${env}_hasVars`);
        localStorage.removeItem(`envizor_${env}_assetCount`);
      }
      
      await fetch(`/api/env/${env}`, { method: "DELETE" });
      await fetch(`/api/env/${env}`, { method: "POST" });
      
      if (locationType === "remote") {
        try {
          await fetch("/api/day0/workspace-settings/push", { method: "POST" });
        } catch (gitErr) {
          console.error("Failed to push reset workspace state to remote repo:", gitErr);
        }
      }
      
      await scanEnvironments();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRedirectToBaseline = (env: "DEV" | "PRE" | "PROD") => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("envizor_baseline_env", env);
      window.location.href = `/wizard/day0/baseline`;
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGlobalWriter) {
      alert(`🔒 Access Restricted\n\nYour account role (${userRole}) is not authorized to edit workspace storage coordinates.`);
      return;
    }
    setSettingsLoading(true);
    setSettingsMsg(null);
    try {
      const payload = {
        locationType,
        localPath,
        remoteUrl,
        remoteRepoName,
        remoteToken,
      };

      const res = await fetch("/api/day0/workspace-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save settings");
      }

      // Save uniquely in localStorage for this user
      const userSettingsKey = `envizor_day0_settings_${userName.toLowerCase()}`;
      localStorage.setItem(userSettingsKey, JSON.stringify(payload));

      // Clear localStorage cache so we scan fresh coordinates
      if (typeof window !== "undefined") {
        for (const env of ["DEV", "PRE", "PROD"]) {
          localStorage.removeItem(`envizor_${env}_exists`);
          localStorage.removeItem(`envizor_${env}_hasProvider`);
          localStorage.removeItem(`envizor_${env}_hasBackend`);
          localStorage.removeItem(`envizor_${env}_hasVars`);
          localStorage.removeItem(`envizor_${env}_assetCount`);
        }
      }

      setSettingsMsg({
        type: "success",
        text: `Your personal workspace coordinates were successfully saved and initialized!`,
      });

      // Re-scan environments immediately to update the checklist
      await scanEnvironments();
    } catch (err: any) {
      console.error(err);
      setSettingsMsg({
        type: "error",
        text: err.message || "An unexpected error occurred while applying workspace settings.",
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleViewRemoteFolders = async () => {
    setShowRemoteModal(true);
    setRemoteModalLoading(true);
    setRemoteModalError(null);
    setRemoteFolders([]);
    try {
      const query = new URLSearchParams({
        locationType,
        remoteUrl,
        remoteRepoName,
        remoteToken
      }).toString();

      const res = await fetch(`/api/day0/workspace-settings/remote-folders?${query}`);
      if (!res.ok) {
        const errData = await res.json();
        setRemoteModalError(errData.error || "Failed to fetch remote repository folders.");
        setRemoteModalLoading(false);
        return;
      }
      const data = await res.json();
      setRemoteFolders(data.folders ?? []);
    } catch (err: any) {
      console.error(err);
      setRemoteModalError(err.message || "An error occurred while connecting to the remote repository.");
    } finally {
      setRemoteModalLoading(false);
    }
  };

  const guideTabs = [
    { id: "flow", label: "🧭 Architecture Flow", icon: "🔄" },
    { id: "workspaces", label: "📁 Workspaces Setup", icon: "💻" },
    { id: "tenants", label: "🔑 Saviynt Details", icon: "🛡️" },
    { id: "commands", label: "📝 Terraform Guide", icon: "🧱" },
  ] as const;

  const currentStatus = envStatus[selectedEnvTab];

  // Derive dynamic checklist completion
  const step1Complete = currentStatus.exists;
  const step2Complete = currentStatus.hasProvider && currentStatus.hasBackend && currentStatus.hasVars;
  const step3Complete = currentStatus.assetCount > 0;
  const onboardingFinished = step1Complete && step2Complete && step3Complete;

  const rNormalized = userRole.replace(/\s+|_/g, "").toUpperCase();
  const visibleEnvs = (["DEV", "PRE", "PROD"] as const).filter((env) => {
    if (rNormalized === "SUPERADMIN") return true;
    if (rNormalized === "DEVADMIN") return env === "DEV";
    if (rNormalized === "PREADMIN") return env === "DEV" || env === "PRE";
    if (rNormalized === "PRODADMIN") return env === "DEV" || env === "PRE" || env === "PROD";
    return false;
  });

  const isSetupAllowed = ["SUPERADMIN", "DEVADMIN", "PREADMIN", "PRODADMIN"].includes(rNormalized);
  if (!isSetupAllowed) {
    return (
      <Day0Shell
        title="Day 0 Onboarding & Setup"
        subtitle="Establish clean baseline resources, configure local directories, and learn EIC DevOps workflows."
        backTo="/wizard/steps/welcome"
      >
        <div 
          className="flex-1 flex flex-col items-center justify-center text-center py-28 rounded-2xl border p-8 shadow-xl animate-fadeIn transition-colors"
          style={{ 
            backgroundColor: "var(--bg-surface)", 
            borderColor: "rgba(239, 68, 68, 0.2)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
          }}
        >
          <span className="text-6xl text-red-500 animate-pulse">🛡️</span>
          <h3 className="text-base font-extrabold text-red-400 mt-5 uppercase tracking-wider">Access Denied</h3>
          <p className="text-xs mt-2.5 max-w-md text-slate-400 leading-relaxed">
            Your active user account role (<strong className="text-slate-200">{userRole}</strong>) does not have authorization to view or configure Day 0 setup settings.
          </p>
          <p className="text-[10px] text-slate-500 mt-3">Please contact your system administrator to request write permissions.</p>
        </div>
      </Day0Shell>
    );
  }

  return (
    <Day0Shell
      title="Day 0 Onboarding & Setup"
      subtitle="Establish clean baseline resources, configure local directories, and learn EIC DevOps workflows."
      backTo="/wizard/steps/welcome"
    >
      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto w-full animate-fadeIn">
        
        {/* WORKSPACE LOCATION SETUP PANEL */}
        <div 
          className="rounded-2xl border p-6 shadow-xl relative overflow-hidden transition-colors duration-300 backdrop-blur-md animate-fadeIn"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] opacity-10 pointer-events-none"
               style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }} />

          <div className="flex flex-col gap-6">
            <div className="space-y-1">
              <div className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                Infrastructure Configuration
              </div>
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <span>⚙️</span> Workspace Location Coordinates
              </h3>
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                Configure Envizor's active workspace storage. Choose whether to target local disk paths or clone dynamically from Git repositories.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Selector Toggle */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-secondary)" }}>
                  Storage Strategy
                </label>
                <div 
                  className="grid grid-cols-2 gap-2 p-1 rounded-xl border max-w-md transition-colors"
                  style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                >
                  <button
                    type="button"
                    onClick={() => setLocationType("local")}
                    className="py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                    style={
                      locationType === "local"
                        ? {
                            backgroundColor: "var(--accent)",
                            color: "#ffffff",
                            boxShadow: "0 4px 12px var(--accent-glow)",
                          }
                        : {
                            color: "var(--text-muted)",
                          }
                    }
                  >
                    <span>💻</span> Local Disk Storage
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationType("remote")}
                    className="py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                    style={
                      locationType === "remote"
                        ? {
                            backgroundColor: "var(--accent)",
                            color: "#ffffff",
                            boxShadow: "0 4px 12px var(--accent-glow)",
                          }
                        : {
                            color: "var(--text-muted)",
                          }
                    }
                  >
                    <span>☁️</span> Cloud Git Repository
                  </button>
                </div>
              </div>

              {/* Conditional Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                {locationType === "local" ? (
                  <div className="col-span-2 space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-secondary)" }}>
                      Target Local Path
                    </label>
                    <input
                      type="text"
                      value={localPath}
                      onChange={(e) => setLocalPath(e.target.value)}
                      placeholder="/Users/tejov/Documents/IGA-Saviynt"
                      className="w-full px-4 py-3 rounded-xl text-xs font-mono border transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      style={{
                        backgroundColor: "var(--bg-panel)",
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <p className="text-[10px] italic" style={{ color: "var(--text-muted)" }}>
                      Envizor will create DEV, PRE, and PROD folders recursively inside this location.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-secondary)" }}>
                        Git Repository URL
                      </label>
                      <input
                        type="text"
                        value={remoteUrl}
                        onChange={(e) => setRemoteUrl(e.target.value)}
                        placeholder="https://github.com/my-org/saviynt-config.git"
                        className="w-full px-4 py-3 rounded-xl text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        style={{
                          backgroundColor: "var(--bg-panel)",
                          borderColor: "var(--border)",
                          color: "var(--text-primary)",
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-secondary)" }}>
                        Repository Branch / Name
                      </label>
                      <input
                        type="text"
                        value={remoteRepoName}
                        onChange={(e) => setRemoteRepoName(e.target.value)}
                        placeholder="main"
                        className="w-full px-4 py-3 rounded-xl text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        style={{
                          backgroundColor: "var(--bg-panel)",
                          borderColor: "var(--border)",
                          color: "var(--text-primary)",
                        }}
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-secondary)" }}>
                        Personal Access Token (PAT)
                      </label>
                      <input
                        type="password"
                        value={remoteToken}
                        onChange={(e) => setRemoteToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxx"
                        className="w-full px-4 py-3 rounded-xl text-xs font-mono border transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        style={{
                          backgroundColor: "var(--bg-panel)",
                          borderColor: "var(--border)",
                          color: "var(--text-primary)",
                        }}
                      />
                      <p className="text-[10px] italic" style={{ color: "var(--text-muted)" }}>
                        Used securely to clone and push updates to your GitOps repository. Masked for security.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Status Message */}
              {settingsMsg && (
                <div 
                  className={`p-3 rounded-xl text-[11px] border leading-relaxed ${
                    settingsMsg.type === "success" 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {settingsMsg.type === "success" ? "✅" : "❌"} {settingsMsg.text}
                </div>
              )}

              {/* Submit & Remote Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={settingsLoading || !isGlobalWriter}
                  className={`
                    px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider
                    text-white hover:scale-[1.02] active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1 ${
                      !isGlobalWriter ? "opacity-50 cursor-not-allowed" : ""
                    }
                  `}
                  style={
                    isGlobalWriter
                      ? {
                          background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                          boxShadow: "0 2px 8px var(--accent-glow)"
                        }
                      : {
                          background: "linear-gradient(135deg, #1e293b, #0f172a)"
                        }
                  }
                >
                  {!isGlobalWriter ? "🔒 " : ""}{settingsLoading ? "Saving Settings..." : "💾 Save & Apply Coordinates"}
                </button>

                {locationType === "remote" && (
                  <button
                    type="button"
                    onClick={handleViewRemoteFolders}
                    className="
                      px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider
                      text-indigo-400 bg-indigo-955/40 border border-indigo-500/30 hover:bg-indigo-950/40 hover:scale-[1.02] active:scale-95 transition-all shadow-md cursor-pointer
                    "
                  >
                    🔌 View Remote Repos
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* SUCCESS ALIGNMENT NOTICE */}
        {publishSuccess && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/65 p-5 shadow-lg shadow-emerald-500/5 animate-fadeIn backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 text-xl border border-emerald-500/30">
                ✅
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-emerald-400">
                  Baseline published successfully!
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Workspace configuration files for your <strong className="text-slate-100 uppercase">{successEnv}</strong> tenant have been safely compiled and published onto local storage.
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  ⚠️ <strong>Action Required:</strong> Please ensure all remaining onboarding checklist steps are fully marked complete below to avoid environment mismatches.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic header card */}
        <div className="rounded-2xl p-[1px] shadow-lg" style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-hover))" }}>
          <div 
            className="rounded-2xl px-6 py-6 h-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors duration-300"
            style={{ backgroundColor: "var(--bg-panel)", color: "var(--text-primary)" }}
          >
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
                Day 0 Bootstrap Center
              </div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                Interactive Workspace Initializer
              </h2>
              <p className="text-xs max-w-xl leading-relaxed animate-fade-in" style={{ color: "var(--text-secondary)" }}>
                Before deploying configurations, establish your directory structures, pull baseline states, and configure API endpoints.
              </p>
            </div>
            
            <button
              onClick={() => handleRedirectToBaseline(selectedEnvTab)}
              className="
                px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider
                text-white hover:scale-[1.02] active:scale-95 transition-all shadow-md border cursor-pointer
              "
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                borderColor: "var(--accent)",
                boxShadow: "0 4px 12px var(--accent-glow)"
              }}
            >
              🧱 Pull Baseline Workspaces →
            </button>
          </div>
        </div>

        {/* Setup and Help Section Grid */}
        <div className="grid lg:grid-cols-[450px_1fr] gap-8">
          
          {/* LEFT: Dynamic Workspace Health Tracker Panel */}
          <div 
            className="rounded-2xl border p-5 space-y-6 shadow-lg h-fit flex flex-col justify-between transition-colors duration-300"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            
            {/* Header & Tabs */}
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                  Live Workspace Health
                </div>
                <h3 className="text-sm font-bold mt-1" style={{ color: "var(--text-primary)" }}>Day 0 Onboarding status</h3>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Real-time scan of your local disk folders and credentials matching Saviynt tenants:
                </p>
              </div>

              {/* Dynamic Connection Status Badge */}
              <div 
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-[11px] font-semibold transition-all backdrop-blur-md"
                style={{ 
                  backgroundColor: "var(--bg-panel)", 
                  borderColor: "var(--border)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                }}
              >
                <span className="text-sm">
                  {locationType === "local" ? "💻" : "☁️"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] uppercase tracking-wider font-extrabold" style={{ color: "var(--accent)" }}>
                    Active Coordinates
                  </div>
                  <div className="truncate font-mono text-[10px] mt-0.5" style={{ color: "var(--text-primary)" }}>
                    {locationType === "local" ? localPath : `${remoteRepoName || "remote-git"}`}
                  </div>
                </div>
                <span className="shrink-0 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Env Selector Tabs */}
              <div 
                className="grid gap-1 p-1 rounded-lg border transition-colors"
                style={{ 
                  backgroundColor: "var(--bg-panel)", 
                  borderColor: "var(--border)",
                  gridTemplateColumns: `repeat(${visibleEnvs.length}, minmax(0, 1fr))`
                }}
              >
                {visibleEnvs.map((env) => (
                  <button
                    key={env}
                    onClick={() => setSelectedEnvTab(env)}
                    className="py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                    style={
                      selectedEnvTab === env
                        ? {
                            backgroundColor: "var(--accent)",
                            color: "#ffffff",
                            boxShadow: "0 2px 6px var(--accent-glow)",
                          }
                        : {
                            color: "var(--text-muted)",
                          }
                    }
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>

            {/* Health Info Block */}
            {currentStatus.loading ? (
              <div className="space-y-4 py-8 animate-pulse text-center">
                <span className="text-xl">🔍</span>
                <p className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>Scanning workspace directories...</p>
              </div>
            ) : (
              <div className="space-y-5 animate-fadeIn">
                
                {/* Visual Indicators */}
                <div 
                  className="p-3.5 rounded-xl border space-y-2.5 text-[11.5px] transition-colors"
                  style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                >
                  <div className="flex justify-between items-center">
                    <span style={{ color: "var(--text-secondary)" }}>Workspace Folder:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${
                      step1Complete ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {step1Complete ? "Exists ✅" : "Missing ❌"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t pt-2.5" style={{ borderColor: "var(--border)" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Saviynt Credentials:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${
                      step2Complete ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {step2Complete ? "Configured 🔐" : "Missing ⚠️"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t pt-2.5" style={{ borderColor: "var(--border)" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Baseline Resources:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${
                      step3Complete ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {step3Complete ? `${currentStatus.assetCount} assets ✅` : "0 assets ⚠️"}
                    </span>
                  </div>
                </div>

                {step1Complete && (
                  <button
                    type="button"
                    onClick={() => handleResetWorkspace(selectedEnvTab)}
                    disabled={actionLoading !== null || !canResetWorkspace(selectedEnvTab)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5 ${
                      !canResetWorkspace(selectedEnvTab)
                        ? "opacity-60 border-dashed border-red-500/30 text-red-500/50 cursor-not-allowed"
                        : "cursor-pointer hover:bg-red-955/20 hover:border-red-500 text-red-400"
                    }`}
                    style={{ 
                      backgroundColor: "var(--bg-base)", 
                      borderColor: !canResetWorkspace(selectedEnvTab) ? "rgba(239, 68, 68, 0.2)" : "var(--border)" 
                    }}
                  >
                    <span>{canResetWorkspace(selectedEnvTab) ? "🧹" : "🔒"}</span> {actionLoading === `reset-${selectedEnvTab}` ? "Clearing Workspace..." : !canResetWorkspace(selectedEnvTab) ? "Reset Restricted" : `Clear & Reset ${selectedEnvTab} Workspace`}
                  </button>
                )}

                {/* Checklist Steps */}
                <div className="space-y-3.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                    Step-by-Step Activities
                  </div>

                  <div className="space-y-3 pl-1">
                    {/* STEP 1 */}
                    <div className="flex gap-3">
                      <div className="pt-0.5">
                        {step1Complete ? (
                          <span className="text-emerald-400 font-bold">✅</span>
                        ) : (
                          <span className="text-amber-500 animate-pulse font-bold">⚠️</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 
                          className="text-xs font-semibold"
                          style={{ color: "var(--text-primary)", textDecoration: step1Complete ? "line-through" : "none" }}
                        >
                          1. Create Workspace Folder
                        </h4>
                        <p className="text-[10.5px] leading-normal" style={{ color: "var(--text-secondary)" }}>
                          Initialize the workspace directory for environment variables at <code className="text-[10px] font-mono px-1 py-0.5 rounded border" style={{ backgroundColor: "var(--code-bg)", color: "var(--code-text)", borderColor: "var(--border)" }}>{locationType === "local" ? `${localPath}/${selectedEnvTab}` : `terraform-workspaces-remote/${selectedEnvTab} (${remoteRepoName || "remote-git"})`}</code>.
                        </p>
                        {!step1Complete && (
                          <button
                            onClick={() => handleCreateFolder(selectedEnvTab)}
                            disabled={actionLoading !== null || !hasWriteAccess(selectedEnvTab)}
                            className={`mt-2 px-3 py-1.5 rounded text-[10px] font-bold tracking-wide uppercase transition flex items-center gap-1 ${
                              !hasWriteAccess(selectedEnvTab)
                                ? "bg-slate-800 text-slate-500 border border-dashed border-slate-700 cursor-not-allowed"
                                : "cursor-pointer text-white"
                            }`}
                            style={{ backgroundColor: hasWriteAccess(selectedEnvTab) ? "var(--accent)" : "transparent" }}
                          >
                            {hasWriteAccess(selectedEnvTab) ? "" : "🔒 "}{actionLoading === `folder-${selectedEnvTab}` ? "Creating..." : "Create Directory Now"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* STEP 2 */}
                    <div className="flex gap-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                      <div className="pt-0.5">
                        {step2Complete ? (
                          <span className="text-emerald-400 font-bold">✅</span>
                        ) : (
                          <span className="text-amber-500 font-bold">⚠️</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 
                          className="text-xs font-semibold"
                          style={{ color: "var(--text-primary)", textDecoration: step2Complete ? "line-through" : "none" }}
                        >
                          2. Configure Saviynt API Credentials
                        </h4>
                        <p className="text-[10.5px] leading-normal" style={{ color: "var(--text-secondary)" }}>
                          Provide Terraform integration settings and access keys in <code className="text-[10px] font-mono px-1 py-0.5 rounded border" style={{ backgroundColor: "var(--code-bg)", color: "var(--code-text)", borderColor: "var(--border)" }}>provider.tf</code>, <code className="text-[10px] font-mono px-1 py-0.5 rounded border" style={{ backgroundColor: "var(--code-bg)", color: "var(--code-text)", borderColor: "var(--border)" }}>backend.tf</code>, and variables files.
                        </p>
                        {!step2Complete && step1Complete && (
                          <button
                            onClick={() => handleBootstrapCredentials(selectedEnvTab)}
                            disabled={actionLoading !== null || !hasWriteAccess(selectedEnvTab)}
                            className={`mt-2 px-3 py-1.5 rounded text-[10px] font-bold tracking-wide uppercase transition flex items-center gap-1 ${
                              !hasWriteAccess(selectedEnvTab)
                                ? "bg-slate-800 text-slate-500 border border-dashed border-slate-700 cursor-not-allowed"
                                : "bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
                            }`}
                          >
                            {hasWriteAccess(selectedEnvTab) ? "" : "🔒 "}{actionLoading === `bootstrap-${selectedEnvTab}` ? "Bootstrapping..." : "Bootstrap Credentials"}
                          </button>
                        )}
                        {!step1Complete && (
                          <p className="text-[9.5px] font-semibold italic text-amber-500">⚠️ Please complete step 1 before configuring credentials.</p>
                        )}
                      </div>
                    </div>

                    {/* STEP 3 */}
                    <div className="flex gap-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                      <div className="pt-0.5">
                        {step3Complete ? (
                          <span className="text-emerald-400 font-bold">✅</span>
                        ) : (
                          <span className="text-amber-500 font-bold">⚠️</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 
                          className="text-xs font-semibold"
                          style={{ color: "var(--text-primary)", textDecoration: step3Complete ? "line-through" : "none" }}
                        >
                          3. Pull Remote Saviynt Baselines
                        </h4>
                        <p className="text-[10.5px] leading-normal" style={{ color: "var(--text-secondary)" }}>
                          Fetch active security profiles, endpoints, custom roles, and configurations from the target Saviynt environment to match local states.
                        </p>
                        {!step3Complete && step2Complete && (
                          <button
                            onClick={() => handleRedirectToBaseline(selectedEnvTab)}
                            className="mt-2 px-3 py-1.5 rounded text-white text-[10px] font-bold tracking-wide uppercase transition cursor-pointer flex items-center gap-1 hover:scale-[1.02]"
                            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}
                          >
                            <span>🧱 Pull Baseline Assets</span>
                            <span>→</span>
                          </button>
                        )}
                        {!step2Complete && (
                          <p className="text-[9.5px] font-semibold italic text-amber-500">⚠️ Please configure credentials before pulling baseline assets.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final status helper box */}
                <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
                  {onboardingFinished ? (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center space-y-3">
                      <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                        <span>🌟</span> <span>Onboarding Complete!</span>
                      </div>
                      <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        Your <strong>{selectedEnvTab}</strong> workspace is fully aligned and ready for active deployments.
                      </p>
                      
                      <div className="flex flex-col gap-2 mt-2 pt-2 border-t" style={{ borderColor: "rgba(16, 185, 129, 0.15)" }}>
                        <Link
                          href={`/wizard/explorer/compare`}
                          className="w-full py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all border cursor-pointer hover:bg-sky-500/10 hover:border-sky-500/30 text-sky-400 flex items-center justify-center gap-1.5"
                          style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                        >
                          <span>🚀</span> Compare Workspace Drift
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRedirectToBaseline(selectedEnvTab)}
                          className="w-full py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all border cursor-pointer hover:bg-amber-500/10 hover:border-amber-500/30 text-amber-400 flex items-center justify-center gap-1.5"
                          style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                        >
                          <span>🔄</span> Re-base Workspace from Tenant
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="rounded-xl p-3 text-center text-[10.5px] leading-relaxed border transition-colors"
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                    >
                      ⚠️ Follow steps above to complete onboarding for the <strong style={{ color: "var(--accent)" }}>{selectedEnvTab}</strong> tenant workspace.
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

          {/* RIGHT: Dynamic Help Guide console */}
          <div 
            className="rounded-2xl border flex flex-col shadow-2xl overflow-hidden min-h-[500px] transition-colors duration-300"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            {/* Guide Tabs */}
            <div 
              className="flex border-b overflow-x-auto transition-colors"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-panel)" }}
            >
              {guideTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveGuideTab(t.id)}
                  className="flex-1 px-5 py-4 text-xs font-bold uppercase tracking-wider transition whitespace-nowrap border-b-2 cursor-pointer"
                  style={
                    activeGuideTab === t.id
                      ? {
                          color: "var(--accent)",
                          borderColor: "var(--accent)",
                          backgroundColor: "var(--bg-elevated)",
                        }
                      : {
                          color: "var(--text-muted)",
                          borderColor: "transparent",
                        }
                  }
                >
                  <span className="mr-1.5">{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            {/* Guide Tab Content */}
            <div className="p-6 overflow-y-auto flex-1 leading-relaxed text-xs space-y-4" style={{ color: "var(--text-secondary)" }}>
              
              {/* FLOW OVERVIEW TAB */}
              {activeGuideTab === "flow" && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 
                    className="text-sm font-bold flex items-center gap-1.5 border-b pb-2 transition-colors"
                    style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
                  >
                    <span>🧭</span> <span>Architecture Flow Overview</span>
                  </h3>
                  
                  <p style={{ color: "var(--text-secondary)" }}>
                    The Envizor DevOps & Monitoring platform separates configuration review from active push operations. Here is how the workspace flow functions:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    <div 
                      className="p-3 border rounded-xl space-y-1 transition-colors"
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                    >
                      <span className="text-[10px] font-bold uppercase" style={{ color: "var(--accent)" }}>1. Onboarding & Setup</span>
                      <h4 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Day 0 Setup</h4>
                      <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        Bootstrap environment directories, manage local workspaces on disk, and pull initial live HCL baseline variables.
                      </p>
                    </div>

                    <div 
                      className="p-3 border rounded-xl space-y-1 transition-colors"
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                    >
                      <span className="text-[10px] font-bold uppercase" style={{ color: "var(--accent)" }}>2. Sync Drift Align</span>
                      <h4 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Synchronize Workspaces</h4>
                      <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        Compare any two local workspace directories on disk (like DEV vs PRE). View inline changes and stage/save merges.
                      </p>
                    </div>

                    <div 
                      className="p-3 border rounded-xl space-y-1 transition-colors"
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                    >
                      <span className="text-[10px] font-bold uppercase" style={{ color: "var(--accent)" }}>3. Monitoring & Discovery</span>
                      <h4 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Workspace Explorer</h4>
                      <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        Explore generated folder trees on disk, view HCL variables, and safely monitor comparative file drifts between environments.
                      </p>
                    </div>

                    <div 
                      className="p-3 border rounded-xl space-y-1 transition-colors"
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                    >
                      <span className="text-[10px] font-bold uppercase" style={{ color: "var(--accent)" }}>4. DevOps Execution</span>
                      <h4 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>DevOps Terraform Wizard</h4>
                      <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        Safely execute Terraform command sequences (plan, apply, state, etc.) against remote cloud EIC endpoints.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* WORKSPACES SETUP TAB */}
              {activeGuideTab === "workspaces" && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 
                    className="text-sm font-bold flex items-center gap-1.5 border-b pb-2 transition-colors"
                    style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
                  >
                    <span>💻</span> <span>Workspaces Directory Setup</span>
                  </h3>

                  <p style={{ color: "var(--text-secondary)" }}>
                    Your local Terraform configurations are saved dynamically to dedicated disk workspaces. Currently, these directories are managed at:
                  </p>

                  <div 
                    className="p-3 border rounded-xl font-mono text-[11px] select-all max-w-xl transition-colors"
                    style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--code-text)" }}
                  >
                    {locationType === "local" ? `${localPath || "/Users/tejov/Documents/IGA-Saviynt"}/` : `terraform-workspaces-remote/`}
                  </div>

                  <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    Inside this directory, separate environment folders are created:
                  </p>

                  <div className="space-y-2 max-w-xl">
                    <div className="flex justify-between items-center py-1.5 border-b last:border-none" style={{ borderColor: "var(--border)" }}>
                      <span className="font-mono text-indigo-400">
                        {locationType === "local" ? `${localPath.split('/').pop() || "IGA-Saviynt"}/DEV/` : `DEV/`}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded border transition-colors" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>Development tenant state</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b last:border-none" style={{ borderColor: "var(--border)" }}>
                      <span className="font-mono text-indigo-400">
                        {locationType === "local" ? `${localPath.split('/').pop() || "IGA-Saviynt"}/PRE/` : `PRE/`}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded border transition-colors" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>Pre-production staging</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b last:border-none" style={{ borderColor: "var(--border)" }}>
                      <span className="font-mono text-indigo-400">
                        {locationType === "local" ? `${localPath.split('/').pop() || "IGA-Saviynt"}/PROD/` : `PROD/`}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded border transition-colors" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>Production release</span>
                    </div>
                  </div>

                  <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
                    Using the <strong style={{ color: "var(--text-primary)" }}>Baseline Workspaces</strong> tool, you can automatically create these folders, inspect pull structures, and save HCL models cleanly inside each folder.
                  </p>
                </div>
              )}

              {/* SAVIYNT DETAILS TAB */}
              {activeGuideTab === "tenants" && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 
                    className="text-sm font-bold flex items-center gap-1.5 border-b pb-2 transition-colors"
                    style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
                  >
                    <span>🛡️</span> <span>Saviynt Tenant Configurations</span>
                  </h3>

                  <p style={{ color: "var(--text-secondary)" }}>
                    Terraform tracks remote resources by communicating directly with live Saviynt cloud tenants. These configurations are driven by three core HCL modules:
                  </p>

                  <div className="space-y-3 max-w-2xl">
                    <div 
                      className="p-3 border rounded-xl space-y-1 transition-colors"
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                    >
                      <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>provider.tf</span>
                      <p className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
                        Declares the Saviynt EIC Terraform provider source and configures endpoints. Ensure client certificates and URLs are structured properly here.
                      </p>
                    </div>

                    <div 
                      className="p-3 border rounded-xl space-y-1 transition-colors"
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                    >
                      <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>backend.tf</span>
                      <p className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
                        Configures state storage backends (e.g. `local` state files or secure remote state storage) to manage resource lockings.
                      </p>
                    </div>

                    <div 
                      className="p-3 border rounded-xl space-y-1 transition-colors"
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                    >
                      <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>*.tfvars</span>
                      <p className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
                        Environment variables (e.g. `dev.tfvars`, `pre.tfvars`) containing specific client IDs, API secrets, and region credentials matching each workspace.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TERRAFORM GUIDE TAB */}
              {activeGuideTab === "commands" && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <span>🧱</span> <span>Terraform DevOps Commands Guide</span>
                  </h3>

                  <p className="text-slate-400">
                    Use this quick reference to understand the DevOps operations executed inside the Wizard:
                  </p>

                  <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                    <div className="flex gap-4 border-b border-slate-850 pb-2">
                      <span className="font-mono text-indigo-400 w-28 shrink-0">terraform init</span>
                      <div>
                        <p className="font-semibold text-slate-200 text-xs">Initialize Workspace</p>
                        <p className="text-[11px] text-slate-400">Pulls backend providers and sets up directory states.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 border-b border-slate-850 pb-2">
                      <span className="font-mono text-indigo-400 w-28 shrink-0">terraform fmt</span>
                      <div>
                        <p className="font-semibold text-slate-200 text-xs">Canonical Formatting</p>
                        <p className="text-[11px] text-slate-400">Cleans up code structure and formatting for baseline modules.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 border-b border-slate-850 pb-2">
                      <span className="font-mono text-indigo-400 w-28 shrink-0">terraform plan</span>
                      <div>
                        <p className="font-semibold text-slate-200 text-xs">Dry-Run Simulation</p>
                        <p className="text-[11px] text-slate-400">Compares local files with target cloud states and shows exact drifts without making any changes.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 border-b border-slate-850 pb-2">
                      <span className="font-mono text-indigo-400 w-28 shrink-0">terraform apply</span>
                      <div>
                        <p className="font-semibold text-slate-200 text-xs">Deploy Changes</p>
                        <p className="text-[11px] text-slate-400">Publishes HCL baseline variables and deploys resources onto remote tenants.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 border-b border-slate-850 pb-2">
                      <span className="font-mono text-indigo-400 w-28 shrink-0">terraform state</span>
                      <div>
                        <p className="font-semibold text-slate-200 text-xs">State Inspection</p>
                        <p className="text-[11px] text-slate-400">Inspects the active tracker logs to verify exactly what resources are mapped.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 border-b border-slate-850 pb-2">
                      <span className="font-mono text-indigo-400 w-28 shrink-0">terraform destroy</span>
                      <div>
                        <p className="font-semibold text-slate-200 text-xs">Tear Down</p>
                        <p className="text-[11px] text-slate-400">Deletes managed EIC objects in remote environments. Use with caution!</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
      {/* REMOTE REPO FOLDERS DIALOG BOX (MODAL) */}
      {showRemoteModal && (
        <div 
          className="fixed inset-0 backdrop-blur-md flex items-center justify-center pointer-events-none z-50 animate-fadeIn" 
          style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
        >
          <div 
            className="border p-6 rounded-2xl max-w-lg w-full shadow-2xl relative flex flex-col pointer-events-auto transition-colors"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <div className="space-y-1">
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-400">
                  Cloud GitOps Repository Explorer
                </div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <span>📂</span> Remote Repository Folders
                </h3>
              </div>
              <button 
                onClick={() => setShowRemoteModal(false)}
                className="text-xs hover:text-white transition cursor-pointer text-slate-400 font-bold border rounded-full h-6 w-6 flex items-center justify-center hover:bg-slate-900"
                style={{ borderColor: "var(--border)" }}
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="py-5 flex-1 min-h-[180px] max-h-[300px] overflow-y-auto space-y-3">
              {remoteModalLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-3 font-mono text-xs animate-pulse">
                  <span className="animate-spin text-xl">🔌</span>
                  <span>Connecting and pulling repository structure...</span>
                </div>
              ) : remoteModalError ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs leading-relaxed">
                  <span className="font-bold block mb-1">❌ Connection Failed</span>
                  {remoteModalError}
                </div>
              ) : remoteFolders.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <span className="text-3xl text-slate-600 block">📁</span>
                  <p className="text-xs font-semibold text-slate-400">No Folders Found</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    The remote repository has been successfully cloned, but no top-level folders were detected. Run a baseline pull to seed configurations!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Successfully connected! The following environment/asset folders exist inside your remote repository:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {remoteFolders.map((folder) => {
                      const isEnvFolder = ["DEV", "PRE", "PROD"].includes(folder.toUpperCase());
                      return (
                        <div 
                          key={folder}
                          className={`px-3 py-2.5 rounded-xl border font-mono text-xs flex items-center gap-2 transition-all ${
                            isEnvFolder 
                              ? "bg-indigo-950/20 border-indigo-500/30 text-indigo-300"
                              : "bg-slate-900 border-slate-800 text-slate-300"
                          }`}
                        >
                          <span>{isEnvFolder ? "🔑" : "📁"}</span>
                          <span className="truncate">{folder}/</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t pt-4 flex justify-end" style={{ borderColor: "var(--border)" }}>
              <button 
                onClick={() => setShowRemoteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 transition"
              >
                Close Explorer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔒 PRODUCTION BOOTSTRAP GATED & STAGED MODAL */}
      {showStagedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn pointer-events-none">
          <div 
            className="border rounded-2xl p-6 w-full max-w-md shadow-2xl text-center relative transition-colors duration-300 animate-fadeIn pointer-events-auto"
            style={{
              backgroundColor: "var(--bg-panel)",
              borderColor: "var(--border)"
            }}
          >
            <div className="flex justify-center mb-3">
              <div 
                className="w-10 h-10 rounded-full border flex items-center justify-center shadow-md transition-colors duration-300 bg-amber-500/10 border-amber-500/20"
              >
                <span className="text-lg font-bold text-amber-500">🔒</span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-100">
              Production Workspace Credentials Gated & Staged
            </h3>

            <p className="text-[11px] mt-1.5 leading-relaxed text-slate-300">
              Direct write bootstrap actions to the <strong>PROD</strong> workspace are protected under zero-trust protocols. Your credentials files have been intercepted and queued as Request <span className="font-mono text-sky-400 font-extrabold">{stagedReqId}</span> for SuperAdmin authorization.
            </p>

            <div 
              className="my-3 max-h-32 overflow-y-auto border rounded-lg p-2.5 text-[10.5px] space-y-1 font-mono text-left bg-slate-950/40 border-slate-900 text-amber-400"
            >
              <div className="font-bold border-b border-slate-900 pb-1 mb-1 text-[9px] uppercase tracking-wider text-slate-500">Staged Files</div>
              {Object.keys(filesToPublish).map((filePath) => (
                <div key={filePath} className="truncate">✓ {filePath}</div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowStagedModal(false);
                  window.location.href = "/wizard/admin";
                }}
                className="w-full py-2.5 rounded-lg text-[10.5px] font-extrabold uppercase transition-all shadow-lg cursor-pointer border"
                style={{
                  background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
                  borderColor: "var(--accent-hover)",
                  color: "#ffffff",
                  boxShadow: "0 2px 8px var(--accent-glow)"
                }}
              >
                ⚙️ Open Admin Console (Approvals)
              </button>

              <button
                onClick={() => setShowStagedModal(false)}
                className="w-full py-2 rounded-lg text-[10px] font-bold uppercase border transition cursor-pointer"
                style={{
                  backgroundColor: "var(--bg-base)",
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)"
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

    </Day0Shell>
  );
}
