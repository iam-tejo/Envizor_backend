"use client";

import { useRouter } from "next/navigation";
import { useDay0Store } from "../wizard/day0/store";
import WizardShell from "@/app/wizard/WizardShell";
import "../wizard/day0/day0.css";

export default function EnvironmentPage() {
  const router = useRouter();
  const { environment, setEnvironment, setEnvInfo, setResults } = useDay0Store();

  const handleSelect = async (env: string) => {
    setEnvironment(env);
    setEnvInfo(null);
    setResults(null);

    const res = await fetch(`/api/day0/environment-info?env=${env}`);
    const data = await res.json();
    setEnvInfo(data);
  };

  return (
    <WizardShell>
      <div className="max-w-3xl mx-auto px-6 py-10">

        <h1 className="text-4xl font-bold mb-8">Day‑0: Select Environment</h1>

        <div className="grid grid-cols-3 gap-4 max-w-md">
          {["DEV", "PRE", "PROD"].map((env) => (
            <button
              key={env}
              onClick={() => handleSelect(env)}
              className={`
                env-tilt relative flex items-center justify-center gap-2
                rounded-xl py-3 border text-center transition-all
                ${environment === env
                  ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md scale-[1.03]"
                  : "border-gray-300 hover:border-gray-400 bg-white"}
              `}
            >
              {environment === env && (
                <>
                  <div className="env-selected-glow absolute inset-0"></div>
                  <svg
                    className="env-checkmark absolute left-3 top-1/2 -translate-y-1/2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1e3a8a"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
              {env}
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-12">
          <button
            disabled={!environment}
            onClick={() => router.push("/wizard/day0/details")}
            className={`
              px-6 py-3 rounded-xl text-white font-medium
              ${environment
                ? "bg-blue-600 hover:bg-blue-700 shadow-md"
                : "bg-gray-400 cursor-not-allowed"}
            `}
          >
            Next →
          </button>
        </div>

      </div>
    </WizardShell>
  );
}
