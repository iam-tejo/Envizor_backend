"use client";

import { usePathname } from "next/navigation";
import { WIZARD_STEPS } from "@/app/wizard/steps/stepOrder";

export default function ProgressBar() {
  const pathname = usePathname();

  const parts = pathname.split("/");
  const step = parts[parts.length - 1];

  const index = WIZARD_STEPS.indexOf(step as any);
  const current = index >= 0 ? index + 1 : 0;
  const total = WIZARD_STEPS.length;

  const percentage = (current / total) * 100;

  return (
    <div className="w-full mb-4 transition-colors">
      <div className="h-1 rounded" style={{ backgroundColor: "var(--border)" }}>
        <div
          className="h-1 rounded transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: "var(--accent)", boxShadow: "0 0 6px var(--accent-glow)" }}
        />
      </div>

      <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
        Step {current} of {total}
      </div>
    </div>
  );
}
