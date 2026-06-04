"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Mode = "closed" | "bubble" | "full";

type ChatMessage = {
  from: "bot" | "user";
  text: string;
  suggestions?: string[];
  customElement?: React.ReactNode;
};

export default function MeetEnvizorAssistant({
  terraformPlan,
  discoveredObjects,
  terraformState,
}: {
  terraformPlan?: string;
  discoveredObjects?: any;
  terraformState?: any;
}) {
  const [mode, setMode] = useState<Mode>("full");

  return (
    <>
      {mode === "bubble" && (
        <MeetEnvizorBubble onGetStarted={() => setMode("full")} />
      )}

      {mode !== "full" && (
        <AssistantLauncher onClick={() => setMode("full")} />
      )}

      {mode === "full" && (
        <FullScreenAdvisor
          onClose={() => setMode("closed")}
          terraformPlan={terraformPlan || ""}
          discoveredObjects={discoveredObjects}
          terraformState={terraformState}
        />
      )}
    </>
  );
}

/* ---------------- Assistant Launcher (top-right, square) ---------------- */

function AssistantLauncher({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        fixed top-6 right-6 z-50
        w-14 h-14
        bg-slate-900 shadow-2xl rounded-2xl border border-slate-800
        flex items-center justify-center
        hover:scale-105 active:scale-95 transition-all
        hover:shadow-blue-500/10
      "
    >
      <img src="/envizor-robot.png" alt="Envizor" className="w-10 h-10 object-contain" />
    </button>
  );
}

/* ---------------- Meet Envizor Bubble (top-right) ---------------- */

function MeetEnvizorBubble({
  onGetStarted,
}: {
  onGetStarted: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 9000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="
        fixed top-24 right-6 z-50
        bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800
        p-5 w-80 animate-fadeIn
      "
    >
      <div className="flex items-center gap-3">
        <img src="/envizor-robot.png" alt="Envizor" className="w-12 h-12 object-contain" />
        <div>
          <div className="font-bold text-sky-400 text-sm">
            Meet Envizor!
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Your Premium AI Advisor for Terraform + Saviynt.
          </div>
        </div>
      </div>

      <button
        onClick={onGetStarted}
        className="
          mt-4 w-full py-2.5 rounded-xl
          bg-gradient-to-r from-sky-500 to-indigo-600
          text-white text-xs font-bold uppercase tracking-wider
          hover:scale-105 active:scale-95 transition-all
          shadow-lg shadow-sky-500/10
        "
      >
        Get Started
      </button>
    </div>
  );
}

/* ---------------- Full Screen Advisor Page ---------------- */

function FullScreenAdvisor({
  onClose,
  terraformPlan,
  discoveredObjects,
  terraformState,
}: {
  onClose: () => void;
  terraformPlan: string;
  discoveredObjects: any;
  terraformState: any;
}) {
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  // Guided Deployment State Machine
  const [flow, setFlow] = useState<{
    step: "greet" | "deploy_art" | "deploy_src" | "deploy_tgt" | "deploy_ready" | "workspace_ins" | "compare_src" | "compare_tgt" | "compare_ready";
    artefact?: string;
    source?: "DEV" | "PRE" | "PROD";
    target?: "DEV" | "PRE" | "PROD";
    workspace?: "DEV" | "PRE" | "PROD";
  }>({ step: "greet" });

  useEffect(() => {
    // Initial welcome greeting
    setMessages([
      {
        from: "bot",
        text: "👋 **Hi, I’m Envizor — your interactive Terraform + Saviynt Intelligence Advisor.**\n\nI am here to guide you safely through your workspace configurations, baseline dynamic assets, compare environments, and dry-run code changes before deployment.\n\n**What would you like to accomplish today?**",
        suggestions: [
          "🚀 Start Interactive Deploy Flow",
          "🧭 Browse Workspace",
          "🔀 Compare Environments",
          "📋 Help/Overview",
          "📦 Baseline Workspace - Day 0",
          "🔄 Synchronize Workspaces"
        ]
      }
    ]);
  }, []);

  const handleSuggestionClick = (option: string) => {
    // Add user message to screen
    setMessages((prev) => [...prev, { from: "user", text: option }]);
    
    setTyping(true);
    setTimeout(() => {
      processState(option);
      setTyping(false);
    }, 450);
  };

  const botReply = (text: string, suggestions?: string[], customElement?: React.ReactNode) => {
    setTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text,
          suggestions,
          customElement
        }
      ]);
      setTyping(false);
    }, 450);
  };

  const processState = (option: string) => {
    const text = option.toLowerCase();

    // Check active flow step transitions first
    if (flow.step === "deploy_art") {
      let art = "";
      if (text.includes("security") || text.includes("sec")) {
        art = "Security Systems";
      } else if (text.includes("endpoint") || text.includes("end")) {
        art = "Endpoints";
      } else if (text.includes("connection") || text.includes("conn")) {
        art = "Connections";
      } else if (text.includes("all") || text.includes("baseline")) {
        art = "All Baseline Assets";
      }

      if (art) {
        setFlow((prev) => ({ ...prev, step: "deploy_src", artefact: art }));
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: `Selected **${art}**.\n\nNow, select the **Source Environment (Source of Truth)** where these baseline configurations live:`,
            suggestions: ["🟢 DEV Environment", "🟡 PRE Environment", "🔴 PROD Environment"]
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "I didn't quite catch that. Please select one of the Saviynt artefacts:",
            suggestions: ["🛡️ Security Systems", "🔌 Endpoints", "🔗 Connections", "📦 All Baseline Assets"]
          }
        ]);
      }
      return;
    }

    if (flow.step === "deploy_src") {
      const src = text.includes("dev") ? "DEV" : text.includes("pre") ? "PRE" : text.includes("prod") ? "PROD" : null;
      if (src) {
        setFlow((prev) => ({ ...prev, step: "deploy_tgt", source: src }));
        const remainders = (["DEV", "PRE", "PROD"] as const).filter((x) => x !== src);
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: `Source environment configured as **${src}**.\n\nChoose the target environment where these changes should be deployed:`,
            suggestions: remainders.map(r => `${r === "DEV" ? "🟢" : r === "PRE" ? "🟡" : "🔴"} ${r} Environment`)
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "Please select a valid source environment:",
            suggestions: ["🟢 DEV Environment", "🟡 PRE Environment", "🔴 PROD Environment"]
          }
        ]);
      }
      return;
    }

    if (flow.step === "deploy_tgt") {
      const tgt = text.includes("dev") ? "DEV" : text.includes("pre") ? "PRE" : text.includes("prod") ? "PROD" : null;
      if (tgt) {
        setFlow({ step: "greet" }); // Reset flow step!
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: `📋 **Deployment Strategy Formulated!**\n\nI have prepared your custom configuration. Ready to pull baseline configs from **${flow.source}** and push them to **${tgt}**.\n\nWhen you're ready, click the transition button below to open the **Pull Wizard** where all options will be pre-filled:`,
            customElement: (
              <button
                onClick={() => {
                  window.location.href = `/wizard/push?source=${flow.source}&target=${tgt}&artefact=${encodeURIComponent(flow.artefact || "")}&action=deploy_wizard&command=init`;
                }}
                className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white text-sm font-bold uppercase tracking-wider hover:scale-[1.03] active:scale-95 transition-all shadow-lg shadow-sky-500/20"
              >
                ➡️ Baseline & Pull from {flow.source}
              </button>
            )
          }
        ]);
      } else {
        const remainders = (["DEV", "PRE", "PROD"] as const).filter((x) => x !== flow.source);
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "Please select a valid target environment:",
            suggestions: remainders.map(r => `${r === "DEV" ? "🟢" : r === "PRE" ? "🟡" : "🔴"} ${r} Environment`)
          }
        ]);
      }
      return;
    }

    if (flow.step === "workspace_ins") {
      const ws = text.includes("dev") ? "DEV" : text.includes("pre") ? "PRE" : text.includes("prod") ? "PROD" : null;
      if (ws) {
        setFlow({ step: "greet" }); // Reset flow step!
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: `I've prepared your explorer context for **${ws}**.\n\nClick the transition below to explore folders and inspect files on the **Workspace Explorer page**:`,
            customElement: (
              <button
                onClick={() => router.push(`/wizard/explorer/discovery?env=${ws}`)}
                className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white text-sm font-bold uppercase tracking-wider hover:scale-[1.03] active:scale-95 transition-all"
              >
                ➡️ Open Workspace Explorer ({ws})
              </button>
            )
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "Please select a workspace environment to inspect:",
            suggestions: ["🟢 DEV Workspace", "🟡 PRE Workspace", "🔴 PROD Workspace"]
          }
        ]);
      }
      return;
    }

    if (flow.step === "compare_src") {
      const src = text.includes("dev") ? "DEV" : text.includes("pre") ? "PRE" : text.includes("prod") ? "PROD" : null;
      if (src) {
        setFlow((prev) => ({ ...prev, step: "compare_tgt", source: src }));
        const remainders = (["DEV", "PRE", "PROD"] as const).filter((x) => x !== src);
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: `Source environment set as **${src}**. Now choose the **Target Environment** to compare against:`,
            suggestions: remainders
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "Please select a valid source environment for comparison:",
            suggestions: ["DEV", "PRE", "PROD"]
          }
        ]);
      }
      return;
    }

    if (flow.step === "compare_tgt") {
      const tgt = text.includes("dev") ? "DEV" : text.includes("pre") ? "PRE" : text.includes("prod") ? "PROD" : null;
      if (tgt) {
        setFlow({ step: "greet" }); // Reset flow step!
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: `Comparing **${flow.source}** ↔ **${tgt}**.\n\nClick the transition button below to open the **Environment Split-Diff Viewer** for live drift alignment:`,
            customElement: (
              <button
                onClick={() => router.push(`/wizard/explorer/compare?left=${flow.source}&right=${tgt}`)}
                className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white text-sm font-bold uppercase tracking-wider hover:scale-[1.03] active:scale-95 transition-all"
              >
                ➡️ Run Environment Comparison
              </button>
            )
          }
        ]);
      } else {
        const remainders = (["DEV", "PRE", "PROD"] as const).filter((x) => x !== flow.source);
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "Please select a valid target environment comparison:",
            suggestions: remainders
          }
        ]);
      }
      return;
    }

    const cleanText = text.trim().toLowerCase();

    // 1. Start Interactive Deploy Flow
    if (cleanText.includes("start interactive deploy") || cleanText === "deploy" || (cleanText.includes("deploy") && !cleanText.includes("baseline"))) {
      setFlow({ step: "deploy_art" });
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "🎯 **Interactive Deployment Flow Activated**\n\nLet's get your changes ready. First, **which Saviynt artefacts** do you want to import or deploy?",
          suggestions: [
            "🛡️ Security Systems",
            "🔌 Endpoints",
            "🔗 Connections",
            "📦 All Baseline Assets"
          ]
        }
      ]);
      return;
    }

    // 2. Browse Workspace
    if (cleanText.includes("browse workspace") || cleanText === "workspaces" || cleanText === "inspect") {
      setFlow({ step: "workspace_ins" });
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "🧭 **Workspace Explorer Activated**\n\nWhich environment workspace directory would you like to inspect?",
          suggestions: ["🟢 DEV Workspace", "🟡 PRE Workspace", "🔴 PROD Workspace"]
        }
      ]);
      return;
    }

    // 3. Compare Environments
    if (cleanText.includes("compare environments") || cleanText === "compare" || cleanText === "drift") {
      setFlow({ step: "compare_src" });
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "🔀 **Environment Compare Engine Active**\n\nChoose the **Source Environment** to compare:",
          suggestions: ["DEV", "PRE", "PROD"]
        }
      ]);
      return;
    }

    // 4. Help/Overview
    if (cleanText.includes("help/overview") || cleanText.includes("help overview") || cleanText === "help") {
      botReply(
        "💡 **I can help you navigate this wizard application:**\n\n• **Deploy Flow**: Guided template onboarding, pull baselines, and plan/apply consoles.\n• **Explore Workspaces**: Visual HCL template layouts on your disk.\n• **Compare drift**: Track and merge configurations between DEV/PRE/PROD stages.\n• **Baseline Workspace**: Day-0 workspace dynamic asset baselining.\n• **Synchronize Workspaces**: Align HCL configurations across environments.\n\nLet me know how to proceed!",
        [
          "🚀 Start Interactive Deploy Flow",
          "🧭 Browse Workspace",
          "🔀 Compare Environments",
          "📋 Help/Overview",
          "📦 Baseline Workspace - Day 0",
          "🔄 Synchronize Workspaces"
        ]
      );
      return;
    }

    // 5. Baseline Workspace - Day 0
    if (cleanText.includes("baseline workspace") || cleanText.includes("day 0") || cleanText.includes("day-0")) {
      setFlow({ step: "greet" }); // reset
      botReply(
        "📦 **Baseline Workspace - Day 0 Activated**\n\nWelcome to the IGA Tenants Explorer Baselining Console. Here you can connect directly to your Saviynt stage cloud tenant, pull active baseline assets, view generated HCL plans, and publish workspaces locally.\n\nClick the transition below to navigate to the **Day-0 Baselining Console**:",
        [],
        (
          <button
            onClick={() => {
              window.location.href = "/wizard/day0/baseline?action=baseline_wizard";
            }}
            className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider hover:scale-[1.03] active:scale-95 transition-all shadow-lg shadow-sky-500/20"
          >
            ➡️ Open Baselining Console
          </button>
        )
      );
      return;
    }

    // 6. Synchronize Workspaces
    if (cleanText.includes("synchronize workspaces") || cleanText === "sync" || (cleanText.includes("sync") && !cleanText.includes("plan") && !cleanText.includes("apply") && !cleanText.includes("deploy"))) {
      setFlow({ step: "greet" });
      botReply(
        "🔄 **Workspace Sync Core Active**\n\nTo synchronize staging workspaces, Envizor will analyze Schema alignment and HCL drifts across DEV, PRE, and PROD stage environments.\n\nClick the transition below to open the **Drift and Reconciliation Dashboard** in your workspace:",
        [],
        (
          <button
            onClick={() => {
              window.location.href = "/wizard/day0/diff?action=sync_wizard";
            }}
            className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider hover:scale-[1.03] active:scale-95 transition-all shadow-lg shadow-sky-500/20"
          >
            ➡️ Open Drift Sync Console
          </button>
        )
      );
      return;
    }

    // --- 4. Fallback answers / general chat ---
    botReply(
      "I am your dedicated Envizor intelligence assistant. Would you like to start a guided deployment, compare environment configurations, or inspect local workspace directories?",
      [
        "🚀 Start Interactive Deploy Flow",
        "🧭 Browse Workspace",
        "🔀 Compare Environments",
        "📋 Help/Overview",
        "📦 Baseline Workspace - Day 0",
        "🔄 Synchronize Workspaces"
      ]
    );
  };

  const handleFreeTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const txt = input.trim();
    if (!txt) return;

    setMessages((prev) => [...prev, { from: "user", text: txt }]);
    setInput("");
    
    setTyping(true);
    setTimeout(() => {
      processState(txt);
      setTyping(false);
    }, 450);
  };

  return (
    <div
      className="
        fixed inset-0 z-50 text-white select-none
        bg-[url('/futuristic-lab-bg2.jpg')] bg-cover bg-center flex flex-col justify-between
      "
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 shadow-md">
        <button
          onClick={() => router.push("/wizard")}
          className="px-4 py-1.5 rounded-full border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs font-semibold"
        >
          ← Return to Hub
        </button>

        <div className="flex items-center gap-3">
          <img src="/envizor-robot.png" alt="Envizor" className="w-8 h-8 object-contain" />
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>Envizor AI Assistant</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            </div>
            <div className="text-[10px] text-sky-400 font-medium">
              Interactive DevOps Command Core
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center hover:bg-slate-800 hover:text-white transition text-sm text-slate-400"
        >
          ✕
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex min-h-0 bg-slate-950/60 backdrop-blur-sm">
        
        {/* Left: Giant Robot / Futuristic graphics */}
        <div className="hidden md:flex w-1/3 flex-col items-center justify-center border-r border-slate-900/40 bg-slate-950/50 backdrop-blur-md p-6 relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-sky-500/10 rounded-full blur-3xl opacity-30" />
            <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-3xl opacity-30" />
          </div>
          
          <div className="relative text-center max-w-xs space-y-4">
            <img src="/envizor-robot-large.png" alt="Envizor Robot" className="w-72 mx-auto drop-shadow-[0_0_40px_rgba(59,130,246,0.6)] animate-pulse" />
            <h2 className="text-lg font-bold text-slate-100 mt-4 tracking-wide uppercase">Envizor AI advisor</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Piping direct conversational inputs into live Terraform baseline workspaces, environment comparison trees, and direct push/pull agents.
            </p>
          </div>
        </div>

        {/* Right: Conversation Pane */}
        <div className="flex-1 flex flex-col p-6 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4 pr-3 max-w-4xl mx-auto w-full">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.from === "bot" ? "items-start" : "items-end"} animate-fadeIn`}
              >
                {/* Bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl max-w-[80%] whitespace-pre-line text-xs leading-relaxed shadow border ${
                    m.from === "bot"
                      ? "bg-slate-900 border-slate-800 text-slate-200"
                      : "bg-gradient-to-br from-sky-500 to-indigo-600 border-sky-400 text-white shadow-sky-500/10"
                  }`}
                >
                  {m.text}
                </div>

                {/* Suggestions / Options */}
                {m.from === "bot" && m.suggestions && (
                  <div className="flex flex-wrap gap-2 mt-2 max-w-[85%]">
                    {m.suggestions.map((s, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSuggestionClick(s)}
                        className="
                          px-3 py-1.5 text-[10px] font-semibold tracking-wide
                          bg-slate-900 border border-slate-800 hover:border-slate-700
                          text-slate-300 rounded-xl hover:bg-slate-800 transition active:scale-95
                        "
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom rendering element if any */}
                {m.customElement && <div className="mt-2 w-full">{m.customElement}</div>}
              </div>
            ))}

            {/* Typing Indicator */}
            {typing && (
              <div className="flex items-center gap-1 px-3 py-2 bg-slate-900 border border-slate-850 rounded-xl w-14 animate-fadeIn">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce delay-300" />
              </div>
            )}
          </div>

          {/* Chat Form Input */}
          <form
            onSubmit={handleFreeTextSubmit}
            className="p-4 border-t border-slate-900 max-w-4xl mx-auto w-full flex gap-3 mt-4"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Envizor a question or type standard commands..."
              className="
                flex-1 bg-slate-900 border border-slate-850 rounded-xl px-4 py-3
                text-xs text-slate-100 placeholder:text-slate-500
                focus:outline-none focus:border-sky-500 transition-colors
              "
            />
            <button
              type="submit"
              className="
                px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600
                hover:from-sky-400 hover:to-indigo-500 text-xs font-bold text-white
                shadow-lg hover:shadow-sky-500/10 active:scale-95 transition-all
              "
            >
              Send Message
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
