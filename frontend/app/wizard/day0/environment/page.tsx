"use client";

import { useRouter } from "next/navigation";
import { useDay0Store } from "../store";
import Day0Shell from "../Day0Shell";
import EnvironmentTile from "./EnvironmentTile";

export default function Day0EnvironmentPage() {
  const router = useRouter();
  const { environment, setEnvironment, setEnvInfo, setResults } = useDay0Store();

  const handleSelect = async (env: string) => {
    setEnvironment(env);
    setEnvInfo(null);
    setResults(null);

    try {
      const res = await fetch(`/api/day0/environment-info?env=${env}`);
      if (res.ok) {
        const data = await res.json();
        setEnvInfo(data);
      }
    } catch (err) {
      console.error("Failed to load environment info", err);
    }
  };

  const envs = [
    { name: "DEV", desc: "Development environment. Use for initial discovery and module sandboxing." },
    { name: "PRE", desc: "Pre-production/staging environment. Safe testing before production rollout." },
    { name: "PROD", desc: "Production live environment. Read-only validation and final drift checks." }
  ];

  return (
    <Day0Shell
      title="Day‑0: Target Environment Selection"
      subtitle="Select the Saviynt environment profile to establish the secure drift monitoring boundary."
      backTo="/"
    >
      <div className="max-w-4xl mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {envs.map((env) => (
            <EnvironmentTile
              key={env.name}
              title={env.name}
              subtitle={env.desc}
              selected={environment === env.name}
              onClick={() => handleSelect(env.name)}
            />
          ))}
        </div>

        <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-800">
          <div className="text-sm text-slate-400">
            {environment 
              ? `Selected Environment: ${environment}` 
              : "Please select an environment to continue."}
          </div>

          <button
            disabled={!environment}
            onClick={() => router.push("/wizard/day0")}
            className={`
              px-8 py-3 rounded-xl font-semibold transition-all duration-200
              ${environment
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:scale-105"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"}
            `}
          >
            Continue to Control Hub →
          </button>
        </div>
      </div>
    </Day0Shell>
  );
}
