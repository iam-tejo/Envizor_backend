// app/wizard/steps/source-workspace/StepSourceWorkspace.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  MouseEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import CatppuccinIcon from "@/app/components/CatppuccinIcon";

type EnvName = "DEV" | "PRE" | "PROD";

interface FilePair {
  source: string;
  target: string;
}

interface LinePair {
  left: string;
  right: string;
  changed: boolean;
}

interface Block {
  start: number;
  end: number;
}

interface TreeNodeData {
  name: string;
  path: string;
  isFile: boolean;
  children: TreeNodeData[];
}

export default function StepSourceWorkspace() {
  const router = useRouter();

  const [sourceEnv, setSourceEnv] = useState<EnvName>("DEV");
  const [targetEnv, setTargetEnv] = useState<EnvName>("PRE");

  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const [filePairs, setFilePairs] = useState<Record<string, FilePair>>({});
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const [lastClickedLine, setLastClickedLine] = useState<number | null>(null);

  const [stagedBlocks, setStagedBlocks] = useState<Block[]>([]);
  const [glowBlocks, setGlowBlocks] = useState<Block[]>([]);

  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const envOptions: EnvName[] = ["DEV", "PRE", "PROD"];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const src = params.get("source") as EnvName;
      const tgt = params.get("target") as EnvName;
      if (src && ["DEV", "PRE", "PROD"].includes(src)) {
        setSourceEnv(src);
      }
      if (tgt && ["DEV", "PRE", "PROD"].includes(tgt)) {
        setTargetEnv(tgt);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSyncTrigger = (e: any) => {
      setShowPublishModal(true);
    };

    window.addEventListener("envizor_diff_sync_trigger", handleSyncTrigger);
    return () => window.removeEventListener("envizor_diff_sync_trigger", handleSyncTrigger);
  }, []);

  useEffect(() => {
    async function loadFiles() {
      try {
        setLoadingFiles(true);
        setError(null);

        const res = await fetch(`/api/env/${targetEnv}`);
        const json = await res.json();
        let list: string[] = json.files ?? [];

        list = list.sort((a, b) => a.localeCompare(b));

        setFiles(list);

        if (!selectedFile && list.length > 0) {
          const firstFile = list.find((f) => !f.endsWith("/"));
          if (firstFile) setSelectedFile(firstFile);
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load environment file list.");
      } finally {
        setLoadingFiles(false);
      }
    }

    loadFiles();
  }, [targetEnv]);

  useEffect(() => {
    async function loadFilePair(file: string) {
      try {
        setLoadingContent(true);
        setError(null);

        const [sourceRes, targetRes] = await Promise.all([
          fetch(`/api/env/${sourceEnv}/file/${file}`),
          fetch(`/api/env/${targetEnv}/file/${file}`),
        ]);

        const sourceJson = await sourceRes.json();
        const targetJson = await targetRes.json();

        setFilePairs((prev) => ({
          ...prev,
          [file]: {
            source: sourceJson.content ?? "",
            target: targetJson.content ?? "",
          },
        }));

        setSelectedLines(new Set());
        setLastClickedLine(null);
        setStagedBlocks([]);
        setGlowBlocks([]);
      } catch (e) {
        console.error(e);
        setError("Failed to load file contents.");
      } finally {
        setLoadingContent(false);
      }
    }

    if (selectedFile) {
      loadFilePair(selectedFile);
    }
  }, [selectedFile, sourceEnv, targetEnv]);

  const currentPair = selectedFile ? filePairs[selectedFile] : undefined;

  const linePairs: LinePair[] = useMemo(() => {
    if (!currentPair) return [];

    const leftLines = currentPair.source.split(/\r?\n/);
    const rightLines = currentPair.target.split(/\r?\n/);
    const maxLen = Math.max(leftLines.length, rightLines.length);

    const result: LinePair[] = [];
    for (let i = 0; i < maxLen; i++) {
      const left = leftLines[i] ?? "";
      const right = rightLines[i] ?? "";
      result.push({
        left,
        right,
        changed: left !== right,
      });
    }
    return result;
  }, [currentPair]);

  const changedFiles = useMemo(() => {
    return Object.entries(filePairs)
      .filter(([_, pair]) => pair.source !== pair.target)
      .map(([file]) => file);
  }, [filePairs]);

  const changedFolders = useMemo(() => {
    const set = new Set<string>();
    changedFiles.forEach((file) => {
      const parts = file.split("/");
      for (let i = 1; i < parts.length; i++) {
        const folder = parts.slice(0, i).join("/") + "/";
        set.add(folder);
      }
    });
    return set;
  }, [changedFiles]);

  const treeData = useMemo(() => buildTree(files), [files]);

  function handleLineClick(idx: number, event: MouseEvent<HTMLDivElement>) {
    const newSet = new Set(selectedLines);

    if (event.shiftKey && lastClickedLine != null) {
      const [start, end] = [lastClickedLine, idx].sort((a, b) => a - b);
      for (let i = start; i <= end; i++) newSet.add(i);
    } else if (event.metaKey || event.ctrlKey) {
      if (newSet.has(idx)) newSet.delete(idx);
      else newSet.add(idx);
      setLastClickedLine(idx);
    } else {
      newSet.clear();
      newSet.add(idx);
      setLastClickedLine(idx);
    }

    setSelectedLines(newSet);
  }

  function stageSelected() {
    if (!currentPair || selectedLines.size === 0) return;

    const sorted = [...selectedLines].sort((a, b) => a - b);
    const blocks: Block[] = [];
    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === prev + 1) {
        prev = sorted[i];
      } else {
        blocks.push({ start, end: prev });
        start = sorted[i];
        prev = sorted[i];
      }
    }
    blocks.push({ start, end: prev });

    setStagedBlocks(blocks);
  }

  async function applyStagedBlocks() {
    if (!currentPair || !selectedFile || stagedBlocks.length === 0) return;

    const sourceLines = currentPair.source.split(/\r?\n/);
    const targetLines = currentPair.target.split(/\r?\n/);
    let newTarget = [...targetLines];

    const sortedBlocks = [...stagedBlocks].sort((a, b) => b.start - a.start);

    sortedBlocks.forEach((block) => {
      const sourceBlock = sourceLines.slice(block.start, block.end + 1);
      const deleteCount = block.end - block.start + 1;

      newTarget.splice(block.start, deleteCount, ...sourceBlock);
    });

    const newContent = newTarget.join("\n");

    setFilePairs((prev) => ({
      ...prev,
      [selectedFile]: {
        source: prev[selectedFile].source,
        target: newContent,
      },
    }));

    setGlowBlocks(stagedBlocks);
    setTimeout(() => setGlowBlocks([]), 450);

    try {
      await fetch(`/api/env/${targetEnv}/file/${selectedFile}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent === "" ? "__EMPTY_FILE__" : newContent,
        }),
      });
    } catch (e) {
      console.error(e);
      setError("Failed to persist updated file to target environment.");
    }
  }

  function toggleFolder(path: string) {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  async function handlePublish() {
    if (stagedBlocks.length === 0) return;
    setPublishing(true);
    await applyStagedBlocks();
    setPublishing(false);
    setShowPublishModal(false);

    const changedParam = encodeURIComponent(selectedFile || "");
    router.push(`/wizard/explorer/discovery?env=${targetEnv}&changed=${changedParam}`);
  }

  return (
    <div 
      className="flex h-screen max-h-screen flex-col gap-6 overflow-hidden font-sans p-6 transition-all duration-300"
      style={{
        background: "var(--bg-base)",
        color: "var(--text-primary)"
      }}
    >
      
      {/* GLOWING HEADER BLOCK */}
      <div className="rounded-2xl p-[1px] shadow-lg transition-colors duration-300" style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-hover))" }}>
        <div className="flex items-center justify-between rounded-2xl px-6 py-4.5 transition-colors duration-300" style={{ background: "var(--bg-panel)" }}>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--accent)" }}>
              Radiant Environment Sync
            </div>
            <h1 className="mt-1 text-lg font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <span>🔄</span> Source Workspace Alignment
              <span className="text-[10px] border px-2.5 py-0.5 rounded-full font-bold tracking-wide uppercase transition-colors duration-300" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                Sync Wizard
              </span>
            </h1>
            <p className="text-xs mt-1 max-w-xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Stage and merge block-level configuration drifts dynamically between source and target environments.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 transition-colors duration-300" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_var(--success)] animate-pulse" />
              Interactive Sync Active
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* LEFT COLUMN: Environment Pills & File Tree */}
        <div 
          className="w-80 flex flex-col gap-4 rounded-2xl border p-4 shadow-2xl overflow-hidden transition-colors duration-300"
          style={{
            backgroundColor: "var(--bg-panel)",
            borderColor: "var(--border)"
          }}
        >
          
          <div className="space-y-3">
            <div className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Selected environments
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              <EnvPill
                label="Source"
                value={sourceEnv}
                options={envOptions}
                onChange={(env) => setSourceEnv(env as EnvName)}
                accent="from-emerald-400/80 to-emerald-500/80"
              />
              <EnvPill
                label="Target"
                value={targetEnv}
                options={envOptions}
                onChange={(env) => setTargetEnv(env as EnvName)}
                accent="from-sky-400/80 to-sky-500/80"
              />
            </div>
          </div>

          <div 
            className="flex-1 rounded-xl border p-3 shadow-inner overflow-hidden flex flex-col transition-colors duration-300"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border)"
            }}
          >
            <div className="mb-2.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              <span>WORKSPACE TREE</span>
              {loadingFiles && (
                <span className="text-[10px] animate-pulse font-bold font-mono" style={{ color: "var(--text-secondary)" }}>LOADING...</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto text-xs pr-1">
              {files.length === 0 && !loadingFiles && (
                <div className="rounded-lg border px-3 py-3 text-[11px] text-center leading-normal transition-colors duration-300" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  No files found for <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{targetEnv}</span>.
                </div>
              )}
              {files.length > 0 && (
                <RadiantTreeView
                  tree={treeData}
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                  openFolders={openFolders}
                  onToggleFolder={toggleFolder}
                  changedFiles={new Set(changedFiles)}
                  changedFolders={changedFolders}
                />
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: IDE-Style Diff Viewer & Controls */}
        <div 
          className="flex flex-1 flex-col gap-4 rounded-2xl border p-4 shadow-2xl overflow-hidden transition-colors duration-300"
          style={{
            backgroundColor: "var(--bg-panel)",
            borderColor: "var(--border)"
          }}
        >
          
          <div 
            className="flex items-center justify-between rounded-xl border px-4 py-3 transition-colors duration-300"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border)"
            }}
          >
            <div className="flex items-center gap-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>
              <span className="rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest transition-colors duration-300" style={{ backgroundColor: "var(--tag-bg)", borderColor: "var(--border)", color: "var(--tag-text)" }}>
                Split‑View Compiler
              </span>
              {selectedFile && (
                <span className="truncate">
                  Comparing <code className="font-mono font-bold text-[10.5px] px-2 py-0.5 rounded border transition-colors duration-300" style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--code-text)" }}>{selectedFile}</code>
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/wizard")}
                className="rounded-lg border px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wider transition shadow cursor-pointer"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)"
                }}
              >
                ← Back to Hub
              </button>

              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                <LegendDot color="bg-slate-650" label="Unchanged" />
                <LegendDot color="bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" label="Changed" />
                <LegendDot color="bg-sky-400 shadow-[0_0_8px_var(--accent-glow)]" label="Staged" />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-400">
              {error}
            </div>
          )}
          
          {loadingContent && (
            <div className="rounded-xl border border-slate-900 bg-slate-950/60 px-4 py-3 text-xs text-slate-500 font-mono animate-pulse">
              ⚙️ Loading configuration file streams...
            </div>
          )}

          {/* DUAL TERMINAL DIFF PANE */}
          <div className="flex min-h-[360px] flex-1 gap-4 overflow-hidden">
            <DiffPane
              title={`${sourceEnv} • Source Reference`}
              accent="from-emerald-500 to-teal-500"
              lines={linePairs.map((l) => ({ text: l.left, changed: l.changed }))}
              side="left"
              selectedLines={selectedLines}
              onLineClick={handleLineClick}
              glowBlocks={[]}
            />
            <DiffPane
              title={`${targetEnv} • Target Sync Reference`}
              accent="from-sky-500 to-indigo-600"
              lines={(() => {
                if (!currentPair) return [];
                const targetLines = currentPair.target.split(/\r?\n/);
                const maxLen = Math.max(targetLines.length, linePairs.length);
                const arr: { text: string; changed: boolean }[] = [];
                for (let i = 0; i < maxLen; i++) {
                  const baseChanged = linePairs[i]?.changed ?? false;
                  arr.push({
                    text: targetLines[i] ?? "",
                    changed: baseChanged,
                  });
                }
                return arr;
              })()}
              side="right"
              selectedLines={new Set()}
              onLineClick={() => {}}
              glowBlocks={glowBlocks}
            />
          </div>
             {/* CONTROL SWITCH PANEL */}
          <div 
            className="flex items-center justify-between rounded-xl border px-4 py-3.5 text-xs shadow-inner transition-colors duration-300"
            style={{
              backgroundColor: "var(--bg-base)",
              borderColor: "var(--border)",
              color: "var(--text-secondary)"
            }}
          >
            <div className="flex items-center gap-3">
              <span>
                {selectedLines.size > 0
                  ? `👉 Selected ${selectedLines.size} line${selectedLines.size > 1 ? "s" : ""} for staging`
                  : "💡 Click, shift‑click, or cmd‑click lines on the left to select them."}
              </span>
              {stagedBlocks.length > 0 && (
                <span 
                  className="rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest animate-pulse transition-colors duration-300"
                  style={{
                    backgroundColor: "rgba(14, 165, 233, 0.1)",
                    borderColor: "var(--accent)",
                    color: "var(--accent)"
                  }}
                >
                  {stagedBlocks.length} block{stagedBlocks.length > 1 ? "s" : ""} staged
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={stageSelected}
                disabled={selectedLines.size === 0}
                className="rounded-lg px-4 py-2 text-[10.5px] font-black uppercase tracking-wider transition duration-150 cursor-pointer border"
                style={
                  selectedLines.size === 0
                    ? {
                        backgroundColor: "var(--bg-panel)",
                        color: "var(--text-muted)",
                        borderColor: "var(--border)",
                        cursor: "not-allowed"
                      }
                    : {
                        backgroundColor: "var(--warning)",
                        color: "#000000",
                        borderColor: "var(--warning)",
                        boxShadow: "0 2px 8px rgba(245,158,11,0.2)"
                      }
                }
              >
                Stage selected
              </button>
              <button
                onClick={applyStagedBlocks}
                disabled={stagedBlocks.length === 0}
                className="rounded-lg px-4 py-2 text-[10.5px] font-black uppercase tracking-wider transition duration-150 cursor-pointer border"
                style={
                  stagedBlocks.length === 0
                    ? {
                        backgroundColor: "var(--bg-panel)",
                        color: "var(--text-muted)",
                        borderColor: "var(--border)",
                        cursor: "not-allowed"
                      }
                    : {
                        backgroundColor: "var(--accent)",
                        color: "#ffffff",
                        borderColor: "var(--accent-hover)",
                        boxShadow: "0 2px 8px var(--accent-glow)"
                      }
                }
              >
                Apply staged → Target
              </button>
            </div>
          </div>

          {/* LARGE INTERACTIVE PUBLISH CHANGES ACTION */}
          <div className="flex justify-center pt-1.5">
            <button
              onClick={() => setShowPublishModal(true)}
              disabled={stagedBlocks.length === 0}
              className="rounded-xl px-8 py-3.5 text-xs font-black uppercase tracking-wider transition duration-200 cursor-pointer flex items-center gap-2 shadow-lg border"
              style={
                stagedBlocks.length === 0
                  ? {
                      backgroundColor: "var(--bg-panel)",
                      color: "var(--text-muted)",
                      borderColor: "var(--border)",
                      cursor: "not-allowed"
                    }
                  : {
                      background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
                      color: "#ffffff",
                      borderColor: "var(--accent-hover)",
                      boxShadow: "0 4px 12px var(--accent-glow)"
                    }
              }
            >
              <span>🚀</span> <span>Publish changes to {targetEnv}</span>
            </button>
          </div>

          {/* LOWER CODE CARD STAGED CHANGES PREVIEW */}
          <div 
            className="rounded-xl border p-4 shadow-inner transition-colors duration-300"
            style={{
              backgroundColor: "var(--bg-panel)",
              borderColor: "var(--border)"
            }}
          >
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "var(--accent)" }}>STAGED DIFF COMPILER PREVIEW</span>
              <span className="text-[9px] font-extrabold uppercase" style={{ color: "var(--text-muted)" }}>
                Migrating configurations to {targetEnv}
              </span>
            </div>
            {(!currentPair || stagedBlocks.length === 0) && (
              <div 
                className="rounded-lg border px-3 py-3 text-[11px] text-center transition-colors duration-300"
                style={{
                  backgroundColor: "var(--bg-base)",
                  borderColor: "var(--border)",
                  color: "var(--text-muted)"
                }}
              >
                No active staged changes. Click lines in the Left Pane and hit "Stage Selected" to compile diff streams.
              </div>
            )}
            {currentPair && stagedBlocks.length > 0 && (
              <StagedPreview
                blocks={stagedBlocks}
                source={currentPair.source}
                target={currentPair.target}
              />
            )}
          </div>

        </div>
      </div>

      {/* STYLISH CONFIRMATION OVERLAY MODAL */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-[360px] rounded-2xl border p-6 shadow-2xl space-y-4 transition-colors duration-300"
            style={{
              backgroundColor: "var(--bg-panel)",
              borderColor: "var(--border)"
            }}
          >
            <div className="text-sm font-extrabold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <span style={{ color: "var(--accent)" }}>⚡</span> Publish changes to {targetEnv}?
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              These staged block changes will be permanently written to the target **{targetEnv}** workspace configuration files on disk.
            </p>
            <p 
              className="text-[10px] font-bold border p-2.5 rounded-lg leading-relaxed transition-colors duration-300"
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.05)",
                borderColor: "rgba(245, 158, 11, 0.2)",
                color: "var(--warning)"
              }}
            >
              ⚠️ Warning: Local workspace alignment directly alters HCL modules. This action is irreversible.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setShowPublishModal(false)}
                className="rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                style={{
                  backgroundColor: "var(--bg-base)",
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)"
                }}
              >
                Cancel
              </button>

              <button
                onClick={handlePublish}
                disabled={publishing}
                className="rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg border transition cursor-pointer"
                style={
                  publishing
                    ? {
                        backgroundColor: "var(--bg-base)",
                        borderColor: "var(--border)",
                        color: "var(--text-muted)",
                        cursor: "wait"
                      }
                    : {
                        background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
                        borderColor: "var(--accent-hover)",
                        boxShadow: "0 2px 8px var(--accent-glow)"
                      }
                }
              >
                {publishing ? "Publishing…" : "Publish Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function buildTree(paths: string[]): TreeNodeData[] {
  const root: Record<string, any> = {};

  paths.forEach((p) => {
    const isFolder = p.endsWith("/");
    const parts = p.split("/").filter(Boolean);
    let node = root;
    let accPath = "";

    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      const key = isLast && !isFolder ? part : part + "/";

      accPath = accPath ? `${accPath}${key}` : key;

      if (!node[key]) {
        node[key] = {
          __name: key,
          __path: accPath,
          __isFile: isLast && !isFolder,
          __children: {},
        };
      }

      node = node[key].__children;
    });
  });

  function toArray(obj: Record<string, any>): TreeNodeData[] {
    return Object.values(obj)
      .map((n: any) => ({
        name: n.__name,
        path: n.__path,
        isFile: n.__isFile,
        children: toArray(n.__children),
      }))
      .sort((a: TreeNodeData, b: TreeNodeData) => {
        if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
        return a.isFile ? 1 : -1;
      });
  }

  return toArray(root);
}

function RadiantTreeView({
  tree,
  selectedFile,
  onSelectFile,
  openFolders,
  onToggleFolder,
  changedFiles,
  changedFolders,
}: {
  tree: TreeNodeData[];
  selectedFile: string | null;
  onSelectFile: (path: string | null) => void;
  openFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  changedFiles: Set<string>;
  changedFolders: Set<string>;
}) {
  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <RadiantTreeNode
          key={node.path}
          node={node}
          depth={0}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          openFolders={openFolders}
          onToggleFolder={onToggleFolder}
          changedFiles={changedFiles}
          changedFolders={changedFolders}
        />
      ))}
    </div>
  );
}

function RadiantTreeNode({
  node,
  depth,
  selectedFile,
  onSelectFile,
  openFolders,
  onToggleFolder,
  changedFiles,
  changedFolders,
}: {
  node: TreeNodeData;
  depth: number;
  selectedFile: string | null;
  onSelectFile: (path: string | null) => void;
  openFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  changedFiles: Set<string>;
  changedFolders: Set<string>;
}) {
  const isOpen = !node.isFile && openFolders.has(node.path);
  const isSelected = node.isFile && selectedFile === node.path;
  const isChangedFile = node.isFile && changedFiles.has(node.path);
  const isChangedFolder = !node.isFile && changedFolders.has(node.path);

  const paddingLeft = 6 + depth * 12;

  const baseClasses =
    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] cursor-pointer transition";

  let highlightClass = "";
  if (isSelected) {
    highlightClass = "bg-gradient-to-r from-sky-500/10 to-indigo-650/15 border border-sky-500/30 text-white font-bold shadow-sm shadow-sky-500/5";
  } else if (isChangedFile || isChangedFolder) {
    highlightClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/15";
  } else {
    highlightClass = "text-slate-400 hover:bg-slate-900 hover:text-white";
  }

  return (
    <div>
      <div
        className={`${baseClasses} ${highlightClass}`}
        style={{ paddingLeft }}
        onClick={() => {
          if (node.isFile) {
            onSelectFile(node.path);
          } else {
            onToggleFolder(node.path);
          }
        }}
      >
        <CatppuccinIcon
          name={node.name}
          type={node.isFile ? "file" : "folder"}
          isOpen={isOpen}
          className="w-4 h-4 shrink-0"
        />
        <span className="truncate font-mono">
          {node.name.endsWith("/") ? node.name.slice(0, -1) : node.name}
        </span>
      </div>
      {!node.isFile && isOpen && node.children.length > 0 && (
        <div className="mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <RadiantTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              openFolders={openFolders}
              onToggleFolder={onToggleFolder}
              changedFiles={changedFiles}
              changedFolders={changedFolders}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EnvPill({
  label,
  value,
  options,
  onChange,
  accent,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  accent: string;
}) {
  return (
    <div className="rounded-xl border p-3 shadow-inner transition-colors duration-300" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
      <div className="mb-2 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        <span>{label} Workspace</span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2 py-[2px] text-[9px] font-black uppercase transition-colors duration-300"
          style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent)" }} />
          active
        </span>
      </div>
      <div className="flex gap-1.5 p-1 rounded-lg border transition-colors duration-300" style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)" }}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className="flex-1 rounded py-1.5 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
              style={
                active
                  ? {
                      backgroundColor: "var(--accent)",
                      borderColor: "var(--accent-hover)",
                      color: "#ffffff",
                      boxShadow: "0 2px 6px var(--accent-glow)",
                    }
                  : {
                      color: "var(--text-muted)",
                    }
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="normal-case">{label}</span>
    </span>
  );
}

function DiffPane({
  title,
  accent,
  lines,
  side,
  selectedLines,
  onLineClick,
  glowBlocks,
}: {
  title: string;
  accent: string;
  lines: { text: string; changed: boolean }[];
  side: "left" | "right";
  selectedLines: Set<number>;
  onLineClick: (idx: number, e: MouseEvent<HTMLDivElement>) => void;
  glowBlocks: Block[];
}) {
  return (
    <div className="flex w-1/2 flex-col rounded-2xl border overflow-hidden shadow-2xl transition-colors duration-300" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between border-b px-4 py-2.5 text-xs font-bold transition-colors duration-300" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-panel)" }}>
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-10 rounded-full bg-gradient-to-r ${accent}`} />
          <span className="font-semibold font-mono" style={{ color: "var(--text-secondary)" }}>{title}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider border px-2 py-0.5 rounded-full transition-colors duration-300" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_var(--success)] animate-pulse" />
          <span>live sync</span>
        </div>
      </div>
      <div className="relative flex-1 overflow-auto rounded-b-2xl shadow-inner transition-colors duration-300" style={{ backgroundColor: "var(--code-bg)" }}>
        <pre className="min-h-full px-4 py-4 text-[11px] leading-relaxed" style={{ color: "var(--code-text)" }}>
          {lines.length === 0 && (
            <span className="italic font-mono pl-2" style={{ color: "var(--text-muted)" }}>No content loaded yet.</span>
          )}
          {lines.map((line, idx) => {
            const isSelected = side === "left" && selectedLines.has(idx);
            const inGlow =
              glowBlocks &&
              glowBlocks.some((b) => idx >= b.start && idx <= b.end);

            return (
              <div
                key={idx}
                onClick={(e) =>
                  side === "left" ? onLineClick(idx, e) : undefined
                }
                className={[
                  "flex gap-3 rounded-md px-2 py-0.5 transition font-mono border-l-2",
                  line.changed
                    ? "shadow-sm"
                    : "bg-transparent border-transparent",
                  isSelected
                    ? "shadow-sm"
                    : "",
                  inGlow
                    ? "shadow-[0_0_12px_var(--accent-glow)] text-sky-100"
                    : "",
                  side === "left" ? "cursor-pointer" : "",
                ].join(" ")}
                style={
                  isSelected
                    ? { backgroundColor: "var(--bg-elevated)", borderColor: "var(--accent)", color: "var(--text-primary)" }
                    : inGlow
                    ? { backgroundColor: "var(--bg-elevated)", borderColor: "var(--accent)", color: "var(--text-primary)" }
                    : line.changed
                    ? { backgroundColor: "rgba(245, 158, 11, 0.12)", borderColor: "rgba(245, 158, 11, 0.4)", color: "var(--warning)" }
                    : { color: "var(--text-muted)" }
                }
              >
                <span className="w-10 select-none text-right text-[10px] font-mono pr-1" style={{ color: "var(--text-muted)" }}>
                  {idx + 1}
                </span>
                <span className="flex-1 whitespace-pre-wrap font-mono">
                  {line.text === "" ? " " : line.text}
                </span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

function StagedPreview({
  blocks,
  source,
  target,
}: {
  blocks: Block[];
  source: string;
  target: string;
}) {
  const sourceLines = source.split(/\r?\n/);
  const targetLines = target.split(/\r?\n/);

  return (
    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
      {blocks.map((b, i) => (
        <div
          key={i}
          className="rounded-lg border px-3 py-2.5 shadow-sm space-y-1.5 transition-colors duration-300"
          style={{
            backgroundColor: "var(--code-bg)",
            borderColor: "var(--border)"
          }}
        >
          <div className="text-[10px] font-extrabold uppercase tracking-wider font-mono" style={{ color: "var(--accent)" }}>
            Staging Stream Block: Lines {b.start + 1}–{b.end + 1}
          </div>
          {Array.from({ length: b.end - b.start + 1 }).map((_, j) => {
            const idx = b.start + j;
            return (
              <div 
                key={idx} 
                className="flex gap-3 text-[10.5px] font-mono leading-relaxed border-b last:border-none pb-0.5 transition-colors duration-300"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="w-8 text-right select-none" style={{ color: "var(--text-muted)" }}>
                  {idx + 1}
                </span>
                <span 
                  className="flex-1 whitespace-pre-wrap font-mono px-2.5 py-0.5 rounded border transition-colors duration-300"
                  style={{
                    color: "var(--success)",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    borderColor: "rgba(16, 185, 129, 0.2)"
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }} className="font-sans pr-1">-</span> {sourceLines[idx] ?? ""}
                </span>
                <span className="self-center" style={{ color: "var(--text-muted)" }}>→</span>
                <span 
                  className="flex-1 whitespace-pre-wrap font-mono px-2.5 py-0.5 rounded border transition-colors duration-300"
                  style={{
                    color: "var(--accent)",
                    backgroundColor: "rgba(14, 165, 233, 0.1)",
                    borderColor: "rgba(14, 165, 233, 0.2)"
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }} className="font-sans pr-1">+</span> {targetLines[idx] ?? ""}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
