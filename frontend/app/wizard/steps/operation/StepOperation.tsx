"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/wizard/useWizardStore";
import { WIZARD_SCHEMA, WizardOperation } from "@/lib/wizard/wizardSchema";
import WizardShell from "@/app/wizard/WizardShell";
import { ArrowLeftIcon, ArrowRightIcon } from "@/app/wizard/components/ArrowIcons";

export default function StepOperation() {
  const router = useRouter();
  const { operations, selectedOperations, toggleOperation } = useWizardStore();

  const handleNext = () => {
    if (selectedOperations.length === 0) return;
    router.push("/wizard/steps/object-type");
  };

  return (
    <WizardShell>
      {/* THEME AWARE CONTAINER */}
      <div 
        className="min-h-screen w-full flex flex-col items-center py-12 px-6 relative transition-colors duration-300"
        style={{ backgroundColor: "transparent", color: "var(--text-primary)" }}
      >

        {/* LEFT ARROW */}
        <div className="absolute inset-y-0 left-0 flex items-center -translate-x-10 z-50">
          <button
            onClick={() => router.push("/wizard/steps/welcome")}
            className="p-4 rounded-full shadow-xl hover:scale-110 transition duration-200 border cursor-pointer"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)"
            }}
          >
            <ArrowLeftIcon size={42} stroke="var(--accent)" />
          </button>
        </div>

        {/* RIGHT ARROW */}
        <div className="absolute inset-y-0 right-0 flex items-center translate-x-10 z-50">
          <button
            onClick={handleNext}
            disabled={selectedOperations.length === 0}
            className="p-4 rounded-full shadow-xl transition duration-200 border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)"
            }}
          >
            <ArrowRightIcon
              size={42}
              stroke={selectedOperations.length === 0 ? "var(--text-muted)" : "var(--accent)"}
            />
          </button>
        </div>

        <h1 
          className="text-3xl font-bold mb-10 transition-colors"
          style={{ color: "var(--text-primary)" }}
        >
          Pick Your Configuration Modules
        </h1>

        {/* 3×2 GRID — NO SCROLLING */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl w-full">

          {operations.map((op: WizardOperation, index: number) => {
            const schema = WIZARD_SCHEMA[op];
            const isSelected = selectedOperations.includes(op);

            return (
              <div
                key={op}
                onClick={() => toggleOperation(op)}
                className="relative rounded-2xl shadow-lg border cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-fade-in"
                style={{
                  animationDelay: `${index * 120}ms`,
                  backgroundColor: isSelected ? "var(--bg-elevated)" : "var(--bg-surface)",
                  borderColor: isSelected ? "var(--accent)" : "var(--border)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  boxShadow: isSelected ? "0 0 0 1px var(--accent), 0 4px 20px var(--accent-glow)" : "none"
                }}
              >
                {/* BLUE RADIANT TOP BAND */}
                <div 
                  className="h-2 w-full rounded-t-2xl bg-gradient-to-r"
                  style={{ background: isSelected ? "linear-gradient(90deg, var(--accent), var(--accent-hover))" : "linear-gradient(90deg, var(--border), var(--border-subtle))" }}
                />

                {/* TICK MARK */}
                {isSelected && (
                  <div 
                    className="absolute top-3 right-3 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-md font-bold"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    ✓
                  </div>
                )}

                {/* CONTENT */}
                <div className="p-6">
                  <h2 
                    className="text-xl font-semibold transition-colors"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {schema.label}
                  </h2>

                  <p 
                    className="mt-2 text-sm transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {schema.description}
                  </p>

                  {/* ARTEFACTS COVERED */}
                  <div className="mt-4">
                    <h3 
                      className="text-sm font-semibold mb-1 transition-colors"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Artefacts Covered:
                    </h3>

                    <ul 
                      className="text-sm list-disc ml-5 space-y-1 transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {schema.objectTypes?.map((obj) => (
                        <li key={obj}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}

        </div>

      </div>

      {/* FADE-IN ANIMATION */}
      <style jsx>{`
        .animate-fade-in {
          opacity: 0;
          transform: translateY(10px);
          animation: fadeIn 0.5s forwards;
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </WizardShell>
  );
}
