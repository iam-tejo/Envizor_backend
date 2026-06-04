"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Day0Shell from "../Day0Shell";
import { dispatchPageContext } from "@/lib/envizorSync";

/* Radiant Env Icon */
function EnvIcon({ env }: { env: string }) {
  const label =
    env === "DEV" ? "D" : env === "PRE" ? "P" : env === "PROD" ? "R" : "?";

  return (
    <div 
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition"
      style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--accent)" }}
    >
      {label}
    </div>
  );
}

/* Radiant Environment Tile */
function EnvironmentTile({
  env,
  selected,
  disabled,
  onClick,
  accent,
}: {
  env: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  accent: "left" | "right";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative rounded-xl border transition-all duration-200 w-full text-left shadow-sm hover:-translate-y-1 cursor-pointer
        ${disabled ? "opacity-40 pointer-events-none" : ""}
        ${selected ? "shadow-lg scale-[1.02]" : ""}
      `}
      style={{
        backgroundColor: "var(--bg-panel)",
        borderColor: selected ? (accent === "left" ? "var(--accent)" : "var(--success)") : "var(--border)",
        boxShadow: selected ? (accent === "left" ? "0 4px 12px var(--accent-glow)" : "0 4px 12px rgba(34, 197, 94, 0.15)") : "none"
      }}
    >
      {selected && (
        <div className="absolute top-2 right-2 z-20">
          <svg
            className="w-5 h-5"
            style={{ color: accent === "left" ? "var(--accent)" : "var(--success)" }}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Gradient Bar */}
      <div
        className="h-2 w-full"
        style={{
          background: selected 
            ? (accent === "left" ? "linear-gradient(90deg, var(--accent), var(--accent-hover))" : "linear-gradient(90deg, var(--success), #16a34a)")
            : "linear-gradient(90deg, var(--border), var(--border-subtle))"
        }}
      />

      <div className="p-4 flex items-center gap-3">
        <EnvIcon env={env} />
        <div>
          <div 
            className="text-base font-semibold transition-colors"
            style={{ color: selected ? (accent === "left" ? "var(--accent)" : "var(--success)") : disabled ? "var(--text-muted)" : "var(--text-primary)" }}
          >
            {env} {disabled && "🔒"}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {selected ? "Selected" : disabled ? "Blocked" : "Click to select"}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function ComparePage() {
  const [leftEnv, setLeftEnv] = useState<string | null>(null);
  const [rightEnv, setRightEnv] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [diff, setDiff] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("SuperAdmin");

  const envOptions = ["DEV", "PRE", "PROD"];

  function hasReadAccess(envName: string): boolean {
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (r === "SUPERADMIN") return true;
    if (r === `${envName.toUpperCase()}ADMIN`) return true;
    if (r === "PREADMIN" && envName === "DEV") return true;
    if (r === "PRODADMIN" && (envName === "DEV" || envName === "PRE")) return true;
    return false;
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("envizor_username") || "user";
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";
      
      setUserRole(latestRole);

      const rNormalized = latestRole.replace(/\s+|_/g, "").toUpperCase();
      const params = new URLSearchParams(window.location.search);
      const left = params.get("left");
      const right = params.get("right");
      if (left && envOptions.includes(left.toUpperCase())) {
        setLeftEnv(left.toUpperCase());
      } else {
        if (rNormalized === "PRODADMIN") {
          setLeftEnv("PRE");
        } else if (rNormalized === "PREADMIN") {
          setLeftEnv("DEV");
        } else {
          setLeftEnv("DEV");
        }
      }
      if (right && envOptions.includes(right.toUpperCase())) {
        setRightEnv(right.toUpperCase());
      } else {
        if (rNormalized === "PRODADMIN") {
          setRightEnv("PROD");
        } else if (rNormalized === "PREADMIN") {
          setRightEnv("PRE");
        } else {
          setRightEnv("DEV");
        }
      }
    }
  }, []);

  async function loadComparison(left: string, right: string) {
    if (!left || !right) return;

    setLoading(true);
    setError(null);

    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(
        `${baseUrl}/api/day0/diff?left=${left}&right=${right}`
      );
      const json = await res.json();
      setDiff(json);
      setError(null);

      // Broadcast diff loaded event to the right-panel chatbot
      const totalDiffs = ["roles", "entitlements", "securitySystems", "endpoints", "connections"]
        .reduce((sum, key) => {
          const cat = json[key];
          return sum + (cat?.onlyLeft?.length ?? 0) + (cat?.onlyRight?.length ?? 0) + (cat?.different?.length ?? 0);
        }, 0);
      dispatchPageContext({
        page: "diff",
        action: "diff_loaded",
        payload: { left, right, totalDiffs, isMock: json.isMock }
      });
    } catch {
      setError("Failed to fetch comparison results.");
      setDiff(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    setDiff(null);
    setError(null);

    if (!leftEnv || !rightEnv) return;
    loadComparison(leftEnv, rightEnv);
  }, [leftEnv, rightEnv]);

  function swapEnvironments() {
    if (!leftEnv || !rightEnv) return;
    setLeftEnv(rightEnv);
    setRightEnv(leftEnv);
  }

  return (
    <Day0Shell
      title="Compare Environments"
      subtitle="Select two environments to view differences."
      backTo="/wizard/day0"
    >
      <div className="grid grid-cols-[260px_1fr] gap-8">

        {/* LEFT NAVIGATION BAR */}
        <div className="flex flex-col gap-6 border-r pr-4 transition-colors" style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Left Environment
            </div>
            <div className="flex flex-col gap-3">
              {envOptions.map((env) => (
                <EnvironmentTile
                  key={`left-${env}`}
                  env={env}
                  selected={leftEnv === env}
                  disabled={!hasReadAccess(env) || rightEnv === env}
                  onClick={() => {
                    setLeftEnv(env);
                    dispatchPageContext({ page: "diff", action: "left_env_selected", payload: { env } });
                  }}
                  accent="left"
                />
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Right Environment
            </div>
            <div className="flex flex-col gap-3">
              {envOptions.map((env) => (
                <EnvironmentTile
                  key={`right-${env}`}
                  env={env}
                  selected={rightEnv === env}
                  disabled={!hasReadAccess(env) || leftEnv === env}
                  onClick={() => {
                    setRightEnv(env);
                    dispatchPageContext({ page: "diff", action: "right_env_selected", payload: { env } });
                  }}
                  accent="right"
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col gap-8">

          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/wizard/day0"
              className="inline-block px-4 py-2 rounded-lg font-medium border transition cursor-pointer"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--accent)" }}
            >
              ← Back to Day‑0 Entry
            </Link>

            <button
              onClick={swapEnvironments}
              disabled={!leftEnv || !rightEnv}
              className="px-4 py-2 rounded-lg text-sm font-medium border transition cursor-pointer"
              style={
                leftEnv && rightEnv
                  ? { backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }
                  : { backgroundColor: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-muted)", cursor: "not-allowed" }
              }
            >
              Swap Environments
            </button>
          </div>

          {/* States */}
          {!leftEnv || !rightEnv ? (
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              Select a left and right environment to see comparison.
            </div>
          ) : loading ? (
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Comparing {leftEnv} and {rightEnv}…
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg text-rose-300 border border-rose-500/20 bg-rose-500/10">
              {error}
            </div>
          ) : diff ? (
            <>
              {diff.isMock && (
                <div 
                  className="p-4 rounded-xl border text-sm shadow-md flex items-start gap-3 backdrop-blur-md transition-colors"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                >
                  <span className="text-xl leading-none">⚠️</span>
                  <div>
                    <div className="font-semibold" style={{ color: "var(--accent)" }}>Demo Mode: Using Mock Data</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                      We were unable to connect to the live Saviynt APIs for{" "}
                      <strong>
                        {diff.leftIsMock ? leftEnv : ""}{" "}
                        {diff.leftIsMock && diff.rightIsMock ? "and" : ""}{" "}
                        {diff.rightIsMock ? rightEnv : ""}
                      </strong>{" "}
                      due to unconfigured URL credentials. Showing fallback mock data instead for demonstration.
                    </div>
                  </div>
                </div>
              )}
              <GroupedDiff diff={diff} leftEnv={leftEnv} rightEnv={rightEnv} />
            </>
          ) : null}
        </div>
      </div>
    </Day0Shell>
  );
}

/* Radiant Diff Grouping */
function GroupedDiff({ diff, leftEnv, rightEnv }: any) {
  const categories = [
    { key: "roles", label: "Roles" },
    { key: "entitlements", label: "Entitlements" },
    { key: "securitySystems", label: "Security Systems" },
    { key: "endpoints", label: "Endpoints" },
    { key: "connections", label: "Connections" },
    { key: "tasks", label: "Tasks" },
    { key: "rules", label: "Rules" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {categories.map((cat) => {
        const data = diff[cat.key];
        const total =
          data.onlyLeft.length +
          data.onlyRight.length +
          data.different.length +
          data.same.length;

        return (
          <details
            key={cat.key}
            className="border rounded-xl shadow-sm transition-colors"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <summary 
              className="cursor-pointer px-4 py-3 font-semibold border-b transition-colors"
              style={{ color: "var(--text-primary)", borderColor: "var(--border)", backgroundColor: "var(--bg-panel)" }}
            >
              {cat.label} ({total})
            </summary>

            <div className="p-4 grid grid-cols-3 gap-6">
              <ArtefactList
                title={`Only in ${leftEnv}`}
                items={data.onlyLeft}
                accent="left"
              />
              <ArtefactList
                title={`Only in ${rightEnv}`}
                items={data.onlyRight}
                accent="right"
              />
              <ArtefactList
                title="Different"
                items={data.different}
                accent="mixed"
              />

              {data.same.length > 0 && (
                <div className="col-span-3 mt-4">
                  <ArtefactList
                    title="Same"
                    items={data.same}
                    accent="neutral"
                  />
                </div>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

/* Radiant Artefact List */
function ArtefactList({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: "left" | "right" | "mixed" | "neutral";
}) {
  const borderMap: Record<string, string> = {
    left: "border-sky-500/40",
    right: "border-purple-500/40",
    mixed: "border-indigo-500/40",
    neutral: "border-slate-700",
  };

  const titleMap: Record<string, string> = {
    left: "text-sky-400",
    right: "text-purple-400",
    mixed: "text-indigo-400",
    neutral: "text-slate-300",
  };

  return (
    <div 
      className="border rounded-xl shadow-sm p-4 transition-colors"
      style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
    >
      <h3 className={`font-semibold mb-3 ${titleMap[accent]}`}>
        {title} ({items?.length ?? 0})
      </h3>

      <div className="max-h-[300px] overflow-auto flex flex-col gap-2">
        {items?.map((name, idx) => (
          <div
            key={name ?? `${title}-${idx}`}
            className="px-3 py-2 border rounded-lg transition"
            style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            <div className="font-medium">{name}</div>
          </div>
        ))}

        {(!items || items.length === 0) && (
          <div style={{ color: "var(--text-muted)" }} className="text-sm">No items found.</div>
        )}
      </div>
    </div>
  );
}
