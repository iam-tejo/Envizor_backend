// lib/envizor/types.ts

export type EnvizorContext = {
  wizardStep?: 
    | "environmentSelection" 
    | "tenantDiscovery" 
    | "environmentComparison"
    | "terraformGeneration" 
    | "summary"
    | "welcome"
    | "operationSelection"
    | "objectTypeSelection"
    | "dynamicFormInputs"
    | "reviewAndDryRun";

  workspace?: string;
  tenant?: string;

  hasGeneratedTerraform?: boolean;
  hasDiscoveredTenants?: boolean;

  selectedObjects?: any[];
  discoveredObjects?: any;

  terraformPlan?: string;
  terraformState?: any;
};

export type EnvizorAction = {
  type: "NAVIGATE";
  payload?: {
    path: string;
  };
};

export type ChatMessage = {
  from: "user" | "bot";
  text: string;
  suggestions?: string[];
};

export type EnvizorReply = {
  from: "bot";
  text: string;
  suggestions?: string[];
  action?: EnvizorAction;
};
