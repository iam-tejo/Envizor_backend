"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dispatchPageContext } from "@/lib/envizorSync";

type EnvName = "DEV" | "PRE" | "PROD";

const COMMANDS = [
  { id: "init",    icon: "⚙️", label: "init",    description: "Pull & Baseline configurations from Saviynt." },
  { id: "plan",    icon: "📝", label: "plan",    description: "Show what Terraform will change." },
  { id: "apply",   icon: "🚀", label: "apply",   description: "Apply changes to Saviynt." },
  { id: "destroy", icon: "💣", label: "destroy", description: "Destroy managed resources." },
  { id: "refresh", icon: "🔄", label: "refresh", description: "Refresh state from remote." },
  { id: "fmt",     icon: "🎨", label: "fmt",     description: "Format Terraform files." },
  { id: "state",   icon: "📦", label: "state",   description: "Inspect or modify state." },
];

const COMMAND_STYLES: Record<string, { active: string; idle: string }> = {
  init: {
    active: "bg-sky-600 text-white border-sky-400 shadow-sky-500/40",
    idle:   "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:border-sky-400",
  },
  plan: {
    active: "bg-yellow-500 text-slate-900 border-yellow-400 shadow-yellow-500/40",
    idle:   "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:border-yellow-400",
  },
  apply: {
    active: "bg-sky-500 text-white border-sky-400 shadow-sky-500/40",
    idle:   "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:border-sky-400",
  },
  destroy: {
    active: "bg-red-600 text-white border-red-500 shadow-red-500/40",
    idle:   "bg-slate-800 text-slate-200 hover:bg-red-900/50 hover:border-red-500",
  },
  refresh: {
    active: "bg-emerald-500 text-slate-900 border-emerald-400 shadow-emerald-500/40",
    idle:   "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:border-emerald-400",
  },
  fmt: {
    active: "bg-purple-500 text-white border-purple-400 shadow-purple-500/40",
    idle:   "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:border-purple-400",
  },
  state: {
    active: "bg-orange-500 text-slate-900 border-orange-400 shadow-orange-500/40",
    idle:   "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:border-orange-400",
  },
};

export default function PushWizardPage() {
  const [env, setEnv] = useState<EnvName>("DEV");
  const [files, setFiles] = useState<string[]>([]);
  const [command, setCommand] = useState<string>("init");
  const [output, setOutput] = useState<string>("");
  const [planPreview, setPlanPreview] = useState<string>("");
  const [confirmApply, setConfirmApply] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastCompleted, setLastCompleted] = useState<string | null>(null);

  // Staged apply modal states
  const [showApplyStaged, setShowApplyStaged] = useState(false);
  const [stagedReqId, setStagedReqId] = useState("");

  // User privileges & session states
  const [userRole, setUserRole] = useState<string>("BasicUser");
  const [userName, setUserName] = useState<string>("admin");
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  function hasReadAccess(envName: string): boolean {
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (r === "SUPERADMIN") return true;
    if (r === `${envName.toUpperCase()}ADMIN`) return true;
    if (r === "PREADMIN" && envName === "DEV") return true;
    if (r === "PRODADMIN" && (envName === "DEV" || envName === "PRE")) return true;
    return false;
  }

  function hasWriteAccess(envName: string): boolean {
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (r === "SUPERADMIN") return true;
    if (r === `${envName.toUpperCase()}ADMIN`) return true;
    if (r === "PREADMIN" && envName === "DEV") return true;
    if (r === "PRODADMIN" && (envName === "DEV" || envName === "PRE")) return true;
    return false;
  }

  function isCommandAllowed(cmd: string): boolean {
    if (hasWriteAccess(env)) return true;
    return ["plan", "state", "refresh"].includes(cmd);
  }

  // Sequence map: after completing a command, which command should be highlighted next
  const NEXT_STEP: Record<string, string> = {
    init:  "plan",
    plan:  "apply",
    apply: "state",
    fmt:   "plan",
  };
  const nextStep = lastCompleted ? (NEXT_STEP[lastCompleted] ?? null) : null;

  // --- Pull/Init Wizard State Variables (all 15 EIC resources) ---
  const RESOURCE_TYPES = [
    { key: "securitySystems",   icon: "🛡️",  label: "Security Systems" },
    { key: "endpoints",         icon: "🔌",  label: "Endpoints" },
    { key: "dynamicAttributes", icon: "🏷️",  label: "Dynamic Attributes" },
    { key: "entitlementTypes",  icon: "📋",  label: "Entitlement Types" },
    { key: "enterpriseRoles",   icon: "👔",  label: "Enterprise Roles" },
    { key: "entitlements",      icon: "🎫",  label: "Entitlements" },
    { key: "privileges",        icon: "⚡",  label: "Privileges" },
    { key: "fileUploads",       icon: "📁",  label: "File Uploads" },
    { key: "connections",       icon: "🔗",  label: "Connections" },
    { key: "jobs",              icon: "⚙️",  label: "Jobs" },
    { key: "transportPackages", icon: "📦",  label: "Transport Packages" },
    { key: "roles",              icon: "👥",  label: "Roles (Standard)" },
    { key: "tasks",              icon: "📋",  label: "Tasks" },
    { key: "rules",              icon: "⚖️",  label: "Rules" },
    { key: "lookups",            icon: "🔍",  label: "Lookups" },
  ] as const;

  type ResourceKey = typeof RESOURCE_TYPES[number]["key"];

  const [available, setAvailable] = useState<Record<ResourceKey, string[]>>(
    Object.fromEntries(RESOURCE_TYPES.map(r => [r.key, []])) as unknown as Record<ResourceKey, string[]>
  );
  const [selected, setSelected] = useState<Record<ResourceKey, string[]>>(
    Object.fromEntries(RESOURCE_TYPES.map(r => [r.key, []])) as unknown as Record<ResourceKey, string[]>
  );

  // Legacy aliases for existing code that still uses old variable names
  const availableSecuritySystems = available.securitySystems;
  const availableEndpoints        = available.endpoints;
  const availableConnections      = available.connections;
  const selectedSecuritySystems   = selected.securitySystems;
  const selectedEndpoints         = selected.endpoints;
  const selectedConnections       = selected.connections;

  const [discoveryData, setDiscoveryData] = useState<any>(null);
  const [pullLoading, setPullLoading] = useState(false);
  const [filesResult, setFilesResult] = useState<{ files: Record<string, string> } | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(true);

  const [showConfirm, setShowConfirm] = useState(false);
  const [filesToWrite, setFilesToWrite] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [writeResult, setWriteResult] = useState<any>(null);

  const [showDiff, setShowDiff] = useState(false);
  const [diffFileName, setDiffFileName] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [newContent, setNewContent] = useState("");

  // Sync workspace files list from backend
  useEffect(() => {
    fetch(`/api/wizard/push/files?env=${env}`)
      .then((r) => r.json())
      .then((d) => {
        setFiles(d.files ?? []);
        setLastCompleted(null); // Reset step tracking on env switch
      });
  }, [env]);

  // Discover APIs
  async function fetchDiscovery(chosenEnv: string) {
    if (discoveryData && discoveryData.env === chosenEnv) {
      return discoveryData;
    }
    try {
      const res = await fetch(`/api/day0/discovery?env=${chosenEnv}&_t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch discovery data");
      const data = await res.json();
      const loaded = { env: chosenEnv, ...data };
      setDiscoveryData(loaded);
      return loaded;
    } catch (err) {
      console.error(err);
      const envKey = (chosenEnv.toUpperCase()) as "DEV" | "PRE" | "PROD";
      const fallbackData = {
        DEV: {
          securitySystems:   [{ name: "HR_SYSTEM_DEV" }, { name: "FINANCE_SYSTEM_DEV" }],
          endpoints:         [{ name: "HR_ENDPOINT_DEV" }, { name: "FIN_ENDPOINT_DEV" }],
          dynamicAttributes: [{ name: "department_code" }],
          entitlementTypes:  [{ name: "AD_Group" }],
          enterpriseRoles:   [{ name: "Enterprise_Dev_Engineer" }],
          entitlements:      [{ name: "Dev Entitlement A" }, { name: "Dev Entitlement B" }],
          privileges:        [{ name: "admin_dashboard_access" }],
          fileUploads:       [{ name: "sap_users_baseline.xlsx" }],
          connections:       [{ name: "DEV_DB_CONN" }, { name: "DEV_LDAP_CONN" }],
          jobs:              [{ name: "Dev Task A" }],
          transportPackages: [{ name: "Billing_Module_DEV" }],
          roles:             [{ name: "Dev Role A" }, { name: "Dev Role B" }, { name: "Dev Role C" }],
          tasks:             [{ name: "Dev Task A" }],
          rules:             [{ name: "Dev Rule A" }],
          lookups:           [{ name: "CountryCodes" }, { name: "DeptMappings" }],
        },
        PRE: {
          securitySystems:   [{ name: "HR_SYSTEM_PRE" }],
          endpoints:         [{ name: "HR_ENDPOINT_PRE" }],
          dynamicAttributes: [{ name: "department_code" }],
          entitlementTypes:  [{ name: "AD_Group" }],
          enterpriseRoles:   [{ name: "Enterprise_Pre_Engineer" }],
          entitlements:      [{ name: "Pre Entitlement A" }],
          privileges:        [{ name: "admin_dashboard_access" }],
          fileUploads:       [],
          connections:       [{ name: "PRE_DB_CONN" }, { name: "PRE_LDAP_CONN" }],
          jobs:              [{ name: "Pre Task A" }],
          transportPackages: [{ name: "Billing_Module_PRE" }],
          roles:             [{ name: "Pre Role A" }, { name: "Pre Role B" }],
          tasks:             [{ name: "Pre Task A" }],
          rules:             [{ name: "Pre Rule A" }],
          lookups:           [{ name: "CountryCodes" }],
        },
        PROD: {
          securitySystems:   [{ name: "HR_SYSTEM_PROD" }, { name: "FINANCE_SYSTEM_PROD" }],
          endpoints:         [{ name: "HR_ENDPOINT_PROD" }],
          dynamicAttributes: [{ name: "department_code" }],
          entitlementTypes:  [{ name: "AD_Group" }],
          enterpriseRoles:   [{ name: "Enterprise_Prod_Engineer" }],
          entitlements:      [{ name: "Prod Entitlement A" }, { name: "Prod Entitlement B" }],
          privileges:        [{ name: "admin_dashboard_access" }],
          fileUploads:       [],
          connections:       [{ name: "PROD_DB_CONN" }, { name: "PROD_LDAP_CONN" }],
          jobs:              [{ name: "Prod Task A" }, { name: "Prod Task B" }],
          transportPackages: [{ name: "Billing_Module_PROD" }],
          roles:             [{ name: "Prod Role A" }, { name: "Prod Role B" }, { name: "Prod Role C" }, { name: "Prod Role D" }],
          tasks:             [{ name: "Prod Task A" }, { name: "Prod Task B" }],
          rules:             [{ name: "Prod Rule A" }],
          lookups:           [{ name: "CountryCodes" }, { name: "DeptMappings" }],
        }
      };
      const fallback = {
        env: chosenEnv,
        isMock: true,
        ...(fallbackData[envKey] || fallbackData.DEV)
      };
      setDiscoveryData(fallback);
      return fallback;
    }
  }

  // Pre-fill parameters on mount (direct from Envizor Robot / Explorer)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("envizor_username") || "admin";
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";
      
      setUserRole(latestRole);
      setUserName(user);
      setAuthLoading(false);

      let initialEnv = "DEV";
      if (latestRole.toUpperCase().startsWith("PRE")) {
        initialEnv = "PRE";
      } else if (latestRole.toUpperCase().startsWith("PROD")) {
        initialEnv = "PROD";
      }

      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");
      const src = params.get("source") as EnvName;
      const art = params.get("artefact") || "";
      const cmdParam = params.get("command");

      // Read ?env= param (sent by explorer/discovery "Push Changes" button)
      const envParam = params.get("env") as EnvName;
      if (envParam && (["DEV", "PRE", "PROD"] as EnvName[]).includes(envParam)) {
        setEnv(envParam);
      } else {
        setEnv(initialEnv as EnvName);
      }

      if (cmdParam) {
        setCommand(cmdParam);
      }

      if (action === "deploy_wizard" && src) {
        setEnv(src);
        setCommand("init");
        
        fetchDiscovery(src).then((data) => {
          const newAvail: Record<string, string[]> = {};
          const newSel: Record<string, string[]> = {};
          for (const r of RESOURCE_TYPES) {
            const names = (data[r.key] || []).map((x: any) => x.name ?? x.fileName ?? x.id ?? "").filter(Boolean);
            newAvail[r.key] = names;
            newSel[r.key] = names; // select all by default
          }
          setAvailable(newAvail as any);
          setSelected(newSel as any);

          // Auto-trigger HCL generation
          setPullLoading(true);
          fetch("/api/wizard/pull", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ env: src, selection: newSel })
          })
            .then((r) => r.json())
            .then((json) => {
              setFilesResult(json);
              const initial = Object.keys(json.files || {}).reduce((acc, file) => {
                acc[file] = true;
                return acc;
              }, {} as Record<string, boolean>);
              setSelectedFiles(initial);
              setSelectAll(true);
              setPullLoading(false);
            })
            .catch(() => setPullLoading(false));
        });
      }
    }
  }, []);

  // When env switches, load discovery data if command === "init"
  useEffect(() => {
    if (command === "init" && env) {
      setPullLoading(true);
      fetchDiscovery(env).then((data) => {
        const newAvail: Record<string, string[]> = {};
        const newSel: Record<string, string[]> = {};
        for (const r of RESOURCE_TYPES) {
          const names = (data[r.key] || []).map((x: any) => x.name ?? x.fileName ?? x.id ?? "").filter(Boolean);
          newAvail[r.key] = names;
          newSel[r.key] = names;
        }
        setAvailable(newAvail as any);
        setSelected(newSel as any);
        setPullLoading(false);
      });
    }
  }, [env, command]);

  // Generate HCL configs
  async function handlePullGenerate() {
    if (!env) return;
    setPullLoading(true);

    try {
      const res = await fetch("/api/wizard/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env, selection: selected }),
      });

      const json = await res.json();
      setFilesResult(json);

      const initial = Object.keys(json.files || {}).reduce((acc, file) => {
        acc[file] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedFiles(initial);
      setSelectAll(true);
    } catch (e) {
      console.error(e);
    } finally {
      setPullLoading(false);
    }
  }

  function handleToggleSelectAll() {
    const newValue = !selectAll;
    setSelectAll(newValue);

    const updated = Object.keys(selectedFiles).reduce((acc, file) => {
      acc[file] = newValue;
      return acc;
    }, {} as Record<string, boolean>);

    setSelectedFiles(updated);
  }

  function handleCheckboxChange(filename: string, checked: boolean) {
    const updated = {
      ...selectedFiles,
      [filename]: checked,
    };
    setSelectedFiles(updated);

    const allSelected = Object.values(updated).every(Boolean);
    setSelectAll(allSelected);
  }

  function handleOpenConfirm() {
    if (!filesResult?.files) return;

    const selected: Record<string, string> = {};
    for (const [filename, isSelected] of Object.entries(selectedFiles)) {
      if (isSelected && filesResult.files[filename]) {
        selected[filename] = filesResult.files[filename];
      }
    }
    if (Object.keys(selected).length === 0) return;

    setFilesToWrite(selected);
    setShowConfirm(true);
  }

  async function handleConfirmWrite() {
    setShowConfirm(false);

    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (env === "PROD" && r !== "SUPERADMIN") {
      try {
        const reqId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
        const approvalRequest = {
          id: reqId,
          timestamp: new Date().toISOString(),
          username: userName || "user",
          env: "PROD",
          files: filesToWrite,
          status: "PENDING" as const
        };

        const existingReqs = localStorage.getItem("envizor_approval_requests");
        const reqs = existingReqs ? JSON.parse(existingReqs) : [];
        reqs.push(approvalRequest);
        localStorage.setItem("envizor_approval_requests", JSON.stringify(reqs));
        window.dispatchEvent(new CustomEvent("storage"));

        setWriteResult({
          written: Object.keys(filesToWrite),
          isStaged: true,
          reqId: reqId
        });
        setShowSuccess(true);
        setLastCompleted(null);
      } catch (e) {
        alert("⚠️ Failed to stage production baseline approval request.");
      }
      return;
    }

    const res = await fetch("/api/wizard/pull/write", {
      method: "POST",
      body: JSON.stringify({ env, files: filesToWrite }),
    });

    const json = await res.json();
    setWriteResult(json);
    setShowSuccess(true);
    setLastCompleted(null); // Reset step tracking on fresh baseline rewrite
    
    // Refresh files list
    fetch(`/api/wizard/push/files?env=${env}`)
      .then((r) => r.json())
      .then((d) => setFiles(d.files ?? []));
  }

  async function openDiff(filename: string, newFileContent: string) {
    if (!env) return;
    setDiffFileName(filename);
    setNewContent(newFileContent);

    const res = await fetch("/api/wizard/pull/read", {
      method: "POST",
      body: JSON.stringify({ env, filename }),
    });

    const json = await res.json();
    setExistingContent(json.exists ? json.content : "");
    setShowDiff(true);
  }

  // Toggle individual item selection
  const toggleSelection = (name: string, type: ResourceKey) => {
    setSelected((prev) => ({
      ...prev,
      [type]: prev[type].includes(name)
        ? prev[type].filter((x) => x !== name)
        : [...prev[type], name],
    }));
  };

  // Select all / Deselect all for a category
  const toggleCategoryAll = (type: ResourceKey) => {
    setSelected((prev) => ({
      ...prev,
      [type]: prev[type].length === available[type].length ? [] : [...available[type]],
    }));
  };

  // Run normal generic Terraform command
  async function runCommand() {
    if (command === "apply" && !confirmApply) {
      alert("Please confirm you have reviewed the plan before applying.");
      return;
    }

    setRunning(true);
    setOutput("");
    setPlanPreview("");

    // 🔒 PROD Apply requires manual SuperAdmin approval!
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (env === "PROD" && command === "apply" && r !== "SUPERADMIN") {
      setTimeout(() => {
        try {
          const reqId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
          const stagedFiles = {
            "provider.tf": `terraform {\n  required_providers {\n    saviynt = {\n      source = "saviynt/saviynt"\n    }\n  }\n}`,
            "prod_security_systems.tf": `resource "saviynt_security_system" "prod_system" {\n  name = "PROD_FINANCE_SYSTEM"\n  auth_type = "OAUTH2"\n  description = "Production Finance Application System - Authenticated via TLS 1.3"\n}`,
            "prod_endpoints.tf": `resource "saviynt_endpoint" "prod_endpoint" {\n  name = "PROD_FINANCE_API_ENDPOINT"\n  security_system = saviynt_security_system.prod_system.name\n  endpoint_url = "https://api.finance.prod.envizor.internal"\n}`
          };
          
          const approvalRequest = {
            id: reqId,
            timestamp: new Date().toISOString(),
            username: userName || "user",
            env: "PROD",
            files: stagedFiles,
            status: "PENDING" as const
          };

          const existingReqs = localStorage.getItem("envizor_approval_requests");
          const reqs = existingReqs ? JSON.parse(existingReqs) : [];
          reqs.push(approvalRequest);
          localStorage.setItem("envizor_approval_requests", JSON.stringify(reqs));
          window.dispatchEvent(new CustomEvent("storage"));

          const customLog = 
            `$ terraform apply -auto-approve\n` +
            `🔒 PROD WRITE ACTIONS REQUIRE MANUAL SECURITY APPROVAL\n` +
            `---------------------------------------------------------\n` +
            `Submitting User: ${userName || "user"}\n` +
            `Staged Configuration Files: 3 items\n` +
            `Approval Request ID: ${reqId}\n\n` +
            `🔄 Your change request has been successfully staged in the system and queued for the SuperAdmin.\n` +
            `Please wait for approval in the Admin Console before files are committed to disk.\n`;

          setOutput(customLog);
          setLastCompleted("apply");
          setStagedReqId(reqId);
          setShowApplyStaged(true);

          // Dispatch custom event to notify RightDockedChatbot
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("envizor_push_update", {
              detail: { command: "apply", output: customLog, env: "PROD", reqId: reqId }
            }));
            dispatchPageContext({
              page: "push",
              action: "command_executed",
              payload: { command: "apply", output: customLog, env: "PROD", reqId: reqId }
            });
          }
        } catch (e) {
          setOutput("⚠️ Failed to stage production approval request.");
        } finally {
          setRunning(false);
        }
      }, 1200);
      return;
    }

    const res = await fetch("/api/wizard/push/command", {
      method: "POST",
      body: JSON.stringify({ env, command }),
    });

    const json = await res.json();
    const cmdOutput = json.output ?? "";
    setOutput(cmdOutput);

    if (command === "plan") {
      setPlanPreview(cmdOutput);
    }
    
    setLastCompleted(command);
    
    // Dispatch custom event to notify RightDockedChatbot
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("envizor_push_update", {
        detail: { command, output: cmdOutput, env }
      }));
      dispatchPageContext({
        page: "push",
        action: "command_executed",
        payload: { command, output: cmdOutput, env }
      });
    }

    setRunning(false);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center animate-pulse" style={{ backgroundColor: "var(--bg-base)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)" }} />
      </div>
    );
  }

  if (!hasReadAccess(env)) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center px-6 py-10 transition-all duration-300"
        style={{
          backgroundColor: "var(--bg-base)",
          color: "var(--text-primary)"
        }}
      >
        <div 
          className="max-w-md w-full rounded-2xl border p-8 shadow-2xl text-center backdrop-blur-md animate-fadeIn"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "rgba(239, 68, 68, 0.2)" }}
        >
          <span className="text-6xl text-red-500 animate-pulse">🛡️</span>
          <h3 className="text-base font-extrabold text-red-400 mt-5 uppercase tracking-wider">Access Denied</h3>
          <p className="text-xs mt-2.5 max-w-sm mx-auto text-slate-400 leading-relaxed">
            Your active user account role (<strong className="text-slate-200">{userRole}</strong>) does not have authorization to view the **DevOps Push Console** for the <strong className="text-slate-100 uppercase">{env}</strong> environment.
          </p>
          <p className="text-[10px] text-slate-500 mt-3 leading-normal">
            Staging environment configuration and deployment actions require read-capable permissions.
          </p>
          
          <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <Link
              href="/wizard/steps/welcome"
              className="inline-block px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-255 transition cursor-pointer"
            >
              ← Return to Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center py-10 transition-all duration-300"
      style={{
        backgroundColor: "var(--bg-base)",
        color: "var(--text-primary)"
      }}
    >
      <div className="max-w-5xl w-full px-4 space-y-8">

        {/* Back */}
        <Link
          href="/wizard/home"
          className="text-xs transition block hover:opacity-80"
          style={{ color: "var(--accent)" }}
        >
          ← Back to Radiant Control Panel
        </Link>

        {/* Header */}
        <div className="text-center">
          <div 
            className="h-1.5 w-24 mx-auto rounded-full mb-3"
            style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-hover))" }}
          />
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Deploy Terraform to Saviynt</h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            Run Terraform commands safely against your Saviynt environment.
          </p>
        </div>

        {/* Environment Selector */}
        <div className="flex justify-center gap-3">
          {(["DEV", "PRE", "PROD"] as EnvName[]).map((e) => {
            const hasAccess = hasReadAccess(e);
            return (
              <button
                key={e}
                disabled={!hasAccess}
                onClick={() => {
                  setEnv(e);
                  dispatchPageContext({ page: "push", action: "env_selected", payload: { env: e } });
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition border ${!hasAccess ? "opacity-35 cursor-not-allowed" : "cursor-pointer"}`}
                style={
                  env === e
                    ? {
                        backgroundColor: "var(--accent)",
                        borderColor: "var(--accent-hover)",
                        color: "#ffffff",
                        boxShadow: "0 2px 8px var(--accent-glow)"
                      }
                    : {
                        backgroundColor: "var(--bg-panel)",
                        borderColor: "var(--border)",
                        color: "var(--text-secondary)"
                      }
                }
              >
                {e} {!hasAccess && "🔒"}
              </button>
            );
          })}
        </div>

        {/* Workspace Files */}
        <div 
          className="rounded-2xl border p-4 animate-fadeIn transition-colors duration-300"
          style={{
            backgroundColor: "var(--bg-panel)",
            borderColor: "var(--border)"
          }}
        >
          <div className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>Workspace Files ({env})</div>

          {files.length === 0 && (
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              No files found. Run Day‑0 or pull init first.
            </div>
          )}

          <ul className="text-[11px] space-y-1 max-h-40 overflow-auto pr-2">
            {files.map((f) => (
              <li key={f} style={{ color: "var(--text-secondary)", fontFamily: "monospace" }}>{f}</li>
            ))}
          </ul>
        </div>

        {/* Terraform Command Sequence Tracker */}
        <div 
          className="rounded-2xl border p-5 space-y-4 transition-colors duration-300"
          style={{
            backgroundColor: "var(--bg-panel)",
            borderColor: "var(--border)"
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <span>📋 Terraform Lifecycle Sequence</span>
              <span 
                className="text-[10px] border px-2 py-0.5 rounded-full font-normal transition-colors duration-300"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-muted)"
                }}
              >
                Standard DevOps Flow
              </span>
            </h3>
            {nextStep && (
              <span className="text-[10px] font-bold animate-pulse flex items-center gap-1" style={{ color: "var(--accent)" }}>
                <span className="h-1.5 w-1.5 rounded-full animate-ping" style={{ backgroundColor: "var(--accent)" }} />
                {lastCompleted} done! Run {nextStep} next.
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
            {[
              { step: 1, label: "init",  desc: "Initialize backend & pull baselines", done: lastCompleted !== null, current: command === "init", highlight: nextStep === "init" },
              { step: 2, label: "fmt",   desc: "Lint & format HCL configs",           done: lastCompleted === "fmt" || lastCompleted === "plan" || lastCompleted === "apply", current: command === "fmt",  highlight: nextStep === "fmt" },
              { step: 3, label: "plan",  desc: "Dry-run and preview changes",          done: lastCompleted === "plan" || lastCompleted === "apply", current: command === "plan", highlight: nextStep === "plan" },
              { step: 4, label: "apply", desc: "Deploy changes to Saviynt",            done: lastCompleted === "apply",current: command === "apply",highlight: nextStep === "apply" },
              { step: 5, label: "state", desc: "Inspect active state logs",             done: false,                  current: command === "state" || command === "refresh", highlight: nextStep === "state" },
            ].map((s) => {
              const isActive = s.current;
              const isDone = s.done;
              const shouldHighlight = s.highlight;
              
              let blockStyle = {};
              let tagColor = "var(--text-muted)";
              let titleColor = "var(--text-muted)";

              if (isActive) {
                blockStyle = {
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--accent)",
                  boxShadow: "0 2px 10px var(--accent-glow)",
                };
                tagColor = "var(--accent)";
                titleColor = "var(--text-primary)";
              } else if (shouldHighlight) {
                blockStyle = {
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--accent)",
                  boxShadow: "0 2px 10px var(--accent-glow)",
                };
                tagColor = "var(--accent)";
                titleColor = "var(--accent)";
              } else if (isDone) {
                blockStyle = {
                  backgroundColor: "var(--bg-base)",
                  borderColor: "var(--border)",
                };
                tagColor = "var(--success)";
                titleColor = "var(--text-secondary)";
              } else {
                blockStyle = {
                  backgroundColor: "var(--bg-base)",
                  borderColor: "var(--border)",
                  opacity: 0.55
                };
              }
              
              return (
                <div 
                  key={s.label}
                  className="relative p-3 rounded-xl border transition-all duration-300 text-left flex flex-col justify-between min-h-[90px]"
                  style={blockStyle}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: tagColor }}>
                        Step {s.step}
                      </span>
                      {isDone && !isActive && <span className="text-[10px] font-extrabold" style={{ color: "var(--success)" }}>✓</span>}
                      {isActive && <span className="h-1.5 w-1.5 rounded-full animate-ping" style={{ backgroundColor: "var(--accent)" }} />}
                      {shouldHighlight && <span className="h-1.5 w-1.5 rounded-full animate-ping" style={{ backgroundColor: "var(--accent)" }} />}
                    </div>
                    <div className="font-bold text-xs font-mono mt-1" style={{ color: titleColor }}>
                      terraform {s.label}
                    </div>
                  </div>
                  <p className="text-[9px] mt-2 leading-tight" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Terraform Commands */}
        <div 
          id="command-panel" 
          className="rounded-2xl border p-4 space-y-4 transition-colors duration-300"
          style={{
            backgroundColor: "var(--bg-panel)",
            borderColor: "var(--border)"
          }}
        >
          <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Terraform Commands</div>

          <div className="grid md:grid-cols-4 gap-3">
            {COMMANDS.map((c) => {
              const isActive = command === c.id;
              const shouldBlink = c.id === nextStep;

              let btnStyle: any = {};
              if (isActive) {
                if (c.id === "destroy") {
                  btnStyle = {
                    backgroundColor: "var(--error)",
                    borderColor: "var(--error)",
                    color: "#ffffff",
                    boxShadow: "0 2px 10px rgba(239, 68, 68, 0.3)"
                  };
                } else {
                  btnStyle = {
                    backgroundColor: "var(--accent)",
                    borderColor: "var(--accent-hover)",
                    color: "#ffffff",
                    boxShadow: "0 2px 10px var(--accent-glow)"
                  };
                }
              } else {
                btnStyle = {
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)"
                };
              }

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setCommand(c.id);
                    dispatchPageContext({ page: "push", action: "command_changed", payload: { command: c.id } });
                  }}
                  className={`
                    relative p-3 rounded-xl text-left text-[11px] transition border cursor-pointer
                    ${shouldBlink && !isActive ? "animate-pulse" : ""}
                  `}
                  style={
                    shouldBlink && !isActive
                      ? {
                          backgroundColor: "var(--bg-surface)",
                          borderColor: "var(--accent)",
                          boxShadow: "0 0 10px var(--accent-glow)"
                        }
                      : btnStyle
                  }
                >
                  <div className="text-2xl mb-1">{c.icon}</div>
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <span>{c.label}</span>
                    {shouldBlink && (
                      <span className="h-2 w-2 rounded-full animate-ping" style={{ backgroundColor: "var(--accent)" }} />
                    )}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: isActive ? "rgba(255,255,255,0.85)" : "var(--text-muted)" }}>{c.description}</div>

                  {c.id === "destroy" && (
                    <div className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider" style={{ color: isActive ? "#ffffff" : "var(--error)" }}>
                      DANGER
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {command === "init" ? (
            // --- DYNAMIC PULL WIZARD PANEL INSIDE INIT COMMAND ---
            <div className="space-y-6 pt-4 border-t animate-fadeIn" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚙️</span>
                <div>
                  <h3 className="text-sm font-black" style={{ color: "var(--accent)" }}>Terraform Pull & Baselining Console</h3>
                  <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Discover active Saviynt objects, select boundaries, and baseline compliance modules directly into the workspace.</p>
                </div>
              </div>

              {discoveryData && discoveryData.isMock && (
                <div 
                  className="p-3 rounded-lg border text-[10.5px] shadow-sm flex items-start gap-2 max-w-2xl transition-colors duration-300"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "rgba(14, 165, 233, 0.2)",
                    color: "var(--text-secondary)"
                  }}
                >
                  <span>⚙️</span>
                  <div>
                    <span className="font-bold" style={{ color: "var(--accent)" }}>Demo Sandbox active:</span> using local simulated cloud schemas to baseline state files.
                  </div>
                </div>
              )}

              <div 
                className="p-4 rounded-xl border text-xs shadow-md flex items-start gap-3 max-w-3xl animate-fadeIn transition-colors duration-300"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.05)",
                  borderColor: "rgba(245, 158, 11, 0.2)"
                }}
              >
                <span className="text-lg">⚠️</span>
                <div className="space-y-1">
                  <div className="font-bold" style={{ color: "var(--warning)" }}>Target Tenant Overwrite Caution</div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Running the <strong>Pull Saviynt Assets</strong> (init) command will pull the live resource states from the <strong>{env}</strong> tenant. This will **overwrite** the HCL configurations currently in your local workspace.
                  </p>
                  <p className="text-[11px] font-semibold mt-1" style={{ color: "var(--warning)" }}>
                    💡 If you have just synchronized workspace changes from DEV and want to push them to {env}, please SKIP this step and select <strong style={{ color: "var(--accent)" }}>plan</strong> or <strong style={{ color: "var(--accent)" }}>apply</strong> directly from the lifecycle sequence above!
                  </p>
                </div>
              </div>

              {pullLoading && Object.values(available).every(a => a.length === 0) ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: "var(--accent)" }} />
                  <p className="text-xs font-semibold animate-pulse" style={{ color: "var(--text-muted)" }}>Running live baseline discovery query...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {RESOURCE_TYPES.map((rt) => {
                    const avail = available[rt.key] || [];
                    const sel = selected[rt.key] || [];
                    const allSelected = avail.length > 0 && sel.length === avail.length;
                    return (
                      <div
                        key={rt.key}
                        className="border rounded-xl p-3 flex flex-col justify-between min-h-[180px] transition-colors duration-300"
                        style={{ backgroundColor: "var(--bg-base)", borderColor: sel.length > 0 ? "rgba(14,165,233,0.3)" : "var(--border)" }}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2 border-b pb-1" style={{ borderColor: "var(--border)" }}>
                            <h4 className="text-[10.5px] font-bold flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                              <span>{rt.icon}</span>
                              <span className="truncate">{rt.label}</span>
                            </h4>
                            <button
                              onClick={() => toggleCategoryAll(rt.key)}
                              className="text-[9px] font-bold uppercase transition flex-shrink-0"
                              style={{ color: "var(--accent)" }}
                            >
                              {allSelected ? "None" : "All"}
                            </button>
                          </div>
                          {avail.length === 0 ? (
                            <p className="text-[9.5px] italic" style={{ color: "var(--text-muted)" }}>No items in mock</p>
                          ) : (
                            <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                              {avail.map((item) => {
                                const isSelected = sel.includes(item);
                                return (
                                  <div
                                    key={item}
                                    onClick={() => toggleSelection(item, rt.key)}
                                    className="px-2 py-1.5 rounded-lg border text-[10px] font-semibold cursor-pointer transition-all flex items-center justify-between gap-1"
                                    style={
                                      isSelected
                                        ? { backgroundColor: "rgba(14,165,233,0.08)", borderColor: "var(--accent)", color: "var(--accent)" }
                                        : { backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }
                                    }
                                  >
                                    <span className="truncate">{item}</span>
                                    {isSelected && <span className="font-black flex-shrink-0">✓</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="text-[9px] mt-2 border-t pt-1 font-bold" style={{ borderColor: "var(--border)", color: sel.length > 0 ? "var(--accent)" : "var(--text-muted)" }}>
                          {sel.length} / {avail.length} selected
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total selected count + Generate button */}
              {(() => {
                const totalSelected = Object.values(selected).reduce((s, arr) => s + arr.length, 0);
                return (
                  <div className="flex flex-col items-center gap-2">
                    {totalSelected > 0 && (
                      <p className="text-[10px] font-bold" style={{ color: "var(--text-secondary)" }}>
                        {totalSelected} resource{totalSelected !== 1 ? "s" : ""} selected across {Object.values(selected).filter(a => a.length > 0).length} types
                      </p>
                    )}
                    <button
                      onClick={handlePullGenerate}
                      disabled={pullLoading || totalSelected === 0}
                      className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shadow-lg cursor-pointer border"
                      style={
                        pullLoading || totalSelected === 0
                          ? { backgroundColor: "var(--bg-panel)", color: "var(--text-muted)", borderColor: "var(--border)", cursor: "not-allowed" }
                          : { background: "linear-gradient(90deg, var(--accent), var(--accent-hover))", color: "#ffffff", borderColor: "var(--accent-hover)", boxShadow: "0 2px 10px var(--accent-glow)" }
                      }
                    >
                      {pullLoading ? "Generating compliance modules..." : `⚡ Pull & Generate ${totalSelected} HCL blocks`}
                    </button>
                  </div>
                );
              })()}

              {/* Review Generated HCL Files */}
              {filesResult?.files && (
                <div className="space-y-4 border-t pt-4 animate-fadeIn" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border)" }}>
                    <h4 className="text-[11.5px] font-bold" style={{ color: "var(--text-primary)" }}>Review Discovered HCL Blocks</h4>
                    <button
                      onClick={handleToggleSelectAll}
                      className="px-2.5 py-1 rounded border text-[9px] font-bold uppercase tracking-wider transition cursor-pointer"
                      style={{
                        backgroundColor: "var(--bg-base)",
                        borderColor: "var(--border)",
                        color: "var(--text-secondary)"
                      }}
                    >
                      {selectAll ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {Object.entries(filesResult.files).map(([filename, content]) => (
                      <div 
                        key={filename} 
                        className="p-3 border rounded-xl space-y-2 animate-fadeIn transition-colors duration-300"
                        style={{
                          backgroundColor: "var(--bg-surface)",
                          borderColor: "var(--border)"
                        }}
                      >
                        <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: "var(--border)" }}>
                          <span className="text-[10px] font-mono font-bold truncate" style={{ color: "var(--accent)" }}>{filename}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openDiff(filename, content)}
                              className="px-2 py-1 text-[8.5px] font-bold rounded border transition cursor-pointer"
                              style={{
                                backgroundColor: "var(--bg-panel)",
                                borderColor: "var(--border)",
                                color: "var(--text-secondary)"
                              }}
                            >
                              Diff
                            </button>
                            <input
                              type="checkbox"
                              checked={selectedFiles[filename] || false}
                              onChange={(e) => handleCheckboxChange(filename, e.target.checked)}
                              className="w-3.5 h-3.5 rounded cursor-pointer"
                              style={{ accentColor: "var(--accent)" }}
                            />
                          </div>
                        </div>
                        <pre 
                          className="text-[9px] font-mono leading-normal p-2.5 rounded-lg border max-h-36 overflow-auto shadow-inner transition-colors duration-300"
                          style={{
                            backgroundColor: "var(--code-bg)",
                            borderColor: "var(--border)",
                            color: "var(--code-text)"
                          }}
                        >
                          {content}
                        </pre>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleOpenConfirm}
                      disabled={!hasWriteAccess(env) || Object.values(selectedFiles).filter(Boolean).length === 0}
                      className={`w-full max-w-sm px-5 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg border ${!hasWriteAccess(env) ? "opacity-45 cursor-not-allowed" : "cursor-pointer"}`}
                      style={
                        !hasWriteAccess(env) || Object.values(selectedFiles).filter(Boolean).length === 0
                          ? {
                              backgroundColor: "var(--bg-panel)",
                              color: "var(--text-muted)",
                              borderColor: "var(--border)"
                            }
                          : {
                              background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
                              color: "#ffffff",
                              borderColor: "var(--accent-hover)",
                              boxShadow: "0 4px 12px var(--accent-glow)"
                            }
                      }
                    >
                      {!hasWriteAccess(env) ? `🔒 Write Restricted (${env}_Admin required)` : `Write Selected HCL to ${env} Workspace`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // --- STANDARD TERRAFORM COMMAND LOGICS (PLAN, APPLY, ETC.) ---
            <>
              {command === "apply" && (
                <label className="flex items-center gap-2 text-[11px] font-bold" style={{ color: "var(--warning)" }}>
                  <input
                    type="checkbox"
                    checked={confirmApply}
                    onChange={(e) => setConfirmApply(e.target.checked)}
                  />
                  I have reviewed the plan and I’m happy with the changes.
                </label>
              )}

              <button
                onClick={runCommand}
                disabled={!isCommandAllowed(command) || running}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition border ${!isCommandAllowed(command) ? "opacity-45 cursor-not-allowed" : "cursor-pointer"}`}
                style={
                  !isCommandAllowed(command)
                    ? {
                        backgroundColor: "var(--bg-panel)",
                        borderColor: "var(--border)",
                        color: "var(--text-muted)"
                      }
                    : command === nextStep
                    ? {
                        background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
                        borderColor: "var(--accent-hover)",
                        color: "#ffffff",
                        boxShadow: "0 2px 10px var(--accent-glow)"
                      }
                    : {
                        backgroundColor: "var(--accent)",
                        borderColor: "var(--accent-hover)",
                        color: "#ffffff"
                      }
                }
              >
                {!isCommandAllowed(command) ? `🔒 Run terraform ${command} Restricted` : `Run terraform ${command}`}
              </button>

              {running && (
                <div className="animate-pulse text-xs mt-2" style={{ color: "var(--accent)" }}>
                  Running terraform {command}…
                </div>
              )}
            </>
          )}
        </div>

        {/* Plan Preview Panel */}
        {planPreview && command === "plan" && (
          <div 
            className="rounded-2xl border p-4 animate-fadeIn transition-colors duration-300"
            style={{
              backgroundColor: "var(--bg-panel)",
              borderColor: "var(--border)"
            }}
          >
            <div className="text-sm font-bold mb-2" style={{ color: "var(--accent)" }}>
              Terraform Plan Preview
            </div>
            <pre 
              className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed p-4 rounded-xl border max-h-[40vh] overflow-y-auto"
              style={{
                backgroundColor: "var(--code-bg)",
                borderColor: "var(--border)",
                color: "var(--code-text)"
              }}
            >
              {planPreview}
            </pre>
          </div>
        )}

        {/* Output */}
        {output && (
          <div 
            className="rounded-2xl border p-5 animate-fadeIn shadow-xl space-y-3 transition-colors duration-300"
            style={{
              backgroundColor: "var(--bg-panel)",
              borderColor: "var(--border)"
            }}
          >
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" style={{ backgroundColor: "var(--success)" }} />
                <span className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                  Command Output: <span className="font-mono lowercase" style={{ color: "var(--accent)" }}>terraform {command}</span>
                </span>
              </div>
              <span 
                className="text-[10px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  borderColor: "rgba(16, 185, 129, 0.2)",
                  color: "var(--success)"
                }}
              >
                SUCCESS
              </span>
            </div>
            <pre 
              className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed p-4 rounded-xl border shadow-inner max-h-[60vh] overflow-y-auto transition-colors duration-300"
              style={{
                backgroundColor: "var(--code-bg)",
                borderColor: "var(--border)",
                color: "var(--code-text)"
              }}
            >
              {output}
            </pre>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
          <div 
            className="border rounded-2xl p-5 w-full max-w-md shadow-2xl relative animate-fadeIn transition-colors duration-300"
            style={{
              backgroundColor: "var(--bg-panel)",
              borderColor: "var(--border)"
            }}
          >
            <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
              <span>✍️</span> <span>Write Configs to Local Workspace</span>
            </h3>

            <p className="text-[11px] mt-2.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              You are baselining <span className="font-bold" style={{ color: "var(--accent)" }}>{Object.keys(filesToWrite).length}</span> generated HCL configuration block(s) into your active local **{env}** workspace. This will overwrite variables matching these resource boundaries:
            </p>

            <div 
              className="my-3 max-h-32 overflow-y-auto border rounded-lg p-2.5 text-[10.5px] space-y-1 font-mono transition-colors duration-300"
              style={{
                backgroundColor: "var(--code-bg)",
                borderColor: "var(--border)",
                color: "var(--code-text)"
              }}
            >
              {Object.keys(filesToWrite).map((f) => (
                <div key={f} className="py-0.5 border-b last:border-none truncate" style={{ borderColor: "var(--border)" }}>
                  {f}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-2 rounded-lg text-[10px] font-bold uppercase border transition cursor-pointer"
                style={{
                  backgroundColor: "var(--bg-base)",
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)"
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmWrite}
                className="px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border"
                style={{
                  background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
                  borderColor: "var(--accent-hover)",
                  color: "#ffffff",
                  boxShadow: "0 2px 8px var(--accent-glow)"
                }}
              >
                Write Configs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
          <div 
            className="border rounded-2xl p-6 w-full max-w-md shadow-2xl text-center animate-fadeIn relative transition-colors duration-300"
            style={{
              backgroundColor: "var(--bg-panel)",
              borderColor: "var(--border)"
            }}
          >
            <div className="flex justify-center mb-3">
              <div 
                className="w-10 h-10 rounded-full border flex items-center justify-center shadow-md transition-colors duration-300"
                style={{
                  backgroundColor: writeResult?.isStaged ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                  borderColor: writeResult?.isStaged ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)"
                }}
              >
                <span className="text-lg font-bold" style={{ color: writeResult?.isStaged ? "var(--warning, #f59e0b)" : "var(--success)" }}>
                  {writeResult?.isStaged ? "🔒" : "✓"}
                </span>
              </div>
            </div>

            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {writeResult?.isStaged ? "🔒 Production Write Staged" : "Workspace Baselined"}
            </h3>

            <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {writeResult?.isStaged ? (
                <>
                  Direct file writes to the <strong>PROD</strong> workspace are restricted. Successfully generated HCL modular files and queued baseline Request <span className="font-mono text-sky-400 font-extrabold">{writeResult.reqId}</span> for SuperAdmin approval.
                </>
              ) : (
                <>
                  Successfully wrote <span className="font-bold" style={{ color: "var(--success)" }}>{writeResult?.written?.length || 0}</span> HCL modular files to your local **{env}** environment state workspace.
                </>
              )}
            </p>

            <div 
              className="my-3 max-h-32 overflow-y-auto border rounded-lg p-2.5 text-[10.5px] space-y-1 font-mono text-left transition-colors duration-300"
              style={{
                backgroundColor: "var(--code-bg)",
                borderColor: "var(--border)",
                color: "var(--code-text)"
              }}
            >
              {writeResult?.written?.map((f: string) => (
                <div key={f} className="py-0.5 border-b last:border-none truncate font-semibold" style={{ borderColor: "var(--border)", color: writeResult?.isStaged ? "var(--warning, #f59e0b)" : "var(--success)" }}>
                  {f}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {writeResult?.isStaged ? (
                <button
                  onClick={() => {
                    setShowSuccess(false);
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
              ) : (
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    setCommand("plan");
                  }}
                  className="w-full py-2.5 rounded-lg text-[10.5px] font-extrabold uppercase transition-all shadow-lg cursor-pointer border"
                  style={{
                    background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
                    borderColor: "var(--accent-hover)",
                    color: "#ffffff",
                    boxShadow: "0 2px 8px var(--accent-glow)"
                  }}
                >
                  📝 Proceed to Plan Command
                </button>
              )}

              <button
                onClick={() => setShowSuccess(false)}
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

      {/* Side-by-Side Diff Modal */}
      {showDiff && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
          <div 
            className="border rounded-2xl p-5 w-full max-w-5xl shadow-2xl relative flex flex-col max-h-[85vh] transition-colors duration-300"
            style={{
              backgroundColor: "var(--bg-panel)",
              borderColor: "var(--border)"
            }}
          >
            <div className="flex justify-between items-center border-b pb-2 mb-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold font-mono" style={{ color: "var(--text-primary)" }}>
                  Diff analysis: {diffFileName}
                </span>
              </div>

              <button
                onClick={() => setShowDiff(false)}
                className="px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition cursor-pointer"
                style={{
                  backgroundColor: "var(--bg-base)",
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)"
                }}
              >
                ✕ Close
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3 flex-1 overflow-y-auto">
              <div className="flex flex-col min-h-[300px]">
                <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Existing HCL Workspace Code</div>
                <pre 
                  className="flex-1 text-[9.5px] font-mono leading-relaxed whitespace-pre-wrap p-3.5 rounded-xl border overflow-auto shadow-inner transition-colors duration-300"
                  style={{
                    backgroundColor: "var(--code-bg)",
                    borderColor: "var(--border)",
                    color: "var(--code-text)"
                  }}
                >
                  {existingContent || "# File does not exist yet. Running primary initialization pull."}
                </pre>
              </div>

              <div className="flex flex-col min-h-[300px]">
                <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--accent)" }}>New Compiled HCL Code</div>
                <pre 
                  className="flex-1 text-[9.5px] font-mono leading-relaxed whitespace-pre-wrap p-3.5 rounded-xl border overflow-auto shadow-inner transition-colors duration-300"
                  style={{
                    backgroundColor: "var(--code-bg)",
                    borderColor: "var(--border)",
                    color: "var(--success)"
                  }}
                >
                  {newContent}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔒 PROD Apply Staged Modal */}
      {showApplyStaged && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
          <div 
            className="border rounded-2xl p-6 w-full max-w-md shadow-2xl text-center animate-fadeIn relative transition-colors duration-300"
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
              Production Release Gated & Staged
            </h3>

            <p className="text-[11px] mt-1.5 leading-relaxed text-slate-300">
              Direct write deployments to the <strong>PROD</strong> workspace are protected under zero-trust protocols. Your baseline apply actions have been intercepted and queued as Request <span className="font-mono text-sky-400 font-extrabold">{stagedReqId}</span> for SuperAdmin authorization.
            </p>

            <div 
              className="my-3 max-h-32 overflow-y-auto border rounded-lg p-2.5 text-[10.5px] space-y-1 font-mono text-left bg-slate-950/40 border-slate-900 text-amber-400"
            >
              <div className="font-bold border-b border-slate-900 pb-1 mb-1 text-[9px] uppercase tracking-wider text-slate-500">Staged Terraform Configurations</div>
              <div className="truncate">✓ provider.tf</div>
              <div className="truncate">✓ prod_security_systems.tf</div>
              <div className="truncate">✓ prod_endpoints.tf</div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowApplyStaged(false);
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
                onClick={() => setShowApplyStaged(false)}
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
    </div>
  );
}
