// /lib/wizard/wizardSchema.ts

// -----------------------------------------------------
// Wizard Operation Types
// -----------------------------------------------------
export type WizardOperation =
  | "STANDARD"
  | "IMPORT"
  | "EXPORT"
  | "FILEUPLOAD"
  | "RUNJOBS";

// -----------------------------------------------------
// Wizard Object Types
// -----------------------------------------------------
export type WizardObjectType =
  | "ENDPOINT"
  | "CONNECTION"
  | "SECURITY_SYSTEM"
  | "ACCOUNT"
  | "ENTITLEMENT"
  | "GROUP"
  | "ROLE"
  | "APPLICATION";

// -----------------------------------------------------
// Wizard Job Types
// -----------------------------------------------------
export type WizardJobType =
  | "IMPORT_JOB"
  | "EXPORT_JOB"
  | "RECONCILIATION_JOB";

// -----------------------------------------------------
// Wizard Step IDs (MUST include all steps)
// -----------------------------------------------------
export type WizardStepId =
  | "Metadata"
  | "Attributes"
  | "ImportConfig"
  | "CustomProperties"
  | "CustomLabels"
  | "Upload"
  | "Mapping"
  | "Validation"
  | "SelectJob"
  | "Parameters"
  | "Execute"
  | "Review";

// -----------------------------------------------------
// Operation Schema
// -----------------------------------------------------
type OperationSchema = {
  label: string;
  description: string;
  objectTypes?: WizardObjectType[];
  jobTypes?: WizardJobType[];
};

export const WIZARD_SCHEMA: Record<WizardOperation, OperationSchema> = {
  STANDARD: {
    label: "Terraform Artefacts",
    description: "Manage core IGA artefacts like endpoints, accounts, and entitlements.",
    objectTypes: [
      "ENDPOINT",
      "CONNECTION",
      "SECURITY_SYSTEM",
      "ACCOUNT",
      "ENTITLEMENT",
      "GROUP",
      "ROLE",
      "APPLICATION",
    ],
  },

  IMPORT: {
    label: "Import Packages",
    description: "Configure import sources and mappings.",
    objectTypes: ["CONNECTION", "SECURITY_SYSTEM", "ACCOUNT", "ENTITLEMENT"],
  },

  EXPORT: {
    label: "Export Packages",
    description: "Configure export targets and mappings.",
    objectTypes: ["CONNECTION", "SECURITY_SYSTEM", "ACCOUNT", "ENTITLEMENT"],
  },

  FILEUPLOAD: {
    label: "File Upload",
    description: "Upload and map flat files for bulk operations.",
    objectTypes: ["ACCOUNT", "ENTITLEMENT", "GROUP"],
  },

  RUNJOBS: {
    label: "Run Jobs",
    description: "Configure and execute background jobs.",
    jobTypes: ["IMPORT_JOB", "EXPORT_JOB", "RECONCILIATION_JOB"],
  },
};

// -----------------------------------------------------
// Steps per Object Type
// -----------------------------------------------------
type ObjectTypeSteps = {
  label: string;
  steps: WizardStepId[];
};

export const OBJECT_TYPE_STEPS: Record<WizardObjectType, ObjectTypeSteps> = {
  ENDPOINT: {
    label: "Endpoint",
    steps: [
      "Metadata",
      "Attributes",
      "ImportConfig",
      "CustomProperties",
      "CustomLabels",
      "Review",
    ],
  },

  CONNECTION: {
    label: "Connection",
    steps: ["Metadata", "Attributes", "Review"],
  },

  SECURITY_SYSTEM: {
    label: "Security System",
    steps: ["Metadata", "Attributes", "Review"],
  },

  ACCOUNT: {
    label: "Account",
    steps: ["Metadata", "Attributes", "Review"],
  },

  ENTITLEMENT: {
    label: "Entitlement",
    steps: ["Metadata", "Attributes", "Review"],
  },

  GROUP: {
    label: "Group",
    steps: ["Metadata", "Attributes", "Review"],
  },

  ROLE: {
    label: "Role",
    steps: ["Metadata", "Attributes", "Review"],
  },

  APPLICATION: {
    label: "Application",
    steps: ["Metadata", "Attributes", "Review"],
  },
};

// -----------------------------------------------------
// Steps per Job Type
// -----------------------------------------------------
type JobTypeSteps = {
  label: string;
  steps: WizardStepId[];
};

export const JOB_TYPE_STEPS: Record<WizardJobType, JobTypeSteps> = {
  IMPORT_JOB: {
    label: "Import Job",
    steps: ["Metadata", "SelectJob", "Parameters", "Execute", "Review"],
  },

  EXPORT_JOB: {
    label: "Export Job",
    steps: ["Metadata", "SelectJob", "Parameters", "Execute", "Review"],
  },

  RECONCILIATION_JOB: {
    label: "Reconciliation Job",
    steps: ["Metadata", "SelectJob", "Parameters", "Execute", "Review"],
  },
};

// -----------------------------------------------------
// Fallback Fields per Object Type & Step
// (Required for TS correctness even if unused)
// -----------------------------------------------------
export const OBJECT_TYPE_FIELDS: Record<
  WizardObjectType,
  Record<WizardStepId, string[]>
> = {
  ENDPOINT: {
    Metadata: [],
    Attributes: [],
    ImportConfig: [],
    CustomProperties: [],
    CustomLabels: [],
    Upload: [],
    Mapping: [],
    Validation: [],
    SelectJob: [],
    Parameters: [],
    Execute: [],
    Review: [],
  },

  CONNECTION: {
    Metadata: ["name", "description", "type"],
    Attributes: ["host", "port", "protocol"],
    ImportConfig: [],
    CustomProperties: [],
    CustomLabels: [],
    Upload: [],
    Mapping: [],
    Validation: [],
    SelectJob: [],
    Parameters: [],
    Execute: [],
    Review: [],
  },

  SECURITY_SYSTEM: {
    Metadata: ["name", "description"],
    Attributes: ["owner", "region"],
    ImportConfig: [],
    CustomProperties: [],
    CustomLabels: [],
    Upload: [],
    Mapping: [],
    Validation: [],
    SelectJob: [],
    Parameters: [],
    Execute: [],
    Review: [],
  },

  ACCOUNT: {
    Metadata: ["name", "description"],
    Attributes: ["status", "owner"],
    ImportConfig: [],
    CustomProperties: [],
    CustomLabels: [],
    Upload: [],
    Mapping: [],
    Validation: [],
    SelectJob: [],
    Parameters: [],
    Execute: [],
    Review: [],
  },

  ENTITLEMENT: {
    Metadata: ["name", "description"],
    Attributes: ["type", "risk"],
    ImportConfig: [],
    CustomProperties: [],
    CustomLabels: [],
    Upload: [],
    Mapping: [],
    Validation: [],
    SelectJob: [],
    Parameters: [],
    Execute: [],
    Review: [],
  },

  GROUP: {
    Metadata: ["name", "description"],
    Attributes: ["owner"],
    ImportConfig: [],
    CustomProperties: [],
    CustomLabels: [],
    Upload: [],
    Mapping: [],
    Validation: [],
    SelectJob: [],
    Parameters: [],
    Execute: [],
    Review: [],
  },

  ROLE: {
    Metadata: ["name", "description"],
    Attributes: ["owner", "risk"],
    ImportConfig: [],
    CustomProperties: [],
    CustomLabels: [],
    Upload: [],
    Mapping: [],
    Validation: [],
    SelectJob: [],
    Parameters: [],
    Execute: [],
    Review: [],
  },

  APPLICATION: {
    Metadata: ["name", "description"],
    Attributes: ["owner", "category"],
    ImportConfig: [],
    CustomProperties: [],
    CustomLabels: [],
    Upload: [],
    Mapping: [],
    Validation: [],
    SelectJob: [],
    Parameters: [],
    Execute: [],
    Review: [],
  },
};
