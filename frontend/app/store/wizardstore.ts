"use client";

import { create } from "zustand";
import {
  WIZARD_SCHEMA,
  WizardOperation,
  WizardObjectType,
  WizardJobType,
} from "@/lib/wizard/wizardSchema";

type WizardStore = {
  // ⭐ NEW — Workspace (DEV / PRE / PROD)
  workspace: string;
  setWorkspace: (workspace: string) => void;

  // Step 1 — Operations
  operations: WizardOperation[];
  selectedOperations: WizardOperation[];
  toggleOperation: (op: WizardOperation) => void;

  // Step 2 — Object Types & Job Types
  selectedObjectTypes: Record<WizardOperation, WizardObjectType[]>;
  toggleObjectType: (op: WizardOperation, obj: WizardObjectType) => void;

  selectedJobTypes: Record<WizardOperation, WizardJobType[]>;
  toggleJobType: (op: WizardOperation, job: WizardJobType) => void;
};

export const useWizardStore = create<WizardStore>((set) => ({
  // ⭐ NEW — Workspace state
  workspace: "",
  setWorkspace: (workspace) => set({ workspace }),

  // All operations come from schema keys
  operations: Object.keys(WIZARD_SCHEMA) as WizardOperation[],

  // Step 1 — Operation selection
  selectedOperations: [],
  toggleOperation: (op) =>
    set((state) => {
      const exists = state.selectedOperations.includes(op);
      return {
        selectedOperations: exists
          ? state.selectedOperations.filter((o) => o !== op)
          : [...state.selectedOperations, op],
      };
    }),

  // Step 2 — Object types
  selectedObjectTypes: {} as Record<WizardOperation, WizardObjectType[]>,
  toggleObjectType: (op, obj) =>
    set((state) => {
      const current = state.selectedObjectTypes[op] || [];
      const exists = current.includes(obj);

      return {
        selectedObjectTypes: {
          ...state.selectedObjectTypes,
          [op]: exists
            ? current.filter((o) => o !== obj)
            : [...current, obj],
        },
      };
    }),

  // Step 2 — Job types
  selectedJobTypes: {} as Record<WizardOperation, WizardJobType[]>,
  toggleJobType: (op, job) =>
    set((state) => {
      const current = state.selectedJobTypes[op] || [];
      const exists = current.includes(job);

      return {
        selectedJobTypes: {
          ...state.selectedJobTypes,
          [op]: exists
            ? current.filter((j) => j !== job)
            : [...current, job],
        },
      };
    }),
}));
