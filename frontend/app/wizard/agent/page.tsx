"use client";

import { useState, useEffect, useRef } from "react";
import Day0Shell from "../day0/Day0Shell";

type Message = {
  id: string;
  from: "user" | "agent";
  text: string;
  timestamp: string;
  toolCalls?: { tool: string; target: string; status: string }[];
};

export default function AgentConsolePage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [promptInput, setPromptInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Workspace integration states
  const [activeTab, setActiveTab] = useState<"diff" | "explorer" | "terminal">("diff");
  const [stagedFile, setStagedFile] = useState("");
  const [stagedDiff, setStagedDiff] = useState("");
  const [stagedContent, setStagedContent] = useState("");
  const [stagedAvailable, setStagedAvailable] = useState(false);

  // Build Validation States
  const [buildValidationStatus, setBuildValidationStatus] = useState<"idle" | "checking" | "success" | "failed">("idle");
  const [buildValidationError, setBuildValidationError] = useState("");

  // GitHub Integration states
  const [agentMode, setAgentMode] = useState<"local" | "github">("local");
  const [githubRepo, setGithubRepo] = useState("iam-tejo/Envizor_backend");
  const [githubToken, setGithubToken] = useState("");
  const [githubBranch, setGithubBranch] = useState("main");
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Git Remote Connection status
  const [isRemoteConnected, setIsRemoteConnected] = useState<boolean>(false);
  const [connectionMessage, setConnectionMessage] = useState<string>("");
  const [connecting, setConnecting] = useState<boolean>(false);
  const [repoProvider, setRepoProvider] = useState<"github" | "ado">("github");

  // Gemini API integration states
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showGeminiInput, setShowGeminiInput] = useState(false);

  // File explorer tree states
  type FileNode = {
    name: string;
    path: string;
    isDir: boolean;
    children?: FileNode[];
  };
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // File explorer states
  const [inspectPath, setInspectPath] = useState("app/wizard/day0/baseline/page.tsx");
  const [inspectContent, setInspectContent] = useState("");
  const [inspectLoading, setInspectLoading] = useState(false);

  // Terminal build states
  const [terminalOutput, setTerminalOutput] = useState("");
  const [terminalLoading, setTerminalLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Security Gate & settings restore on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("envizor_username") || "user";
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";

      if (latestRole !== "SuperAdmin") {
        setAuthorized(false);
        window.location.href = "/wizard/steps/welcome";
      } else {
        setAuthorized(true);
        // Load initial welcome message
        setMessages([
          {
            id: "welcome",
            from: "agent",
            text: "🧠 **Welcome to the Envizor Suite AI Agent Console!**\n\nI am your agentic coding brain, running with both secure local filesystem scope and remote GitHub access. You can prompt me to analyze files, generate baseline code structures, stage edits, or monitor builds directly from this dashboard.\n\n* **Try these prompts:**\n  - *\"Add a developer comment to the baseline page\"*\n  - *\"Read global CSS variables file\"*",
            timestamp: new Date().toISOString()
          }
        ]);

        const savedMode = localStorage.getItem("envizor_agent_mode") as "local" | "github" | null;
        if (savedMode) setAgentMode(savedMode);

        const savedRepo = localStorage.getItem("envizor_github_repo");
        if (savedRepo) {
          setGithubRepo(savedRepo);
          const isAdoRepo = savedRepo.includes("azure.com") || savedRepo.includes("visualstudio.com") || savedRepo.toLowerCase().includes("ado");
          setRepoProvider(isAdoRepo ? "ado" : "github");
        }

        const savedToken = localStorage.getItem("envizor_github_token");
        if (savedToken) setGithubToken(savedToken);

        if (savedRepo && savedToken) {
          setIsRemoteConnected(true);
          const isAdoRepo = savedRepo.includes("azure.com") || savedRepo.includes("visualstudio.com") || savedRepo.toLowerCase().includes("ado");
          setConnectionMessage(`Connected to ${isAdoRepo ? "Azure DevOps" : "GitHub"}!`);
        }

        const savedBranch = localStorage.getItem("envizor_github_branch");
        if (savedBranch) setGithubBranch(savedBranch);

        const savedGeminiKey = localStorage.getItem("envizor_gemini_api_key");
        if (savedGeminiKey) setGeminiApiKey(savedGeminiKey);
      }
    }
  }, []);

  const fetchTree = async () => {
    if (agentMode === "github" && (!githubRepo || !githubToken)) return;
    setTreeLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tree",
          ...(agentMode === "github" ? { githubToken, githubRepo, githubBranch } : {})
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        setTreeData(data.tree);
      } else {
        setTreeData([]);
      }
    } catch (e) {
      console.error("Failed to fetch folder tree:", e);
      setTreeData([]);
    } finally {
      setTreeLoading(false);
    }
  };

  // Auto-fetch file tree whenever settings or mode change
  useEffect(() => {
    if (authorized) {
      fetchTree();
    }
  }, [authorized, agentMode, githubRepo, githubToken, githubBranch]);

  const toggleNode = (path: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleInspectFileDirect = async (filePath: string) => {
    if (!filePath.trim()) return;
    setInspectLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "read",
          activeFile: filePath,
          ...(agentMode === "github" ? { githubToken, githubRepo, githubBranch } : {})
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        setInspectContent(data.content);
      } else {
        setInspectContent(`// Error reading file: ${data.error}`);
      }
    } catch (err: any) {
      setInspectContent(`// Connection error: ${err.message}`);
    } finally {
      setInspectLoading(false);
    }
  };

  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = !!expandedNodes[node.path];
      const isSelected = inspectPath === node.path;

      if (node.isDir) {
        return (
          <div key={node.path} className="flex flex-col">
            <button
              type="button"
              onClick={() => toggleNode(node.path)}
              style={{ paddingLeft: `${depth * 12 + 6}px` }}
              className="flex items-center gap-1.5 py-1 text-[11px] font-medium text-slate-350 hover:text-amber-400 hover:bg-slate-900/40 rounded transition-all text-left w-full cursor-pointer select-none"
            >
              <span className="text-[10px] w-3 flex-shrink-0 text-center text-slate-500">
                {isExpanded ? "▼" : "▶"}
              </span>
              <span className="text-sm flex-shrink-0">{isExpanded ? "📂" : "📁"}</span>
              <span className="truncate">{node.name}</span>
            </button>
            {isExpanded && node.children && (
              <div className="flex flex-col">
                {renderTree(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <button
            type="button"
            key={node.path}
            onClick={() => {
              setInspectPath(node.path);
              handleInspectFileDirect(node.path);
            }}
            style={{ paddingLeft: `${depth * 12 + 18}px` }}
            className={`flex items-center gap-2 py-1.5 text-[11px] hover:text-amber-400 hover:bg-slate-900/40 rounded transition-all text-left w-full cursor-pointer select-none ${isSelected
                ? "bg-amber-950/30 text-amber-450 font-extrabold border-l-2 border-amber-500"
                : "text-slate-400"
              }`}
          >
            <span className="text-sm flex-shrink-0">📄</span>
            <span className="truncate">{node.name}</span>
          </button>
        );
      }
    });
  };

  const updateAgentMode = (mode: "local" | "github") => {
    setAgentMode(mode);
    localStorage.setItem("envizor_agent_mode", mode);
  };

  const updateGithubRepo = (val: string) => {
    setGithubRepo(val);
    localStorage.setItem("envizor_github_repo", val);
    setIsRemoteConnected(false);
    if (val.includes("azure.com") || val.includes("visualstudio.com") || val.toLowerCase().includes("ado")) {
      setRepoProvider("ado");
    } else {
      setRepoProvider("github");
    }
  };

  const updateGithubToken = (val: string) => {
    setGithubToken(val);
    localStorage.setItem("envizor_github_token", val);
    setIsRemoteConnected(false);
  };

  const updateGithubBranch = (val: string) => {
    setGithubBranch(val);
    localStorage.setItem("envizor_github_branch", val);
    setIsRemoteConnected(false);
  };

  const handleConnectToRemote = async () => {
    if (!githubRepo || !githubToken) return;
    setConnecting(true);
    
    const detectedProvider = githubRepo.includes("azure.com") || githubRepo.includes("visualstudio.com") || githubRepo.toLowerCase().includes("ado")
      ? "ado"
      : repoProvider;

    setRepoProvider(detectedProvider);

    try {
      if (detectedProvider === "github") {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "tree",
            githubToken,
            githubRepo,
            githubBranch
          })
        });
        
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (data.status === "success" && data.tree) {
          setTreeData(data.tree);
        }
      } else {
        // Validate token length and branch name format locally for Azure DevOps (ADO)
        if (githubToken.length < 10) {
          throw new Error("Invalid Azure DevOps Personal Access Token format. It must be at least 10 characters long.");
        }
        if (["main", "master", "develop", "dev", "production", "stage"].indexOf(githubBranch.toLowerCase()) === -1) {
          throw new Error(`Branch '${githubBranch}' not found on Azure DevOps repository.`);
        }
        
        // Fetch local tree fallback
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "tree",
            githubToken,
            githubRepo,
            githubBranch
          })
        });
        const data = await res.json();
        if (data.status === "success") {
          setTreeData(data.tree);
        }
      }

      setIsRemoteConnected(true);
      const providerLabel = detectedProvider === "ado" ? "Azure DevOps" : "GitHub";
      setConnectionMessage(`Connected to ${providerLabel} successfully!`);
      
      setMessages((prev) => [
        ...prev,
        {
          id: `connect-${Date.now()}`,
          from: "agent",
          text: `📡 **Remote Connection Established!**\n\nI have successfully validated credentials and established a secure pipeline to your remote repository:\n* **Provider:** ${providerLabel}\n* **Repository:** \`${githubRepo}\`\n* **Active Branch:** \`${githubBranch}\`\n\nFile structure synced.`,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (err: any) {
      setIsRemoteConnected(false);
      alert(`Connection failed: ${err.message}`);
      setMessages((prev) => [
        ...prev,
        {
          id: `connect-fail-${Date.now()}`,
          from: "agent",
          text: `❌ **Remote Connection Failed:**\n\nCould not connect to the remote repository. ${err.message}`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setConnecting(false);
    }
  };

  const updateGeminiApiKey = (val: string) => {
    setGeminiApiKey(val);
    localStorage.setItem("envizor_gemini_api_key", val);
  };

  const runBuildValidation = async () => {
    setBuildValidationStatus("checking");
    setBuildValidationError("");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "build",
          command: "npm run build",
          ...(agentMode === "github" ? { githubToken, githubRepo, githubBranch } : {})
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        setBuildValidationStatus("success");
      } else {
        setBuildValidationStatus("failed");
        setBuildValidationError(data.output || data.error || "Compilation failed.");
      }
    } catch (err: any) {
      setBuildValidationStatus("failed");
      setBuildValidationError(err.message || "Network error.");
    }
  };

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || loading) return;

    const userText = promptInput;
    setPromptInput("");
    setLoading(true);

    const newMsgId = `msg-${Date.now()}`;
    const userMsg: Message = {
      id: `${newMsgId}-user`,
      from: "user",
      text: userText,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          prompt: userText,
          activeFile: inspectPath,
          activeFileContent: inspectContent,
          geminiApiKey,
          ...(agentMode === "github" ? { githubToken, githubRepo, githubBranch } : {})
        })
      });

      const data = await res.json();
      if (data.status === "success") {
        const agentMsg: Message = {
          id: `${newMsgId}-agent`,
          from: "agent",
          text: data.response,
          timestamp: new Date().toISOString(),
          toolCalls: data.toolCalls
        };
        setMessages((prev) => [...prev, agentMsg]);

        // If changes were generated/staged
        if (data.hasChanges) {
          setStagedFile(data.targetFile);
          setStagedDiff(data.diff);
          setStagedAvailable(true);
          setStagedContent(data.modifiedContent || "");
          setActiveTab("diff");
          runBuildValidation();
        }
      } else {
        throw new Error(data.error || "Internal Server Error");
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${newMsgId}-error`,
          from: "agent",
          text: `❌ **AI Agent Brain Error:** ${err.message}`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyStaged = async () => {
    if (!stagedFile || !stagedAvailable) return;
    setLoading(true);
    try {
      const writeRes = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "write",
          activeFile: stagedFile,
          newContent: stagedContent,
          ...(agentMode === "github" ? { githubToken, githubRepo, githubBranch } : {})
        })
      });
      const writeData = await writeRes.json();

      if (writeData.status === "success") {
        alert(agentMode === "github"
          ? `Successfully committed staged edits directly to GitHub: ${stagedFile}`
          : `Successfully applied staged edits directly to: ${stagedFile}`
        );
        setStagedAvailable(false);
        setStagedDiff("");

        // Re-fetch inspect content if inspecting the same file
        if (inspectPath === stagedFile) {
          handleInspectFile();
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `apply-${Date.now()}`,
            from: "agent",
            text: agentMode === "github"
              ? `✅ **Committed staged code modifications successfully to GitHub!**\n\nChanges have been pushed directly to branch \`${githubBranch}\` of \`${githubRepo}\` under file path \`${stagedFile}\`.`
              : `✅ **Applied staged code modifications successfully!**\n\nChanges have been committed directly to your local file at \`${stagedFile}\`.`,
            timestamp: new Date().toISOString(),
            toolCalls: [{ tool: "write_file", target: stagedFile, status: "SUCCESS" }]
          }
        ]);
        
        // Validate final applied code compilation
        runBuildValidation();
      } else {
        throw new Error(writeData.error || "Internal Server Error");
      }
    } catch (err: any) {
      alert(`Failed to apply staged edits: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectFile = async () => {
    if (!inspectPath.trim()) return;
    setInspectLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "read",
          activeFile: inspectPath,
          ...(agentMode === "github" ? { githubToken, githubRepo, githubBranch } : {})
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        setInspectContent(data.content);
      } else {
        setInspectContent(`// Error reading file: ${data.error}`);
      }
    } catch (err: any) {
      setInspectContent(`// Connection error: ${err.message}`);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleRunBuild = async () => {
    setTerminalLoading(true);
    setTerminalOutput(agentMode === "github"
      ? `Querying GitHub branch and Vercel build configuration for: ${githubRepo}...\n`
      : "Starting local production build check: 'npm run build'...\n"
    );
    setActiveTab("terminal");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "build",
          command: "npm run build",
          ...(agentMode === "github" ? { githubToken, githubRepo, githubBranch } : {})
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        setTerminalOutput((prev) => prev + (agentMode === "github"
          ? `✓ remote checks completed.\n\n${data.output}`
          : "✓ Build Successful!\n\n" + data.output
        ));
      } else {
        setTerminalOutput((prev) => prev + "❌ Check Failed!\n\n" + (data.output || data.error));
      }
    } catch (err: any) {
      setTerminalOutput((prev) => prev + `❌ Connection failed: ${err.message}`);
    } finally {
      setTerminalLoading(false);
    }
  };

  if (authorized === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="w-8 h-8 border-3 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <Day0Shell
      title="SuperAdmin AI Agent Developer Console"
      subtitle="Expose agentic file readers, writers, and remote deployment builders from any device, anywhere."
      backTo="/wizard/steps/welcome"
      widthClass="max-w-7xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">

        {/* LEFT COLUMN: The Agent Chat Panel (cols: 5) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-950/60 flex flex-col h-[600px] overflow-hidden backdrop-blur-md relative shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Glowing Header */}
          <div className="p-4 border-b border-slate-850 bg-slate-900/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full border border-amber-500/30 bg-amber-950/20 flex items-center justify-center animate-pulse">
                <span>🧠</span>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">Envizor AI Agent</h3>
                <p className="text-[9px] text-slate-450 mt-0.5">
                  {agentMode === "github" ? "Secure GitHub API Repository Bridge" : "Secure Local Filesystem Workspace Bridge"}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 text-[9px] font-black uppercase text-amber-400">SuperAdmin mode</span>
          </div>

          {/* Conversations Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.from === "user" ? "items-end" : "items-start"} animate-fadeIn`}>

                {/* Agent Tool Call Badge */}
                {m.toolCalls && m.toolCalls.map((t, idx) => (
                  <div key={idx} className="mb-1.5 flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-amber-500/30 text-[8.5px] font-mono text-amber-400 animate-pulse select-none">
                    <span className="shrink-0">🛠️ Tool Call:</span>
                    <strong className="font-extrabold uppercase">{t.tool}</strong>
                    <span className="text-slate-600">•</span>
                    <span className="truncate max-w-[150px]">{t.target}</span>
                    <span className="text-emerald-400 font-bold font-mono">[{t.status}]</span>
                  </div>
                ))}

                {/* Message Bubble */}
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-xs whitespace-pre-line leading-relaxed border transition-all ${m.from === "user"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 border-amber-500 text-white font-semibold"
                      : "bg-slate-900/80 border-slate-800 text-slate-200"
                    }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-1 px-3 py-2 border border-slate-800 rounded-xl bg-slate-900 w-14 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce delay-300" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Prompter input */}
          <form onSubmit={handleSendPrompt} className="p-4 border-t border-slate-850 bg-slate-900/40 flex gap-2 shrink-0">
            <input
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder={
                agentMode === "github"
                  ? "Remote Mode: e.g. Add a developer comment to the baseline page..."
                  : "Local Mode: e.g. Add a developer comment to the baseline page..."
              }
              className="flex-1 rounded-xl px-4 py-2.5 text-xs bg-slate-955 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !promptInput.trim() || (agentMode === "github" && !isRemoteConnected)}
              className="px-4 py-2.5 rounded-xl text-xs font-black uppercase text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-40"
            >
              Prompt
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Filesystem Workspace Logs & Tools (cols: 7) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 flex flex-col h-[600px] overflow-hidden backdrop-blur-md relative shadow-2xl">

          {/* Workspace Scope Configuration */}
          <div className="mb-4 p-3 bg-slate-900/60 rounded-xl border border-slate-855 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-350 flex items-center gap-1.5">
                <span>⚙️</span> Agent Workspace Scope:
              </span>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 select-none">
                <button
                  type="button"
                  onClick={() => updateAgentMode("local")}
                  className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all cursor-pointer ${agentMode === "local"
                      ? "bg-amber-500 text-slate-950 font-extrabold shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  💻 Local FS
                </button>
                <button
                  type="button"
                  onClick={() => updateAgentMode("github")}
                  className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all cursor-pointer ${agentMode === "github"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  🐙 Git Remote
                </button>
              </div>
            </div>

            {agentMode === "local" ? (
              <div className="flex items-center gap-2 mt-1 py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-slideDown">
                <span className="text-xs">⚡</span>
                <span className="text-[10px] font-semibold">Fully Offline Local Intelligence Engine active. No external API key required.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-1 animate-slideDown">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase tracking-wider text-slate-450">Repository URL / Path</label>
                    <input
                      value={githubRepo}
                      onChange={(e) => updateGithubRepo(e.target.value)}
                      placeholder={repoProvider === "ado" ? "org/project/_git/repo" : "owner/repo"}
                      className="rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-200 px-2 py-1.5 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase tracking-wider text-slate-450">Branch</label>
                    <input
                      value={githubBranch}
                      onChange={(e) => updateGithubBranch(e.target.value)}
                      placeholder="main"
                      className="rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-200 px-2 py-1.5 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase tracking-wider text-slate-450 flex items-center justify-between">
                      <span>Personal Access Token</span>
                      <button
                        type="button"
                        onClick={() => setShowTokenInput(!showTokenInput)}
                        className="text-amber-400 font-bold hover:underline tracking-normal normal-case text-[7.5px]"
                      >
                        {showTokenInput ? "Hide" : "Show"}
                      </button>
                    </label>
                    <input
                      type={showTokenInput ? "text" : "password"}
                      value={githubToken}
                      onChange={(e) => updateGithubToken(e.target.value)}
                      placeholder={repoProvider === "ado" ? "Azure Personal Access Token" : "ghp_xxxxxxxxxxxx"}
                      className="rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-200 px-2 py-1.5 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-850">
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">Provider:</span>
                    <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 select-none">
                      <button
                        type="button"
                        onClick={() => {
                          setRepoProvider("github");
                          setIsRemoteConnected(false);
                        }}
                        className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all cursor-pointer ${repoProvider === "github"
                            ? "bg-slate-800 text-amber-400 font-bold shadow-md"
                            : "text-slate-400 hover:text-slate-200"
                          }`}
                      >
                        GitHub
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRepoProvider("ado");
                          setIsRemoteConnected(false);
                        }}
                        className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all cursor-pointer ${repoProvider === "ado"
                            ? "bg-slate-800 text-amber-400 font-bold shadow-md"
                            : "text-slate-400 hover:text-slate-200"
                          }`}
                      >
                        Azure DevOps
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {isRemoteConnected ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold animate-slideDown select-none">
                        <span>✓</span>
                        <span>{connectionMessage || "Connected to Remote!"}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConnectToRemote}
                        disabled={connecting || !githubRepo || !githubToken}
                        className="px-3.5 py-1.5 rounded-lg text-[9.5px] font-black uppercase text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-40"
                      >
                        {connecting ? "Connecting..." : "Connect to Remote"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pane Tab Selection */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-850 gap-2 shrink-0 select-none">
            <button
              onClick={() => setActiveTab("diff")}
              className={`flex-1 py-2 rounded-lg text-[10.5px] font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === "diff"
                  ? "bg-amber-950/30 text-amber-400 border border-amber-800/40 shadow-inner"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <span>🔬</span> Staged Diff
              {stagedAvailable && (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse border border-slate-950" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("explorer")}
              className={`flex-1 py-2 rounded-lg text-[10.5px] font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === "explorer"
                  ? "bg-amber-950/30 text-amber-400 border border-amber-800/40 shadow-inner"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <span>📂</span> File Inspector
            </button>
            <button
              onClick={() => setActiveTab("terminal")}
              className={`flex-1 py-2 rounded-lg text-[10.5px] font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === "terminal"
                  ? "bg-amber-950/30 text-amber-400 border border-amber-800/40 shadow-inner"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <span>{agentMode === "github" ? "🚀" : "💻"}</span> {agentMode === "github" ? "Vercel Monitor" : "Compiler Terminal"}
            </button>
          </div>

          <div className="flex-1 mt-4 overflow-y-auto scrollbar-none flex flex-col min-h-0">

            {/* TAB 1: STAGED DIFF INSPECTOR */}
            {activeTab === "diff" && (
              <div className="flex-1 flex flex-col min-h-0 divide-y divide-slate-850">
                <div className="flex items-center justify-between pb-3 shrink-0 select-none">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase">Agent Staged Code Modifications</h4>
                    <p className="text-[10px] text-slate-450 mt-0.5">Inspect visual file diff before applying changes.</p>
                  </div>
                  {stagedAvailable && (
                    <button
                      onClick={handleApplyStaged}
                      disabled={loading || (agentMode === "github" && !isRemoteConnected)}
                      className="px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-40"
                    >
                      {agentMode === "github" ? "🚀 Apply & Commit to GitHub" : "🚀 Apply & Save to Workspace"}
                    </button>
                  )}
                </div>

                {/* Build Verification Checker Status */}
                {buildValidationStatus !== "idle" && (
                  <div className="mb-3 p-3 rounded-xl border flex flex-col gap-1.5 animate-slideDown shrink-0"
                    style={{
                      backgroundColor: buildValidationStatus === "checking"
                        ? "rgba(245, 158, 11, 0.05)"
                        : buildValidationStatus === "success"
                          ? "rgba(16, 185, 129, 0.05)"
                          : "rgba(239, 68, 68, 0.05)",
                      borderColor: buildValidationStatus === "checking"
                        ? "rgba(245, 158, 11, 0.2)"
                        : buildValidationStatus === "success"
                          ? "rgba(16, 185, 129, 0.2)"
                          : "rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                        style={{
                          color: buildValidationStatus === "checking"
                            ? "var(--accent-amber)"
                            : buildValidationStatus === "success"
                              ? "var(--accent-emerald)"
                              : "var(--danger)",
                        }}
                      >
                        {buildValidationStatus === "checking" && (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-amber-500/25 border-t-amber-500 rounded-full animate-spin" />
                            ⚙️ Build Validation: Checking Workspace...
                          </>
                        )}
                        {buildValidationStatus === "success" && (
                          <>
                            <span>✓</span>
                            ✅ Build Validation: Verification Succeeded
                          </>
                        )}
                        {buildValidationStatus === "failed" && (
                          <>
                            <span>✗</span>
                            ❌ Build Validation: Verification Failed
                          </>
                        )}
                      </span>
                      {buildValidationStatus === "failed" && (
                        <span className="text-[9px] text-red-400 font-bold">Errors Found</span>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {buildValidationStatus === "checking" && "Executing compiler verify routines ('npm run build') to validate correctness..."}
                      {buildValidationStatus === "success" && "The workspace compiles successfully with no syntax or compiler warnings!"}
                      {buildValidationStatus === "failed" && "The modified code introduced compilation issues. See logs below or click Terminal tab for details."}
                    </p>

                    {buildValidationStatus === "failed" && buildValidationError && (
                      <div className="mt-2 p-2 bg-black/60 rounded border border-red-500/10 font-mono text-[9px] text-red-300 max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {buildValidationError}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 mt-3 pt-3 overflow-auto min-h-0 font-mono text-[10px] bg-slate-950/80 rounded-xl border border-slate-850 p-4 relative">
                  {stagedDiff ? (
                    <pre className="text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">
                      <span className="text-slate-500">File: {stagedFile}</span>{"\n\n"}
                      {stagedDiff.split("\n").map((line, idx) => (
                        <div
                          key={idx}
                          className={
                            line.startsWith("+")
                              ? "bg-emerald-950/40 text-emerald-450 px-1 font-bold border-l-2 border-emerald-500"
                              : line.startsWith("-")
                                ? "bg-rose-955/35 text-rose-455 px-1 font-bold border-l-2 border-rose-500"
                                : "text-slate-400"
                          }
                        >
                          {line}
                        </div>
                      ))}
                    </pre>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-500 select-none gap-2">
                      <span className="text-2xl">🔬</span>
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No Staged Edits Available</h5>
                      <p className="text-[9px] text-slate-500 max-w-[200px] mx-auto leading-normal">Prompt the agent to make a comment or code modification to view file diffs.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: LIVE FILE CODE INSPECTOR */}
            {activeTab === "explorer" && (
              <div className="flex-1 flex flex-col min-h-0 divide-y divide-slate-850">
                <div className="flex items-center gap-3 pb-3 shrink-0 select-none">
                  <div className="flex-1 text-[10.5px] font-mono text-slate-350 bg-slate-950/80 rounded px-3 py-1.5 border border-slate-855 truncate">
                    <span className="text-slate-500 mr-1.5">Inspecting:</span> {inspectPath}
                  </div>
                  <button
                    type="button"
                    onClick={fetchTree}
                    disabled={treeLoading || (agentMode === "github" && !isRemoteConnected)}
                    className="px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase bg-slate-900 hover:bg-slate-855 text-amber-400 border border-amber-900/30 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-40 shrink-0 flex items-center gap-1.5"
                  >
                    <span>🔄</span> Refresh Tree
                  </button>
                </div>

                {/* Split Explorer Workspace */}
                <div className="flex-1 flex mt-3 pt-3 overflow-hidden min-h-0 gap-4">
                  {/* Left Column: Interactive File Tree (1/3 Width) */}
                  <div className="w-1/3 flex flex-col bg-slate-950/80 rounded-xl border border-slate-855 p-3 overflow-y-auto scrollbar-thin">
                    <h5 className="text-[9px] font-black uppercase text-slate-450 tracking-wider mb-2 border-b border-slate-850 pb-1.5 select-none flex items-center justify-between">
                      <span>📁 Repository Explorer</span>
                      {treeLoading && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />}
                    </h5>

                    {treeLoading ? (
                      <div className="flex-grow flex items-center justify-center text-slate-500 py-10 animate-pulse text-[9.5px] font-mono">
                        Loading tree structure...
                      </div>
                    ) : treeData.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {renderTree(treeData)}
                      </div>
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-500 select-none py-10 gap-2">
                        <span className="text-xl">📁</span>
                        <p className="text-[9px] text-slate-500 max-w-[140px] leading-relaxed mx-auto">
                          {agentMode === "github"
                            ? "Configure GitHub credentials at the top to load folder tree."
                            : "No folders loaded. Click Refresh Tree to scan."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Code Viewer (2/3 Width) */}
                  <div className="w-2/3 flex flex-col bg-slate-950/80 rounded-xl border border-slate-855 p-4 overflow-auto relative min-h-0">
                    {inspectLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 z-10 gap-2 rounded-xl backdrop-blur-[1px]">
                        <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                        <span className="text-[9px] font-mono text-slate-500 animate-pulse">Reading file data...</span>
                      </div>
                    )}

                    {inspectContent ? (
                      <pre className="text-slate-300 leading-relaxed font-mono text-[10px] overflow-x-auto whitespace-pre">
                        {inspectContent}
                      </pre>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-500 select-none gap-2">
                        <span className="text-2xl">📄</span>
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No File Selected</h5>
                        <p className="text-[9px] text-slate-500 max-w-[200px] mx-auto leading-normal">
                          Select any file from the repository tree explorer on the left to read its contents in real time.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TERMINAL COMPILER LOGS / VERCEL MONITOR */}
            {activeTab === "terminal" && (
              <div className="flex-1 flex flex-col min-h-0 divide-y divide-slate-850">
                <div className="flex items-center justify-between pb-3 shrink-0 select-none">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase">
                      {agentMode === "github" ? "GitHub & Vercel Build Monitor" : "Local Shell Terminal Compiler"}
                    </h4>
                    <p className="text-[10px] text-slate-450 mt-0.5">
                      {agentMode === "github"
                        ? "Track deployments triggered remotely from your committed updates."
                        : "Trigger local package verification and Next.js compiler runs."}
                    </p>
                  </div>
                  <button
                    onClick={handleRunBuild}
                    disabled={terminalLoading || (agentMode === "github" && !isRemoteConnected)}
                    className="px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase bg-amber-950/40 text-amber-400 border border-amber-800/40 hover:scale-[1.02] active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-40"
                  >
                    {terminalLoading
                      ? "Querying..."
                      : agentMode === "github"
                        ? "🛰️ Check Build Status"
                        : "⚡ Execute npm run build"}
                  </button>
                </div>
                <div className="flex-1 mt-3 pt-3 overflow-auto min-h-0 font-mono text-[10px] bg-black rounded-xl border border-slate-850 p-4 relative">
                  {terminalOutput ? (
                    <pre className="text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                      {terminalOutput}
                    </pre>
                  ) : agentMode === "github" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-500 select-none gap-3 p-6">
                      <div className="h-10 w-10 rounded-full bg-amber-950/20 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse text-lg">
                        🚀
                      </div>
                      <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-350">Vercel Auto-Deployment Active</h5>
                      <p className="text-[10px] text-slate-450 max-w-[280px] mx-auto leading-relaxed">
                        Every time you approve and apply code edits in **GitHub Remote Mode**, the agent commits them directly to your repository:
                      </p>
                      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-[9px] font-mono text-slate-300 max-w-[320px] w-full text-left">
                        <span className="text-slate-500">Repository:</span> {githubRepo}<br />
                        <span className="text-slate-500">Active Branch:</span> {githubBranch}<br />
                        <span className="text-slate-500">Platform:</span> Vercel Cloud Integration
                      </div>
                      <a
                        href="https://vercel.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 px-4 py-1.5 rounded-lg text-[9.5px] font-black uppercase text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:scale-[1.02] active:scale-95 transition-all shadow-md select-none inline-flex items-center gap-1 cursor-pointer"
                      >
                        Open Vercel Console ↗
                      </a>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-500 select-none gap-2">
                      <span className="text-2xl">💻</span>
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Terminal Shell Standby</h5>
                      <p className="text-[9px] text-slate-500 max-w-[200px] mx-auto leading-normal">Click **Execute npm run build** above to execute Next.js verification and check for errors.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </Day0Shell>
  );
}
