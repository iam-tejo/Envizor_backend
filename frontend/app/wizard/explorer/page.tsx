"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Day0Shell from "../day0/Day0Shell";

export default function ExplorerHomePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("envizor_username") || "user";
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";
      
      if (latestRole === "BasicUser") {
        setAuthorized(false);
        router.push("/wizard/steps/welcome");
      } else {
        setAuthorized(true);
      }
    }
  }, [router]);

  if (authorized === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <div className="w-5 h-5 rounded-full border-2 border-slate-800 border-t-sky-500 animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;
  const tiles = [
    {
      title: "Workspace Discovery - Monitoring Activity",
      description: "Explore folders, view Terraform files, and inspect workspace structure.",
      href: "/wizard/explorer/discovery",
      icon: "🧭",
      gradient: "from-blue-500 via-blue-600 to-blue-700",
      glow: "hover:shadow-sky-500/20",
    },
    {
      title: "Compare Workspaces - Monitoring Activity",
      description: "Compare DEV, PRE, and PROD Terraform states and merge differences.",
      href: "/wizard/day0/diff?action=compare_wizard",
      icon: "🔀",
      gradient: "from-purple-500 via-purple-600 to-purple-700",
      glow: "hover:shadow-purple-500/20",
    },
    {
      title: "Saviynt Provider Schema Registry",
      description: "Configure and adapt resource schemas when Saviynt and Terraform extend support for new baseline EIC artefacts.",
      href: "/wizard/explorer/schema-registry",
      icon: "⚙️",
      gradient: "from-amber-500 via-orange-600 to-red-600",
      glow: "hover:shadow-orange-500/20",
    }
  ];

  return (
    <Day0Shell
       title="Workspace Management"
      subtitle="Browse folders, view files, and explore Terraform workspace structure, And merge chan."
      backTo="/wizard"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">

        {tiles.map((tile) => (
          <Link
            key={tile.title}
            href={tile.href}
            className={`
              group relative rounded-2xl border border-slate-800 shadow-sm overflow-hidden
              bg-slate-900 transition-all duration-200
              hover:-translate-y-1 ${tile.glow}
            `}
          >
            {/* Radiant Gradient Top Bar */}
            <div
              className={`
                h-2 w-full bg-gradient-to-r
                ${tile.gradient}
              `}
            />

            <div className="p-6 flex flex-col gap-3">
              <div className="text-3xl">{tile.icon}</div>

              <div className="text-lg font-semibold text-slate-100">
                {tile.title}
              </div>

              <div className="text-sm text-slate-400 leading-relaxed">
                {tile.description}
              </div>
            </div>
          </Link>
        ))}

      </div>
    </Day0Shell>
  );
}
