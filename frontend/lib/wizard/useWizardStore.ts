import { create } from "zustand";
import {
  WizardOperation,
  WizardObjectType,
  WizardJobType,
  WIZARD_SCHEMA,
} from "./wizardSchema";

interface WizardState {
  sourceEnvironment: string | null;
  targetEnvironment: string | null;
  setSourceEnvironment: (env: string) => void;
  setTargetEnvironment: (env: string) => void;

  operations: WizardOperation[];
  selectedOperations: WizardOperation[];
  toggleOperation: (op: WizardOperation) => void;

  selectedObjectTypes: Record<WizardOperation, WizardObjectType[]>;
  toggleObjectType: (op: WizardOperation, obj: WizardObjectType) => void;

  selectedJobTypes: Record<WizardOperation, WizardJobType[]>;
  toggleJobType: (op: WizardOperation, job: WizardJobType) => void;

  formData: Record<string, any>;
  updateFormField: (
    objectOrJob: string,
    stepId: string,
    field: string,
    value: any
  ) => void;
}

export const useWizardStore = create<WizardState>((set) => ({
  sourceEnvironment: null,
  targetEnvironment: null,
  setSourceEnvironment: (env) => set({ sourceEnvironment: env }),
  setTargetEnvironment: (env) => set({ targetEnvironment: env }),

  operations: Object.keys(WIZARD_SCHEMA) as WizardOperation[],
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

  formData: {},
  updateFormField: (objectOrJob, stepId, field, value) =>
    set((state) => {
      const prevForm = state.formData;
      const objectData = prevForm[objectOrJob] || {};
      const stepData = objectData[stepId] || {};

      return {
        formData: {
          ...prevForm,
          [objectOrJob]: {
            ...objectData,
            [stepId]: {
              ...stepData,
              [field]: value,
            },
          },
        },
      };
    }),
}));
