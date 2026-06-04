// 🤖 Envizor AI Agent Local Mod: Run the changes (Modified on 6/4/2026)
"use client";

import Link from "next/link";
import Day0Shell from "./Day0Shell";

type Tile = {
  title: string;
  description: string;
  href: string;
  icon: string;
  gradient: string;
  glow: string;
};

// ⭐ Radiant Premium Tiles
const tiles: Tile[] = [
  {
    title: "Environment Discovery - Monitoring Activity",
    description: "Scan DEV, PRE, PROD and load artefacts.",
    href: "/wizard/day0/discovery",
    icon: "🔍",
    gradient: "from-blue-500 via-blue-600 to-blue-700",
    glow: "hover:shadow-sky-500/20",
  },
  {
    title: "Compare Environments - Monitoring Activity",
    description: "View differences between any two environments.",
    href: "/wizard/day0/diff",
    icon: "🔀",
    gradient: "from-purple-500 via-purple-600 to-purple-700",
    glow: "hover:shadow-purple-500/20",
  },
  {
    title: "Saviynt API Usage",
    description: "Explore, edit, and add Saviynt REST API definitions used to interface with tenants.",
    href: "/wizard/day0/api-usage",
    icon: "⚡",
    gradient: "from-amber-500 via-orange-600 to-red-600",
    glow: "hover:shadow-orange-500/20",
  }
];

export default function Day0Page() {
  return (
    <Day0Shell
      title="Monitor Tenant Differences"
      subtitle="Choose an action to begin."
      backTo="/wizard/"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">

        {tiles.map((tile: Tile) => (
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

            {/* Tile Body */}
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
