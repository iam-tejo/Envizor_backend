"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────
type FileNode = {
  name: string;
  type: "folder" | "file";
  children?: FileNode[];
};

type DiffPart = {
  value: string;
  added?: boolean;
  removed?: boolean;
};

type CompareNode = {
  name: string;
  type: "folder" | "file";
  inLeft: boolean;
  inRight: boolean;
  diff?: DiffPart[] | null;
  children?: CompareNode[];
};

type ChatMessage = {
  id: string;
  from: "bot" | "user";
  text: string;
  options?: { label: string; actionName: string; desc?: string }[];
  customElement?: "deploy_button" | "explorer_button" | "compare_button" | "role_request_card" | "compliance_cert_card" | "none";
  useTypewriter?: boolean;
};

// ─── Envizor Product Knowledge Base ──────────────────────────────────────────
const ENVIZOR_KB = {
  mission: `🚀 **Envizor's Mission: Uniting IGA & Infrastructure-as-Code**

Envizor was built to solve a critical enterprise problem. Identity Governance (IGA) platforms like Saviynt EIC have traditionally been managed entirely through manual web portals — click-by-click configuration that leaves no audit trail, drifts silently between environments, and is prone to catastrophic human error.

The three threats Envizor eliminates:
• **Environment Drift** — DEV, PRE, and PROD configs silently diverge over weeks of manual changes
• **Untraceable Operations** — Portal changes leave no Git history or change records
• **Human Error** — Manual JSON and SQL configurations are slow and fragile

Envizor bridges the gap by automatically discovering live tenant configurations and compiling them into clean, declarative **Terraform HCL modules** — so your entire governance footprint becomes code that can be versioned, reviewed, and deployed safely.`,

  pipeline: `⚙️ **The Envizor 4-Block Pipeline**

Envizor operates as a unified governance pipeline with 4 sequential functional blocks:

🔌 **Block 1 — API Discovery Scan**
Securely connects to Saviynt SaaS tenants using TLS 1.3, running read-only crawlers to extract security systems, endpoints, connections, and entitlements into a JSON metadata baseline. Zero impact on live environments.

🔍 **Block 2 — Reconciler Drift Engine**
Compares the live scanned state against your approved Git baseline, line-by-line. Flags any unauthorized portal changes (authentication overrides, server URL changes, role mismatches) in amber with full diff output.

⚙️ **Block 3 — Modular HCL Synthesizer**
Translates JSON scan baselines and staged delta corrections into structured Terraform HCL modules (.tf files). Extracts hardcoded values into variables.tf for dynamic, reusable configurations. Writes to local disk only — no cloud changes.

🚀 **Block 4 — Safe DevOps Deployment Pipeline**
Executes the standard Terraform lifecycle: \`terraform init\` → downloads the saviynt provider → \`terraform plan\` → dry-run diff vs live EIC state → \`terraform apply\` → writes approved changes to cloud APIs → GitOps push to main branch.`,

  reconcile: `🔍 **Block 2 — Reconciler Drift Engine**

The Reconciler (Block 2) compares the live scanned state of your Saviynt tenants against the approved Git baseline, line-by-line. 

**Key Features:**
• **High-Speed Comparison**: Compares scanned cloud metadata snapshots against local Git directories in milliseconds.
• **Drift Isolation**: Flags unauthorized console modifications such as authentication changes or endpoint switches.
• **Visual Diffing**: Renders side-by-side color-coded diff output (green for additions, red for deletions, amber for drifts).
• **Audit readiness**: Guarantees that what's running in production matches exactly what is recorded in Git.`,

  drift: `🔍 **What is Configuration Drift?**

Configuration drift happens when someone modifies Saviynt security systems, users, endpoints or connections directly through the admin console — without updating the code baseline in Git.

A classic example: An engineer manually changes an API endpoint's auth type from OAUTH2 to PASSWORD in the DEV console for a quick fix. This change isn't captured in any .tf file. The next time Terraform runs, it detects the mismatch and flags it as a drift.

**Why it's dangerous:**
• Security compliance gaps accumulate silently across environments
• No audit trail means no accountability or rollback path
• DEV/PRE/PROD environments gradually diverge in unpredictable ways

**How Envizor catches it:**
The Reconciler Diff Engine (Block 2) continuously compares live EIC state against your approved baseline and displays mismatches with colour-coded diff output — before Terraform even runs.`,

  jit: `⚡ **Just-In-Time (JIT) Access — Zero-Trust Temporal Gating**

JIT access is a core Zero-Trust security principle. Instead of holding permanent admin permissions indefinitely, users request **temporary** role elevation for a defined window: 1 hour, 4 hours, 8 hours, or 24 hours.

When the window expires, the platform automatically revokes all elevated permissions — no manual cleanup required. This dramatically reduces your attack surface.

**Why JIT over Permanent?**
• Permanent admin keys are a persistent security risk if compromised
• JIT sessions are auto-logged with timestamps and business justifications
• Satisfies SOX, SOC 2, and ISO 27001 least-privilege access controls
• SuperAdmin can audit all JIT sessions in real-time from the approval catalog

**Requesting JIT access via Envy:**
Just ask me to "request access" or "unlock roles" — I'll open the interactive gating form right here in the chat!`,

  roles: `🔑 **Envizor Role Hierarchy**

Envizor enforces a strict role-based access gating scheme with 4 tiers:

**1. BasicUser (Default)**
Can browse the Welcome Hub and read the Ecosystem Guide. All active tool tiles (Baseline, Compare, Deploy, Analytics) are gated with lock symbols.

**2. DEV Admin**
Grants read-write access to DEV workspace environments. Unlocks: Day 0 Setup, IGA Tenant Explorer, Workspace Explorer, Terraform DevOps Wizard, Connected App Generator, Analytics Workbench.

**3. PRE Admin**
Extends DEV Admin rights to PRE staging environments. Permits staging reconciliation, cross-environment drift comparison, and PRE baseline deployments.

**4. PROD Admin / SuperAdmin**
Complete access across the entire pipeline including PROD deployments, tenant credential edits, and access request approval management.

💡 **Pro tip:** You can request role elevation directly here in the chat — just say "I need access" or "unlock my permissions" and I'll bring up the secure gating form!`,

  terraform: `🔧 **Saviynt Terraform Provider Details**

The \`saviynt/saviynt\` Terraform provider (v0.3.4+) manages **11 EIC resource types** declaratively:

• **Security Systems** — Core identity tenant definitions
• **Endpoints** — Application connections to HR, Finance, Payroll systems
• **Database Connections** — JDBC/REST database link configurations
• **Entitlements** — Fine-grained access permission definitions
• **Roles** — Bundled entitlement packages
• **Custom Properties** — Extended metadata fields (e.g. customproperty31 for group mapping)
• **Transport Packages** — Cross-environment config promotion (export → import .zip artifacts)
• **Job Resources** — Automated reconciliation, sync, and import batch jobs

**Authentication:** Strict Zero-Trust ephemeral auth — credentials rotate every 5 minutes. Never hardcoded.

**Lifecycle:** \`terraform init\` → \`plan\` → \`apply\` → \`destroy\`. Envizor automates the init→plan→apply loop inside the DevOps Pipeline Wizard.`,

  howto: `🧭 **How to Get Started with Envizor**

Here's the recommended onboarding path:

**Step 1: Day 0 Workspace Setup**
Configure your DEV/PRE/PROD environment directories and enter your Saviynt tenant credentials. This bootstraps the connection layer.

**Step 2: Run a Discovery Scan (IGA Tenants Explorer)**
Connect to your live Saviynt tenant and crawl all active security systems, endpoints, and entitlements into a JSON metadata snapshot.

**Step 3: Generate Your Terraform Baseline**
The HCL Synthesizer compiles your JSON snapshot into structured .tf modules. Run \`terraform init\` then \`terraform apply\` to publish the baseline to disk.

**Step 4: Compare Environments**
Use the Drift Comparison tool to detect differences between DEV, PRE, and PROD configurations side-by-side.

**Step 5: Deploy Changes Safely**
Run the DevOps Wizard to execute \`terraform plan\` → review → \`terraform apply\` on target environments.

💡 **Need access to these tools?** As a BasicUser, your tiles are locked. Ask me to "request access" and I'll handle the gating form for you right here!`,
};

// ─── Trivia Questions ─────────────────────────────────────────────────────────
const TRIVIA = [
  {
    q: "What is 'configuration drift' in the context of Envizor?",
    options: [
      { label: "A) When .tf files get corrupted on disk", ans: "a" },
      { label: "B) When portal changes diverge from the Git baseline", ans: "b" },
      { label: "C) When a tenant DB undergoes scheduled indexing", ans: "c" },
    ],
    correct: "b",
    expl: "Configuration drift occurs when admin console changes create discrepancies with your approved Terraform baseline in Git.",
  },
  {
    q: "Which Envizor pipeline block compiles JSON scan data into declarative .tf files?",
    options: [
      { label: "A) Block 1 — API Discovery Scan", ans: "a" },
      { label: "B) Block 2 — Reconciler Diff Engine", ans: "b" },
      { label: "C) Block 3 — Modular HCL Synthesizer", ans: "c" },
    ],
    correct: "c",
    expl: "Block 3 (the HCL Synthesizer) translates JSON metadata into structured, production-ready Terraform modules.",
  },
  {
    q: "What is the Zero-Trust recommended access model for high-security cloud environments?",
    options: [
      { label: "A) Just-In-Time ephemeral sessions with auto-expiry", ans: "a" },
      { label: "B) Permanent admin keys for productivity", ans: "b" },
      { label: "C) Global read-only tokens with zero expiry", ans: "c" },
    ],
    correct: "a",
    expl: "JIT access minimises the attack surface by auto-revoking privileges at the end of a defined temporal window.",
  },
];

// ─── Intent Classifier ────────────────────────────────────────────────────────
function classifyIntent(input: string): string {
  const t = input.toLowerCase().trim();

  // 1. Reset / Start Over / Cancel
  if (/\b(start over|reset|restart|clear|new session|cancel|exit|abort)\b/.test(t) || t === "exit" || t === "cancel") return "reset";

  // 2. Greetings
  if (/\b(hi|hello|hello envy|hey|what up|howdy|greet|yo|greetings)\b/.test(t)) return "greet";

  // 3. Locked Tiles / Gated Dashboard Hub (Checks for lock symbols, why things are locked, seeing only one tile)
  if (
    t.includes("tile") ||
    t.includes("tiles") ||
    t.includes("lock") ||
    t.includes("locked") ||
    t.includes("unlock") ||
    t.includes("grayed") ||
    t.includes("hidden") ||
    t.includes("visible") ||
    t.includes("welcome page") ||
    t.includes("welcome hub")
  ) {
    if (
      t.includes("one") ||
      t.includes("only") ||
      t.includes("single") ||
      t.includes("why") ||
      t.includes("how") ||
      t.includes("access") ||
      t.includes("dashboard") ||
      t.includes("welcome") ||
      t.includes("hub") ||
      t.includes("gray") ||
      t.includes("disable")
    ) {
      return "locked_tiles";
    }
  }

  // 3a. Approvals / Requests / Pending / History Catalog
  if (
    t.includes("approval") ||
    t.includes("approvals") ||
    t.includes("approved") ||
    (t.includes("request") && (t.includes("how many") || t.includes("status") || t.includes("pending") || t.includes("my") || t.includes("list") || t.includes("show") || t.includes("view") || t.includes("check") || t.includes("history") || t.includes("count") || t.includes("today") || t.includes("have"))) ||
    (t.includes("requests") && !/\b(request access|unlock|elevate|i need access|grant me|give me access|open access)\b/.test(t))
  ) {
    return "approvals";
  }

  // 4. Request Access / Unlock / Elevate / JIT request
  if (
    /\b(request|request access|unlock|elevate|i need access|grant me|give me access|open access|gating|temporal|jit)\b/.test(t) ||
    t.includes("request access") ||
    t.includes("unlock roles") ||
    t.includes("elevate my permissions") ||
    t.includes("jit access") ||
    t.includes("need access")
  ) {
    return "request_access";
  }

  // 5. Trivia / Quiz / Game
  if (/\b(trivia|quiz|game|challenge|test me|play)\b/.test(t) || t.includes("play trivia") || t.includes("trivia game")) return "start_quiz";

  // 6. Mission / About Envizor
  if (
    /\b(what is|who are|explain|tell me about|about)\b.*(envizor|wizard|platform|product)/.test(t) ||
    /\b(mission|purpose|why|built for)\b/.test(t) ||
    t.includes("what is envizor") ||
    t.includes("what is the wizard") ||
    t.includes("about envizor") ||
    t.includes("who are you") ||
    t.includes("what is this")
  ) {
    return "mission";
  }

  // 7. Pipeline / Blocks
  if (
    /\b(pipeline|4 block|four block|block 1|block 2|block 3|block 4|process|flow|how does it work)\b/.test(t) ||
    t.includes("pipeline") ||
    t.includes("4-block")
  ) {
    return "pipeline";
  }

  // 8. Drift Detection
  if (
    /\b(drift|configuration drift|mismatch|diverge|out.of.sync|portal change)\b/.test(t) ||
    t.includes("drift")
  ) {
    return "drift";
  }

  // 9. JIT Access Info
  if (
    /\b(jit|just.in.time|temporal|temporary access|ephemeral|short.term)\b/.test(t) ||
    t.includes("just in time") ||
    t.includes("jit")
  ) {
    return "jit";
  }

  // 10. Roles Hierarchy Info
  if (
    /\b(role|permission|access level|privilege|unlock|tier|basicuser|dev admin|pre admin|prod admin)\b/.test(t) ||
    t.includes("role") ||
    t.includes("permission")
  ) {
    return "roles";
  }

  // 11. Terraform / HCL Info
  if (
    /\b(terraform|hcl|provider|saviynt provider|resource type|tf file|init|plan|apply)\b/.test(t) ||
    t.includes("terraform") ||
    t.includes("hcl") ||
    t.includes("saviynt provider")
  ) {
    return "terraform";
  }

  // 12. How to get started / Onboarding
  if (
    /\b(how to|get started|start|onboard|first step|where do i|begin)\b/.test(t) ||
    t.includes("how to start") ||
    t.includes("get started")
  ) {
    return "howto";
  }

  // 13. Deploy / Push
  if (/\b(deploy|push|apply|release|publish)\b/.test(t) || t.includes("deploy flow") || t.includes("guided deployment")) return "deploy";

  // 14. Workspaces / Explorer
  if (/\b(workspace|explorer|browse|files|directory)\b/.test(t) || t.includes("workspace explorer")) return "workspaces";

  // 15. Compare / Diff
  if (/\b(compare|diff|reconcile|sync|align)\b/.test(t) || t.includes("compare environments")) return "compare";

  // 16. Analytics Workbench
  if (/\b(analytics|sql|query|database|workbench)\b/.test(t) || t.includes("analytics workbench") || t.includes("sql query")) return "analytics";

  // 17. Help & Overview
  if (/\b(help|overview|what can you do|commands|options)\b/.test(t) || t.includes("help")) return "help";

  return "unknown";
}


// ─── Envy Sub-components ──────────────────────────────────────────────────────

// ─── Programmatic Sci-Fi Synthesizer (Zero-dependency Web Audio API) ─────────
const playSynthSound = (type: "send" | "typewriter" | "success" | "denied") => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === "send") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } 
    else if (type === "typewriter") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(900 + Math.random() * 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.004, ctx.currentTime); // ultra low volume click
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.015);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.02);
    } 
    else if (type === "success") {
      const now = ctx.currentTime;
      const playTone = (freq: number, delay: number, dur: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(vol, now + delay + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + dur);
      };
      // A beautiful major chord arpeggio
      playTone(261.63, 0.0, 0.5, 0.04); // C4
      playTone(329.63, 0.08, 0.5, 0.04); // E4
      playTone(392.00, 0.16, 0.5, 0.04); // G4
      playTone(523.25, 0.24, 0.8, 0.06); // C5
    } 
    else if (type === "denied") {
      const now = ctx.currentTime;
      const playBeep = (time: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(98, now + time); // low hum
        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.03, now + time + 0.02);
        gain.gain.linearRampToValueAtTime(0.0001, now + time + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + time);
        osc.stop(now + time + 0.13);
      };
      playBeep(0.0);
      playBeep(0.12);
    }
  } catch (e) {
    // Fail silently if browser AudioContext block is active
  }
};

function TypewriterBubble({ text, onDone }: { text: string; onDone?: () => void }) {
  const [shown, setShown] = useState("");
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    setShown("");
    const iv = setInterval(() => {
      const chunk = text.substring(0, Math.min(i + 2, text.length));
      setShown(chunk);
      i += 2;
      // Satisfying click sound
      if (i % 6 === 0) {
        playSynthSound("typewriter");
      }
      if (i >= text.length) {
        clearInterval(iv);
        setCursor(false);
        if (onDone) onDone();
      }
    }, 16);
    return () => clearInterval(iv);
  }, [text]);

  // Blink cursor effect
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    if (!cursor) return;
    const b = setInterval(() => setBlink((v) => !v), 500);
    return () => clearInterval(b);
  }, [cursor]);

  return (
    <span className="whitespace-pre-line leading-relaxed">
      {shown}
      {cursor && <span className={`inline-block w-[2px] h-[13px] ml-0.5 -mb-0.5 bg-current align-middle transition-opacity ${blink ? "opacity-100" : "opacity-0"}`} />}
    </span>
  );
}

function RoleRequestCard({ userName, onSubmit }: { userName: string; onSubmit: (role: string, duration: string, just: string) => void }) {
  const [selRole, setSelRole] = useState("DEV_Admin");
  const [mode, setMode] = useState<"JIT" | "Permanent">("JIT");
  const [hrs, setHrs] = useState("4");
  const [just, setJust] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    onSubmit(selRole, mode === "JIT" ? `${hrs} Hours` : "Permanent", just);
  };

  if (submitting) {
    return (
      <div className="w-[88%] mt-3 p-4 rounded-xl border border-sky-500/30 bg-sky-950/20 text-xs font-bold text-sky-400 text-center animate-pulse">
        📡 Routing to SuperAdmin AI Auto-Approver...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-[88%] mt-3 p-4 rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-sm flex flex-col gap-3.5 text-left shadow-xl animate-fadeIn"
      style={{ boxShadow: "0 4px 24px rgba(6, 182, 212, 0.08)" }}
    >
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sky-400">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
        ⚡ Temporal Gating Console
      </div>

      {/* Role selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Target Administrative Role</label>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { val: "DEV_Admin", label: "🛠️ DEV Admin", desc: "DEV workspace read-write" },
            { val: "PRE_Admin", label: "✨ PRE Admin", desc: "DEV + PRE staging environments" },
            { val: "PROD_Admin", label: "🚀 PROD Admin", desc: "Full production deployment access" },
          ].map((r) => (
            <button
              key={r.val}
              type="button"
              onClick={() => setSelRole(r.val)}
              className={`p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer text-xs ${
                selRole === r.val
                  ? "border-sky-500 bg-sky-950/30 text-sky-300"
                  : "border-slate-800 bg-slate-950/30 text-slate-400 hover:border-slate-700"
              }`}
            >
              <span className="font-bold">{r.label}</span>
              <span className={`text-[10px] ml-1.5 ${selRole === r.val ? "text-sky-500/70" : "text-slate-600"}`}>— {r.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Authorization Mode</label>
        <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
          {(["JIT", "Permanent"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`py-1.5 rounded text-[10px] font-black uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                mode === m ? "bg-sky-600 text-white shadow" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {m === "JIT" ? "⚡ JIT Temporal" : "🔑 Permanent"}
            </button>
          ))}
        </div>
      </div>

      {/* Duration pills */}
      {mode === "JIT" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Temporal Window</label>
          <div className="grid grid-cols-4 gap-1.5">
            {["1", "4", "8", "24"].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHrs(h)}
                className={`py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                  hrs === h
                    ? "border-sky-500 bg-slate-900 text-sky-400"
                    : "border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700"
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
          <div className="text-[9px] text-slate-600 italic">Access auto-revokes after selected window</div>
        </div>
      )}

      {/* Justification */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Business Justification</label>
        <textarea
          required
          rows={2}
          placeholder="Briefly describe why you need elevated permissions..."
          value={just}
          onChange={(e) => setJust(e.target.value)}
          className="w-full text-xs rounded-lg p-2.5 border border-slate-800 bg-slate-950 text-slate-200 outline-none resize-none leading-relaxed placeholder:text-slate-700 focus:border-sky-700 transition-colors"
        />
      </div>

      <button
        type="submit"
        className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white cursor-pointer transition-all active:scale-95 hover:scale-[1.01] border-0"
        style={{
          background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
          boxShadow: "0 4px 14px var(--accent-glow)",
        }}
      >
        Elevate My Permissions 🚀
      </button>
    </form>
  );
}

function ComplianceCertCard({ userName }: { userName: string }) {
  const uuid = useRef(`CERT-${Math.floor(100000 + Math.random() * 900000)}`).current;
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return (
    <div
      className="w-[88%] mt-3 p-6 rounded-2xl relative overflow-hidden select-none text-center animate-fadeIn"
      style={{
        background: "linear-gradient(135deg, #0a0a12 0%, #0f0f1e 50%, #0a0a12 100%)",
        border: "1px dashed rgba(245, 158, 11, 0.45)",
        boxShadow: "0 0 32px rgba(245, 158, 11, 0.1)",
      }}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-500/40 rounded-tl-2xl" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-500/40 rounded-tr-2xl" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-500/40 rounded-bl-2xl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-500/40 rounded-br-2xl" />

      {/* Glow orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-amber-500/3 blur-3xl pointer-events-none" />

      {/* Trophy icon */}
      <div className="text-3xl mb-2" style={{ filter: "drop-shadow(0 0 12px rgba(245, 158, 11, 0.6))" }}>🏆</div>

      <div className="text-[8px] font-black tracking-[0.25em] text-amber-500/70 uppercase mb-1">Envizor Compliance Authority</div>
      <div className="text-xs font-black text-amber-300 uppercase tracking-widest">Governance-as-Code Master</div>

      <div className="my-3 border-t border-b border-amber-500/10 py-3">
        <div className="text-[9px] text-slate-600 italic">This certificate is awarded to</div>
        <div className="text-sm font-black text-slate-200 uppercase tracking-wider mt-1">{userName}</div>
        <div className="text-[9px] text-slate-500 mt-1 leading-relaxed px-4">
          For demonstrating mastery of IaC governance, drift detection, HCL synthesis, and Zero-Trust access principles.
        </div>
      </div>

      <div className="flex justify-between items-end text-[8px] text-slate-700 font-mono">
        <div className="text-left">
          <div>SERIAL: <span className="text-amber-600/50">{uuid}</span></div>
          <div>ISSUED: {date}</div>
        </div>
        <div className="text-right">
          <div className="text-amber-600/50 font-bold">✓ ENVIZOR CORE AI</div>
          <div>VERIFIED</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RightDockedChatbot({
  panelState,
  onChangePanelState,
}: {
  panelState?: "standard" | "expanded" | "hidden";
  onChangePanelState?: (state: "standard" | "expanded" | "hidden") => void;
}) {
  const pathname = usePathname();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [avatarPulse, setAvatarPulse] = useState<"idle" | "thinking" | "success" | "warn" | "scan" | "deploy" | "elevation">("idle");

  // User identity
  const [userName, setUserName] = useState("user");
  const [userRole, setUserRole] = useState("BasicUser");
  const [userPermissions, setUserPermissions] = useState<string[]>(["tile-know-more"]);
  const [userAvatar, setUserAvatar] = useState<string>("👤");

  // JIT session
  const [jitActive, setJitActive] = useState(false);
  const [jitRole, setJitRole] = useState("");
  const [jitTimeLeft, setJitTimeLeft] = useState("");

  // Trivia state
  const [triviaActive, setTriviaActive] = useState(false);
  const [triviaIdx, setTriviaIdx] = useState(0);
  const [triviaScore, setTriviaScore] = useState(0);

  // Deploy flow state machine
  const [deployFlow, setDeployFlow] = useState<{
    step: "idle" | "artefact" | "source" | "target" | "navigate" | "guided_pull" | "guided_push" | "inspect_ws" | "compare_src" | "compare_tgt" | "guided_baseline" | "sync_src" | "sync_tgt";
    artefact?: string;
    source?: "DEV" | "PRE" | "PROD";
    target?: "DEV" | "PRE" | "PROD";
  }>({ step: "idle" });

  // Left panel state
  const [leftPanelType, setLeftPanelType] = useState<"none" | "explorer" | "compare" | "deploy">("none");
  const [currentWs, setCurrentWs] = useState<"DEV" | "PRE" | "PROD">("DEV");
  const [explorerTree, setExplorerTree] = useState<FileNode[]>([]);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [viewingContent, setViewingContent] = useState("");
  const [viewingLoading, setViewingLoading] = useState(false);

  // Compare state
  const [compareLeft, setCompareLeft] = useState<"DEV" | "PRE" | "PROD">("DEV");
  const [compareRight, setCompareRight] = useState<"DEV" | "PRE" | "PROD">("PRE");
  const [compareTree, setCompareTree] = useState<CompareNode | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [selectedCompareFile, setSelectedCompareFile] = useState<CompareNode | null>(null);

  // Deploy output state
  const [deployEnv, setDeployEnv] = useState<"DEV" | "PRE" | "PROD">("DEV");
  const [deployRunning, setDeployRunning] = useState(false);
  const [deployOutput, setDeployOutput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // ── Load session on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const user = sessionStorage.getItem("envizor_username") || "user";
    const overriddenRoles = localStorage.getItem("envizor_custom_roles");
    const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
    const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";
    setUserRole(latestRole);
    setUserName(user);

    const allPerms = localStorage.getItem("envizor_user_permissions");
    const permsMap = allPerms ? JSON.parse(allPerms) : {};
    setUserPermissions(permsMap[user.toLowerCase()] || ["tile-know-more"]);

    // Hydrate avatar
    const savedAvatar = localStorage.getItem(`envizor_user_avatar_${user.toLowerCase()}`) || "👤";
    setUserAvatar(savedAvatar);

    const savedMessages = sessionStorage.getItem("envizor_chat_messages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      initGreeting();
    }

    const savedFlow = sessionStorage.getItem("envizor_chat_flow");
    if (savedFlow) setDeployFlow(JSON.parse(savedFlow));
  }, []);

  // ── Synchronize avatar ───────────────────────────────────────────────────
  useEffect(() => {
    if (!userName) return;
    const handleAvatarChange = () => {
      const saved = localStorage.getItem(`envizor_user_avatar_${userName.toLowerCase()}`) || "👤";
      setUserAvatar(saved);
    };
    window.addEventListener("envizorAvatarChanged", handleAvatarChange);
    window.addEventListener("storage", handleAvatarChange);
    return () => {
      window.removeEventListener("envizorAvatarChanged", handleAvatarChange);
      window.removeEventListener("storage", handleAvatarChange);
    };
  }, [userName]);

  // ── JIT countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userName || userName === "user" || userName === "admin") return;
    const checkJit = () => {
      try {
        const jitData = localStorage.getItem("envizor_jit_access");
        if (!jitData) { setJitActive(false); return; }
        const jitMap = JSON.parse(jitData);
        const userJit = jitMap[userName.toLowerCase()];
        if (!userJit) { setJitActive(false); return; }
        const diffMs = userJit.expiresAt - Date.now();
        if (diffMs <= 0) {
          setJitActive(false);
        } else {
          setJitActive(true);
          setJitRole(userJit.targetRole);
          const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
          const mins = Math.floor(totalSecs / 60);
          const secs = totalSecs % 60;
          setJitTimeLeft(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
        }
      } catch { setJitActive(false); }
    };
    checkJit();
    const iv = setInterval(checkJit, 1000);

    const syncStorage = () => {
      checkJit();
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      setUserRole(rolesMap[userName.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser");
      const allPerms = localStorage.getItem("envizor_user_permissions");
      const permsMap = allPerms ? JSON.parse(allPerms) : {};
      setUserPermissions(permsMap[userName.toLowerCase()] || ["tile-know-more"]);
    };
    window.addEventListener("storage", syncStorage);
    window.addEventListener("envizorRoleChanged", syncStorage as any);
    return () => {
      clearInterval(iv);
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener("envizorRoleChanged", syncStorage as any);
    };
  }, [userName]);

  // ── Persist state ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      sessionStorage.setItem("envizor_chat_messages", JSON.stringify(messages));
      sessionStorage.setItem("envizor_chat_flow", JSON.stringify(deployFlow));
    }
  }, [messages, deployFlow]);

  // ── Page context event bus ────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePushUpdate = (e: any) => {
      const { command, output, env, reqId } = e.detail;
      if (command === "plan") {
        botReply(`📊 **Terraform Plan Executed on the Page!**\n\nDry-run simulation for **${env}** completed.\n\n**Next step:** Run \`terraform apply\` to deploy these changes.`, [{ label: "🚀 Run terraform apply", actionName: "run_apply" }]);
      } else if (command === "apply") {
        if (env === "PROD") {
          setAvatarPulse("warn");
          botReply(
            `🔒 **Production Release Gated & Staged!**\n\nDirect deployment to the **PROD** environment has been intercepted under zero-trust safety protocols.\n\nYour deployment is staged under Request ID: \`${reqId || "REQ-PENDING"}\`.\n\nPlease navigate to the **Admin Console** (as a SuperAdmin) to authorize this release before any changes are committed to disk!`,
            [
              { label: "⚙️ Open Admin Console", actionName: "launch_admin_console" },
              { label: "🔄 Start Fresh Flow", actionName: "deploy" }
            ]
          );
        } else {
          botReply(`🚀 **Terraform Apply Succeeded!**\n\nAll resources provisioned on **${env}** cloud tenant.`, [{ label: "📂 Browse Workspace Explorer", actionName: "workspaces" }]);
        }
      }
    };

    const handleBaselineUpdate = (e: any) => {
      const { tfPlan, terminalOutput, activeTab } = e.detail;
      if (tfPlan !== undefined && activeTab === "terraform") {
        botReply(`📊 **HCL Terraform baseline plan generated!**\n\nReady to initialize providers.`, [{ label: "⚙️ Run terraform init", actionName: "base_init" }]);
      }
      if (terminalOutput !== undefined && terminalOutput.includes("successfully initialized")) {
        botReply(`✅ **Terraform workspace initialized!**\n\nReady to publish baseline resources.`, [{ label: "🚀 Publish Baseline Workspace", actionName: "base_publish" }]);
      }
    };

    const handlePageContext = (e: any) => {
      const { page, action, payload } = e.detail as { page: string; action: string; payload?: Record<string, any> };
      if (page === "push" && action === "command_changed" && payload?.command) {
        const HINTS: Record<string, string> = {
          init: "⚙️ **`terraform init` selected** — Initialises backend and downloads the saviynt provider plugin.",
          plan: "📝 **`terraform plan` selected** — Runs a dry-run to preview changes. No modifications yet.",
          apply: "🚀 **`terraform apply` selected** — Deploys planned changes to your Saviynt tenant.",
          destroy: "💣 **`terraform destroy` selected** — ⚠️ Permanently destroys all managed resources.",
        };
        if (HINTS[payload.command]) botReply(HINTS[payload.command], []);
      }
      if (page === "diff" && action === "diff_loaded" && payload) {
        const { left, right, totalDiffs } = payload;
        botReply(`📊 **Drift Analysis: ${left} ↔ ${right}**\n\nFound **${totalDiffs} configuration differences**. Review the breakdown in the left panel.`, [{ label: "📋 Help/Overview", actionName: "help" }]);
      }
      if (page === "discovery" && action === "data_loaded" && payload) {
        const { env, counts } = payload;
        const total = Object.values(counts as Record<string, number>).reduce((a, b) => a + b, 0);
        botReply(`✅ **${env} Discovery Complete!**\n\nDiscovered **${total} artefacts** across Roles, Endpoints, Security Systems, and Connections.`, [{ label: "🚀 Push Changes", actionName: "deploy" }, { label: "🔀 Compare Environments", actionName: "compare" }]);
      }
    };

    window.addEventListener("envizor_push_update", handlePushUpdate);
    window.addEventListener("envizor_baseline_update", handleBaselineUpdate);
    window.addEventListener("envizor_page_context", handlePageContext);
    return () => {
      window.removeEventListener("envizor_push_update", handlePushUpdate);
      window.removeEventListener("envizor_baseline_update", handleBaselineUpdate);
      window.removeEventListener("envizor_page_context", handlePageContext);
    };
  }, []);

  // ── URL context on navigation ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const src = params.get("source") as any;
    const tgt = params.get("target") as any;
    const art = params.get("artefact") || "";
    if (action === "deploy_wizard" && pathname.includes("pull")) {
      const hasPullGreet = messages.some((m) => m.id === "guided_pull_greet");
      if (!hasPullGreet) {
        botReply(`🎯 **Guided Deployment: Pull Phase**\n\nDeploying **${art}** from **${src}** to **${tgt}**.\n\nFirst, let's fetch baseline configurations:`, [{ label: "⬇️ Fetch & Load Terraform files", actionName: "fetch_tf" }]);
      }
    }
  }, [pathname]);

  // ─── Role elevation engine ────────────────────────────────────────────────
  const elevateUserRole = (role: string, duration: string, justification: string) => {
    try {
      const user = userName || "user";
      const rolesMap = JSON.parse(localStorage.getItem("envizor_custom_roles") || "{}");
      rolesMap[user.toLowerCase()] = role === "DEV_Admin" ? "DEV Admin" : role === "PRE_Admin" ? "PRE Admin" : role === "PROD_Admin" ? "PROD Admin" : role;
      localStorage.setItem("envizor_custom_roles", JSON.stringify(rolesMap));

      const allPerms = JSON.parse(localStorage.getItem("envizor_user_permissions") || "{}");
      allPerms[user.toLowerCase()] = [
        "tile-know-more", "tile-day0-setup", "tile-iga-explorer",
        "tile-workspace-explorer", "tile-terraform-wizard", "tile-connected-app", "tile-analytics",
      ];
      localStorage.setItem("envizor_user_permissions", JSON.stringify(allPerms));

      if (duration !== "Permanent") {
        const hours = parseInt(duration.replace(/[^0-9]/g, "")) || 4;
        const jitMap = JSON.parse(localStorage.getItem("envizor_jit_access") || "{}");
        jitMap[user.toLowerCase()] = { targetRole: rolesMap[user.toLowerCase()], expiresAt: Date.now() + hours * 3600000, requestedAt: Date.now(), durationHours: hours };
        localStorage.setItem("envizor_jit_access", JSON.stringify(jitMap));
      } else {
        const jitMap = JSON.parse(localStorage.getItem("envizor_jit_access") || "{}");
        delete jitMap[user.toLowerCase()];
        localStorage.setItem("envizor_jit_access", JSON.stringify(jitMap));
      }

      const reqs = JSON.parse(localStorage.getItem("envizor_access_requests") || "[]");
      reqs.push({ id: `BOT-${Math.floor(1000 + Math.random() * 9000)}`, timestamp: new Date().toISOString(), username: user, tileId: "all-unlocked-bot", tileName: "Full Platform Unlock", requestedRole: rolesMap[user.toLowerCase()], justification, status: "APPROVED" });
      localStorage.setItem("envizor_access_requests", JSON.stringify(reqs));

      window.dispatchEvent(new CustomEvent("storage"));
      window.dispatchEvent(new CustomEvent("envizorRoleChanged"));
      setAvatarPulse("elevation");
      setTimeout(() => setAvatarPulse("idle"), 5000);
      playSynthSound("success");

      import("canvas-confetti").then((m) => m.default({ particleCount: 200, spread: 110, origin: { y: 0.5 } }));
    } catch (err) { console.error("Elevation failed:", err); }
  };

  // ─── Role request submit handler ──────────────────────────────────────────
  const handleRoleSubmit = (role: string, duration: string, justification: string) => {
    setAvatarPulse("thinking");
    setTimeout(() => {
      const isProd = role === "PROD_Admin" || role.includes("PROD");
      if (isProd) {
        try {
          const user = userName || "user";
          const reqs = JSON.parse(localStorage.getItem("envizor_access_requests") || "[]");
          const hours = parseInt(duration.replace(/[^0-9]/g, "")) || 4;
          const isJit = duration !== "Permanent";
          
          const newReq = {
            id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
            timestamp: new Date().toISOString(),
            username: user,
            tileId: "all-unlocked-bot",
            tileName: "Full Platform Unlock",
            requestedRole: "PROD Admin",
            justification,
            status: "PENDING" as const,
            isJit,
            jitDuration: isJit ? hours * 60 : undefined
          };
          
          reqs.push(newReq);
          localStorage.setItem("envizor_access_requests", JSON.stringify(reqs));
          window.dispatchEvent(new CustomEvent("storage"));
          
          setAvatarPulse("idle");
          addBotMessage(
            `⏳ **Role Request Staged — PENDING SUPERADMIN APPROVAL**\n\n` +
            `Your request to elevate your privileges to **PROD Admin** (${duration === "Permanent" ? "Permanent" : `${duration} JIT`}) has been successfully submitted to the governance approval queue.\n\n` +
            `🛡️ **Security Protocol**: Production environment elevations require manual validation by a registered SuperAdmin.\n\n` +
            `You can monitor the status of this request by asking me for *"my approvals"*, or by visiting your **Profile** page. Once the SuperAdmin reviews and approves it, your temporal session will activate instantly!`,
            [{ label: "📋 Check Approvals Queue", actionName: "approvals" }],
            undefined,
            true
          );
        } catch (e) {
          addBotMessage("⚠️ Failed to submit request to the queue.", undefined, undefined, true);
        }
      } else {
        elevateUserRole(role, duration, justification);
        const roleLabel = role === "DEV_Admin" ? "DEV Admin" : role === "PRE_Admin" ? "PRE Admin" : "PROD Admin";
        const durationLabel = duration === "Permanent" ? "permanent" : `${duration} JIT`;
        addBotMessage(`⚡ **AI Auto-Approver — ACCESS GRANTED**\n\nJustification reviewed and approved.\n\n✅ Your role has been elevated to **${roleLabel}** (${durationLabel}).\n\nAll locked tool tiles on your Welcome Hub are now **unlocked in real time**! Refresh or navigate back to the dashboard to access the full platform. Welcome to the inner circle! 🎉`, undefined, undefined, true);
      }
    }, 2000);
  };

  // ─── Trivia engine ────────────────────────────────────────────────────────
  const startTrivia = () => {
    setTriviaActive(true);
    setTriviaIdx(0);
    setTriviaScore(0);
    addBotMessage(
      "👾 **DevOps IaC Governance Trivia — activated!**\n\nAnswer 3 questions correctly to earn your **Compliance Certification** and unlock SuperAdmin privileges automatically!\n\nReady? Here's question 1 of 3:",
      undefined, undefined, true
    );
    setTimeout(() => {
      addBotMessage(TRIVIA[0].q, TRIVIA[0].options.map((o) => ({ label: o.label, actionName: `quiz_${o.ans}` })), undefined, true);
    }, 600);
  };

  const handleQuizAnswer = (ans: string) => {
    const q = TRIVIA[triviaIdx];
    const correct = ans === q.correct;
    const newScore = correct ? triviaScore + 1 : triviaScore;
    const nextIdx = triviaIdx + 1;

    const feedbackText = correct
      ? `✅ **Correct!**\n\n${q.expl}`
      : `❌ **Not quite.** The correct answer was **${q.options.find((o) => o.ans === q.correct)?.label}**\n\n${q.expl}`;

    addBotMessage(feedbackText, undefined, undefined, true);

    if (nextIdx < TRIVIA.length) {
      setTriviaIdx(nextIdx);
      setTriviaScore(newScore);
      setTimeout(() => {
        addBotMessage(
          `Question ${nextIdx + 1} of 3:\n\n${TRIVIA[nextIdx].q}`,
          TRIVIA[nextIdx].options.map((o) => ({ label: o.label, actionName: `quiz_${o.ans}` })),
          undefined, true
        );
      }, 800);
    } else {
      setTriviaActive(false);
      setTriviaScore(0);
      if (newScore === 3) {
        setTimeout(() => {
          addBotMessage(
            `${feedbackText}\n\n🏆 **PERFECT SCORE — 3/3!**\n\nOutstanding knowledge of IaC governance! Your **Compliance Master Certificate** is below, and your platform access has been elevated to **SuperAdmin** automatically!`,
            undefined, undefined, true
          );
          setTimeout(() => {
            addBotMessage("", undefined, "compliance_cert_card", true);
            elevateUserRole("SuperAdmin", "Permanent", "Trivia Governance Master — 3/3 Perfect Score");
          }, 600);
        }, 400);
      } else {
        setTimeout(() => {
          addBotMessage(
            `${feedbackText}\n\n🏁 **Quiz complete!** Score: **${newScore}/3**\n\nNot bad! Try again to aim for a perfect score — a 3/3 automatically unlocks **SuperAdmin** and generates your certificate!`,
            [{ label: "🔄 Play Again", actionName: "start_quiz" }, { label: "🔑 Request Access Now", actionName: "show_role_request" }],
            undefined, true
          );
        }, 400);
      }
    }
  };

  // ─── Core reply primitives ────────────────────────────────────────────────
  const addBotMessage = (
    text: string,
    options?: ChatMessage["options"],
    customElement?: ChatMessage["customElement"],
    useTypewriter?: boolean
  ) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), from: "bot", text, options, customElement, useTypewriter },
    ]);
  };

  const botReply = (
    text: string,
    options?: ChatMessage["options"],
    custom?: ChatMessage["customElement"]
  ) => {
    setAvatarPulse("thinking");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setAvatarPulse("idle");
      addBotMessage(text, options, custom, true);
    }, 420);
  };

  // ─── Greeting ─────────────────────────────────────────────────────────────
  const initGreeting = () => {
    let contextText = "";
    if (pathname?.includes("know-more")) {
      contextText = "You're exploring the **Ecosystem Guide** — I can explain any part of the pipeline in detail!";
    } else if (pathname?.includes("push")) {
      contextText = "You're in the **Deployment Console** — I can guide you through `terraform plan` and `apply` safely.";
    } else if (pathname?.includes("day0")) {
      contextText = "You're in the **IGA Tenant Explorer** — I can help with baseline scans and drift analysis.";
    } else if (pathname?.includes("analytics")) {
      contextText = "You're in the **Analytics Workbench** — I can help you construct and optimise SQL queries.";
    } else {
      contextText = "I'm **Envy**, your Envizor AI guide. I know everything about the platform — ask me anything, request access to locked tools, or play the IaC governance trivia game!";
    }

    const isBasicUser = userRole === "BasicUser";

    setMessages([
      {
        id: "greet",
        from: "bot",
        text: `👋 **Hello${userName !== "user" ? `, ${userName}` : ""}! Welcome to the Envizor Assistant.**\n\n${contextText}${isBasicUser ? "\n\n🔒 Your tiles are currently locked as **BasicUser** — ask me to **unlock your access** or **request a role** and I'll handle it right here!" : ""}`,
        options: [
          { label: "🚀 Start Interactive Deploy Flow", actionName: "deploy", desc: "Guided step-by-step credentials pulls, plans, and deployments" },
          { label: "📦 Baseline Workspace — Day 0", actionName: "baseline_start", desc: "Discover Saviynt tenants and baseline Terraform configurations" },
          { label: "🔀 Compare Staging Schema", actionName: "compare", desc: "Analyse drift between DEV, PRE, and PROD environments" },
          { label: "🔑 Request Role Access", actionName: "show_role_request", desc: "Unlock locked tiles — JIT or Permanent elevation" },
          { label: "⚙️ Explain the Pipeline", actionName: "explain_pipeline", desc: "Walk me through the 4-block governance pipeline" },
          { label: "👾 Play Trivia — Win SuperAdmin", actionName: "start_quiz", desc: "Answer 3 governance questions and earn a certificate" },
          { label: "🧭 Browse Workspace Explorer", actionName: "workspaces", desc: "Browse files and inspect generated Terraform workspaces" },
          { label: "📋 Help & Overview", actionName: "help", desc: "See all Envy's capabilities" },
        ],
        useTypewriter: true,
      },
    ]);
  };

  const handleStartOver = () => {
    sessionStorage.removeItem("envizor_chat_messages");
    sessionStorage.removeItem("envizor_chat_flow");
    setDeployFlow({ step: "idle" });
    setLeftPanelType("none");
    setTriviaActive(false);
    setMessages([]);
    initGreeting();
  };

  // ─── Access gating ────────────────────────────────────────────────────────
  const checkActionAllowed = (actionName: string): boolean => {
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (r === "SUPERADMIN") return true;
    const actionToTileMap: Record<string, string> = {
      launch_day0_setup: "tile-day0-setup",
      baseline_start: "tile-day0-setup",
      base_env_dev: "tile-day0-setup",
      base_env_pre: "tile-day0-setup",
      base_env_prod: "tile-day0-setup",
      compare: "tile-iga-explorer",
      cmp_src_dev: "tile-iga-explorer",
      cmp_src_pre: "tile-iga-explorer",
      cmp_src_prod: "tile-iga-explorer",
      workspaces: "tile-workspace-explorer",
      ws_dev: "tile-workspace-explorer",
      ws_pre: "tile-workspace-explorer",
      ws_prod: "tile-workspace-explorer",
      launch_wizard_home: "tile-terraform-wizard",
      deploy: "tile-terraform-wizard",
      launch_connected_app: "tile-connected-app",
      launch_analytics: "tile-analytics",
    };
    const tile = actionToTileMap[actionName];
    if (!tile) return true;
    if (r === "BASICUSER") return userPermissions.includes(tile);
    return true;
  };

  // ─── Action router ────────────────────────────────────────────────────────
  const handleActionNameClick = (name: string, label: string) => {
    // Add user echo
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: "user", text: label }]);
    playSynthSound("send");

    // ── Trivia answers ───
    if (name.startsWith("quiz_") && triviaActive) {
      handleQuizAnswer(name.replace("quiz_", ""));
      return;
    }

    // ── Quiz & role cards ─
    if (name === "start_quiz") { startTrivia(); return; }
    if (name === "show_role_request") {
      const r = userRole.replace(/\s+|_/g, "").toUpperCase();
      const hasMaxAccess = r === "SUPERADMIN" || r === "PRODADMIN";
      if (hasMaxAccess) {
        botReply(
          `👑 **Elevation Unnecessary**\n\nYou are already logged in as a **${userRole}**! You hold complete, unrestricted operational clearance across DEV, PRE, and PROD. There is no higher administrative tier to elevate to!`,
          [
            { label: "⚙️ Open Admin Console", actionName: "launch_admin_console" },
            { label: "🚀 Start Deploy Flow", actionName: "deploy" },
            { label: "📋 My Requests History", actionName: "approvals" },
          ]
        );
      } else {
        botReply("Sure! Fill out the access gating form below — choose a role, select JIT or Permanent, and I'll push your request to the AI Auto-Approver instantly! 🔑");
        setTimeout(() => addBotMessage("", undefined, "role_request_card", false), 700);
      }
      return;
    }
    if (name === "explain_pipeline") {
      botReply(ENVIZOR_KB.pipeline, [
        { label: "🔌 Explain Block 1: Scan", actionName: "kb_scan" },
        { label: "🔍 Explain Block 2: Reconcile", actionName: "kb_reconcile" },
        { label: "⚙️ Explain Block 3: HCL Compile", actionName: "kb_compile" },
        { label: "🚀 Explain Block 4: Deploy", actionName: "kb_deploy" },
      ]);
      return;
    }
    if (name === "kb_scan") { botReply(ENVIZOR_KB.pipeline.split("🔍")[0].trim(), [{ label: "Next: Reconcile →", actionName: "kb_reconcile" }]); return; }
    if (name === "kb_reconcile") { botReply(ENVIZOR_KB.reconcile ?? ENVIZOR_KB.drift, [{ label: "Next: HCL Compile →", actionName: "kb_compile" }]); return; }
    if (name === "kb_compile") { botReply(ENVIZOR_KB.terraform, [{ label: "Next: Deploy →", actionName: "kb_deploy" }]); return; }
    if (name === "kb_deploy") { botReply(ENVIZOR_KB.howto, [{ label: "🔑 Request Access to Try", actionName: "show_role_request" }]); return; }
    if (name === "kb_roles") { botReply(ENVIZOR_KB.roles, [{ label: "🔑 Request Access Now", actionName: "show_role_request" }]); return; }

    // ── Gate check ───
    if (!checkActionAllowed(name)) {
      playSynthSound("denied");
      setTimeout(() => {
        botReply(
          `🔒 **Access Gated**\n\nYour current role (**${userRole}**) doesn't have permission for this operation.\n\n💡 **Tip:** I can unlock your access right here in the chat — no need to navigate anywhere! Just click below to request elevation.`,
          [{ label: "🔑 Request Role Access Now", actionName: "show_role_request" }, { label: "👾 Play Trivia to Auto-Unlock", actionName: "start_quiz" }]
        );
      }, 400);
      return;
    }

    if (panelState === "expanded") {
      setTimeout(() => {
        botReply("💡 **Full-Page Mode Active**: The left panel is hidden. Click **⤭ Standard** to see the output panel alongside the chat.");
      }, 1000);
    }

    // ── Operational actions ───
    if (name === "launch_day0_setup") {
      setLeftPanelType("none");
      window.location.href = "/wizard/day0-setup";
      botReply("Opening **Day 0 Workspace Setup** — configure environment directories, enter tenant credentials, and bootstrap your baseline connections!");
    } else if (name === "launch_connected_app") {
      setLeftPanelType("none");
      window.location.href = "/wizard/connected-app";
      botReply("Launching **Connected Application JSON Generator** — generate REST, SCIM, Database, or CSV integration configuration suites.");
    } else if (name === "launch_analytics") {
      setLeftPanelType("none");
      window.location.href = "/wizard/analytics";
      botReply("Opening **SQL Analytics Workbench** — run relational queries on pre-seeded Saviynt Identity Cloud schemas.");
    } else if (name === "launch_admin_console") {
      setLeftPanelType("none");
      window.location.href = "/wizard/admin";
      botReply("Opening **SuperAdmin Console** — approve pending access requests and manage environment mappings!");
    } else if (name === "launch_wizard_home") {
      setLeftPanelType("none");
      window.location.href = "/wizard/home";
      botReply("Opening **DevOps Terraform Wizard** — generate HCL files and run operations on workspace directories.");
    } else if (name === "launch_know_more") {
      setLeftPanelType("none");
      window.location.href = "/wizard/know-more";
      botReply("Opening the **Ecosystem Guide** — a full interactive walkthrough of the Envizor governance pipeline.");
    } else if (name === "deploy") {
      setDeployFlow({ step: "artefact" });
      window.location.href = "/wizard/push?command=init";
      setLeftPanelType("none");
      botReply("Let's begin guided deployment! Which Saviynt artefacts do you want to deploy?", [
        { label: "🛡️ Security Systems", actionName: "art_sec" },
        { label: "🔌 Endpoints", actionName: "art_end" },
        { label: "🔗 Connections", actionName: "art_conn" },
        { label: "📦 All Baseline Assets", actionName: "art_all" },
      ]);
    } else if (name.startsWith("art_")) {
      const art = label.replace(/[^a-zA-Z0-9\s]/g, "").trim();
      setDeployFlow((prev) => ({ ...prev, step: "source", artefact: art }));
      botReply(`Selected **${art}**. Now choose the **Source Environment** (source of truth):`, [
        { label: "DEV", actionName: "src_dev" },
        { label: "PRE", actionName: "src_pre" },
        { label: "PROD", actionName: "src_prod" },
      ]);
    } else if (name.startsWith("src_")) {
      const src = label.replace(/[^a-zA-Z]/g, "").trim() as any;
      setDeployFlow((prev) => ({ ...prev, step: "target", source: src }));
      const remainders = (["DEV", "PRE", "PROD"] as const).filter((x) => x !== src);
      botReply(`Source: **${src}**. Choose the **Target Environment**:`, remainders.map((r) => ({ label: r, actionName: `tgt_${r.toLowerCase()}` })));
    } else if (name.startsWith("tgt_")) {
      const tgt = label.replace(/[^a-zA-Z]/g, "").trim() as any;
      setDeployFlow((prev) => ({ ...prev, step: "navigate", target: tgt }));
      botReply(`📋 **Deployment Strategy Ready**\n\n• **Artefact**: ${deployFlow.artefact}\n• **Source**: ${deployFlow.source}\n• **Target**: ${tgt}\n\nClick below to prefill and fetch baselines automatically:`, [], "deploy_button");
    } else if (name === "fetch_tf") {
      triggerFetchTF(deployFlow.source || "DEV", deployFlow.artefact || "All Assets");
    } else if (name === "write_files") {
      triggerWriteLocalFiles();
    } else if (name === "run_plan") {
      executeTfCommand(deployFlow.target || "PRE", "plan");
    } else if (name === "run_apply") {
      executeTfCommand(deployFlow.target || "PRE", "apply");
    } else if (name === "workspaces") {
      setDeployFlow({ step: "inspect_ws" });
      triggerExploreWorkspaces();
    } else if (name.startsWith("ws_")) {
      openWorkspace(label.replace(/[^a-zA-Z]/g, "") as any);
    } else if (name === "compare") {
      setDeployFlow({ step: "compare_src" });
      window.location.href = "/wizard/day0/diff?action=compare_wizard";
    } else if (name.startsWith("cmp_src_")) {
      const src = label.replace(/[^a-zA-Z]/g, "").trim() as any;
      setCompareLeft(src);
      setDeployFlow({ step: "compare_tgt" });
      window.location.href = `/wizard/day0/diff?left=${src}&action=compare_wizard`;
    } else if (name.startsWith("cmp_tgt_")) {
      setDeployFlow({ step: "idle" });
      const tgt = label.replace(/[^a-zA-Z]/g, "").trim() as any;
      setCompareRight(tgt);
      window.location.href = `/wizard/day0/diff?left=${compareLeft}&right=${tgt}&action=compare_wizard`;
    } else if (name === "sync_action") {
      window.dispatchEvent(new CustomEvent("envizor_diff_sync_trigger", { detail: { left: compareLeft, right: compareRight } }));
      botReply("🖥️ **Sync confirmation modal** activated on the left panel. Review the changed files and click **Confirm & Sync Workspaces**.");
    } else if (name === "sync_start") {
      setDeployFlow({ step: "sync_src" });
      window.location.href = "/wizard/steps/source-workspace?source=DEV&target=PRE";
    } else if (name.startsWith("sync_src_")) {
      const src = label.replace(/[^a-zA-Z]/g, "").trim() as any;
      setCompareLeft(src);
      window.location.href = `/wizard/steps/source-workspace?source=${src}&target=PRE`;
    } else if (name.startsWith("sync_tgt_")) {
      setDeployFlow({ step: "idle" });
      const tgt = label.replace(/[^a-zA-Z]/g, "").trim() as any;
      setCompareRight(tgt);
      window.location.href = `/wizard/steps/source-workspace?source=${compareLeft}&target=${tgt}`;
    } else if (name === "help") {
      botReply(`💡 **Envy — Your Envizor AI Guide**\n\nHere's what I can do:\n\n• **Answer questions** about Envizor, Terraform, drift detection, IGA governance\n• **Explain the 4-block pipeline** — Scan → Reconcile → Compile → Deploy\n• **Request role access** — unlock locked tiles right here in chat (JIT or Permanent)\n• **Guide deployments** — step-by-step artefact selection, environment targeting, and terraform execution\n• **Run the Trivia Game** — score 3/3 to win a certificate and auto-unlock SuperAdmin!\n\nJust type naturally — I understand free-form questions! 💬`, [
        { label: "🔑 Request Access", actionName: "show_role_request" },
        { label: "👾 Play Trivia", actionName: "start_quiz" },
        { label: "⚙️ Explain Pipeline", actionName: "explain_pipeline" },
      ]);
    } else if (name === "baseline_start") {
      setDeployFlow({ step: "guided_baseline" });
      window.location.href = "/wizard/day0/baseline?action=baseline_wizard";
    } else if (name.startsWith("base_env_")) {
      const env = name.replace("base_env_", "").toUpperCase();
      setDeployFlow((prev) => ({ ...prev, step: "guided_baseline", source: env as any }));
      executeBaselineEnvCheck(env);
    } else if (name === "base_ws_create") {
      executeBaselineStart(deployFlow.source || "DEV", "create");
    } else if (name === "base_ws_empty") {
      executeBaselineStart(deployFlow.source || "DEV", "empty");
    } else if (name === "base_ws_keep") {
      executeBaselineStart(deployFlow.source || "DEV", "keep");
    } else if (name === "base_gen_tf") {
      executeBaselineGenerateTf();
    } else if (name === "base_init") {
      executeBaselineInit(deployFlow.source || "DEV");
    } else if (name === "base_publish") {
      executeBaselinePublish(deployFlow.source || "DEV");
    }
  };

  // ─── Baseline operations ──────────────────────────────────────────────────
  const executeBaselineEnvCheck = async (env: string) => {
    setAvatarPulse("scan");
    botReply(`⚙️ Checking **${env}** workspace folder...`);
    setTyping(true);
    try {
      const res = await fetch(`/api/env/${env}`);
      const exists = res.status !== 404;
      const json = exists ? await res.json() : { files: [] };
      if (!exists) {
        botReply(`📁 **${env}** workspace doesn't exist yet. Create it?`, [
          { label: "📁 Yes, create it", actionName: "base_ws_create" },
          { label: "❌ Cancel", actionName: "deploy" },
        ]);
      } else {
        botReply(`📂 **${env}** workspace exists with **${json.files?.length ?? 0}** files. Empty it for a clean baseline?`, [
          { label: "🗑️ Yes, empty it", actionName: "base_ws_empty" },
          { label: "📂 Keep existing", actionName: "base_ws_keep" },
        ]);
      }
    } catch { botReply("⚠️ Failed to check workspace folder."); }
    finally {
      setTyping(false);
      setAvatarPulse("idle");
    }
  };

  const executeBaselineStart = async (env: string, decision: "create" | "empty" | "keep") => {
    setAvatarPulse("scan");
    botReply("⚙️ Initialising baseline operations...");
    setTyping(true);
    try {
      if (decision === "create") { await fetch(`/api/env/${env}`, { method: "POST" }); }
      else if (decision === "empty") { await fetch(`/api/env/${env}`, { method: "DELETE" }); await fetch(`/api/env/${env}`, { method: "POST" }); }
      botReply(`🔄 Pulling baseline configs from **${env}** Saviynt tenant...`);
      const res = await fetch(`/api/day0/discovery?env=${env}`);
      const json = await res.json();
      const mapped = Object.entries(json).filter(([_, items]) => Array.isArray(items)).map(([key, items]) => ({
        key, label: key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
        items: (items as any[]).map((i) => typeof i === "string" ? i : i.name ?? i.id ?? JSON.stringify(i)),
      }));
      sessionStorage.setItem("envizor_baseline_artefacts", JSON.stringify(mapped));
      sessionStorage.setItem("envizor_baseline_activeTab", "workspace");
      window.dispatchEvent(new CustomEvent("envizor_baseline_update", { detail: { artefacts: mapped, activeTab: "workspace" } }));
      botReply(`✅ **Pulled ${mapped.reduce((s, c) => s + c.items.length, 0)} artefacts** across ${mapped.length} categories! Generate HCL files?`, [{ label: "⚡ Generate HCL Files", actionName: "base_gen_tf" }]);
    } catch { botReply("⚠️ Failed to baseline assets."); } finally {
      setTyping(false);
      setAvatarPulse("idle");
    }
  };

  const executeBaselineGenerateTf = () => {
    botReply("⚙️ Generating Terraform file plan...");
    try {
      const saved = sessionStorage.getItem("envizor_baseline_artefacts");
      const artefacts = saved ? JSON.parse(saved) : [];
      const plan = artefacts.map((cat: any) => ({ key: cat.key, label: cat.label, files: cat.items.map((name: string) => `${cat.key}_${name.replace(/_(DEV|PRE|PROD)$/i, "")}.tf`) }));
      sessionStorage.setItem("envizor_baseline_tfPlan", JSON.stringify(plan));
      sessionStorage.setItem("envizor_baseline_activeTab", "terraform");
      window.dispatchEvent(new CustomEvent("envizor_baseline_update", { detail: { tfPlan: plan, activeTab: "terraform" } }));
      botReply("📊 **HCL Terraform plan generated!** Check the Terraform Artefacts tab. Ready to init?", [{ label: "⚙️ Run terraform init", actionName: "base_init" }]);
    } catch { botReply("⚠️ Failed to generate HCL plan."); }
  };

  const executeBaselineInit = async (env: string) => {
    setAvatarPulse("scan");
    botReply(`⚙️ Running \`terraform init\` on **${env}** workspace...`);
    setTyping(true);
    window.dispatchEvent(new CustomEvent("envizor_baseline_update", { detail: { activeTab: "terminal", initRunning: true } }));
    try {
      const writeTf = (path: string, content: string) => fetch(`/api/env/${env}/write`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullPath: path, content }) });
      await Promise.all([
        writeTf("provider.tf", `terraform { required_providers { saviynt = { source = "saviynt/saviynt" } } }`),
        writeTf("backend.tf", `terraform { backend "local" {} }`),
        writeTf(`${env.toLowerCase()}.tfvars`, `environment = "${env}"`),
      ]);
      const log = `$ terraform init\n\nInitializing backend...\nInstalling saviynt/saviynt v1.3.4...\n\nTerraform has been successfully initialized!\n\n`;
      sessionStorage.setItem("envizor_baseline_terminalOutput", log);
      window.dispatchEvent(new CustomEvent("envizor_baseline_update", { detail: { terminalOutput: log, activeTab: "terminal", initRunning: false } }));
      botReply("✅ **Workspace initialized!** Ready to publish baseline resources?", [{ label: "🚀 Publish Baseline Workspace", actionName: "base_publish" }]);
    } catch { botReply("⚠️ Failed to run terraform init."); window.dispatchEvent(new CustomEvent("envizor_baseline_update", { detail: { initRunning: false } })); }
    finally {
      setTyping(false);
      setAvatarPulse("idle");
    }
  };

  const executeBaselinePublish = async (env: string) => {
    setAvatarPulse("deploy");
    botReply("🚀 Publishing baseline resource configurations to disk...");
    setTyping(true);
    try {
      const writeTf = (path: string, content: string) => fetch(`/api/env/${env}/write`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullPath: path, content }) });
      await Promise.all([
        writeTf("provider.tf", `terraform {\n  required_providers {\n    saviynt = {\n      source = "saviynt/saviynt"\n    }\n  }\n}`),
        writeTf("backend.tf", `terraform {\n  backend "local" {}\n}`),
        writeTf(`${env.toLowerCase()}.tfvars`, `environment = "${env}"`),
      ]);
      const selectionPayload: Record<string, string[]> = {};
      const rawStored = sessionStorage.getItem("envizor_baseline_raw_discovery");
      if (rawStored) {
        const rawJson = JSON.parse(rawStored);
        Object.entries(rawJson).forEach(([key, items]) => { if (Array.isArray(items)) selectionPayload[key] = items.map((i: any) => typeof i === "string" ? i : i.name ?? i.id ?? JSON.stringify(i)); });
      } else {
        const saved = sessionStorage.getItem("envizor_baseline_artefacts");
        const artefacts = saved ? JSON.parse(saved) : [];
        for (const cat of artefacts) selectionPayload[cat.key] = cat.items;
      }
      const pullRes = await fetch("/api/wizard/pull", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ env, selection: selectionPayload }) });
      let totalCreated = 0;
      let currentLog = sessionStorage.getItem("envizor_baseline_terminalOutput") || "";
      currentLog += `$ terraform apply -auto-approve\n\n`;
      if (pullRes.ok) {
        const { files = {} } = await pullRes.json();
        for (const [filePath, hclContent] of Object.entries(files)) {
          currentLog += `saviynt_resource.${filePath}: Creating...\n`;
          window.dispatchEvent(new CustomEvent("envizor_baseline_update", { detail: { terminalOutput: currentLog } }));
          await writeTf(filePath, hclContent as string);
          currentLog += `saviynt_resource.${filePath}: Creation complete\n`;
          window.dispatchEvent(new CustomEvent("envizor_baseline_update", { detail: { terminalOutput: currentLog } }));
          totalCreated++;
        }
      }
      currentLog += `\nApply complete! Resources: ${totalCreated} created, 0 changed, 0 destroyed.\n`;
      sessionStorage.setItem("envizor_baseline_terminalOutput", currentLog);
      window.dispatchEvent(new CustomEvent("envizor_baseline_update", { detail: { terminalOutput: currentLog } }));
      try { await fetch("/api/day0/workspace-settings/push", { method: "POST" }); } catch {}
      try { const confetti = (await import("canvas-confetti")).default; confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }); } catch {}
      botReply(`🎉 **Baseline published for ${env}!**\n\nAll HCL resource configurations are on disk. Taking you back to Day 0 Setup to verify onboarding checklist items.`);
      setTimeout(() => { window.location.href = `/wizard/day0-setup?publish_success=true&env=${env}`; }, 2500);
    } catch { botReply("⚠️ Failed to publish baseline files."); } finally {
      setTyping(false);
      setAvatarPulse("idle");
    }
  };

  const triggerFetchTF = async (src: string, art: string) => {
    setAvatarPulse("scan");
    botReply(`⚙️ Loading **${art}** baselines from **${src}**...`);
    setTyping(true);
    try {
      await fetch("/api/wizard/pull", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ env: src, selection: { securitySystems: art.includes("Security") || art.includes("All") ? ["HR_SYSTEM", "FINANCE_SYSTEM"] : [], endpoints: art.includes("Endpoint") || art.includes("All") ? ["HR_API_ENDPOINT"] : [], connections: art.includes("Connection") || art.includes("All") ? ["DB_CONNECTION"] : [] } }) });
      setLeftPanelType("explorer");
      setCurrentWs(src as any);
      const treeRes = await fetch(`/api/workspaces/${src}/tree`);
      const treeData = await treeRes.json();
      setExplorerTree(treeData);
      botReply("✅ **Configurations retrieved!** Write them to the local workspace?", [{ label: "✍️ Write & Save local files", actionName: "write_files" }]);
    } catch { botReply("⚠️ Failed to baseline assets."); } finally {
      setTyping(false);
      setAvatarPulse("idle");
    }
  };

  const triggerWriteLocalFiles = () => {
    botReply("✍️ Saving baseline modules to workspace disk...");
    setTyping(true);
    setTimeout(() => {
      botReply(`🎉 **Files baselined!** Local workspaces updated. Open Deploy Console?`, [], "explorer_button");
      setTyping(false);
    }, 1200);
  };

  const executeTfCommand = async (env: string, cmd: string) => {
    setLeftPanelType("deploy");
    setDeployEnv(env as any);
    setDeployRunning(true);
    setDeployOutput(`$ terraform ${cmd}\n`);
    if (cmd === "apply") {
      setAvatarPulse("deploy");
    } else {
      setAvatarPulse("scan");
    }
    botReply(`⚙️ Executing \`terraform ${cmd}\` on **${env}**...`);

    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (env === "PROD" && cmd === "apply" && r !== "SUPERADMIN") {
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

          setDeployOutput(customLog);
          setAvatarPulse("warn");
          setTimeout(() => setAvatarPulse("idle"), 4000);

          botReply(
            `🔒 **Production Deploy Gated & Staged!**\n\nDirect deployment to the **PROD** environment is strictly restricted under Zero-Trust protocols.\n\nYour \`terraform apply\` request has been intercepted and queued for SuperAdmin approval:\n• **Request ID**: \`${reqId}\`\n• **Staged Config**: 3 HCL resources\n\nI have logged the security details to your active terminal. Please head to the **Admin Console** (as a SuperAdmin) to review and authorize this deployment!`,
            [
              { label: "⚙️ Open Admin Console", actionName: "launch_admin_console" },
              { label: "🔄 Start Fresh Flow", actionName: "deploy" }
            ]
          );

          // Dispatch custom event to notify page components listening
          window.dispatchEvent(new CustomEvent("envizor_push_update", {
            detail: { command: "apply", output: customLog, env: "PROD" }
          }));

        } catch (e) {
          setDeployOutput("⚠️ Failed to stage production approval request.");
          botReply("⚠️ Failed to stage production approval request.");
        } finally {
          setDeployRunning(false);
        }
      }, 1200);
      return;
    }

    try {
      const res = await fetch("/api/wizard/push/command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ env, command: cmd }) });
      const data = await res.json();
      setDeployOutput((prev) => prev + (data.output || "Execution completed."));
      if (cmd === "plan") {
        setAvatarPulse("idle");
        botReply("📊 **Plan preview compiled!** Review the terminal. Ready to apply?", [{ label: "🚀 Run terraform apply", actionName: "run_apply" }]);
      } else {
        setAvatarPulse("success");
        setTimeout(() => setAvatarPulse("idle"), 4000);
        botReply(`🎉 **Deployment Succeeded!** All configurations synced on **${env}**.`, [{ label: "🔄 Start fresh flow", actionName: "deploy" }]);
      }
    } catch {
      setAvatarPulse("warn");
      setTimeout(() => setAvatarPulse("idle"), 4000);
      botReply("⚠️ Execution failed.");
    } finally { setDeployRunning(false); }
  };

  const triggerExploreWorkspaces = () => {
    botReply("Which workspace environment do you want to inspect?", [
      { label: "DEV", actionName: "ws_dev" },
      { label: "PRE", actionName: "ws_pre" },
      { label: "PROD", actionName: "ws_prod" },
    ]);
  };

  const openWorkspace = async (ws: "DEV" | "PRE" | "PROD") => {
    setCurrentWs(ws);
    window.location.href = `/wizard/explorer/discovery?env=${ws}`;
    setLeftPanelType("none");
    setExplorerLoading(true);
    setViewingFile(null);
    botReply(`🔍 Loading **${ws}** directory tree...`);
    try {
      const res = await fetch(`/api/workspaces/${ws}/tree`);
      const tree = await res.json();
      setExplorerTree(tree);
      botReply("📂 **Workspace Explorer active!** Directory layout loaded in the left panel.");
    } catch { botReply("⚠️ Failed to load workspace tree."); } finally { setExplorerLoading(false); }
  };

  // ─── Free-text NLU handler ────────────────────────────────────────────────
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const txt = input.trim();
    if (!txt) return;
    playSynthSound("send");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: "user", text: txt }]);
    setInput("");
    setAvatarPulse("thinking");
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      setAvatarPulse("idle");
      const lower = txt.toLowerCase();

      // ── Trivia answer detection ─
      if (triviaActive && (lower.includes("option a") || lower.startsWith("a)") || lower === "a" || lower.startsWith("a "))) {
        handleQuizAnswer("a"); return;
      }
      if (triviaActive && (lower.includes("option b") || lower.startsWith("b)") || lower === "b" || lower.startsWith("b "))) {
        handleQuizAnswer("b"); return;
      }
      if (triviaActive && (lower.includes("option c") || lower.startsWith("c)") || lower === "c" || lower.startsWith("c "))) {
        handleQuizAnswer("c"); return;
      }

      // ── Knowledge NLU intent classification (Takes absolute priority over guided flow intercepts) ─
      const intent = classifyIntent(txt);
      if (intent !== "unknown") {
        switch (intent) {
          case "greet":
            addBotMessage(`Hey ${userName !== "user" ? userName : "there"}! 👋 Great to see you. I'm **Envy**, your Envizor platform guide.\n\nWhat can I help you with today? You can ask me anything about the platform, request role access to unlock tools, or even play the IaC governance trivia game!`, [
              { label: "🔑 Request Role Access", actionName: "show_role_request" },
              { label: "👾 Play Trivia", actionName: "start_quiz" },
              { label: "⚙️ Explain the Pipeline", actionName: "explain_pipeline" },
            ], undefined, true);
            break;
          case "mission":
            addBotMessage(ENVIZOR_KB.mission, [{ label: "⚙️ Explain the Pipeline", actionName: "explain_pipeline" }, { label: "🔑 Request Access", actionName: "show_role_request" }], undefined, true);
            break;
          case "pipeline":
            addBotMessage(ENVIZOR_KB.pipeline, [{ label: "🔌 Block 1: Scan", actionName: "kb_scan" }, { label: "🔍 Block 2: Reconcile", actionName: "kb_reconcile" }, { label: "⚙️ Block 3: Compile", actionName: "kb_compile" }, { label: "🚀 Block 4: Deploy", actionName: "kb_deploy" }], undefined, true);
            break;
          case "drift":
            addBotMessage(ENVIZOR_KB.drift, [{ label: "🔀 Start Drift Comparison", actionName: "compare" }, { label: "🔑 Request Access to Reconciler", actionName: "show_role_request" }], undefined, true);
            break;
          case "jit":
            addBotMessage(ENVIZOR_KB.jit, [{ label: "⚡ Request JIT Access Now", actionName: "show_role_request" }], undefined, true);
            break;
          case "roles":
            addBotMessage(ENVIZOR_KB.roles, [{ label: "🔑 Request Role Elevation", actionName: "show_role_request" }, { label: "👾 Win Roles via Trivia", actionName: "start_quiz" }], undefined, true);
            break;
          case "terraform":
            addBotMessage(ENVIZOR_KB.terraform, [{ label: "🚀 Try the Deploy Wizard", actionName: "deploy" }, { label: "🔑 Request Access", actionName: "show_role_request" }], undefined, true);
            break;
          case "howto":
            addBotMessage(ENVIZOR_KB.howto, [{ label: "🔑 Request Role Access", actionName: "show_role_request" }, { label: "⚙️ Day 0 Setup", actionName: "launch_day0_setup" }], undefined, true);
            break;
          case "request_access": {
            const r = userRole.replace(/\s+|_/g, "").toUpperCase();
            const hasMaxAccess = r === "SUPERADMIN" || r === "PRODADMIN";
            if (hasMaxAccess) {
              addBotMessage(
                `👑 **Elevation Unnecessary**\n\nYou are already authenticated with **${userRole}** status!\n\nYou hold absolute administrative control and full deployment privileges across all DEV, PRE, and PROD environments. There are no higher permissions to request!\n\nWhat would you like to do next?`,
                [
                  { label: "⚙️ Open Admin Console", actionName: "launch_admin_console" },
                  { label: "🚀 Start guided Deploy Flow", actionName: "deploy" },
                  { label: "📋 My Requests History", actionName: "approvals" },
                ],
                undefined,
                true
              );
            } else {
              addBotMessage("Of course! I'll open the secure access gating form right here in the chat. Select your role, choose JIT or Permanent, add a justification, and I'll handle the rest! 🔑", undefined, undefined, true);
              setTimeout(() => addBotMessage("", undefined, "role_request_card", false), 700);
            }
            break;
          }
          case "start_quiz":
            startTrivia();
            break;
          case "deploy":
            handleActionNameClick("deploy", "Start Deploy Flow");
            break;
          case "workspaces":
            setDeployFlow({ step: "inspect_ws" });
            triggerExploreWorkspaces();
            break;
          case "compare":
            setDeployFlow({ step: "compare_src" });
            window.location.href = "/wizard/day0/diff?action=compare_wizard";
            break;
          case "analytics":
            handleActionNameClick("launch_analytics", "Launch Analytics");
            break;
          case "help":
            handleActionNameClick("help", "Help & Overview");
            break;
          case "reset":
            handleStartOver();
            break;
          case "approvals": {
            try {
              const raw = localStorage.getItem("envizor_access_requests");
              const reqs = raw ? JSON.parse(raw) : [];
              const user = userName || "user";
              
              const userReqs = reqs.filter((r: any) => r.username?.toLowerCase() === user.toLowerCase());
              const pending = userReqs.filter((r: any) => r.status === "PENDING").length;
              
              let reply = "";
              if (userReqs.length === 0) {
                reply = `📋 **Access Request Registry**\n\nYou currently have **no access requests** filed today.\n\n💡 **Tip:** You can request elevated environment privileges right here by saying *"request access"*!`;
              } else {
                reply = `📋 **Access Request Registry**\n\nYou have filed **${userReqs.length} access request${userReqs.length > 1 ? "s" : ""}** today:\n\n`;
                userReqs.forEach((r: any) => {
                  const statusEmoji = r.status === "APPROVED" ? "🟢" : r.status === "PENDING" ? "🟡" : "🔴";
                  const roleLabel = r.requestedRole || "DEV Admin";
                  const timeStr = r.timestamp ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently";
                  reply += `• **[${timeStr}]** Request for **${r.tileName || "Environment Scope"}** (${roleLabel}): ${statusEmoji} **${r.status}**\n`;
                });
                
                if (pending > 0) {
                  reply += `\n⏳ **${pending} pending request${pending > 1 ? "s" : ""}** is currently in the queue awaiting SuperAdmin review.`;
                }
              }
              
              if (userRole === "SuperAdmin") {
                const globalPending = reqs.filter((r: any) => r.status === "PENDING").length;
                if (globalPending > 0) {
                  reply += `\n\n🛡️ **SuperAdmin Alert**: There are **${globalPending} pending approval${globalPending > 1 ? "s" : ""}** in the system approval catalog. Click below to view the Admin Console.`;
                }
              }
              
              addBotMessage(reply, userRole === "SuperAdmin" ? [{ label: "⚙️ Open Admin Console", actionName: "launch_admin_console" }] : [{ label: "🔑 Request Access", actionName: "show_role_request" }], undefined, true);
            } catch (e) {
              addBotMessage("📋 **Access Request Registry**\n\nI was unable to load your requests from session storage at this time.", undefined, undefined, true);
            }
            break;
          }
          case "locked_tiles": {
            const isBasic = userRole === "BasicUser";
            if (!isBasic) {
              addBotMessage(
                `Wait a second... 🕵️‍♀️ According to my active directory records, you are already authenticated with **${userRole}** privileges!\n\nAll of your tool tiles (Baseline, Compare, Deploy, Analytics) should be wide open and unlocked! 🔓\n\nAre you trying to test my intelligence, or is there a genuine display glitch? If you want to check your active access credentials, say *"my requests"*, or if you're just having fun, we can always play the trivia game! 👾`,
                [
                  { label: "📋 My Requests History", actionName: "approvals" },
                  { label: "👾 Play Trivia Challenge", actionName: "start_quiz" },
                  { label: "🔑 Explain Role Hierarchy", actionName: "kb_roles" },
                ],
                undefined,
                true
              );
            } else {
              addBotMessage(
                `Ah! I see what's happening. 🔒\n\nAs a **BasicUser** (your default role), you only have access to the Welcome Hub Ecosystem Guide tile. The rest of the high-performance modules — **Baseline Setup**, **Drift Reconciler**, **DevOps Terraform Wizard**, and **SQL Analytics Workbench** — are locked and gated behind role-based access control to maintain strict security compliance.\n\nBut here is the good news: I'm authorized to route role elevation requests directly to the AI Auto-Approver! You can unlock the entire dashboard in under 2 seconds right here in the chat.\n\nWhat would you like to do?`,
                [
                  { label: "🔑 Request Access Now", actionName: "show_role_request" },
                  { label: "👾 Play Trivia to Auto-Unlock", actionName: "start_quiz" },
                  { label: "🔑 Explain Role Hierarchy", actionName: "kb_roles" },
                ],
                undefined,
                true
              );
            }
            break;
          }
        }
        return;
      }

      // ── Guided flow parsing (Executed only if input was NOT matched by NLU) ─
      if (deployFlow.step === "artefact") {
        if (lower.includes("security") || lower.includes("sec")) handleActionNameClick("art_sec", "🛡️ Security Systems");
        else if (lower.includes("endpoint") || lower.includes("end")) handleActionNameClick("art_end", "🔌 Endpoints");
        else if (lower.includes("connection") || lower.includes("conn")) handleActionNameClick("art_conn", "🔗 Connections");
        else if (lower.includes("all") || lower.includes("baseline")) handleActionNameClick("art_all", "📦 All Baseline Assets");
        else addBotMessage("I couldn't quite map that to our current step in the guided flow. 🤔\n\nIf you want to exit and ask something else, say *'cancel'* or *'reset'*!\n\nOtherwise, please select an artefact type: **Security Systems**, **Endpoints**, **Connections**, or **All Baseline Assets**.", undefined, undefined, true);
        return;
      }
      if (deployFlow.step === "source") {
        if (lower.includes("dev")) handleActionNameClick("src_dev", "DEV");
        else if (lower.includes("pre")) handleActionNameClick("src_pre", "PRE");
        else if (lower.includes("prod")) handleActionNameClick("src_prod", "PROD");
        else addBotMessage("I couldn't quite map that to our current step. 🤔 If you want to cancel, say *'cancel'*.\n\nOtherwise, please choose **DEV**, **PRE**, or **PROD** as your source environment.", undefined, undefined, true);
        return;
      }
      if (deployFlow.step === "target") {
        if (lower.includes("dev")) handleActionNameClick("tgt_dev", "DEV");
        else if (lower.includes("pre")) handleActionNameClick("tgt_pre", "PRE");
        else if (lower.includes("prod")) handleActionNameClick("tgt_prod", "PROD");
        else addBotMessage("I couldn't quite map that to our current step. 🤔 If you want to cancel, say *'cancel'*.\n\nOtherwise, please choose **DEV**, **PRE**, or **PROD** as your target environment.", undefined, undefined, true);
        return;
      }
      if (deployFlow.step === "inspect_ws") {
        if (lower.includes("dev")) handleActionNameClick("ws_dev", "DEV");
        else if (lower.includes("pre")) handleActionNameClick("ws_pre", "PRE");
        else if (lower.includes("prod")) handleActionNameClick("ws_prod", "PROD");
        else addBotMessage("I couldn't quite map that to our current step. 🤔 If you want to cancel, say *'cancel'*.\n\nOtherwise, which workspace would you like to inspect: **DEV**, **PRE**, or **PROD**?", undefined, undefined, true);
        return;
      }
      if (deployFlow.step === "compare_src") {
        if (lower.includes("dev")) handleActionNameClick("cmp_src_dev", "DEV");
        else if (lower.includes("pre")) handleActionNameClick("cmp_src_pre", "PRE");
        else if (lower.includes("prod")) handleActionNameClick("cmp_src_prod", "PROD");
        else addBotMessage("I couldn't quite map that to our current step. 🤔 If you want to cancel, say *'cancel'*.\n\nOtherwise, please choose a source environment for comparison: **DEV**, **PRE**, or **PROD**.", undefined, undefined, true);
        return;
      }
      if (deployFlow.step === "compare_tgt") {
        if (lower.includes("dev")) handleActionNameClick("cmp_tgt_dev", "DEV");
        else if (lower.includes("pre")) handleActionNameClick("cmp_tgt_pre", "PRE");
        else if (lower.includes("prod")) handleActionNameClick("cmp_tgt_prod", "PROD");
        else addBotMessage("I couldn't quite map that to our current step. 🤔 If you want to cancel, say *'cancel'*.\n\nOtherwise, please choose a target environment for comparison: **DEV**, **PRE**, or **PROD**.", undefined, undefined, true);
        return;
      }
      if (deployFlow.step === "sync_src") {
        if (lower.includes("dev")) handleActionNameClick("sync_src_dev", "DEV");
        else if (lower.includes("pre")) handleActionNameClick("sync_src_pre", "PRE");
        else if (lower.includes("prod")) handleActionNameClick("sync_src_prod", "PROD");
        else addBotMessage("I couldn't quite map that to our current step. 🤔 If you want to cancel, say *'cancel'*.\n\nOtherwise, please choose a source environment for sync: **DEV**, **PRE**, or **PROD**.", undefined, undefined, true);
        return;
      }
      if (deployFlow.step === "sync_tgt") {
        if (lower.includes("dev")) handleActionNameClick("sync_tgt_dev", "DEV");
        else if (lower.includes("pre")) handleActionNameClick("sync_tgt_pre", "PRE");
        else if (lower.includes("prod")) handleActionNameClick("sync_tgt_prod", "PROD");
        else addBotMessage("I couldn't quite map that to our current step. 🤔 If you want to cancel, say *'cancel'*.\n\nOtherwise, please choose a target environment to sync into: **DEV**, **PRE**, or **PROD**.", undefined, undefined, true);
        return;
      }

      // ── Default Fallback for truly unknown inputs ─
      addBotMessage(`I'm not quite sure what you're asking, but I'm here to help! 🤔\n\nTry asking me:\n• "What is configuration drift?"\n• "Explain the Envizor pipeline"\n• "How do I request access?"\n• "What is JIT access?"\n• "Tell me about the Terraform provider"`, [
        { label: "🔑 Request Role Access", actionName: "show_role_request" },
        { label: "⚙️ Explain the Pipeline", actionName: "explain_pipeline" },
        { label: "👾 Play Trivia", actionName: "start_quiz" },
        { label: "📋 Help & Overview", actionName: "help" },
      ], undefined, true);
    }, 450);
  };

  // ─── Tree helpers ─────────────────────────────────────────────────────────
  const renderTree = (nodes: FileNode[], parentPath: string[] = []): React.ReactNode => {
    return nodes.map((node) => {
      const nodePath = [...parentPath, node.name];
      const isSelected = viewingFile === nodePath.join("/");
      if (node.type === "folder") {
        return (
          <div key={node.name} className="pl-3 mt-1 border-l" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 text-xs font-semibold py-1 select-none" style={{ color: "var(--text-secondary)" }}>
              <span>📂</span><span>{node.name}</span>
            </div>
            {node.children && renderTree(node.children, nodePath)}
          </div>
        );
      }
      return (
        <button
          key={node.name}
          onClick={() => loadFileContent(nodePath)}
          className="flex items-center gap-2 text-xs font-mono text-left w-full pl-3 py-1 rounded transition border-l border-transparent cursor-pointer"
          style={{ color: isSelected ? "var(--accent)" : "var(--text-secondary)", backgroundColor: isSelected ? "var(--bg-elevated)" : "transparent", borderColor: isSelected ? "var(--accent)" : "transparent" }}
        >
          <span>📄</span><span className="truncate">{node.name}</span>
        </button>
      );
    });
  };

  const loadFileContent = async (pathArray: string[]) => {
    setViewingLoading(true);
    const full = pathArray.join("/");
    setViewingFile(full);
    try {
      const res = await fetch(`/api/workspaces/${currentWs}/file/${full}`);
      const json = await res.json();
      setViewingContent(json.content || "");
    } catch { setViewingContent("Error loading file content."); } finally { setViewingLoading(false); }
  };

  const renderCompareTree = (node: CompareNode): React.ReactNode => {
    const hasDiff = node.type === "file" ? node.diff?.some((d) => d.added || d.removed) : node.children?.some((c) => c.diff?.some((d) => d.added || d.removed) || c.inLeft !== c.inRight);
    const isSelected = selectedCompareFile?.name === node.name;
    const badgeColor = !node.inLeft || !node.inRight ? "var(--danger)" : hasDiff ? "var(--warning)" : "var(--success)";
    const badgeBg = !node.inLeft || !node.inRight ? "rgba(239,68,68,0.08)" : hasDiff ? "rgba(245,158,11,0.08)" : "rgba(34,197,94,0.08)";
    if (node.type === "folder") {
      return (
        <div key={node.name} className="pl-3 mt-1 border-l" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 text-xs font-semibold py-1" style={{ color: "var(--text-secondary)" }}>
            <span>📂</span><span>{node.name}</span>
          </div>
          {node.children && node.children.map((c) => renderCompareTree(c))}
        </div>
      );
    }
    return (
      <button
        key={node.name}
        onClick={() => setSelectedCompareFile(node)}
        className={`flex items-center justify-between text-xs font-mono text-left w-full pl-3 py-1.5 rounded transition border-l cursor-pointer ${isSelected ? "border-sky-500" : "border-transparent"}`}
        style={{ backgroundColor: isSelected ? "var(--bg-elevated)" : "transparent", borderColor: isSelected ? "var(--accent)" : "transparent" }}
      >
        <div className="flex items-center gap-2 truncate">
          <span>📄</span>
          <span style={{ color: hasDiff ? "var(--warning)" : "var(--text-primary)" }}>{node.name}</span>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded border font-bold" style={{ borderColor: badgeColor, color: badgeColor, backgroundColor: badgeBg }}>
          {!node.inLeft ? "ADDED" : !node.inRight ? "DELETED" : hasDiff ? "DRIFTED" : "SYNCED"}
        </span>
      </button>
    );
  };

  // ─── Avatar glow map ──────────────────────────────────────────────────────
  const glowStyles: Record<string, string> = {
    idle: "shadow-[0_0_8px_rgba(6,182,212,0.25)] border border-cyan-500/20",
    thinking: "shadow-[0_0_16px_rgba(245,158,11,0.5)] animate-pulse border border-amber-500/40",
    success: "shadow-[0_0_20px_rgba(34,197,94,0.6)] animate-pulse border border-emerald-500/40",
    warn: "shadow-[0_0_16px_rgba(239,68,68,0.4)] animate-pulse border border-rose-500/40",
    scan: "shadow-[0_0_20px_rgba(245,158,11,0.65)] animate-pulse border border-amber-500/50",
    deploy: "shadow-[0_0_24px_rgba(34,197,94,0.8)] animate-pulse border border-emerald-500/60",
    elevation: "shadow-[0_0_28px_rgba(234,179,8,0.9)] animate-pulse border border-yellow-500/70",
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full bg-slate-900 flex select-none">

      {/* LEFT PANEL OVERLAY */}
      {leftPanelType !== "none" && (
        <div className="absolute top-0 right-full z-45 w-[650px] h-full backdrop-blur-xl border-r p-6 flex flex-col justify-between animate-slideLeft transition-all duration-300"
          style={{ background: "var(--bg-panel)", borderColor: "var(--border)", boxShadow: "0 0 50px rgba(0,0,0,0.4)" }}>
          <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: "var(--border)" }}>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest" style={{ color: "var(--accent)" }}>
                {leftPanelType === "explorer" ? "Workspace Directory View" : leftPanelType === "compare" ? "Drift & Schema Mismatch View" : "Deployment Console Log"}
              </div>
              <h3 className="text-base font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
                {leftPanelType === "explorer" && `Inspecting ${currentWs} Workspace`}
                {leftPanelType === "compare" && `Drift Comparison: ${compareLeft} ↔ ${compareRight}`}
                {leftPanelType === "deploy" && `Interactive Deployment Console`}
              </h3>
            </div>
            <button onClick={() => setLeftPanelType("none")} className="text-xs px-2.5 py-1 rounded transition border cursor-pointer font-semibold"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>✕ Close Panel</button>
          </div>

          <div className="flex-1 overflow-hidden flex gap-4 min-h-0">
            {leftPanelType === "explorer" && (
              <>
                <div className="w-60 border-r pr-3 flex flex-col gap-2 overflow-auto" style={{ borderColor: "var(--border)" }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>File Layout</div>
                  {explorerLoading ? <div className="text-xs animate-pulse mt-4" style={{ color: "var(--text-secondary)" }}>Loading tree...</div> : <div className="space-y-1">{renderTree(explorerTree)}</div>}
                </div>
                <div className="flex-1 flex flex-col min-w-0 rounded-xl border p-3 overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                  <div className="text-[10px] font-bold uppercase mb-2" style={{ color: "var(--text-muted)" }}>File Content Viewer</div>
                  <div className="flex-1 overflow-auto">
                    {viewingLoading ? <div className="text-xs animate-pulse mt-4" style={{ color: "var(--text-secondary)" }}>Loading...</div>
                      : viewingFile ? <pre className="text-[10.5px] font-mono whitespace-pre leading-relaxed p-3 rounded-lg border overflow-auto max-h-[70vh]" style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--code-text)" }}>{viewingContent || "# File is empty"}</pre>
                      : <div className="text-xs italic mt-8 text-center" style={{ color: "var(--text-muted)" }}>Select a file to view its HCL content.</div>}
                  </div>
                </div>
              </>
            )}
            {leftPanelType === "compare" && (
              <>
                <div className="w-60 border-r pr-3 flex flex-col gap-2 overflow-auto" style={{ borderColor: "var(--border)" }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Workspace Drift Tree</div>
                  {compareLoading ? <div className="text-xs animate-pulse mt-4" style={{ color: "var(--text-secondary)" }}>Loading diff structures...</div>
                    : compareTree ? <div className="space-y-1">{renderCompareTree(compareTree)}</div>
                    : <div className="text-xs italic" style={{ color: "var(--text-muted)" }}>No differences loaded.</div>}
                </div>
                <div className="flex-1 flex flex-col min-w-0 rounded-xl border p-3 overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                  <div className="text-[10px] font-bold uppercase mb-2" style={{ color: "var(--text-muted)" }}>Side-by-Side Differences</div>
                  {selectedCompareFile ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="text-xs font-semibold mb-2 truncate" style={{ color: "var(--text-primary)" }}>File: {selectedCompareFile.name}</div>
                      <div className="flex-1 flex overflow-hidden text-[10px] font-mono border rounded-lg" style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)" }}>
                        <div className="w-1/2 border-r overflow-auto p-2" style={{ borderColor: "var(--border)" }}>
                          <div className="text-[9px] uppercase font-bold border-b pb-1 mb-1" style={{ color: "var(--accent)", borderColor: "var(--border)" }}>{compareLeft} SOURCE</div>
                          {selectedCompareFile.diff?.map((part, idx) => (
                            <pre key={idx} className="px-2 py-0.5 whitespace-pre-wrap leading-relaxed border-l-2 border-transparent"
                              style={part.removed ? { backgroundColor: "rgba(239,68,68,0.12)", color: "var(--danger)", borderLeftColor: "var(--danger)" } : part.added ? { opacity: 0.25, color: "var(--text-muted)" } : { color: "var(--text-secondary)" }}>
                              {part.removed || !part.added ? part.value : ""}
                            </pre>
                          ))}
                        </div>
                        <div className="w-1/2 overflow-auto p-2">
                          <div className="text-[9px] uppercase font-bold border-b pb-1 mb-1" style={{ color: "var(--success)", borderColor: "var(--border)" }}>{compareRight} TARGET</div>
                          {selectedCompareFile.diff?.map((part, idx) => (
                            <pre key={idx} className="px-2 py-0.5 whitespace-pre-wrap leading-relaxed border-l-2 border-transparent"
                              style={part.added ? { backgroundColor: "rgba(34,197,94,0.12)", color: "var(--success)", borderLeftColor: "var(--success)" } : part.removed ? { opacity: 0.25, color: "var(--text-muted)" } : { color: "var(--text-secondary)" }}>
                              {part.added || !part.removed ? part.value : ""}
                            </pre>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : <div className="text-xs italic mt-8 text-center" style={{ color: "var(--text-muted)" }}>Select a drifted file from the tree.</div>}
                </div>
              </>
            )}
            {leftPanelType === "deploy" && (
              <div className="flex-1 flex flex-col border rounded-xl overflow-hidden shadow-inner" style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-[10px] font-mono pl-2" style={{ color: "var(--text-muted)" }}>terraform@{deployEnv.toLowerCase()}-workspace</span>
                </div>
                <div className="flex-1 p-4 overflow-auto font-mono text-[10.5px] leading-relaxed" style={{ backgroundColor: "var(--code-bg)", color: "var(--code-text)" }}>
                  <pre className="whitespace-pre-wrap">{deployOutput}</pre>
                  {deployRunning && <div className="animate-pulse mt-2 font-bold font-mono" style={{ color: "var(--accent)" }}>■ Running process...</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRIMARY CHAT PANEL */}
      <div className="w-full h-full flex flex-col justify-between relative transition-all duration-300 bg-cover bg-center"
        style={{ backgroundImage: panelState === "expanded" ? "url('/robots_brains_bg.png')" : "none", backgroundColor: "var(--bg-panel)", color: "var(--text-primary)" }}>
        {panelState === "expanded" && (
          <div className="absolute inset-0 transition-all duration-300 z-0 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(10,15,30,0.75), rgba(10,15,30,0.9))", backdropFilter: "blur(4px)" }} />
        )}

        <div className="h-1.5 w-full relative z-10" style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-hover))" }} />

        {/* HEADER */}
        <div className="p-4 border-b flex items-center justify-between backdrop-blur-md relative z-10" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              {/* Holographic scanner outer ring */}
              <div className={`absolute -inset-1.5 rounded-full border border-dashed transition-all duration-700 ${
                avatarPulse === "thinking" ? "border-amber-500/50 animate-spin" :
                avatarPulse === "scan" ? "border-amber-500/60 animate-[spin_3s_linear_infinite]" :
                avatarPulse === "deploy" ? "border-emerald-500/60 animate-[spin_2s_linear_infinite]" :
                avatarPulse === "elevation" ? "border-yellow-500/80 animate-[spin_1s_linear_infinite]" :
                "border-cyan-500/30 animate-[spin_10s_linear_infinite]"
              }`} />
              
              {/* Core Avatar Container */}
              <div className={`relative w-9 h-9 rounded-full overflow-hidden transition-all duration-500 z-10 ${glowStyles[avatarPulse]}`}>
                <img src="/envizor-robot.png" alt="Envy" className="w-full h-full object-contain" />
              </div>
              
              {/* Bouncing real-time Spectrogram audio bars */}
              {typing && (
                <div className="absolute -bottom-1 -right-1 z-20 flex gap-[2px] bg-slate-950/80 px-1.5 py-0.5 rounded-full border border-cyan-500/30 shadow animate-pulse">
                  <span className="w-[1.5px] h-2 bg-cyan-400 rounded-full origin-bottom animate-[wave_0.8s_ease-in-out_infinite]" />
                  <span className="w-[1.5px] h-3.5 bg-cyan-400 rounded-full origin-bottom animate-[wave_0.5s_ease-in-out_0.15s_infinite]" />
                  <span className="w-[1.5px] h-2 bg-cyan-400 rounded-full origin-bottom animate-[wave_0.7s_ease-in-out_0.3s_infinite]" />
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <span>Envy — Envizor AI</span>
                <span className={`h-2 w-2 rounded-full ${avatarPulse === "thinking" ? "bg-amber-400 animate-pulse" : avatarPulse === "success" ? "bg-emerald-400 animate-pulse" : "bg-emerald-400"}`}
                  style={{ boxShadow: avatarPulse !== "idle" ? "0 0 8px currentColor" : "0 0 8px var(--success)" }} />
              </div>
              <div className="text-[10px] tracking-wide mt-0.5" style={{ color: "var(--text-muted)" }}>
                {avatarPulse === "thinking" ? "Thinking..." : avatarPulse === "success" ? "Access granted!" : "Intelligent Platform Guide"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onChangePanelState && (
              <>
                <button onClick={() => onChangePanelState(panelState === "expanded" ? "standard" : "expanded")}
                  className="text-[10px] px-2 py-1 rounded border transition font-semibold cursor-pointer"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                  {panelState === "expanded" ? "⤭ Standard" : "⤢ Expand"}
                </button>
                <button onClick={() => onChangePanelState("hidden")}
                  className="text-[10px] px-2 py-1 rounded border transition font-semibold cursor-pointer"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>✕ Hide</button>
              </>
            )}
            <button onClick={handleStartOver}
              className="text-[10px] px-2 py-1 rounded border font-semibold transition cursor-pointer"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", borderColor: "var(--danger)", color: "var(--danger)" }}>
              🔄 Start Over
            </button>
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 chat-perspective-viewport scrollbar-none" style={{ background: panelState === "expanded" ? "transparent" : "var(--bg-base)" }}>

          {/* JIT Banner */}
          {jitActive && (
            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-[10.5px] leading-relaxed flex flex-col gap-1.5 animate-pulse shadow-sm">
              <div className="flex items-center gap-1 font-black uppercase text-[9.5px] tracking-wider text-amber-400">
                <span>⚡ TEMPORARY PRIVILEGED SESSION ACTIVE</span>
              </div>
              <div>
                Elevated <strong className="text-amber-200 font-extrabold uppercase">{jitRole}</strong> rights active.
                Auto-expires in <span className="font-mono text-amber-100 bg-black/45 px-1.5 py-0.5 rounded border border-amber-900/35 font-black">{jitTimeLeft}</span>
              </div>
              <div className="text-[9.5px] text-amber-500 font-bold border-t border-amber-900/20 pt-1.5 flex items-center gap-1">
                <span>↳ Need an extension? Visit</span>
                <span className="underline cursor-pointer hover:text-white" onClick={() => window.location.href = "/wizard/profile"}>Profile Page 👤</span>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-2.5 items-start ${m.from === "bot" ? "flex-row" : "flex-row-reverse"} animate-fadeIn`}>
              {/* Message Avatar */}
              <div 
                className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center border text-xs shrink-0 select-none shadow-sm mt-0.5"
                style={{ 
                  borderColor: m.from === "bot" ? "var(--border)" : "var(--accent-hover)",
                  backgroundColor: m.from === "bot" ? "var(--bg-surface)" : "var(--accent)"
                }}
              >
                {m.from === "bot" ? (
                  <img src="/envizor-robot.png" alt="Bot Avatar" className="w-5 h-5 object-contain" />
                ) : (
                  userAvatar.startsWith("data:image") ? (
                    <img src={userAvatar} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{userAvatar}</span>
                  )
                )}
              </div>

              {/* Message Content Container */}
              <div className={`flex flex-col ${m.from === "bot" ? "items-start" : "items-end"} flex-1 min-w-0`}>
                {/* Message bubble */}
              {(m.customElement !== "role_request_card" && m.customElement !== "compliance_cert_card") && m.text && (
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs border whitespace-pre-line leading-relaxed transition-all duration-300 msg-3d-${m.from}`}
                  style={m.from === "bot"
                    ? { background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }
                    : { background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", borderColor: "var(--accent-hover)", color: "white" }
                  }
                >
                  {m.from === "bot" && m.useTypewriter
                    ? <TypewriterBubble text={m.text} />
                    : m.text}
                </div>
              )}

              {/* Greeting card options grid */}
              {m.from === "bot" && m.id === "greet" && m.options && m.options.length > 0 && (
                <div className="w-[98%] mt-3.5 flex flex-col gap-1.5 border border-slate-800/80 bg-slate-950/40 rounded-xl p-2.5 animate-fadeIn shadow-inner relative z-10 select-none">
                  {/* Browser-like Bookmark Address Bar Indicator */}
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900/60 rounded-lg border border-slate-800 text-[9px] font-mono text-slate-500 mb-2.5">
                    <span className="text-emerald-400">🔒 secure</span>
                    <span>|</span>
                    <span className="truncate">envizor://ai-assistant/quick-bookmarks</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {m.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionNameClick(opt.actionName, opt.label)}
                        className="flex items-center gap-1.5 px-3 py-2 text-[10.5px] font-bold text-slate-300 bg-slate-900/80 hover:bg-slate-850 hover:text-sky-400 border border-slate-800/60 rounded-xl cursor-pointer transition-all duration-200 shadow-sm hover:shadow-[0_2px_12px_var(--accent-glow)] active:scale-95 group flex-shrink-0"
                      >
                        <span className="text-[10px] group-hover:scale-110 transition-transform">🔖</span>
                        <span>{opt.label.replace(/[^a-zA-Z0-9\s:/—→]/g, "").trim()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular option pills */}
              {m.from === "bot" && m.id !== "greet" && m.options && m.options.length > 0 && (
                m.options[0].actionName.startsWith("quiz_") ? (
                  // BEAUTIFUL MULTIPLE CHOICE QUIZ PANEL
                  <div className="w-[98%] mt-3 flex flex-col gap-2.5 animate-fadeIn select-none">
                    <div className="text-[9px] font-black uppercase tracking-wider text-amber-500/90 pl-1">
                      👾 Select Your Answer:
                    </div>
                    <div className="flex flex-col gap-2">
                      {m.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleActionNameClick(opt.actionName, opt.label)}
                          className="w-full text-left px-4 py-3 text-xs font-semibold text-slate-350 bg-slate-900/40 hover:bg-slate-900 hover:text-sky-400 border border-slate-850 rounded-xl cursor-pointer transition-all duration-150 shadow-sm active:scale-[0.99] hover:border-sky-500/50 hover:shadow-[0_0_12px_rgba(56,189,248,0.15)] flex items-center gap-3 group"
                        >
                          <span className="h-6 w-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10.5px] font-black text-slate-500 group-hover:border-sky-500 group-hover:text-sky-400 transition-colors shrink-0">
                            {idx === 0 ? "A" : idx === 1 ? "B" : "C"}
                          </span>
                          <span className="flex-1 leading-normal">{opt.label.replace(/^[A-C]\)\s*/i, "")}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // ORIGINAL BOOKMARKS BAR
                  <div className="w-[98%] mt-2 flex flex-col gap-1.5 animate-fadeIn select-none">
                    <div className="flex items-center bg-slate-950/30 p-1.5 rounded-xl border border-slate-800/50 overflow-x-auto scrollbar-none gap-2">
                      <span className="text-[8px] font-black uppercase text-slate-600 tracking-wider pl-1.5 flex-shrink-0">Bookmarks:</span>
                      {m.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleActionNameClick(opt.actionName, opt.label)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9.5px] font-bold text-slate-400 bg-slate-900/60 hover:bg-slate-850 hover:text-sky-400 border border-slate-850 rounded-lg cursor-pointer transition-all duration-150 active:scale-95 flex-shrink-0"
                        >
                          <span className="text-[8px]">📁</span>
                          <span>{opt.label.replace(/[^a-zA-Z0-9\s:/—→]/g, "").trim()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* Custom element: Role Request Card */}
              {m.from === "bot" && m.customElement === "role_request_card" && (
                <div className="card-3d-holo w-[88%] rounded-2xl overflow-hidden mt-3">
                  <RoleRequestCard userName={userName} onSubmit={handleRoleSubmit} />
                </div>
              )}

              {/* Custom element: Compliance Certificate */}
              {m.from === "bot" && m.customElement === "compliance_cert_card" && (
                <div className="card-3d-holo w-[88%] rounded-2xl overflow-hidden mt-3">
                  <ComplianceCertCard userName={userName !== "user" ? userName : "Governance Expert"} />
                </div>
              )}

              {/* Custom element: Deploy button */}
              {m.from === "bot" && m.customElement === "deploy_button" && (
                <button
                  onClick={() => { window.location.href = `/wizard/push?source=${deployFlow.source}&target=${deployFlow.target}&artefact=${encodeURIComponent(deployFlow.artefact || "")}&action=deploy_wizard&command=init`; }}
                  className="mt-3 px-4 py-2.5 rounded-xl text-white text-[11px] font-bold uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-md animate-fadeIn cursor-pointer"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", boxShadow: "0 4px 12px var(--accent-glow)" }}>
                  ⚡ Pre-fill & Fetch Baselines
                </button>
              )}

              {/* Custom element: Explorer button */}
              {m.from === "bot" && m.customElement === "explorer_button" && (
                <button
                  onClick={() => { window.location.href = `/wizard/push?env=${deployFlow.target}&source=${deployFlow.source}&target=${deployFlow.target}&artefact=${encodeURIComponent(deployFlow.artefact || "")}&action=push_wizard`; }}
                  className="mt-3 px-4 py-2.5 rounded-xl text-white text-[11px] font-bold uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-md animate-fadeIn cursor-pointer"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", boxShadow: "0 4px 12px var(--accent-glow)" }}>
                  🚀 Open Deploy Console & Run Plan
                </button>
              )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex gap-2.5 items-start animate-fadeIn">
              <div 
                className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center border text-xs shrink-0 select-none shadow-sm"
                style={{ 
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg-surface)"
                }}
              >
                <img src="/envizor-robot.png" alt="Bot Avatar" className="w-5 h-5 object-contain" />
              </div>
              <div className="flex items-center gap-1 px-3 py-2 border rounded-xl w-14"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--accent)" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce delay-150" style={{ backgroundColor: "var(--accent)" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce delay-300" style={{ backgroundColor: "var(--accent)" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <form onSubmit={handleTextSubmit} className="p-4 border-t flex gap-2 transition-all duration-300 relative z-10"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={triviaActive ? "Type A, B, or C to answer..." : "Ask Envy anything about Envizor..."}
            className="flex-1 rounded-xl px-4 py-2.5 text-xs transition-colors duration-300 focus:outline-none border"
            style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
          <button type="submit"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white active:scale-95 transition-all duration-300 shadow-md cursor-pointer"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", boxShadow: "0 4px 12px var(--accent-glow)" }}>
            Send
          </button>
        </form>
      </div>
      <style>{`
        .chat-perspective-viewport {
          perspective: 1000px;
          perspective-origin: 50% 30%;
          transform-style: preserve-3d;
          background-image: 
            linear-gradient(rgba(14, 165, 233, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.02) 1px, transparent 1px);
          background-size: 20px 20px;
          background-position: center;
          position: relative;
        }

        .msg-3d-bot {
          transform: rotateY(5deg) rotateX(1deg) translateZ(0px);
          transform-origin: left center;
          box-shadow: -6px 6px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
        .msg-3d-bot:hover {
          transform: rotateY(1.5deg) rotateX(0deg) translateZ(10px);
          box-shadow: -10px 10px 24px rgba(6, 182, 212, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .msg-3d-user {
          transform: rotateY(-5deg) rotateX(-1deg) translateZ(0px);
          transform-origin: right center;
          box-shadow: 6px 6px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
        .msg-3d-user:hover {
          transform: rotateY(-1.5deg) rotateX(0deg) translateZ(10px);
          box-shadow: 10px 10px 24px rgba(14, 165, 233, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .card-3d-holo {
          transform: rotateX(3deg) rotateY(1deg) translateZ(0px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
        .card-3d-holo:hover {
          transform: rotateX(0deg) rotateY(0deg) translateZ(15px) scale(1.01);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.55), 0 0 16px rgba(245, 158, 11, 0.1);
        }

        @keyframes wave {
          0%, 100% { transform: scaleY(0.45); }
          50% { transform: scaleY(1.45); }
        }
      `}</style>
    </div>
  );
}
