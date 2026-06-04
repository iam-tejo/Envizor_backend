"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Day0Shell from "../Day0Shell";
import { dispatchPageContext } from "@/lib/envizorSync";

/* Icons */
function RolesIcon() { return <span className="text-sky-400 text-2xl">👤</span>; }
function KeyIcon() { return <span className="text-sky-400 text-2xl">🔑</span>; }
function ShieldIcon() { return <span className="text-sky-400 text-2xl">🛡️</span>; }
function PlugIcon() { return <span className="text-sky-400 text-2xl">🔌</span>; }
function ClipboardIcon() { return <span className="text-sky-400 text-2xl">📋</span>; }
function FlowIcon() { return <span className="text-sky-400 text-2xl">🔁</span>; }
function FileIcon() { return <span className="text-sky-400 text-2xl">📄</span>; }

/* Radiant Environment Tile */
function EnvironmentTile({ env, selected, disabled, onClick }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative rounded-xl border border-slate-800 bg-slate-900
        transition-all duration-200 w-full text-left shadow-sm
        ${disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "hover:-translate-y-1 hover:shadow-sky-500/20"}
        ${selected ? "border-sky-500 shadow-sky-500/30 scale-[1.02]" : ""}
      `}
    >
      {/* Gradient Bar */}
      <div
        className={`
          h-2 w-full bg-gradient-to-r
          ${selected
            ? "from-sky-500 via-sky-600 to-sky-700"
            : disabled
            ? "from-slate-800 to-slate-950"
            : "from-slate-700 to-slate-800 group-hover:from-sky-500 group-hover:to-sky-700"}
        `}
      />

      <div className="p-4">
        <div
          className={`
            text-base font-semibold
            ${selected ? "text-sky-400" : disabled ? "text-slate-500" : "text-slate-200"}
          `}
        >
          {env} {disabled && "🔒"}
        </div>
        <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {selected ? "Selected" : disabled ? "Blocked" : "Click to select"}
        </div>
      </div>
    </button>
  );
}

export default function Day0DiscoveryPage() {
  const [environment, setEnvironment] = useState("DEV");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("SuperAdmin");

  function hasReadAccess(envName: string): boolean {
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (r === "SUPERADMIN") return true;
    if (r === `${envName.toUpperCase()}ADMIN`) return true;
    if (r === "PREADMIN" && envName === "DEV") return true;
    if (r === "PRODADMIN" && (envName === "DEV" || envName === "PRE")) return true;
    return false;
  }

  async function loadEnvironment(env: string) {
    setEnvironment(env);
    setLoading(true);
    setError(null);

    // Notify chatbot that env was selected
    dispatchPageContext({ page: "discovery", action: "env_selected", payload: { env } });

    try {
      const tenantRes = await fetch(`/api/day0/discovery?env=${env}`);
      const tenantJson = await tenantRes.json();

      const wsRes = await fetch(`/api/env/${env}`);
      const wsJson = await wsRes.json();

      const combined = {
        ...tenantJson,
        workspaceFiles: wsJson.files ?? []
      };

      setData(combined);

      // Notify chatbot that discovery data loaded
      dispatchPageContext({
        page: "discovery",
        action: "data_loaded",
        payload: {
          env,
          counts: {
            roles: tenantJson.roles?.length ?? 0,
            entitlements: tenantJson.entitlements?.length ?? 0,
            securitySystems: tenantJson.securitySystems?.length ?? 0,
            endpoints: tenantJson.endpoints?.length ?? 0,
            tasks: tenantJson.tasks?.length ?? 0,
            workspaceFiles: wsJson.files?.length ?? 0,
          },
          isMock: tenantJson.isMock ?? false,
        }
      });

    } catch (err) {
      console.error(err);
      setError("Failed to fetch discovery results.");
    }

    setLoading(false);
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("envizor_username") || "user";
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";
      
      setUserRole(latestRole);
      let initialEnv = "DEV";
      const rNormalized = latestRole.replace(/\s+|_/g, "").toUpperCase();
      if (rNormalized === "PRODADMIN") {
        initialEnv = "PROD";
      } else if (rNormalized === "PREADMIN") {
        initialEnv = "PRE";
      }
      loadEnvironment(initialEnv);
    } else {
      loadEnvironment("DEV");
    }
  }, []);

  const tiles = [
    { key: "roles", label: "Roles", value: data?.roles?.length ?? 0, icon: RolesIcon },
    { key: "entitlements", label: "Entitlements", value: data?.entitlements?.length ?? 0, icon: KeyIcon },
    { key: "securitySystems", label: "Security Systems", value: data?.securitySystems?.length ?? 0, icon: ShieldIcon },
    { key: "endpoints", label: "Endpoints", value: data?.endpoints?.length ?? 0, icon: PlugIcon },
    { key: "tasks", label: "Tasks", value: data?.tasks?.length ?? 0, icon: ClipboardIcon },
    { key: "rules", label: "Rules", value: data?.rules?.length ?? 0, icon: FlowIcon },
    { key: "workspaceFiles", label: "Workspace Files", value: data?.workspaceFiles?.length ?? 0, icon: FileIcon },
  ];

  const envOptions = ["DEV", "PRE", "PROD"];

  return (
    <Day0Shell
      title="Discovery"
      subtitle="Fetch artefacts from Saviynt environments and explore Terraform workspace files."
      backTo="/wizard/day0"
    >
      <div className="grid grid-cols-[220px_1fr] gap-8">

        {/* LEFT NAVIGATION BAR */}
        <div className="flex flex-col gap-4 border-r border-slate-800 pr-4">
          <div className="text-sm font-medium text-slate-400 mb-1">
            Environments
          </div>

          {envOptions.map((env) => (
            <EnvironmentTile
              key={env}
              env={env}
              selected={environment === env}
              disabled={!hasReadAccess(env)}
              onClick={() => loadEnvironment(env)}
            />
          ))}
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col gap-8">

          {/* Back Button */}
          <div>
            <Link
              href="/wizard/day0"
              className="
                inline-block px-4 py-2 rounded-lg text-sky-400 font-medium
                border border-slate-700 bg-slate-900
                hover:bg-slate-800 transition
              "
            >
              ← Back to Day‑0 Entry
            </Link>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-slate-400 text-sm">
              Loading {environment}…
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {/* Demo Mode Alert */}
          {data && data.isMock && !loading && (
            <div className="p-4 rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-950/80 to-slate-900/80 text-slate-200 text-sm shadow-md flex items-start gap-3 backdrop-blur-md">
              <span className="text-xl leading-none">⚠️</span>
              <div>
                <div className="font-semibold text-sky-400">Demo Mode: Using Mock Data</div>
                <div className="text-xs text-slate-400 mt-1">
                  We were unable to connect to the live Saviynt APIs for <strong>{environment}</strong> due to unconfigured URL credentials. Showing fallback mock data instead for demonstration.
                </div>
              </div>
            </div>
          )}

          {/* Category Tiles */}
          {data && (
            <div className="grid grid-cols-3 gap-6">
              {tiles.map((tile) => (
                <div
                  key={tile.key}
                  className="
                    rounded-xl bg-slate-900 border border-slate-800 shadow-sm
                    p-4 flex items-center gap-4 hover:shadow-sky-500/10 transition
                  "
                >
                  <div className="text-3xl">{<tile.icon />}</div>
                  <div>
                    <div className="text-xl font-bold text-sky-400">
                      {tile.value}
                    </div>
                    <div className="text-sm text-slate-400">
                      {tile.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

         {/* Ask Envizor Button */}
{data && (
  <div className="mt-8">
    <button
      onClick={() => {
        const discoveredObjects = {
          roles: data.roles ?? [],
          entitlements: data.entitlements ?? [],
          securitySystems: data.securitySystems ?? [],
          endpoints: data.endpoints ?? [],
          tasks: data.tasks ?? [],
          rules: data.rules ?? [],
          workspaceFiles: data.workspaceFiles ?? [],
          environment,
        };

        const terraformState = {}; // optional for now
        const plan = ""; // no plan on discovery page

        window.location.href =
          `/assistant` +
          `?plan=${encodeURIComponent(plan)}` +
          `&discovered=${encodeURIComponent(JSON.stringify(discoveredObjects))}` +
          `&state=${encodeURIComponent(JSON.stringify(terraformState))}`;
      }}
      className="
        px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold
        hover:bg-blue-700 transition shadow-lg
      "
    >
      Ask Envizor About This Environment →
    </button>
  </div>
)}

        </div>
      </div>
    </Day0Shell>
  );
}

/* Radiant Artefact List Component */
function ArtefactList({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="border border-slate-800 rounded-xl bg-slate-900 shadow-sm p-4">
      <h3 className="font-semibold text-slate-200 mb-3">
        {title} ({items?.length ?? 0})
      </h3>

      <div className="max-h-[300px] overflow-auto flex flex-col gap-2">
        {items?.map((item, idx) => (
          <div
            key={item.name ?? `${title}-${idx}`}
            className="
              px-3 py-2 border border-slate-800 rounded-lg bg-slate-950
              hover:bg-slate-800 transition text-slate-300
            "
          >
            <div className="font-medium">{item.name}</div>
          </div>
        ))}

        {(!items || items.length === 0) && (
          <div className="text-slate-500 text-sm">
            No {title.toLowerCase()} found.
          </div>
        )}
      </div>
    </div>
  );
}
