export const WIZARD_STEPS = [
  "welcome",
  "operation",
  "object-type",
  "dynamic",
  "review",
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];
