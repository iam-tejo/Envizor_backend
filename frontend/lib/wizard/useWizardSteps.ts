"use client";

import { create } from "zustand";
import { useWizardStore } from "./useWizardStore";
import {
  WizardObjectType,
  WizardJobType,
  WizardStepId,
  OBJECT_TYPE_STEPS,
  JOB_TYPE_STEPS,
} from "./wizardSchema";

export type WizardStepsState = {
  currentObjectIndex: number;
  currentStepIndex: number;

  nextStep: () => void;
  prevStep: () => void;
  resetSteps: () => void;
};

export const useWizardSteps = create<WizardStepsState>((set, get) => ({
  currentObjectIndex: 0,
  currentStepIndex: 0,

  nextStep: () => {
    const { selectedObjectTypes, selectedJobTypes } = useWizardStore.getState();
    const { currentObjectIndex, currentStepIndex } = get();

    const allItems: (WizardObjectType | WizardJobType)[] = [
      ...Object.values(selectedObjectTypes).flat(),
      ...Object.values(selectedJobTypes).flat(),
    ];

    const currentItem = allItems[currentObjectIndex];

    const steps =
      OBJECT_TYPE_STEPS[currentItem as WizardObjectType]?.steps ||
      JOB_TYPE_STEPS[currentItem as WizardJobType]?.steps ||
      [];

    const isLastStep = currentStepIndex === steps.length - 1;

    if (!isLastStep) {
      set({ currentStepIndex: currentStepIndex + 1 });
      return;
    }

    const isLastObject = currentObjectIndex === allItems.length - 1;

    if (!isLastObject) {
      set({
        currentObjectIndex: currentObjectIndex + 1,
        currentStepIndex: 0,
      });
      return;
    }
  },

  prevStep: () => {
    const { selectedObjectTypes, selectedJobTypes } = useWizardStore.getState();
    const { currentObjectIndex, currentStepIndex } = get();

    const allItems: (WizardObjectType | WizardJobType)[] = [
      ...Object.values(selectedObjectTypes).flat(),
      ...Object.values(selectedJobTypes).flat(),
    ];

    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
      return;
    }

    if (currentObjectIndex > 0) {
      const prevItem = allItems[currentObjectIndex - 1];

      const prevSteps =
        OBJECT_TYPE_STEPS[prevItem as WizardObjectType]?.steps ||
        JOB_TYPE_STEPS[prevItem as WizardJobType]?.steps ||
        [];

      set({
        currentObjectIndex: currentObjectIndex - 1,
        currentStepIndex: prevSteps.length - 1,
      });
    }
  },

  resetSteps: () =>
    set({
      currentObjectIndex: 0,
      currentStepIndex: 0,
    }),
}));
