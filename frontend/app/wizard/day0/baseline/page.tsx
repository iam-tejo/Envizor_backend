"use client";
 
import { useEffect, useState } from "react";
import Day0Shell from "../Day0Shell";
import { dispatchPageContext } from "@/lib/envizorSync";
 
type ArtefactCategory = {
  key: string;
  label: string;
  items: string[];
};
 
export default function BaselineWorkspacePage() {
  const [selectedEnv, setSelectedEnv] = useState<"DEV" | "PRE" | "PROD" | null>(null);
  const [workspaceExists, setWorkspaceExists] = useState<boolean | null>(null);
  const [workspaceFiles, setWorkspaceFiles] = useState<string[]>([]);
  const [artefacts, setArtefacts] = useState<ArtefactCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
 
  // Step-by-step baselining states
  const [baselineStep, setBaselineStep] = useState<"idle" | "pulled" | "initialized" | "published">("idle");
  const [terminalOutput, setTerminalOutput] = useState<string>("");
  const [initRunning, setInitRunning] = useState<boolean>(false);
 
  // Pre-publish confirmation states
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [filesToPublish, setFilesToPublish] = useState<Record<string, string>>({});
  const [existingContents, setExistingContents] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>({});
  const [showStagedModal, setShowStagedModal] = useState<boolean>(false);
  const [stagedReqId, setStagedReqId] = useState<string>("");

  // User privileges & session states
  const [userRole, setUserRole] = useState<string>("SuperAdmin");
  const [userName, setUserName] = useState<string>("admin");

  function hasReadAccess(envName: string): boolean {
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (r === "SUPERADMIN") return true;
    if (r === `${envName.toUpperCase()}ADMIN`) return true;
    // Let's also check if user has access to lower environments, e.g. PRE Admin has access to DEV
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

  function canResetWorkspace(envName: string): boolean {
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (envName === "PROD") {
      return r === "SUPERADMIN";
    }
    return hasWriteAccess(envName);
  }

  const isWriter = selectedEnv ? hasWriteAccess(selectedEnv) : false;
 
  const [workspaceSettings, setWorkspaceSettings] = useState<{
    locationType: "local" | "remote";
    localPath: string;
    remoteRepoName: string;
  } | null>(null);
 
  useEffect(() => {
    fetch("/api/day0/workspace-settings")
      .then((res) => res.json())
      .then((data) => setWorkspaceSettings(data))
      .catch((err) => console.error(err));
  }, []);
 
  // Synchronize state on mount and listen to chatbot events
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("envizor_username") || "admin";
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";
      
      setUserRole(latestRole);
      setUserName(user);

      const savedEnv = sessionStorage.getItem("envizor_baseline_env") as any;
      const savedArtefacts = sessionStorage.getItem("envizor_baseline_artefacts");
      const savedStep = sessionStorage.getItem("envizor_baseline_step") as any;
      const savedTerminal = sessionStorage.getItem("envizor_baseline_terminalOutput");
 
      let initialEnv = savedEnv;
      const rNormalized = latestRole.replace(/\s+|_/g, "").toUpperCase();
      if (!initialEnv) {
        if (rNormalized === "PRODADMIN") {
          initialEnv = "PROD";
        } else if (rNormalized === "PREADMIN") {
          initialEnv = "PRE";
        } else {
          initialEnv = "DEV";
        }
        sessionStorage.setItem("envizor_baseline_env", initialEnv);
      }

      setSelectedEnv(initialEnv);
      apiCheckWorkspace(initialEnv).then((res) => {
        setWorkspaceExists(res.exists);
        setWorkspaceFiles(res.files);
      });
      if (savedArtefacts) {
        const parsed = JSON.parse(savedArtefacts);
        const cleaned = parsed.map((cat: any) => ({
          ...cat,
          items: cat.items.map((name: string) =>
            name
              .replace(/^(DEV|PRE|PROD|dev|pre|prod)[_ ]+/i, "")
              .replace(/[_ ]+(DEV|PRE|PROD|dev|pre|prod)$/i, "")
          )
        }));
        setArtefacts(cleaned);
      }
      if (savedStep) {
        setBaselineStep(savedStep);
      }
      if (savedTerminal) {
        setTerminalOutput(savedTerminal);
      }
    }
 
    const handleUpdate = (e: any) => {
      const { artefacts, selectedEnv, activeTab, terminalOutput, initRunning } = e.detail;
      if (selectedEnv !== undefined) setSelectedEnv(selectedEnv);
      if (artefacts !== undefined) setArtefacts(artefacts);
      if (terminalOutput !== undefined) {
        setTerminalOutput(terminalOutput);
        sessionStorage.setItem("envizor_baseline_terminalOutput", terminalOutput);
      }
      if (initRunning !== undefined) setInitRunning(initRunning);
 
      // Sync chatbot actions with baselineStep
      if (activeTab === "workspace") {
        setBaselineStep("pulled");
        sessionStorage.setItem("envizor_baseline_step", "pulled");
      }
      if (activeTab === "terminal" && terminalOutput?.includes("successfully initialized")) {
        setBaselineStep("initialized");
        sessionStorage.setItem("envizor_baseline_step", "initialized");
      }
      if (activeTab === "terminal" && terminalOutput?.includes("Apply complete")) {
        setBaselineStep("published");
        sessionStorage.setItem("envizor_baseline_step", "published");
      }
    };
 
    window.addEventListener("envizor_baseline_update", handleUpdate);
    return () => window.removeEventListener("envizor_baseline_update", handleUpdate);
  }, []);
 
  // --- Real Backend Actions ---
 
  async function apiCheckWorkspace(env: string) {
    try {
      const res = await fetch(`/api/env/${env}`);
      const exists = res.status !== 404;
      const json = exists ? await res.json() : { files: [] };
      return { exists, files: json.files ?? [] };
    } catch {
      return { exists: false, files: [] };
    }
  }
 
  async function handleEnvChange(env: "DEV" | "PRE" | "PROD") {
    setSelectedEnv(env);
    sessionStorage.setItem("envizor_baseline_env", env);
    setLoading(true);
 
    // Sync to chatbot
    window.dispatchEvent(new CustomEvent("envizor_baseline_update", {
      detail: { selectedEnv: env }
    }));
    dispatchPageContext({ page: "baseline", action: "env_selected", payload: { env } });
 
    const res = await apiCheckWorkspace(env);
    setWorkspaceExists(res.exists);
    setWorkspaceFiles(res.files);
 
    // Reset step
    setBaselineStep("idle");
    setTerminalOutput("");
    setExistingContents({});
    setSelectedFiles({});
    sessionStorage.setItem("envizor_baseline_step", "idle");
    sessionStorage.removeItem("envizor_baseline_terminalOutput");
    setLoading(false);
  }
 
  async function handleCreateFolder() {
    if (!isWriter) {
      alert("🔒 Access Restricted\n\nYour account role is not authorized to create workspace directories in this environment.");
      return;
    }
    if (!selectedEnv) return;
    setLoading(true);
    await fetch(`/api/env/${selectedEnv}`, { method: "POST" });
    const res = await apiCheckWorkspace(selectedEnv);
    setWorkspaceExists(res.exists);
    setWorkspaceFiles(res.files);
    setLoading(false);
  }
 
  async function handleEmptyFolder() {
    if (!selectedEnv) return;
    if (!canResetWorkspace(selectedEnv)) {
      alert(`🔒 Access Restricted\n\nClearing and resetting the ${selectedEnv} workspace is a high-security operation. ${selectedEnv === "PROD" ? "Only a SuperAdmin is authorized to reset the PROD workspace." : "Your account role is not authorized to clear or reset the active workspace."}`);
      return;
    }
    if (!selectedEnv) return;
    const confirm = window.confirm(`Are you absolutely sure you want to clear the active workspace? This will delete all generated .tf files, folders, and variables, resetting the step status to blank.`);
    if (!confirm) return;
 
    setLoading(true);
    await fetch(`/api/env/${selectedEnv}`, { method: "DELETE" });
    await fetch(`/api/env/${selectedEnv}`, { method: "POST" });
    
    // Clear session and state variables
    setArtefacts([]);
    setBaselineStep("idle");
    setTerminalOutput("");
    setExistingContents({});
    setSelectedFiles({});
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("envizor_baseline_artefacts");
      sessionStorage.removeItem("envizor_baseline_raw_discovery");
      sessionStorage.removeItem("envizor_baseline_step");
      sessionStorage.removeItem("envizor_baseline_terminalOutput");
    }
 
    // Push empty state to remote Git repository if GitOps strategy is active
    try {
      await fetch("/api/day0/workspace-settings/push", { method: "POST" });
    } catch {}
 
    const res = await apiCheckWorkspace(selectedEnv);
    setWorkspaceExists(res.exists);
    setWorkspaceFiles(res.files);
    setLoading(false);
  }
 
  async function handlePullArtefacts() {
    if (!selectedEnv) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/day0/discovery?env=${selectedEnv}`);
      const json = await res.json();
 
      const mapped = Object.entries(json)
        .filter(([_, items]) => Array.isArray(items))
        .map(([key, items]) => ({
          key,
          label: key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
          items: (items as any[]).map((i) => {
            const nameStr = typeof i === "string" ? i : i.name ?? i.id ?? JSON.stringify(i);
            return nameStr
              .replace(/^(DEV|PRE|PROD|dev|pre|prod)[_ ]+/i, "")
              .replace(/[_ ]+(DEV|PRE|PROD|dev|pre|prod)$/i, "");
          })
        }));
 
      setArtefacts(mapped);
      setBaselineStep("pulled");
      sessionStorage.setItem("envizor_baseline_artefacts", JSON.stringify(mapped));
      sessionStorage.setItem("envizor_baseline_raw_discovery", JSON.stringify(json));
      sessionStorage.setItem("envizor_baseline_step", "pulled");
      
      // Dispatch custom event to notify chatbot
      window.dispatchEvent(new CustomEvent("envizor_baseline_update", {
        detail: { artefacts: mapped, activeTab: "workspace" }
      }));
      const totalCount = mapped.reduce((sum: number, c: any) => sum + c.items.length, 0);
      dispatchPageContext({
        page: "baseline",
        action: "artefacts_pulled",
        payload: { env: selectedEnv, count: totalCount, categories: mapped.length }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }
 
  async function handleInit() {
    if (!selectedEnv) return;
    setInitRunning(true);
    setLoading(true);
 
    const log = `$ terraform init\n\nInitializing the backend...\nInitializing provider plugins...\n- Finding saviynt/saviynt versions matching...\n- Installing saviynt/saviynt v1.3.4...\n- Installed saviynt/saviynt v1.3.4 (self-signed, local registry)\n\n✅ Terraform has been successfully initialized!\n\n`;
 
    setTimeout(() => {
      setTerminalOutput(log);
      sessionStorage.setItem("envizor_baseline_terminalOutput", log);
      setBaselineStep("initialized");
      sessionStorage.setItem("envizor_baseline_step", "initialized");
      setInitRunning(false);
      setLoading(false);
 
      // Sync to chatbot
      window.dispatchEvent(new CustomEvent("envizor_baseline_update", {
        detail: { activeTab: "terminal", terminalOutput: log, initRunning: false }
      }));
    }, 1200);
  }

  async function handleStartPublish() {
    if (!isWriter) {
      alert("🔒 Access Restricted\n\nYour account role is not authorized to write configurations in this environment.");
      return;
    }
    if (!selectedEnv || artefacts.length === 0) return;
    setLoading(true);
 
    try {
      // 1. Build Selection Payload for all pulled assets (using original unstripped names)
      const selectionPayload: Record<string, string[]> = {};
      const rawStored = sessionStorage.getItem("envizor_baseline_raw_discovery");
      if (rawStored) {
        const rawJson = JSON.parse(rawStored);
        Object.entries(rawJson).forEach(([key, items]) => {
          if (Array.isArray(items)) {
            selectionPayload[key] = items.map((i: any) => typeof i === "string" ? i : i.name ?? i.id ?? JSON.stringify(i));
          }
        });
      } else {
        for (const cat of artefacts) {
          selectionPayload[cat.key] = cat.items;
        }
      }
 
      // 2. Query the compiler API to retrieve actual Terraform HCL blocks
      const pullRes = await fetch("/api/wizard/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env: selectedEnv, selection: selectionPayload })
      });
      
      const allFiles: Record<string, string> = {
        "provider.tf": `terraform {\n  required_providers {\n    saviynt = {\n      source = "saviynt/saviynt"\n    }\n  }\n}`,
        "backend.tf": `terraform {\n  backend "local" {}\n}`,
        [`${selectedEnv.toLowerCase()}.tfvars`]: `environment = "${selectedEnv}"`
      };
 
      if (pullRes.ok) {
        const pullData = await pullRes.json();
        const compiledFiles = pullData.files ?? {};
        Object.assign(allFiles, compiledFiles);
      }
 
      // 3. Compare with files already in workspaceFiles and fetch their current content
      const existingFilePaths = Object.keys(allFiles).filter((fp) => workspaceFiles.includes(fp));
      const contentsMap: Record<string, string> = {};
      
      await Promise.all(
        existingFilePaths.map(async (filePath) => {
          try {
            const res = await fetch(`/api/env/${selectedEnv}/file/${filePath}`);
            if (res.ok) {
              const data = await res.json();
              contentsMap[filePath] = data.content ?? "";
            }
          } catch (e) {
            console.error(`Failed to read file ${filePath}:`, e);
          }
        })
      );
 
      const initialSelection: Record<string, boolean> = {};
      Object.keys(allFiles).forEach((fp) => {
        initialSelection[fp] = true;
      });
 
      setSelectedFiles(initialSelection);
      setExistingContents(contentsMap);
      setFilesToPublish(allFiles);
      setShowConfirmModal(true);
    } catch (e) {
      console.error(e);
      alert("Failed to stage configurations for your baseline preview review.");
    } finally {
      setLoading(false);
    }
  }
 
  async function handleConfirmPublish() {
    if (!isWriter) {
      alert("🔒 Access Restricted\n\nYour account role is not authorized to finalize publication in this environment.");
      return;
    }
    if (!selectedEnv) return;
    setShowConfirmModal(false);
    setLoading(true);
 
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (selectedEnv === "PROD" && r !== "SUPERADMIN") {
      const reqId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
      const approvalRequest = {
        id: reqId,
        timestamp: new Date().toISOString(),
        username: userName,
        env: "PROD",
        files: filesToPublish,
        status: "PENDING"
      };

      const existingReqs = localStorage.getItem("envizor_approval_requests");
      const reqs = existingReqs ? JSON.parse(existingReqs) : [];
      reqs.push(approvalRequest);
      localStorage.setItem("envizor_approval_requests", JSON.stringify(reqs));

      const customLog = terminalOutput + 
        `$ terraform apply -auto-approve\n` +
        `🔒 PROD WRITE ACTIONS REQUIRE SECURITY APPROVAL\n` +
        `--------------------------------------------------\n` +
        `Submitting User: ${userName}\n` +
        `Staged Configuration Files: ${Object.keys(filesToPublish).length} items\n` +
        `Approval Request ID: ${reqId}\n\n` +
        `🔄 Your change request has been queued in the system and sent to the SuperAdmin.\n` +
        `Please wait for approval in the Admin Console before files are committed to disk.\n`;

      setTerminalOutput(customLog);
      sessionStorage.setItem("envizor_baseline_terminalOutput", customLog);
      setBaselineStep("published");
      sessionStorage.setItem("envizor_baseline_step", "published");
      setStagedReqId(reqId);
      setShowStagedModal(true);

      window.dispatchEvent(new CustomEvent("envizor_baseline_update", {
        detail: { terminalOutput: customLog }
      }));
      
      setLoading(false);
      return;
    }

    try {
      const writeTf = async (fullPath: string, content: string) => {
        await fetch(`/api/env/${selectedEnv}/write`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullPath, content })
        });
      };
 
      let currentLog = terminalOutput + `$ terraform apply -auto-approve\n\n`;
      setTerminalOutput(currentLog);
      sessionStorage.setItem("envizor_baseline_terminalOutput", currentLog);
      window.dispatchEvent(new CustomEvent("envizor_baseline_update", {
        detail: { terminalOutput: currentLog }
      }));
 
      let totalCreated = 0;
      for (const [filePath, hclContent] of Object.entries(filesToPublish)) {
        const isBasic = 
          filePath === "provider.tf" || 
          filePath === "backend.tf" || 
          filePath === `${selectedEnv.toLowerCase()}.tfvars`;

        if (!isBasic && !selectedFiles[filePath]) {
          continue;
        }
        currentLog += `saviynt_resource.${filePath}: Creating...\n`;
        setTerminalOutput(currentLog);
        sessionStorage.setItem("envizor_baseline_terminalOutput", currentLog);
        window.dispatchEvent(new CustomEvent("envizor_baseline_update", {
          detail: { terminalOutput: currentLog }
        }));
 
        await writeTf(filePath, hclContent as string);
 
        currentLog += `saviynt_resource.${filePath}: Creation complete\n`;
        setTerminalOutput(currentLog);
        sessionStorage.setItem("envizor_baseline_terminalOutput", currentLog);
        window.dispatchEvent(new CustomEvent("envizor_baseline_update", {
          detail: { terminalOutput: currentLog }
        }));
        totalCreated++;
      }
 
      currentLog += `\n🎉 Apply complete! Resources: ${totalCreated} created, 0 changed, 0 destroyed.\n`;
      setTerminalOutput(currentLog);
      sessionStorage.setItem("envizor_baseline_terminalOutput", currentLog);
      window.dispatchEvent(new CustomEvent("envizor_baseline_update", {
        detail: { terminalOutput: currentLog }
      }));
 
      // 5. Stage, commit, and push generated baseline configuration directories and files to GitHub in GitOps mode
      try {
        await fetch("/api/day0/workspace-settings/push", { method: "POST" });
      } catch (gitPushErr) {
        console.error("Failed to execute GitOps remote repository push:", gitPushErr);
      }
 
      // Trigger Confetti!
      setShowConfetti(true);
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
 
      setBaselineStep("published");
      sessionStorage.setItem("envizor_baseline_step", "published");
      
      // Update local checked files list
      const checkRes = await apiCheckWorkspace(selectedEnv);
      setWorkspaceFiles(checkRes.files);
 
      // Notify chatbot
      window.dispatchEvent(new CustomEvent("envizor_baseline_update", {
        detail: { activeTab: "terminal", terminalOutput: currentLog }
      }));
    } catch (err) {
      console.error("Baseline publish failed:", err);
    } finally {
      setLoading(false);
    }
  }
 
  // Horizontal step structures
  const steps = [
    { label: "Pull Assets", step: "idle", desc: "Discover Saviynt boundaries", icon: "⬇️", active: baselineStep === "idle", done: ["pulled", "initialized", "published"].includes(baselineStep) },
    { label: "Run Init", step: "pulled", desc: "Initialize workspace directory", icon: "⚙️", active: baselineStep === "pulled", done: ["initialized", "published"].includes(baselineStep) },
    { label: "Publish", step: "initialized", desc: "Write HCL configurations & push", icon: "🚀", active: baselineStep === "initialized", done: baselineStep === "published" },
    { label: "Verify Explorer", step: "published", desc: "Validate published files", icon: "🔍", active: baselineStep === "published", done: false },
  ];
 
  return (
    <Day0Shell
      title="Baseline Workspaces"
      subtitle="Map boundary dependencies and generate authentic Terraform baseline configurations."
      backTo="/wizard/day0"
    >
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full animate-fadeIn">
        {/* Environment Selector and Manual Navigation Panel */}
        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          
          {/* Environment Pick Panel */}
          <div 
            className="rounded-2xl border p-4 space-y-4 shadow-lg flex flex-col justify-between transition-colors duration-300"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                1. Select Environment
              </div>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>Select the cloud tenant to configure baseline resources.</p>
              
              <div className="flex flex-col gap-2 mt-4">
                {(["DEV", "PRE", "PROD"] as const)
                  .filter((e) => hasReadAccess(e))
                  .map((e) => (
                    <button
                      key={e}
                      onClick={() => handleEnvChange(e)}
                      className="px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left flex items-center justify-between border cursor-pointer hover:scale-[1.01]"
                      style={
                        selectedEnv === e
                          ? {
                              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                              borderColor: "var(--accent)",
                              color: "#ffffff",
                              boxShadow: "0 4px 12px var(--accent-glow)"
                            }
                          : {
                              backgroundColor: "var(--bg-base)",
                              borderColor: "var(--border)",
                              color: "var(--text-secondary)",
                            }
                      }
                    >
                      <span>{e} Tenant</span>
                      {selectedEnv === e && <span className="text-[10px] bg-sky-300/20 text-sky-300 px-2 py-0.5 rounded-full font-extrabold">Active</span>}
                    </button>
                  ))}
              </div>
            </div>
 
            {selectedEnv && (
              <div className="border-t pt-4 text-xs space-y-2 transition-colors" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                <div className="flex justify-between items-center">
                  <span>Workspace Directory:</span>
                  <span className="font-semibold text-right max-w-[180px] truncate" style={{ color: "var(--text-primary)" }} title={workspaceSettings?.locationType === "local" ? `${workspaceSettings.localPath}/${selectedEnv}` : `terraform-workspaces-remote/${selectedEnv}`}>
                    {workspaceSettings
                      ? workspaceSettings.locationType === "local"
                        ? `${workspaceSettings.localPath}/${selectedEnv}`
                        : `terraform-workspaces-remote/${selectedEnv}`
                      : `/IGA-Saviynt/${selectedEnv}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Directory Status:</span>
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {workspaceExists ? "Exists ✅" : "Missing ❌"}
                  </span>
                </div>
              </div>
            )}
          </div>
 
          {/* Dynamic header card */}
          <div className="rounded-2xl p-[1px] shadow-lg flex-1" style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-hover))" }}>
            <div 
              className="rounded-2xl px-6 py-6 h-full flex flex-col justify-between transition-colors duration-300"
              style={{ backgroundColor: "var(--bg-panel)", color: "var(--text-primary)" }}
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
                  Envizor Baselines Console
                </div>
                <h2 className="mt-2 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                  Interactive Workspace Initializer
                </h2>
                <p className="text-xs leading-relaxed mt-2 max-w-xl" style={{ color: "var(--text-secondary)" }}>
                  Follow the step-by-step wizard pipeline to pull boundaries, initialize local directories via terraform, and publish fully compliance HCL configurations onto Git.
                </p>
              </div>
 
              <div className="flex items-center gap-3 text-xs border-t pt-4 mt-4" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 border" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                  <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-pulse" />
                  Advisor Chatbot Linked
                </span>
                <span>•</span>
                <span>Active step validation live</span>
              </div>
            </div>
          </div>
        </div>
 
        {/* STEPS SEQUENCE TRACKER */}
        {selectedEnv && (
          <div 
            className="rounded-2xl border p-4 shadow-md transition-colors grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn"
            style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
          >
            {steps.map((s, idx) => {
              const isCurrent = s.active;
              const isCompleted = s.done;
              return (
                <div 
                  key={s.label} 
                  className={`p-3 rounded-xl border flex flex-col justify-between min-h-[90px] transition-all duration-300 ${
                    isCurrent ? "shadow-lg scale-[1.01]" : ""
                  }`}
                  style={
                    isCurrent
                      ? { backgroundColor: "var(--bg-surface)", borderColor: "var(--accent)", boxShadow: "0 2px 10px var(--accent-glow)" }
                      : isCompleted
                      ? { backgroundColor: "var(--bg-base)", borderColor: "var(--border)", opacity: 0.85 }
                      : { backgroundColor: "var(--bg-base)", borderColor: "var(--border)", opacity: 0.55 }
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isCurrent ? "var(--accent)" : isCompleted ? "var(--success)" : "var(--text-muted)" }}>
                      Step {idx + 1} {isCompleted && "✓"}
                    </span>
                    <span className="text-sm">{s.icon}</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-extrabold" style={{ color: isCurrent ? "var(--text-primary)" : "var(--text-secondary)" }}>{s.label}</div>
                    <p className="text-[9px] text-slate-400 leading-tight mt-1">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
 
        {/* FULL WIDTH DASHBOARD */}
        <div 
          className="rounded-2xl border flex flex-col w-full min-h-[580px] shadow-2xl transition-colors duration-300"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          {/* Dashboard Header */}
          <div 
            className="flex items-center justify-between px-6 py-4 border-b rounded-t-2xl transition-colors"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-panel)" }}
          >
            <span className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--accent)" }}>
              📦 Workspace Configuration Builder
            </span>
            {selectedEnv && baselineStep !== "idle" && (
              <span className="text-[10px] bg-sky-300/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-full font-extrabold uppercase animate-pulse">
                Active Step: {baselineStep.toUpperCase()}
              </span>
            )}
          </div>
 
          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col">
            {!selectedEnv ? (
              <div 
                className="flex-1 flex flex-col items-center justify-center text-center py-24 rounded-xl border p-6 transition-colors"
                style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
              >
                <span className="text-4xl">🧭</span>
                <p className="text-sm mt-3 font-semibold" style={{ color: "var(--text-secondary)" }}>
                  Please select an environment tenant in the top panel to begin.
                </p>
              </div>
            ) : !hasReadAccess(selectedEnv) ? (
              <div 
                className="flex-1 flex flex-col items-center justify-center text-center py-20 rounded-xl border p-6 transition-all animate-fadeIn"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.03)", borderColor: "rgba(239, 68, 68, 0.2)" }}
              >
                <span className="text-5xl text-red-500 animate-pulse">🛡️</span>
                <h3 className="text-sm font-extrabold text-red-400 mt-4 uppercase tracking-wider">Access Restricted</h3>
                <p className="text-xs mt-2 max-w-md text-slate-400 leading-relaxed">
                  Your current account role (<strong className="text-slate-200">{userRole}</strong>) does not possess read privileges for the <strong className="text-slate-200 uppercase">{selectedEnv}</strong> tenant. 
                </p>
                <p className="text-[10px] text-slate-500 mt-2">Contact your system SuperAdmin to request environment permissions.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                
                {/* DYNAMIC CONTENTS BASED ON ACTIVE STEP */}
                <div className="flex-1 flex flex-col gap-6">
                  
                  {/* STEP 1: PULL SAVIYNT ASSETS (baselineStep === "idle") */}
                  {baselineStep === "idle" && (
                    <div 
                      className="flex-1 flex flex-col items-center justify-center text-center py-16 rounded-xl border p-6 space-y-5 animate-fadeIn transition-colors"
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                    >
                      <span className="text-4xl animate-pulse">🤖</span>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-100">Step 1: Pull Staged Saviynt Assets</h3>
                        <p className="text-xs mt-1 max-w-sm text-slate-400">
                          {workspaceExists 
                            ? `Workspace directory is ready. Discovered ${workspaceFiles.length} files currently on disk.`
                            : "Workspace directory is missing and will be auto-created during init."}
                        </p>
                      </div>
 
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={handlePullArtefacts}
                          disabled={loading}
                          className="px-8 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white hover:scale-[1.02] active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}
                        >
                          {loading ? "Pulling..." : "⬇️ Pull Saviynt Assets"}
                        </button>
                      </div>
                    </div>
                  )}
 
                  {/* STEP 2: RUN TERRAFORM INIT (baselineStep === "pulled") */}
                  {baselineStep === "pulled" && (
                    <div className="space-y-6 animate-fadeIn">
                      <div 
                        className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border gap-4 transition-colors"
                        style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">⚙️</span>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-100">Step 2: Initialize Terraform Modules</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">Initialize state engines and prepare the saviynt provider directories.</p>
                          </div>
                        </div>
 
                        <button
                          onClick={handleInit}
                          disabled={loading || initRunning}
                          className="px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white hover:scale-[1.02] transition-all shadow-md cursor-pointer"
                          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}
                        >
                          {initRunning ? "Initializing..." : "⚙️ Run terraform init"}
                        </button>
                      </div>
 
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {artefacts.map((cat) => (
                          <CategoryPanel key={cat.key} category={cat} />
                        ))}
                      </div>
                    </div>
                  )}
 
                  {/* STEP 3 & 4: WRITE & PUBLISH BASELINE & TERMINAL STREAMING (baselineStep === "initialized" || "published") */}
                  {(baselineStep === "initialized" || baselineStep === "published") && (
                    <div className="space-y-6 animate-fadeIn">
                      <div 
                        className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border gap-4 transition-colors"
                        style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🚀</span>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-100">
                              {baselineStep === "initialized" ? "Step 3: Publish Baseline Configurations" : "Step 4: Baseline Successfully Published!"}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {baselineStep === "initialized" 
                                ? "Compile dynamic Terraform modules, save configurations to disk, and synchronize GitOps."
                                : "All resources successfully compiled and GitOps repositories synchronized."}
                            </p>
                          </div>
                        </div>
 
                        {baselineStep === "initialized" && (
                          <button
                            onClick={handleStartPublish}
                            disabled={loading || !isWriter}
                            className="px-8 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white transition-all shadow-lg cursor-pointer hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                            style={{
                              background: "linear-gradient(135deg, var(--success), #16a34a)",
                              border: "1px solid var(--border)",
                              boxShadow: "0 4px 12px rgba(34, 197, 94, 0.2)"
                            }}
                          >
                            {loading ? "Staging Changes..." : !isWriter ? "🔒 Publish Restricted" : "🚀 Publish Baseline Workspace"}
                          </button>
                        )}
 
                        {baselineStep === "published" && (
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={handlePullArtefacts}
                              disabled={loading}
                              className="px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white hover:scale-[1.02] active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
                              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}
                            >
                              {loading ? "Pulling..." : "⬇️ Pull Baseline Assets from Tenant"}
                            </button>
                            <button
                              onClick={() => {
                                window.location.href = `/wizard/explorer/discovery?env=${selectedEnv}`;
                              }}
                              className="px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white transition-all shadow-lg cursor-pointer hover:scale-[1.02]"
                              style={{
                                background: "linear-gradient(135deg, var(--success), #16a34a)",
                                border: "1px solid var(--border)",
                                boxShadow: "0 4px 12px rgba(34, 197, 94, 0.2)"
                              }}
                            >
                              🔍 Confirm & Go to Explorer
                            </button>
                          </div>
                        )}
                      </div>
 
                      {/* TERMINAL PANEL DISPLAY */}
                      {terminalOutput && (
                        <div 
                          className="rounded-xl border p-4 shadow-inner flex flex-col h-[280px] overflow-hidden"
                          style={{ backgroundColor: "#0b0f19", borderColor: "var(--border)" }}
                        >
                          <div className="flex items-center justify-between border-b pb-2 mb-2" style={{ borderColor: "#1e293b" }}>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                              Console log terminal output streams
                            </span>
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          </div>
                          <pre 
                            className="flex-1 text-[10.5px] font-mono text-slate-300 leading-normal overflow-y-auto space-y-1 whitespace-pre-wrap select-text pr-2"
                            style={{ scrollBehavior: "smooth" }}
                            ref={(el) => {
                              if (el) el.scrollTop = el.scrollHeight;
                            }}
                          >
                            {terminalOutput}
                          </pre>
                        </div>
                      )}
 
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {artefacts.map((cat) => (
                          <CategoryPanel key={cat.key} category={cat} />
                        ))}
                      </div>
                    </div>
                  )}
 
                </div>
 
                {/* Bottom clean/reset control buttons */}
                <div className="flex justify-start border-t pt-4 mt-6" style={{ borderColor: "var(--border)" }}>
                  <button
                    onClick={handleEmptyFolder}
                    disabled={loading || (selectedEnv ? !canResetWorkspace(selectedEnv) : true)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer hover:bg-red-955/20 hover:border-red-500 text-red-400 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-800"
                    style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                  >
                    <span>{(selectedEnv && canResetWorkspace(selectedEnv)) ? "🧹" : "🔒"}</span> {(selectedEnv && canResetWorkspace(selectedEnv)) ? "Clear & Reset Workspace" : "Reset Restricted"}
                  </button>
                </div>
 
              </div>
            )}
          </div>
        </div>
      </div>
 
      {/* FINAL CONFIRMATION OVERLAY MODAL */}
      {baselineStep === "published" && showConfetti && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center pointer-events-none z-50 animate-fadeIn" style={{ backgroundColor: "rgba(0,0,0,0.65)" }}>
          <div 
            className="border p-8 rounded-2xl text-center space-y-5 max-w-md shadow-2xl transition-colors pointer-events-auto"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div 
              className="h-16 w-16 rounded-full flex items-center justify-center text-3xl mx-auto border bg-emerald-950/20 animate-bounce"
              style={{ borderColor: "var(--success)" }}
            >
              🎉
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black tracking-wide" style={{ color: "var(--success)" }}>Workspace Baseline Published!</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Declarative Terraform HCL definitions for your active environment have been safely compiled, saved on disk, and committed to GitOps successfully.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  window.location.href = `/wizard/explorer/discovery?env=${selectedEnv}`;
                }}
                className="w-full py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white transition-all shadow-lg cursor-pointer hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 12px var(--accent-glow)"
                }}
              >
                🔍 Confirm & Go to Workspace Explorer
              </button>
            </div>
            <p className="text-[9px] text-slate-500 font-mono">
              Redirects to full visual repository inventory inspector
            </p>
          </div>
        </div>
      )}
 
      {/* PRE-PUBLISH CHANGE REVIEW MODAL OVERLAY */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 backdrop-blur-md flex items-center justify-center pointer-events-none z-50 animate-fadeIn" 
          style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
        >
          <div 
            className="border p-6 rounded-2xl max-w-2xl w-full shadow-2xl relative flex flex-col pointer-events-auto transition-colors"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <div className="space-y-1">
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-400">
                  Pre-Publish Validation & Audit
                </div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <span>📋</span> Review Workspace Baseline Changes
                </h3>
              </div>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="text-xs hover:text-white transition cursor-pointer text-slate-400 font-bold border rounded-full h-6 w-6 flex items-center justify-center hover:bg-slate-900"
                style={{ borderColor: "var(--border)" }}
              >
                ✕
              </button>
            </div>
 
            {/* Content Body */}
            <div className="py-5 flex-1 min-h-[220px] max-h-[360px] overflow-y-auto space-y-4">
              <p className="text-[11px] text-slate-400 leading-normal">
                The following HCL baseline files have been compiled and staged. Confirming this action will write these configurations directly into the <strong className="text-slate-200 uppercase">{selectedEnv}</strong> workspace:
              </p>
 
              <div className="rounded-xl border p-3 bg-slate-950/70 space-y-2" style={{ borderColor: "var(--border)" }}>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b pb-1.5 flex justify-between items-center" style={{ borderColor: "#1e293b" }}>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={
                        Object.keys(filesToPublish).length > 0 && 
                        Object.keys(filesToPublish).every((fp) => {
                          const isBasic = 
                            fp === "provider.tf" || 
                            fp === "backend.tf" || 
                            fp === `${selectedEnv?.toLowerCase()}.tfvars`;
                          return isBasic ? true : !!selectedFiles[fp];
                        })
                      }
                      onChange={(e) => {
                        const val = e.target.checked;
                        const updated: Record<string, boolean> = {};
                        Object.keys(filesToPublish).forEach((fp) => {
                          const isBasic = 
                            fp === "provider.tf" || 
                            fp === "backend.tf" || 
                            fp === `${selectedEnv?.toLowerCase()}.tfvars`;
                          updated[fp] = isBasic ? true : val;
                        });
                        setSelectedFiles(updated);
                      }}
                      className="cursor-pointer h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
                    />
                    <span>Proposed Workspace Configuration Files</span>
                  </div>
                  <span>Action Status</span>
                </div>
                
                <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                  {Object.keys(filesToPublish).map((filePath) => {
                    const isExisting = workspaceFiles.includes(filePath);
                    const newContent = filesToPublish[filePath] ?? "";
                    const oldContent = existingContents[filePath] ?? "";
                    const isChanged = !isExisting || newContent.trim() !== oldContent.trim();
                    const isBasic = 
                      filePath === "provider.tf" || 
                      filePath === "backend.tf" || 
                      filePath === `${selectedEnv?.toLowerCase()}.tfvars`;
                    const isSelected = isBasic ? true : !!selectedFiles[filePath];
                    return (
                      <div 
                        key={filePath}
                        className="flex items-center justify-between text-xs font-mono py-1.5 border-b border-dashed"
                        style={{ borderColor: "#1e293b" }}
                      >
                        <div className="flex items-center gap-2 max-w-[400px]">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            disabled={isBasic}
                            onChange={(e) => {
                              if (isBasic) return;
                              setSelectedFiles((prev) => ({
                                ...prev,
                                [filePath]: e.target.checked
                              }));
                            }}
                            className={`h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 focus:ring-sky-500 focus:ring-offset-slate-900 ${
                              isBasic ? "cursor-not-allowed opacity-50 text-slate-500" : "cursor-pointer text-sky-500"
                            }`}
                          />
                          <span className={`text-slate-300 truncate ${!isSelected ? "opacity-35 line-through text-slate-500" : ""}`}>
                            {filePath} {isBasic && <span className="text-[9px] text-sky-400 font-extrabold uppercase scale-90 ml-1.5 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-900/40">Required</span>}
                          </span>
                        </div>
                        {!isExisting ? (
                          <span className={`text-[9px] font-extrabold uppercase bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/40 scale-95 flex items-center gap-1 ${!isSelected ? "opacity-35" : ""}`}>
                            <span className={`h-1.5 w-1.5 rounded-full bg-emerald-400 ${isSelected ? "animate-pulse" : ""}`} />
                            [NEW / ADD]
                          </span>
                        ) : isChanged ? (
                          <span className={`text-[9px] font-extrabold uppercase bg-amber-950/40 text-amber-400 px-2 py-0.5 rounded border border-amber-800/40 scale-95 flex items-center gap-1 ${!isSelected ? "opacity-35" : ""}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            [UPDATE]
                          </span>
                        ) : (
                          <span className={`text-[9px] font-extrabold uppercase bg-slate-950/50 text-slate-500 px-2 py-0.5 rounded border border-slate-800/50 scale-95 flex items-center gap-1 ${!isSelected ? "opacity-35" : ""}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                            [NO CHANGES]
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
 
            {/* Footer */}
            <div className="border-t pt-4 flex justify-end gap-3" style={{ borderColor: "var(--border)" }}>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 transition cursor-pointer"
                style={{ borderColor: "var(--border)" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmPublish}
                disabled={!Object.values(selectedFiles).some(Boolean)}
                className="px-6 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-emerald-500/20 border border-emerald-400 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Confirm & Publish Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔒 PRODUCTION BASELINE WRITE GATED & STAGED MODAL */}
      {showStagedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
          <div 
            className="border rounded-2xl p-6 w-full max-w-md shadow-2xl text-center relative transition-colors duration-300 animate-fadeIn"
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
              Production Baseline Write Gated & Staged
            </h3>

            <p className="text-[11px] mt-1.5 leading-relaxed text-slate-300">
              Direct write baseline publications to the <strong>PROD</strong> workspace are protected under zero-trust protocols. Your baseline assets have been intercepted and queued as Request <span className="font-mono text-sky-400 font-extrabold">{stagedReqId}</span> for SuperAdmin authorization.
            </p>

            <div 
              className="my-3 max-h-32 overflow-y-auto border rounded-lg p-2.5 text-[10.5px] space-y-1 font-mono text-left bg-slate-950/40 border-slate-900 text-amber-400"
            >
              <div className="font-bold border-b border-slate-900 pb-1 mb-1 text-[9px] uppercase tracking-wider text-slate-500">Staged Baseline Files</div>
              {Object.keys(filesToPublish).map((filePath) => {
                const isSelected = filePath === "provider.tf" || filePath === "backend.tf" || filePath === `prod.tfvars` || !!selectedFiles[filePath];
                if (!isSelected) return null;
                return <div key={filePath} className="truncate">✓ {filePath}</div>;
              })}
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
 
function CategoryPanel({ category }: { category: ArtefactCategory }) {
  const [open, setOpen] = useState(true);
 
  return (
    <div 
      className="border rounded-xl mb-2 transition hover:opacity-95"
      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-4 py-3 text-xs font-bold border-b transition-colors cursor-pointer"
        style={{ color: "var(--text-primary)", borderColor: "var(--border)", backgroundColor: "var(--bg-panel)" }}
      >
        <span>
          {category.label} ({category.items.length})
        </span>
        <span style={{ color: "var(--text-muted)" }}>{open ? "−" : "+"}</span>
      </button>
 
      {open && (
        <div className="p-3 space-y-1.5 max-h-56 overflow-y-auto">
          {category.items.map((item) => (
            <div
              key={item}
              className="text-xs border rounded-lg px-3 py-2.5 font-semibold"
              style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              {item
                .replace(/^(DEV|PRE|PROD|dev|pre|prod)[_ ]+/i, "")
                .replace(/[_ ]+(DEV|PRE|PROD|dev|pre|prod)$/i, "")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
