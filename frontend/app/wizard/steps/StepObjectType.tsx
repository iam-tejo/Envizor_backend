"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/wizard/useWizardStore";
import {
  WIZARD_SCHEMA,
  WizardOperation,
  WizardObjectType,
  WizardJobType,
} from "@/lib/wizard/wizardSchema";
import WizardShell from "@/app/wizard/WizardShell";
import { ArrowLeftIcon, ArrowRightIcon } from "@/app/wizard/components/ArrowIcons";

// ⭐ Import premium tile styling from StepOperation
import "@/app/wizard/steps/operation/StepOperation.css";

export default function StepObjectType() {
  const router = useRouter();

  const {
    selectedOperations,   // ⭐ FIX: use selected operations only
    selectedObjectTypes,
    selectedJobTypes,
    toggleObjectType,
    toggleJobType,
  } = useWizardStore();

  const [openGroups, setOpenGroups] = useState<
    Partial<Record<WizardOperation, boolean>>
  >({});

  const toggleGroup = (op: WizardOperation) =>
    setOpenGroups((prev) => ({ ...prev, [op]: !prev[op] }));

  const totalSelected =
    Object.values(selectedObjectTypes).flat().length +
    Object.values(selectedJobTypes).flat().length;

  const handleNext = () => {
    if (totalSelected === 0) return;
    router.push("/wizard/steps/dynamic");
  };

  return (
    <WizardShell>

      <div 
        className="relative w-full max-w-5xl flex flex-col items-center py-12 px-6 transition-colors duration-300"
        style={{ backgroundColor: "transparent", color: "var(--text-primary)" }}
      >

        {/* LEFT ARROW */}
        <div className="absolute inset-y-0 left-0 flex items-center -translate-x-12 z-50">
          <button
            onClick={() => router.push("/wizard/steps/operation")}
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
        <div className="absolute inset-y-0 right-0 flex items-center translate-x-12 z-50">
          <button
            onClick={handleNext}
            disabled={totalSelected === 0}
            className="p-4 rounded-full shadow-xl transition duration-200 border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)"
            }}
          >
            <ArrowRightIcon
              size={42}
              stroke={totalSelected === 0 ? "var(--text-muted)" : "var(--accent)"}
            />
          </button>
        </div>

        <h1 
          className="text-3xl font-bold mb-10 transition-colors"
          style={{ color: "var(--text-primary)" }}
        >
          Select Object Types / Job Types
        </h1>

        <div className="w-full space-y-6">

          {/* ⭐ FIX: Only loop through selected operations */}
          {selectedOperations.map((op: WizardOperation) => {
            const schema = WIZARD_SCHEMA[op];
            const isOpen = openGroups[op];

            const objectTypes = schema.objectTypes || [];
            const jobTypes = schema.jobTypes || [];

            return (
              <div
                key={op}
                className="rounded-2xl shadow-xl p-6 transition-all duration-300 border"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border)",
                }}
              >
                {/* ⭐ PREMIUM GROUP HEADER */}
                <div
                  onClick={() => toggleGroup(op)}
                  className="operation-tile relative rounded-2xl shadow-lg border cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl p-6 flex justify-between items-center"
                  style={{
                    backgroundColor: "var(--bg-panel)",
                    borderColor: "var(--border)"
                  }}
                >
                  {/* Radiant top band */}
                  <div className="absolute top-0 left-0 w-full h-2 rounded-t-2xl bg-gradient-to-r from-blue-400 to-blue-600" />

                  <div>
                    <h2 
                      className="text-2xl font-semibold transition-colors"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {schema.label}
                    </h2>
                    <p 
                      className="transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {schema.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div
                    className={`text-3xl transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    style={{ color: "var(--text-muted)" }}
                  >
                    ▼
                  </div>
                </div>

                {/* COLLAPSIBLE CONTENT */}
                <div
                  className={`overflow-hidden transition-all duration-500 ${
                    isOpen ? "max-h-[600px] mt-6" : "max-h-0"
                  }`}
                >

                  {/* ⭐ OBJECT TYPES (premium tiles) */}
                  {objectTypes.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                      {objectTypes.map((obj: WizardObjectType) => {
                        const isSelected =
                          selectedObjectTypes[op]?.includes(obj) || false;

                        return (
                          <div
                            key={obj}
                            onClick={() => toggleObjectType(op, obj)}
                            className="operation-tile relative rounded-2xl shadow-lg border cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                            style={{
                              backgroundColor: isSelected ? "var(--bg-elevated)" : "var(--bg-panel)",
                              borderColor: isSelected ? "var(--accent)" : "var(--border)",
                              boxShadow: isSelected ? "0 0 0 1px var(--accent), 0 4px 20px var(--accent-glow)" : "none"
                            }}
                          >
                            {/* Radiant band */}
                            <div className="h-2 w-full rounded-t-2xl bg-gradient-to-r from-blue-400 to-blue-600" />

                            {/* Tick */}
                            {isSelected && (
                              <div 
                                className="absolute top-3 right-3 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-md font-bold"
                                style={{ backgroundColor: "var(--accent)" }}
                              >
                                ✓
                              </div>
                            )}

                            <div className="p-6">
                              <h3 
                                className="text-xl font-semibold transition-colors"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {obj}
                              </h3>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ⭐ JOB TYPES (premium tiles, green variant) */}
                  {jobTypes.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {jobTypes.map((job: WizardJobType) => {
                        const isSelected =
                          selectedJobTypes[op]?.includes(job) || false;

                        return (
                          <div
                            key={job}
                            onClick={() => toggleJobType(op, job)}
                            className="operation-tile relative rounded-2xl shadow-lg border cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                            style={{
                              backgroundColor: isSelected ? "var(--bg-elevated)" : "var(--bg-panel)",
                              borderColor: isSelected ? "var(--success)" : "var(--border)",
                              boxShadow: isSelected ? "0 0 0 1px var(--success), 0 4px 20px rgba(34, 197, 94, 0.2)" : "none"
                            }}
                          >
                            {/* Green radiant band */}
                            <div className="h-2 w-full rounded-t-2xl bg-gradient-to-r from-green-400 to-green-600" />

                            {/* Tick */}
                            {isSelected && (
                              <div 
                                className="absolute top-3 right-3 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-md font-bold"
                                style={{ backgroundColor: "var(--success)" }}
                              >
                                ✓
                              </div>
                            )}

                            <div className="p-6">
                              <h3 
                                className="text-xl font-semibold transition-colors"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {job}
                              </h3>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </WizardShell>
  );
}
