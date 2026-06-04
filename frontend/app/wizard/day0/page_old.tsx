"use client";

import { useState, useEffect } from "react";
import WizardShell from "@/app/wizard/WizardShell";
import "./day0.css";

export default function Day0Onboarding() {
  const [environment, setEnvironment] = useState<string | null>(null);
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [loadingEnv, setLoadingEnv] = useState(false);

  const [discovering, setDiscovering] = useState(false);
  const [results, setResults] = useState<any>(null);

  // 3D Tilt Effect
  useEffect(() => {
    const buttons = document.querySelectorAll(".env-tilt") as NodeListOf<HTMLElement>;

    buttons.forEach((btn) => {
      const handleMove = (e: MouseEvent) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        btn.style.transform = `
          perspective(600px)
          rotateX(${(-y / 25)}deg)
          rotateY(${x / 25}deg)
          scale(1.05)
        `;
      };

      const reset = () => {
        btn.style.transform =
          "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)";
      };

      btn.addEventListener("mousemove", handleMove);
      btn.addEventListener("mouseleave", reset);
    });

    return () => {
      buttons.forEach((btn) => {
        btn.replaceWith(btn.cloneNode(true) as HTMLElement);
      });
    };
  }, []);

  const loadEnvironmentInfo = async (env: string) => {
    setEnvironment(env);
    setEnvInfo(null);
    setResults(null);
    setLoadingEnv(true);

    try {
      const res = await fetch(`/api/day0/environment-info?env=${env}`);
      const data = await res.json();
      setEnvInfo(data);
    } finally {
      setLoadingEnv(false);
    }
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    setResults(null);

    try {
      const res = await fetch(`/api/day0/discover?env=${environment}`);
      const data = await res.json();
      setResults(data);
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <WizardShell>
      <div className="relative w-full px-6 py-10">

        {/* Soft Blue Radial Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-100 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="relative max-w-4xl mx-auto day0-fade-in">

          {/* Header */}
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Day‑0 Terraform Onboarding
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mb-12">
            Import existing Saviynt artefacts and bootstrap Terraform state for your selected environment.
          </p>

          {/* STEP 1 — Select Environment */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. Select Environment
            </h2>

            <div className="grid grid-cols-3 gap-4 max-w-md">
              {["DEV", "PRE", "PROD"].map((env) => (
                <button
                  key={env}
                  onClick={() => loadEnvironmentInfo(env)}
                  className={`
                    env-tilt
                    relative flex items-center justify-center gap-2
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

            {loadingEnv && (
              <p className="text-gray-500 mt-4">Loading environment details…</p>
            )}
          </div>

          {/* STEP 2 — Environment Details */}
          {environment && envInfo && (
            <div className="mb-12 day0-fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                2. Environment Details
              </h2>

              <div className="p-6 border rounded-2xl bg-gray-50 shadow-sm">
                <ul className="text-gray-700 space-y-2">
                  <li><strong>User:</strong> {envInfo.user}</li>
                  <li><strong>URL:</strong> {envInfo.url}</li>
                  <li><strong>Workspace:</strong> {envInfo.workspace}</li>
                </ul>

                {envInfo.files?.length > 0 && (
                  <>
                    <h4 className="font-semibold text-gray-900 mt-6 mb-2">
                      Workspace Impact
                    </h4>
                    <ul className="text-gray-700 space-y-1">
                      {envInfo.files.map((f: any) => (
                        <li key={f.name}>
                          {f.name} — 
                          {f.status === "create" && <span className="text-green-600"> will be created</span>}
                          {f.status === "update" && <span className="text-blue-600"> will be updated</span>}
                          {f.status === "nochange" && <span className="text-gray-500"> no changes</span>}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 — Discover Artefacts */}
          {environment && envInfo && (
            <div className="mb-12 day0-fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                3. Discover Existing Artefacts
              </h2>

              <button
                disabled={discovering}
                onClick={handleDiscover}
                className={`
                  px-6 py-3 rounded-xl text-white font-medium transition-all
                  ${discovering
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 shadow-md"}
                `}
              >
                {discovering ? "Discovering..." : "Discover Artefacts"}
              </button>

              {results && (
                <div className="mt-6 p-6 border rounded-2xl bg-gray-50 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Discovered Artefacts
                  </h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>Security Systems: {results.systems}</li>
                    <li>Endpoints: {results.endpoints}</li>
                    <li>Technical Rules: {results.rules}</li>
                    <li>Roles: {results.roles}</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Generate Workspace */}
          {results && (
            <div className="mb-20 day0-fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                4. Generate Terraform Workspace
              </h2>

              <button
                className="px-6 py-3 rounded-xl text-white font-medium
                           bg-green-600 hover:bg-green-700 shadow-md"
              >
                Generate TF Files & Import Commands
              </button>
            </div>
          )}

        </div>
      </div>
    </WizardShell>
  );
}
