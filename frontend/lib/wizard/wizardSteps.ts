// lib/wizard/wizardSteps.ts

import { WizardObjectType } from "./wizardSchema";

export interface WizardStepDefinition {
  id: string;
  title: string;
  fields: { id: string; label: string; type: string }[];
}

export const WIZARD_STEPS: any = {
  STANDARD: {
    Security_System: [
      {
        id: "basic",
        title: "Basic Details",
        fields: [
          { id: "name", label: "Name", type: "text" },
          { id: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
  },

  EXPORT: {},
  IMPORT: {},
  JOBS: {},
};
