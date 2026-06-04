"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/wizard/useWizardStore";
import { useWizardSteps } from "@/lib/wizard/useWizardSteps";
import {
  WizardObjectType,
  WizardJobType,
  WizardStepId,
  OBJECT_TYPE_STEPS,
  JOB_TYPE_STEPS,
} from "@/lib/wizard/wizardSchema";
import DynamicStepForm from "@/app/wizard/components/DynamicStepForm";

export default function StepDynamic() {
  const router = useRouter();

  const {
    selectedOperations,
    selectedObjectTypes,
    selectedJobTypes,
  } = useWizardStore();

  const { currentObjectIndex, currentStepIndex, nextStep, prevStep } =
    useWizardSteps();

  // ⭐ FIX: Only load object/job types for selected operations
  const allObjects: (WizardObjectType | WizardJobType)[] = [
    ...selectedOperations.flatMap(
      (op) => selectedObjectTypes[op] || []
    ),
    ...selectedOperations.flatMap(
      (op) => selectedJobTypes[op] || []
    ),
  ];

  // If nothing selected → show error
  if (allObjects.length === 0) {
    return (
      <div className="p-10 text-center text-red-600 font-bold">
        No selections found.
      </div>
    );
  }

  const currentItem = allObjects[currentObjectIndex];

  const steps =
    OBJECT_TYPE_STEPS[currentItem as WizardObjectType]?.steps ||
    JOB_TYPE_STEPS[currentItem as WizardJobType]?.steps ||
    [];

  const stepId = steps[currentStepIndex];

  const handleBack = () => {
    if (currentObjectIndex === 0 && currentStepIndex === 0) {
      router.push("/wizard/steps/object-type");
      return;
    }
    prevStep();
  };

  return (
    <div 
      className="relative min-h-screen flex flex-col items-center py-12 px-6 transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
    >

      <h1 
        className="text-3xl font-bold mb-6 transition-colors"
        style={{ color: "var(--text-primary)" }}
      >
        {currentItem} — {stepId}
      </h1>

      {/* Object/Job Progress */}
      <div className="flex gap-3 mb-8">
        {allObjects.map((obj, idx) => (
          <div
            key={obj}
            className="px-4 py-2 rounded-xl text-sm font-semibold shadow transition duration-200"
            style={
              idx === currentObjectIndex
                ? {
                    backgroundColor: "var(--accent)",
                    color: "#ffffff",
                  }
                : {
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }
            }
          >
            {obj}
          </div>
        ))}
      </div>

      {/* Step Progress */}
      <div className="flex gap-2 mb-10">
        {steps.map((s, idx) => (
          <div
            key={s}
            className="w-8 h-2 rounded-full transition-all duration-200"
            style={{
              backgroundColor: idx <= currentStepIndex ? "var(--accent)" : "var(--border)",
            }}
          />
        ))}
      </div>

      <DynamicStepForm objectOrJob={currentItem} stepId={stepId} />

      <div className="flex gap-4 mt-10">
        <button
          onClick={handleBack}
          className="px-8 py-3 rounded-xl font-semibold shadow transition hover:opacity-90 border cursor-pointer"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          Back
        </button>

        <button
          onClick={nextStep}
          className="px-8 py-3 rounded-xl font-semibold shadow transition hover:opacity-90 cursor-pointer"
          style={{
            backgroundColor: "var(--accent)",
            color: "#ffffff",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
