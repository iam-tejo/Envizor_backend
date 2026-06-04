"use client";

import { useState, useEffect } from "react";
import Day0Shell from "../../day0/Day0Shell";
import CatppuccinIcon from "@/app/components/CatppuccinIcon";
import { dispatchPageContext } from "@/lib/envizorSync";

const ChevronRight = ({ open }: { open: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    className={`transition-transform ${open ? "rotate-90" : ""} text-slate-500`}
  >
    <path fill="currentColor" d="M9 6l6 6-6 6z" />
  </svg>
);

/* -------------------------------------------------------
   File Type Colors
------------------------------------------------------- */

const fileColors: Record<string, string> = {
  ".tf": "text-emerald-300",
  ".tfvars": "text-sky-300",
  ".json": "text-amber-300",
  ".yaml": "text-purple-300",
  ".yml": "text-purple-300",
  default: "text-slate-300",
};

const environments = ["DEV", "PRE", "PROD"];

/* -------------------------------------------------------
   Terraform Syntax Highlighter
------------------------------------------------------- */

function highlightTerraform(code: string) {
  if (!code) return "";

  // 1. Escape HTML
  code = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Tokenize strings FIRST (so regex never touches them again)
  const stringTokens: string[] = [];
  code = code.replace(/"([^"]*)"/g, (match) => {
    stringTokens.push(match);
    return `__STRING_TOKEN_${stringTokens.length - 1}__`;
  });

  // 3. Apply highlighting (VS Code Dark+ colors)
  code = code
    // comments
    .replace(/(#.*)/g, `<span class="text-[#6A9955]">$1</span>`)

    // numbers
    .replace(/\b(\d+)\b/g, `<span class="text-[#B5CEA8]">$1</span>`)

    // resource/data blocks
    .replace(
      /\b(resource|data)\s+"([^"]+)"\s+"([^"]+)"/g,
      `<span class="text-[#569CD6]">$1</span> <span class="text-[#4EC9B0]">"$2"</span> <span class="text-[#9CDCFE]">"$3"</span>`
    )

    // keywords
    .replace(
      /\b(variable|output|provider|module|locals|terraform)\b/g,
      `<span class="text-[#569CD6]">$1</span>`
    )

    // attribute keys
    .replace(
      /^(\s*)([a-zA-Z0-9_]+)\s*=/gm,
      `$1<span class="text-[#9CDCFE]">$2</span> =`
    );

  // 4. Restore string tokens with VS Code string color
  code = code.replace(/__STRING_TOKEN_(\d+)__/g, (_, index) => {
    const original = stringTokens[index];
    return `<span class="text-[#CE9178]">${original}</span>`;
  });

  return code;
}

function highlightJson(jsonObj: any) {
  if (!jsonObj) return "";
  const raw = JSON.stringify(jsonObj, null, 2);
  let escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  return escaped.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
    let cls = 'text-[#CE9178]';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'text-[#9CDCFE]';
      }
    } else if (/true|false/.test(match)) {
      cls = 'text-[#569CD6]';
    } else if (/null/.test(match)) {
      cls = 'text-[#569CD6]';
    } else {
      cls = 'text-[#B5CEA8]';
    }
    return `<span class="${cls}">${match}</span>`;
  });
}


/* -------------------------------------------------------
   Main Component
------------------------------------------------------- */

export default function WorkspaceExplorer() {
  const [env, setEnv] = useState("DEV");
  const [tree, setTree] = useState<any[]>([]);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [changedFiles, setChangedFiles] = useState<string[]>([]);

  // State Explorer tabs & bindings
  const [activeTab, setActiveTab] = useState<"files" | "state">("files");
  const [stateArtifacts, setStateArtifacts] = useState<any[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<any | null>(null);
  const [hasStateFile, setHasStateFile] = useState<boolean>(false);
  const [stateSearch, setStateSearch] = useState("");

  // User privileges & session states
  const [userRole, setUserRole] = useState<string>("SuperAdmin");
  const [userName, setUserName] = useState<string>("admin");

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

  async function loadTree(environment: string) {
    setEnv(environment);
    const res = await fetch(`/api/workspaces/${environment}/tree`);
    const json = await res.json();
    setTree(json);

    try {
      const stateRes = await fetch(`/api/workspaces/${environment}/state`);
      if (stateRes.ok) {
        const stateJson = await stateRes.json();
        const arts = stateJson.artifacts ?? [];
        setStateArtifacts(arts);
        setHasStateFile(stateJson.exists ?? false);
        if (arts.length > 0) {
          setSelectedArtifact(arts[0]);
        } else {
          setSelectedArtifact(null);
        }
      }
    } catch (err) {
      console.error("Failed to load state file details:", err);
    }
  }

  async function openFile(path: string[]) {
    const full = path.join("/");
    const res = await fetch(`/api/workspaces/${env}/file/${full}`);
    const json = await res.json();
    setSelectedFile(full);
    setFileContent(json.content);
  }

  function toggleFolder(path: string) {
    setOpenFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("envizor_username") || "admin";
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";
      
      setUserRole(latestRole);
      setUserName(user);

      const params = new URLSearchParams(window.location.search);
      const queryEnv = params.get("env");
      const changedParam = params.get("changed");
      
      let parsedFiles: string[] = [];
      if (changedParam) {
        parsedFiles = decodeURIComponent(changedParam).split(",").filter(Boolean);
        setChangedFiles(parsedFiles);
        
        // Auto-expand any folders that contain changed files
        const foldersToOpen: Record<string, boolean> = {};
        parsedFiles.forEach(file => {
          const parts = file.split("/");
          if (parts.length > 1) {
            foldersToOpen[parts[0]] = true;
          }
        });
        setOpenFolders(foldersToOpen);
      }

      if (queryEnv && ["DEV", "PRE", "PROD"].includes(queryEnv.toUpperCase())) {
        const finalEnv = queryEnv.toUpperCase();
        loadTree(finalEnv);
        
        if (changedParam && parsedFiles.length > 0) {
          dispatchPageContext({
            page: "explorer",
            action: "changed_files_loaded",
            payload: { env: finalEnv, count: parsedFiles.length, changedFiles: parsedFiles }
          });
        }
        return;
      }
    }
    loadTree("DEV");
  }, []);

  /* -------------------------------------------------------
     Render Tree Node
  ------------------------------------------------------- */

  function renderNode(node: any, parentPath: string[] = []) {
    const fullPath = [...parentPath, node.name];
    const pathKey = fullPath.join("/");

    /* ---------- Folder ---------- */
    if (node.type === "folder") {
      const isOpen = openFolders[pathKey];
      const isSelectedFolder = selectedFile?.startsWith(pathKey);

      return (
        <div key={pathKey} className="ml-1">
          <div
            className={`
              cursor-pointer flex items-center gap-2 px-1 py-1 rounded-lg transition
              hover:bg-slate-800/40
              ${isSelectedFolder ? "bg-sky-600/10 border border-sky-500/30" : ""}
            `}
            onClick={() => toggleFolder(pathKey)}
          >
            <ChevronRight open={isOpen} />
            <CatppuccinIcon name={node.name} type="folder" isOpen={isOpen} className="w-4.5 h-4.5" />
            <span className="font-medium text-slate-200">{node.name}</span>
          </div>

          {isOpen && (
            <div className="ml-3 border-l border-slate-700 pl-3 mt-1">
              {node.children.map((child: any) =>
                renderNode(child, fullPath)
              )}
            </div>
          )}
        </div>
      );
    }

    /* ---------- File ---------- */
    const ext = node.name.slice(node.name.lastIndexOf("."));
    const color = fileColors[ext] || fileColors.default;
    const isChanged = changedFiles.some(
      (f) =>
        f.toLowerCase() === pathKey.toLowerCase() ||
        f.toLowerCase() === node.name.toLowerCase() ||
        pathKey.toLowerCase().endsWith(f.toLowerCase())
    );

    return (
      <div
        key={pathKey}
        onClick={() => openFile(fullPath)}
        className={`
          ml-4 cursor-pointer flex items-center gap-2 px-2 py-1 rounded-lg transition
          hover:bg-slate-800/40
          ${selectedFile === pathKey 
            ? "bg-sky-600/20 border border-sky-500/40 shadow-sm" 
            : isChanged
              ? "bg-amber-500/10 border border-amber-500/35 shadow-sm shadow-amber-500/10"
              : ""
          }
        `}
      >
        <CatppuccinIcon name={node.name} type="file" className="w-4.5 h-4.5" />

        <span
          className={`
            break-words leading-snug font-medium
            ${selectedFile === pathKey 
              ? "text-sky-300" 
              : isChanged
                ? "text-amber-400 font-extrabold"
                : color
            }
          `}
        >
          {node.name}
        </span>

        {selectedFile === pathKey && (
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
        )}
        {isChanged && selectedFile !== pathKey && (
          <span className="text-[8px] font-extrabold uppercase bg-amber-950 text-amber-400 px-1 py-0.2 rounded border border-amber-800/40 scale-90">SYNCED</span>
        )}
      </div>
    );
  }

  /* -------------------------------------------------------
     Syntax Highlighted Output
  ------------------------------------------------------- */

  const highlighted = highlightTerraform(fileContent);

  const filteredArtifacts = stateArtifacts.filter((art) => {
    const q = stateSearch.toLowerCase();
    return (
      art.type.toLowerCase().includes(q) ||
      art.name.toLowerCase().includes(q) ||
      art.tenantName.toLowerCase().includes(q) ||
      art.id.toLowerCase().includes(q)
    );
  });

  /* -------------------------------------------------------
     UI Layout
  ------------------------------------------------------- */

  return (
    <Day0Shell
      title="Workspace Explorer"
      subtitle="Browse folders, view files, and explore Terraform workspace structure."
      backTo="/wizard/explorer"
    >
      <div className="flex flex-col gap-4">

        {/* Radiant Header */}
        <div className="rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 p-[1px] shadow-lg">
          <div className="rounded-2xl bg-slate-950/95 px-5 py-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
                Radiant Workspace Explorer
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-50">
                Terraform Workspace Structure
              </div>
              <div className="text-xs text-slate-400">
                Navigate folders, inspect files, and explore generated Terraform artefacts.
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => {
                  window.location.href = `/wizard/day0/baseline`;
                }}
                className="
                  px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider
                  bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700
                  hover:scale-[1.03] active:scale-95 transition-all cursor-pointer
                "
              >
                ↩ Back to Baseline Day0
              </button>

              {hasWriteAccess(env) ? (
                <button
                  onClick={() => {
                    window.location.href = `/wizard/push?env=${env}&source=${env}&target=${env}&command=plan&action=push_wizard`;
                  }}
                  className="
                    px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider
                    bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500
                    text-slate-950 hover:scale-[1.03] active:scale-95 transition-all
                    shadow-lg shadow-emerald-500/20 border border-emerald-400 cursor-pointer
                  "
                >
                  🚀 Push Changes to {env} Tenant
                </button>
              ) : (
                <button
                  disabled
                  className="
                    px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider
                    bg-slate-800 text-slate-500 border border-slate-700
                    opacity-50 cursor-not-allowed
                  "
                >
                  🔒 Push Restricted
                </button>
              )}


              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  Live workspace
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-3 py-1">
                  <span className="text-sky-300">☾</span> Radiant Premium
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Success Alert Banner */}
        {changedFiles.length > 0 && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-lg shadow-emerald-500/5 animate-fadeIn flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">✅</span>
              <div>
                <h4 className="text-sm font-bold text-emerald-400">Workspace Aligned & Synchronized Successfully!</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Baselines from your source tenant have been successfully merged into local target <strong className="text-slate-200">{env}</strong> directory.
                  The <strong className="text-amber-400 font-semibold">{changedFiles.length} synchronized HCL configuration file(s)</strong> are highlighted below with a <span className="text-amber-400 font-extrabold uppercase scale-90 border border-amber-800/40 bg-amber-950/40 px-1 rounded text-[8px]">SYNCED</span> badge.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-450 hidden lg:inline animate-pulse font-medium">
                👉 Run dry-run checks next:
              </span>
              <button
                onClick={() => {
                  window.location.href = `/wizard/push?env=${env}&source=${env}&target=${env}&command=plan&action=push_wizard`;
                }}
                className="
                  px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider
                  bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400
                  text-slate-950 hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-emerald-500/20 border border-emerald-350 cursor-pointer
                "
              >
                📝 Run terraform plan
              </button>
            </div>
          </div>
        )}

        {/* Main Layout */}
        {!hasReadAccess(env) ? (
          <div 
            className="flex-1 flex flex-col items-center justify-center text-center py-28 rounded-2xl border p-8 shadow-xl animate-fadeIn transition-colors"
            style={{ 
              backgroundColor: "var(--bg-surface)", 
              borderColor: "rgba(239, 68, 68, 0.2)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
            }}
          >
            <span className="text-6xl text-red-500 animate-pulse">🛡️</span>
            <h3 className="text-base font-extrabold text-red-400 mt-5 uppercase tracking-wider">Environment Access Denied</h3>
            <p className="text-xs mt-2.5 max-w-md text-slate-400 leading-relaxed">
              Your active user account role (<strong className="text-slate-200">{userRole}</strong>) does not have authorization to browse files or states within the <strong className="text-slate-200 uppercase">{env}</strong> staging directory.
            </p>
            <p className="text-[10px] text-slate-500 mt-3">Please switch environments or contact your system administrator to reassign your roles.</p>
          </div>
        ) : (
          <div className="flex flex-1 min-h-[540px] gap-6 max-w-[1600px] mx-auto w-full">

          {/* LEFT PANEL */}
          <div className="w-96 flex flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-lg shadow-sky-500/10">

            {/* Environment Selector */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Environments
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {environments.map((e) => (
                  <button
                    key={e}
                    onClick={() => loadTree(e)}
                    className={`
                      rounded-lg px-3 py-2 text-xs font-semibold transition cursor-pointer
                      ${env === e
                        ? "bg-sky-600/40 text-sky-200 border border-sky-500/25 shadow-sm font-extrabold"
                        : "bg-slate-850 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"}
                    `}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* View Tab Selector */}
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                onClick={() => {
                  setActiveTab("files");
                  setSelectedArtifact(null);
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "files"
                    ? "bg-slate-900 text-slate-100 shadow-sm border border-slate-800"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>📁</span> Files Tree
              </button>
              <button
                onClick={() => {
                  setActiveTab("state");
                  setSelectedFile(null);
                  if (stateArtifacts.length > 0 && !selectedArtifact) {
                    setSelectedArtifact(stateArtifacts[0]);
                  }
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "state"
                    ? "bg-slate-900 text-slate-100 shadow-sm border border-slate-800"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>🛡️</span> State Explorer
              </button>
            </div>

            {/* Folder Tree Tab */}
            {activeTab === "files" && (
              <div className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 p-3 shadow-inner">
                <div className="mb-2 text-xs font-medium text-slate-400 flex justify-between items-center">
                  <span>Workspace tree</span>
                  <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">Folders &amp; Files</span>
                </div>

                <div className="max-h-[380px] overflow-auto text-xs space-y-1">
                  {tree.map((node) => renderNode(node))}
                </div>
              </div>
            )}

            {/* State Explorer Tab */}
            {activeTab === "state" && (
              <div className="flex-1 flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3 shadow-inner overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Tracked Saviynt Artifacts ({filteredArtifacts.length})</span>
                  <span className={`text-[8px] px-2 py-0.5 rounded font-extrabold uppercase ${hasStateFile ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40" : "bg-amber-950/40 text-amber-400 border border-amber-800/40"}`}>
                    {hasStateFile ? "TFSTATE LIVE" : "STATE PROJECTED"}
                  </span>
                </div>

                <input 
                  type="text"
                  placeholder="Filter artifacts..."
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[320px]">
                  {filteredArtifacts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-[11px] font-medium">
                      No tracked artifacts match filter.
                    </div>
                  ) : (
                    filteredArtifacts.map((art) => {
                      const isSelected = selectedArtifact?.id === art.id;
                      return (
                        <div 
                          key={art.id}
                          onClick={() => setSelectedArtifact(art)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-sky-600/20 border-sky-500/40 shadow-sm"
                              : "bg-slate-900/60 border border-slate-850 hover:bg-slate-800/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-mono text-emerald-400 font-bold uppercase">{art.type.replace(/^saviynt_/, "")}</span>
                            <span className={`text-[7.5px] font-extrabold px-1.5 py-0.2 rounded border uppercase scale-90 ${
                              art.status.toUpperCase() === "ACTIVE" || art.status.toUpperCase() === "SUCCESS"
                                ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
                                : "bg-amber-950/40 text-amber-400 border-amber-800/40"
                            }`}>
                              {art.status}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-200 truncate mt-1">{art.tenantName}</div>
                          <div className="text-[9px] text-slate-500 font-mono truncate mt-0.5">TF: {art.name} | ID: {art.id}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 p-3 shadow-lg shadow-sky-500/10">

            {/* File Header */}
            <div className="flex items-center justify-between rounded-xl bg-slate-950/80 px-3 py-2 border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="rounded-full bg-slate-850 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-sky-400 border border-slate-750">
                  {activeTab === "files" ? "📁 File Viewer" : "🛡️ State Inspector"}
                </span>
                {activeTab === "files" && selectedFile && (
                  <span className="truncate">
                    Viewing <span className="font-mono font-bold text-slate-200">{selectedFile}</span>
                  </span>
                )}
                {activeTab === "state" && selectedArtifact && (
                  <span className="truncate">
                    Inspecting <span className="font-mono font-bold text-slate-200">{selectedArtifact.type}.{selectedArtifact.name}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Contents View */}
            <div className="flex-1 rounded-xl bg-slate-950/60 p-4 border border-slate-850 overflow-auto shadow-inner">
              
              {/* FILES VIEW */}
              {activeTab === "files" && (
                <>
                  {!selectedFile ? (
                    <div className="flex flex-col items-center justify-center text-center py-24 text-slate-500">
                      <span className="text-3xl">📂</span>
                      <p className="text-[11px] mt-2 font-semibold">Select a file from the workspace tree on the left to view its declarative HCL content.</p>
                    </div>
                  ) : (
                    <pre className="bg-slate-950/90 border border-slate-850 p-4 rounded-xl overflow-auto max-h-[70vh] text-[11.5px] leading-relaxed text-slate-300 font-mono select-text">
                      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
                    </pre>
                  )}
                </>
              )}

              {/* STATE VIEW */}
              {activeTab === "state" && (
                <>
                  {!selectedArtifact ? (
                    <div className="flex flex-col items-center justify-center text-center py-24 text-slate-500">
                      <span className="text-3xl">🛡️</span>
                      <p className="text-[11px] mt-2 font-semibold">Select a tracked state artifact from the list on the left to inspect its live tenant attributes.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-left animate-fadeIn">
                      
                      {/* State metadata grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Saviynt Type</span>
                          <span className="text-xs font-mono font-bold text-emerald-400 mt-1 block">{selectedArtifact.type}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Tenant Database ID</span>
                          <span className="text-xs font-mono font-bold text-sky-400 mt-1 block truncate" title={selectedArtifact.id}>{selectedArtifact.id}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-slate-500 block">TF Configuration Name</span>
                          <span className="text-xs font-mono font-bold text-amber-400 mt-1 block truncate" title={selectedArtifact.name}>{selectedArtifact.name}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Managed Provider</span>
                          <span className="text-xs font-mono text-slate-400 mt-1 block truncate" title={selectedArtifact.provider}>{selectedArtifact.provider}</span>
                        </div>
                      </div>

                      {/* State Attribute Inspector */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Cached tfstate attributes</span>
                          <span className="text-[8.5px] font-mono text-slate-600 select-none">READ ONLY JSON SCHEMA</span>
                        </div>
                        
                        <pre className="bg-slate-950 border border-slate-850 p-4 rounded-xl overflow-auto max-h-[50vh] text-[11px] leading-normal text-slate-300 font-mono select-text">
                          <code dangerouslySetInnerHTML={{ __html: highlightJson(selectedArtifact.attributes) }} />
                        </pre>
                      </div>

                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </Day0Shell>
  );
}
