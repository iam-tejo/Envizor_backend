// app/wizard/explorer/compare/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type DiffPart = {
  value: string;
  added?: boolean;
  removed?: boolean;
};

type TreeNode = {
  name: string;
  type: "folder" | "file";
  inLeft: boolean;
  inRight: boolean;
  diff?: DiffPart[] | null;
  children?: TreeNode[];
};

type Workspace = "DEV" | "PRE" | "PROD";

const WORKSPACES: Workspace[] = ["DEV", "PRE", "PROD"];

export default function ComparePage() {
  const [leftWs, setLeftWs] = useState<Workspace>("DEV");
  const [rightWs, setRightWs] = useState<Workspace>("PRE");

  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loadingTree, setLoadingTree] = useState(false);

  const [selectedFile, setSelectedFile] = useState<TreeNode | null>(null);

  const [workspaceSettings, setWorkspaceSettings] = useState<{
    locationType: "local" | "remote";
    localPath: string;
    remoteRepoName: string;
    remoteUrl: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/day0/workspace-settings")
      .then((res) => res.json())
      .then((data) => setWorkspaceSettings(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const left = params.get("left") as Workspace;
      const right = params.get("right") as Workspace;
      if (left && WORKSPACES.includes(left)) {
        setLeftWs(left);
      }
      if (right && WORKSPACES.includes(right)) {
        setRightWs(right);
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoadingTree(true);
      setSelectedFile(null);

      try {
        const res = await fetch(
          `/api/workspaces/compare?left=${leftWs}&right=${rightWs}`
        );
        if (!res.ok) {
          throw new Error(`Failed to fetch comparison: ${res.status}`);
        }
        const data = await res.json();
        setTree(data.tree || { name: "", type: "folder", inLeft: false, inRight: false, children: [] });
      } catch (err) {
        console.error("Comparison load error:", err);
        setTree({ name: "", type: "folder", inLeft: false, inRight: false, children: [] });
      } finally {
        setLoadingTree(false);
      }
    };

    load();
  }, [leftWs, rightWs]);

  const loadDiff = (node: TreeNode) => {
    setSelectedFile(node);
  };

  function TreeNodeView({ node }: { node: TreeNode }) {
    const [open, setOpen] = useState(true);

    const hasDiff =
      node.type === "file"
        ? node.diff?.some((p) => p.added || p.removed)
        : node.children?.some(
            (c) =>
              c.diff?.some((p) => p.added || p.removed) ||
              c.inLeft !== c.inRight
          );

    // Dynamic semantic highlights matching the dark-mode layout
    let highlightClass = "";
    let statusLabel = "";

    if (!node.inLeft || !node.inRight) {
      highlightClass = "bg-rose-500/10 border border-rose-500/25 text-rose-300 hover:bg-rose-500/15";
      statusLabel = !node.inLeft ? "Right Only 🔵" : "Left Only 🔴";
    } else if (hasDiff) {
      highlightClass = "bg-amber-500/10 border border-amber-500/25 text-amber-400 shadow-sm shadow-amber-500/5 hover:bg-amber-500/15";
      statusLabel = "Drifted ⚠️";
    } else {
      highlightClass = "bg-slate-950/40 border border-slate-900 text-slate-300 hover:bg-slate-900/50 hover:text-white";
      statusLabel = node.type === "file" ? "Aligned ✅" : "";
    }

    return (
      <div className="ml-4 space-y-1 mt-1">
        <div
          className={`px-3 py-2 cursor-pointer rounded-xl flex items-center justify-between transition-all gap-2 text-[11px] font-medium tracking-wide ${highlightClass}`}
          onClick={() => {
            if (node.type === "folder") setOpen(!open);
            else loadDiff(node);
          }}
        >
          <div className="flex items-center gap-2">
            <span>
              {node.type === "folder" ? (
                <span className="text-indigo-400">{open ? "📂" : "📁"}</span>
              ) : (
                <span className="text-sky-400">📄</span>
              )}
            </span>
            <span className="font-mono">{node.name}</span>
          </div>
          {statusLabel && (
            <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 shrink-0">
              {statusLabel}
            </span>
          )}
        </div>

        {open &&
          node.children?.map((child) => (
            <TreeNodeView key={child.name} node={child} />
          ))}
      </div>
    );
  }

  const isNotConfigured = !loadingTree && tree && (!tree.children || tree.children.length === 0);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/15 via-slate-950 to-slate-950">
      
      {/* HEADER SECTION */}
      <div className="px-6 py-4 border-b border-slate-900 flex flex-wrap items-center justify-between gap-5 bg-slate-950/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-400">
              Semantic Compare Engine
            </div>
            <h1 className="text-lg font-black text-slate-50 flex items-center gap-2">
              <span>🔍</span> Compare Workspaces 
              <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-850 px-2.5 py-0.5 rounded-full font-bold tracking-wide uppercase">
                Drift Inspector
              </span>
            </h1>
          </div>

          {/* Dynamic Storage Strategy Badge */}
          {workspaceSettings && (
            <div 
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-[10px] font-semibold transition-all backdrop-blur-md"
              style={{ 
                backgroundColor: "rgba(15, 23, 42, 0.4)", 
                borderColor: "rgba(51, 65, 85, 0.3)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
              }}
            >
              <span className="text-xs">
                {workspaceSettings.locationType === "local" ? "💻" : "☁️"}
              </span>
              <div className="text-left leading-tight">
                <div className="text-[8px] uppercase tracking-widest font-extrabold text-indigo-400">
                  {workspaceSettings.locationType === "local" ? "Local Directory" : "Cloud Git Ops"}
                </div>
                <div className="font-mono text-[9.5px] truncate max-w-[180px] mt-0.5 text-slate-300" title={workspaceSettings.locationType === "local" ? workspaceSettings.localPath : workspaceSettings.remoteUrl}>
                  {workspaceSettings.locationType === "local" ? workspaceSettings.localPath : workspaceSettings.remoteRepoName || "Git Repository"}
                </div>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>
          )}
        </div>

        {/* Dynamic selector pills */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Left Selector */}
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-850 p-1.5 rounded-xl backdrop-blur-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-2">Left:</span>
            <div className="flex gap-1">
              {WORKSPACES.map((ws) => (
                <button
                  key={ws}
                  onClick={() => setLeftWs(ws)}
                  disabled={rightWs === ws}
                  className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
                    leftWs === ws
                      ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow shadow-sky-500/20 border border-sky-400"
                      : rightWs === ws
                      ? "bg-slate-950/30 text-slate-700 border border-slate-950 cursor-not-allowed"
                      : "bg-slate-950 border border-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {ws}
                </button>
              ))}
            </div>
          </div>

          {/* Swap icon arrow */}
          <div className="text-slate-600 font-bold hidden sm:block">⇄</div>

          {/* Right Selector */}
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-850 p-1.5 rounded-xl backdrop-blur-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-2">Right:</span>
            <div className="flex gap-1">
              {WORKSPACES.map((ws) => (
                <button
                  key={ws}
                  onClick={() => setRightWs(ws)}
                  disabled={leftWs === ws}
                  className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
                    rightWs === ws
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow shadow-indigo-500/20 border border-indigo-400"
                      : leftWs === ws
                      ? "bg-slate-950/30 text-slate-700 border border-slate-950 cursor-not-allowed"
                      : "bg-slate-950 border border-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {ws}
                </button>
              ))}
            </div>
          </div>

          {/* Back to welcome */}
          <Link
            href="/wizard/steps/welcome"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 transition shadow-sm"
          >
            🏠 Exit
          </Link>
        </div>
      </div>

      {/* QUICK RECONCILE SUGGESTION BANNER */}
      {leftWs && rightWs && !isNotConfigured && (
        <div className="mx-6 mt-4">
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4 shadow-lg shadow-indigo-950/5 flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="text-lg">💡</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                To reconcile and migrate configuration drifts between these workspaces, utilize the **Synchronize Workspace DevOps Wizard** to stage and save changes.
              </p>
            </div>
            <button
              onClick={() => {
                window.location.href = `/wizard/steps/source-workspace?source=${leftWs}&target=${rightWs}`;
              }}
              className="
                px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider
                bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-400 hover:to-purple-550
                text-white transition-all shadow-md shadow-indigo-500/20 border border-indigo-400 cursor-pointer whitespace-nowrap
              "
            >
              🔄 Synchronize Workspaces
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER LAYOUT */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {isNotConfigured ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 max-w-4xl mx-auto w-full my-6 space-y-5 animate-fadeIn backdrop-blur-sm">
            <div className="h-16 w-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-3xl border border-amber-500/20 animate-pulse shadow-inner shadow-amber-500/5">
              ⚠️
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-base font-bold text-slate-100">
                Workspaces Not Fully Configured
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The selected workspaces (<strong className="text-slate-200">{leftWs}</strong> and <strong className="text-slate-200">{rightWs}</strong>) do not have directory structures or baseline files configured.
              </p>
              <p className="text-xs text-indigo-400 font-bold leading-relaxed">
                First configure them in the Day 0 Setup center and then try this.
              </p>
            </div>
            <button
              onClick={() => {
                window.location.href = "/wizard/day0-setup";
              }}
              className="
                px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider
                bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-indigo-500/20 border border-indigo-400 cursor-pointer
              "
            >
              🧱 Day 0 Setup Center →
            </button>
          </div>
        ) : (
          <>
            {/* LEFT TREE BLOCK */}
            <div className="w-1/3 flex flex-col rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm overflow-hidden shadow-2xl">
              <div className="px-4 py-3 border-b border-slate-900 bg-slate-950 text-[10px] font-extrabold tracking-widest text-slate-400 flex justify-between items-center">
                <span>DIRECTORY TREE STRUCTURE</span>
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {loadingTree ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3 font-mono text-xs">
                    <span className="animate-spin text-lg">⚙️</span>
                    <span>Scanning directories...</span>
                  </div>
                ) : (
                  tree && <TreeNodeView node={tree} />
                )}
              </div>
            </div>

            {/* RIGHT DIFFERENCE PREVIEW BLOCK */}
            <div className="w-2/3 flex flex-col rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm overflow-hidden shadow-2xl">
              
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-900 bg-slate-950">
                <div className="text-[10px] font-extrabold tracking-widest text-slate-400">
                  CONTENT DRIFT PREVIEW
                </div>

                <Link
                  href="/wizard"
                  className="px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg 
                             bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 text-white shadow-lg transition"
                >
                  Exit Hub
                </Link>
              </div>

              {!selectedFile ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-4">
                  <div className="text-4xl text-slate-600 animate-pulse">📄</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400">No File Selected</h4>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-normal">
                      Select a file highlighted in amber or red in the left directory tree to inspect line-level differences.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* File detail breadcrumb */}
                  <div className="px-5 py-2.5 text-xs border-b border-slate-900 bg-slate-900/30 flex justify-between items-center">
                    <span className="font-mono text-indigo-300 font-bold">{selectedFile.name}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                      Diff inspector active
                    </span>
                  </div>

                  {/* Dual Pane Terminal code split viewer */}
                  <div className="flex-1 flex overflow-hidden font-mono text-[11px] leading-relaxed bg-black/90">
                    
                    {/* Left Pane (Target Workspace / Source reference) */}
                    <div className="w-1/2 border-r border-slate-900 overflow-auto flex flex-col">
                      <div className="px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-950/60 border-b border-slate-900">
                        {leftWs} Workspace
                      </div>
                      <div className="p-3.5 flex-1 space-y-0.5">
                        {selectedFile.diff?.map((part, idx) => {
                          if (part.added) {
                            // Blank placeholders for added lines on right side
                            return (
                              <div key={idx} className="bg-slate-950/10 text-slate-800/25 px-2 py-0.5 font-mono select-none border-l-2 border-transparent italic">
                                /* Aligned blank placeholder */
                              </div>
                            );
                          }

                          const bg = part.removed
                            ? "bg-rose-950/30 border-l-2 border-rose-500 text-rose-300"
                            : "text-slate-400 border-l-2 border-transparent";

                          return (
                            <pre key={idx} className={`${bg} px-2 py-0.5 whitespace-pre-wrap`}>
                              {part.removed ? `- ${part.value}` : part.value}
                            </pre>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Pane (Compare Target reference) */}
                    <div className="w-1/2 overflow-auto flex flex-col">
                      <div className="px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-950/60 border-b border-slate-900">
                        {rightWs} Workspace
                      </div>
                      <div className="p-3.5 flex-1 space-y-0.5">
                        {selectedFile.diff?.map((part, idx) => {
                          if (part.removed) {
                            // Blank placeholders for removed lines on left side
                            return (
                              <div key={idx} className="bg-slate-950/10 text-slate-800/25 px-2 py-0.5 font-mono select-none border-l-2 border-transparent italic">
                                /* Aligned blank placeholder */
                              </div>
                            );
                          }

                          const bg = part.added
                            ? "bg-emerald-950/30 border-l-2 border-emerald-500 text-emerald-400"
                            : "text-slate-400 border-l-2 border-transparent";

                          return (
                            <pre key={idx} className={`${bg} px-2 py-0.5 whitespace-pre-wrap`}>
                              {part.added ? `+ ${part.value}` : part.value}
                            </pre>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          </>
        )}

      </div>
    </div>
  );
}
