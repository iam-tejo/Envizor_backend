"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function WizardHomePage() {
  const [userRole, setUserRole] = useState("BasicUser");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("envizor_username") || "user";
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";
      
      setUserRole(latestRole);
      setLoading(false);
    }
  }, []);

  const tiles = [
    {
      title: "Deploy Terraform Configuration to Saviynt",
      description:
        "Run Terraform commands safely against Saviynt - Powerful for deploying new workspaces or pushing updates to existing ones. Use with caution!",
      href: "/wizard/push",
      background: "linear-gradient(90deg, var(--warning), var(--error))",
      icon: "🚀",
    },
    {
      title: "Synchronize Terraform Workspaces",
      description:
        "Compare Terraform workspaces and synchronize configuration files between them. Ideal for keeping DEV, PRE, and PROD in sync or migrating changes across environments.",
      href: "/wizard/steps/source-workspace?source=DEV&target=PRE",
      background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
      icon: "🔄",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)" }} />
      </div>
    );
  }

  if (userRole === "BasicUser") {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center px-6 py-10 transition-all duration-300"
        style={{
          backgroundColor: "var(--bg-base)",
          color: "var(--text-primary)"
        }}
      >
        <div 
          className="max-w-md w-full rounded-2xl border p-8 shadow-2xl text-center backdrop-blur-md animate-fadeIn"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "rgba(239, 68, 68, 0.2)" }}
        >
          <span className="text-6xl text-red-500 animate-pulse">🛡️</span>
          <h3 className="text-base font-extrabold text-red-400 mt-5 uppercase tracking-wider">Access Denied</h3>
          <p className="text-xs mt-2.5 max-w-sm mx-auto text-slate-400 leading-relaxed">
            Your active user account role (<strong className="text-slate-200">{userRole}</strong>) does not have authorization to view the **Terraform Control Panel**.
          </p>
          <p className="text-[10px] text-slate-500 mt-3 leading-normal">
            Writing HCL baseline configurations and running terraform deployments requires write-capable environments access.
          </p>
          
          <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <Link
              href="/wizard/steps/welcome"
              className="inline-block px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-255 transition cursor-pointer"
            >
              ← Return to Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center py-10 transition-all duration-300"
      style={{
        backgroundColor: "var(--bg-base)",
        color: "var(--text-primary)"
      }}
    >
      <div className="max-w-5xl w-full px-4">

        {/* Back to Hub */}
        <Link
          href="/wizard/steps/welcome"
          className="text-xs transition block mb-4 hover:opacity-80"
          style={{ color: "var(--accent)" }}
        >
          ← Back to Hub
        </Link>

        <h1 className="text-2xl font-black mb-2" style={{ color: "var(--text-primary)" }}>
          Terraform Control Panel
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Choose what you want to do today with your Saviynt Terraform workspace.
        </p>

        <div className="grid gap-8 md:grid-cols-2 max-w-2xl mx-auto pt-6">
          {tiles.map((tile) => (
            <Link key={tile.title} href={tile.href} className="group block">

              {/* ⭐ OUTER CIRCLE BORDER */}
              <div 
                className="
                  h-48 w-48 
                  mx-auto
                  rounded-full 
                  p-[1.5px] 
                  transition-all
                  duration-300
                  group-hover:scale-105
                  group-hover:shadow-2xl
                "
                style={{
                  background: "var(--border)",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)"
                }}
              >

                {/* ⭐ INNER CIRCLE */}
                <div 
                  className="
                    h-full w-full 
                    rounded-full 
                    p-5 
                    flex flex-col items-center justify-center text-center
                    transition-colors
                    duration-300
                  "
                  style={{
                    backgroundColor: "var(--bg-surface)",
                  }}
                >

                  {/* Radiant gradient bar */}
                  <div
                    className="mb-3 h-1 w-12 rounded-full"
                    style={{ background: tile.background }}
                  />

                  {/* Icon */}
                  <div className="text-3xl mb-2">
                    {tile.icon}
                  </div>

                  {/* Title */}
                  <h2 className="text-xs font-bold leading-snug transition-colors duration-200 group-hover:opacity-85" style={{ color: "var(--text-primary)" }}>
                    {tile.title}
                  </h2>

                </div>
              </div>

              {/* ⭐ Description BELOW the circle */}
              <p className="mt-4 text-xs text-center max-w-[220px] mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {tile.description}
              </p>

              <span className="block mt-2 text-[11px] font-bold text-center uppercase tracking-wider transition-opacity duration-200 group-hover:opacity-80" style={{ color: "var(--accent)" }}>
                Open →
              </span>

            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
