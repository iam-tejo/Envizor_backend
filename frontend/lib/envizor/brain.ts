// lib/envizor/brain.ts

import { EnvizorContext, EnvizorReply } from "./types";
import { detectIntent, EnvizorIntent } from "./intentDetector";
import { WizardKnowledge } from "./wizardKnowledge";

import { analyzeDrift } from "./driftAnalyzer";
import { reconcile } from "./reconciliationEngine";
import { buildSaviyntModel } from "./saviyntModel";
import { buildTerraformStateModel } from "./terraformModel";
import { analyzeCrossSystemDrift } from "./crossSystemDrift";
import { buildRoleLineage } from "./lineageEngine";
import { generatePredictiveGuidance } from "./predictiveGuidance";
import { wizardNextStep } from "./cognitiveModel";

type BrainContext = EnvizorContext;

/* ------------------------------
   Helper: No plan loaded
--------------------------------*/
function noPlanLoaded(): EnvizorReply {
  return {
    from: "bot",
    text: "I don’t see a Terraform plan loaded yet. Generate a plan first and I’ll analyse it for you.",
    suggestions: ["Generate Terraform plan", "Open Terraform Generation"]
  };
}

/* ------------------------------
   Terraform Plan Explanation
--------------------------------*/
function explainTerraformPlan(plan: string): EnvizorReply {
  if (!plan) return noPlanLoaded();

  const creates = (plan.match(/\+ create/g) || []).length;
  const destroys = (plan.match(/- destroy/g) || []).length;
  const updates = (plan.match(/~ update/g) || []).length;

  return {
    from: "bot",
    text: `
Here’s what I found in your Terraform plan:

• Creates: ${creates}
• Updates: ${updates}
• Destroys: ${destroys}

Ask me to go deeper:
- "Explain the destroys"
- "Explain the creates"
- "Explain the updates"
- "Is this plan safe"
- "Analyse drift"
`,
    suggestions: [
      "Explain the destroys",
      "Explain the creates",
      "Explain the updates",
      "Is this plan safe",
      "Analyse drift"
    ]
  };
}

/* ------------------------------
   Plan Sections
--------------------------------*/
function explainPlanSection(plan: string, marker: string, label: string): EnvizorReply {
  if (!plan) return noPlanLoaded();

  const lines = plan
    .split("\n")
    .filter((l) => l.includes(marker))
    .map((l) => l.trim());

  if (!lines.length) {
    return {
      from: "bot",
      text: `Your plan does not contain any ${label.toLowerCase()}.`,
      suggestions: ["Explain this Terraform plan", "Is this plan safe"]
    };
  }

  return {
    from: "bot",
    text: `These resources will be **${label.toLowerCase()}**:\n\n${lines.join("\n")}`,
    suggestions: ["Is this plan safe", "Analyse drift"]
  };
}

/* ------------------------------
   Plan Safety
--------------------------------*/
function planSafety(plan: string, ctx: BrainContext): EnvizorReply {
  if (!plan) return noPlanLoaded();

  const drift = analyzeDrift(plan, ctx.discoveredObjects);
  const destroys = drift.destroys;

  if (destroys === 0) {
    return {
      from: "bot",
      text: "This plan does not destroy any resources. From a deletion perspective, it looks safe.",
      suggestions: ["Explain the creates", "Explain the updates", "Analyse drift"]
    };
  }

  const recon = reconcile(plan, ctx);
  return {
    from: "bot",
    text: recon ?? `This plan destroys ${destroys} resources. Review the destroys carefully.`,
    suggestions: ["Explain the destroys", "Analyse drift", "Show lineage for a role"]
  };
}

/* ------------------------------
   Cross-System Drift
--------------------------------*/
function analyseDriftCrossSystem(ctx: BrainContext): EnvizorReply {
  if (!ctx.discoveredObjects || !ctx.terraformState) {
    return {
      from: "bot",
      text: "I need both Saviynt discovery data and Terraform state to analyse cross-system drift.",
      suggestions: ["Run tenant discovery", "Load Terraform state"]
    };
  }

  const saviynt = buildSaviyntModel(ctx.discoveredObjects);
  const tfState = buildTerraformStateModel(ctx.terraformState);
  const drift = analyzeCrossSystemDrift(saviynt, tfState);

  return {
    from: "bot",
    text: `
Cross-system drift detected:

• In Saviynt but not in Terraform: ${drift.missingInTerraform.length}
• In Terraform but not in Saviynt: ${drift.missingInSaviynt.length}
`,
    suggestions: ["Show lineage for a role", "Is this plan safe", "Predict my next step"]
  };
}

/* ------------------------------
   Lineage
--------------------------------*/
function showLineage(ctx: BrainContext, message: string): EnvizorReply {
  if (!ctx.discoveredObjects) {
    return {
      from: "bot",
      text: "I need Saviynt discovery data to show lineage.",
      suggestions: ["Run tenant discovery"]
    };
  }

  const saviynt = buildSaviyntModel(ctx.discoveredObjects);
  const lower = message.toLowerCase();
  const role = saviynt.roles.find((r: any) => lower.includes(r.name.toLowerCase()));

  if (!role) {
    return {
      from: "bot",
      text: "Tell me which role you want lineage for.",
      suggestions: ["Show lineage for ROLE_X"]
    };
  }

  const lineage = buildRoleLineage(saviynt, role.id);

  // ⭐ FIX: Type guard ensures lineage is non-null
  if (!lineage) {
    return {
      from: "bot",
      text: "I couldn’t build lineage for that role.",
      suggestions: ["Analyse drift", "Predict my next step"]
    };
  }

  return {
    from: "bot",
    text: `
Lineage for **${lineage.role.name}**:

• Entitlements: ${lineage.entitlements.length}
• Accounts: ${lineage.accounts.length}
`,
    suggestions: ["Is this plan safe", "Analyse drift", "Predict my next step"]
  };
}

/* ------------------------------
   Predict Next Step
--------------------------------*/
function predictNext(ctx: BrainContext): EnvizorReply {
  const next = wizardNextStep(ctx);

  return {
    from: "bot",
    text: next
      ? `Based on your progress, the next step is **${next}**.`
      : "You’ve completed the wizard flow.",
    suggestions: ["Open next step", "Explain this Terraform plan"]
  };
}

/* ------------------------------
   Wizard Explanation
--------------------------------*/
function explainWizard(): EnvizorReply {
  return {
    from: "bot",
    text: WizardKnowledge.overview,
    suggestions: ["Explain tenant discovery", "Explain Terraform generation"]
  };
}

/* ------------------------------
   Wizard Step Explanation
--------------------------------*/
function explainWizardStep(message: string, ctx: BrainContext): EnvizorReply {
  const m = message.toLowerCase();
  let step: string | null = null;

  if (
    m.includes("welcome") ||
    m.includes("day-0") ||
    m.includes("day-n") ||
    m.includes("wizard flow")
  ) {
    step = "welcome";
  } else if (
    m.includes("dynamic") ||
    m.includes("form") ||
    m.includes("input") ||
    m.includes("attribute") ||
    m.includes("metadata")
  ) {
    step = "dynamicFormInputs";
  } else if (
    m.includes("review") ||
    m.includes("dry run") ||
    m.includes("dryrun") ||
    m.includes("validation") ||
    m.includes("compile") ||
    m.includes("syntactically")
  ) {
    step = "reviewAndDryRun";
  } else if (
    m.includes("object type") ||
    m.includes("object-type") ||
    m.includes("objecttype") ||
    m.includes("endpoint") ||
    m.includes("connection") ||
    m.includes("group") ||
    m.includes("privilege") ||
    m.includes("role") ||
    m.includes("entitlement")
  ) {
    step = "objectTypeSelection";
  } else if (
    m.includes("operation") ||
    m.includes("import/export") ||
    m.includes("bulk") ||
    m.includes("upload") ||
    m.includes("reconciliation") ||
    m.includes("job")
  ) {
    step = "operationSelection";
  } else if (
    m.includes("generate") ||
    m.includes("generation") ||
    m.includes("sensitive") ||
    m.includes("variable") ||
    m.includes("credential") ||
    m.includes("hcl") ||
    m.includes("layout")
  ) {
    step = "terraformGeneration";
  } else if (
    m.includes("compare") ||
    m.includes("comparison") ||
    m.includes("diff") ||
    m.includes("drift") ||
    m.includes("difference")
  ) {
    step = "environmentComparison";
  } else if (
    m.includes("environment") ||
    m.includes("tenant") ||
    m.includes("active") ||
    m.includes("detect") ||
    m.includes("workspace") ||
    m.includes("directory")
  ) {
    step = "environmentSelection";
  } else if (m.includes("discovery")) {
    step = "tenantDiscovery";
  } else if (m.includes("summary")) {
    step = "summary";
  }

  if (step && WizardKnowledge.steps[step]) {
    const info = WizardKnowledge.steps[step];
    const suggestions = [...info.assistantHelp];
    return {
      from: "bot",
      text: `
Here is what you need to know about **${info.name}**:

${info.purpose.trim()}
`,
      suggestions: suggestions
    };
  }

  // Fallback to active step context
  let activeStep = ctx.wizardStep || "environmentSelection";
  if (!WizardKnowledge.steps[activeStep]) {
    activeStep = "environmentSelection";
  }

  const info = WizardKnowledge.steps[activeStep];

  return {
    from: "bot",
    text: `
You are currently on the **${info.name}** step. Here is what it does:

${info.purpose.trim()}
`,
    suggestions: ["What should I do next", "Predict my next step"]
  };
}


/* ------------------------------
   Where Am I?
--------------------------------*/
function whereAmI(ctx: BrainContext): EnvizorReply {
  const step = ctx.wizardStep || "environmentSelection";
  const info = (WizardKnowledge.steps as any)[step];

  return {
    from: "bot",
    text: `You are currently on the **${info.name}** step.`,
    suggestions: ["What should I do next", "Explain this step"]
  };
}

/* ------------------------------
   Wizard Navigation
--------------------------------*/
function wizardNavigate(message: string): EnvizorReply {
  const m = message.toLowerCase();
  let path: string | null = null;

  if (m.includes("discovery"))
    path = WizardKnowledge.navigation.routes.tenantDiscovery;
  else if (m.includes("generate"))
    path = WizardKnowledge.navigation.routes.terraformGeneration;
  else if (m.includes("summary"))
    path = WizardKnowledge.navigation.routes.summary;
  else if (m.includes("environment"))
    path = WizardKnowledge.navigation.routes.environmentSelection;

  if (!path) {
    return {
      from: "bot",
      text: "Tell me which step to open: Discovery, Generate, Summary, or Environment.",
      suggestions: ["Go to Discovery", "Open Generate", "Open Summary"]
    };
  }

  return {
    from: "bot",
    text: "Opening the requested wizard step.",
    action: {
      type: "NAVIGATE",
      payload: { path }
    },
    suggestions: ["What should I do next", "Explain this step"]
  };
}

/* ------------------------------
   Main Brain
--------------------------------*/
export async function envizorBrain(
  message: string,
  ctx: BrainContext
): Promise<EnvizorReply> {
  const intent: EnvizorIntent = detectIntent(message);

  switch (intent) {
    case "greeting":
      return {
        from: "bot",
        text: "Hi, I’m Envizor — your Terraform + Saviynt intelligence layer.",
        suggestions: ["Explain this Terraform plan", "Analyse drift", "Predict my next step"]
      };

    case "explain_plan":
      return explainTerraformPlan(ctx.terraformPlan || "");

    case "explain_destroys":
      return explainPlanSection(ctx.terraformPlan || "", "- destroy", "Destroys");

    case "explain_creates":
      return explainPlanSection(ctx.terraformPlan || "", "+ create", "Creates");

    case "explain_updates":
      return explainPlanSection(ctx.terraformPlan || "", "~ update", "Updates");

    case "plan_safety":
      return planSafety(ctx.terraformPlan || "", ctx);

    case "analyse_drift":
      return analyseDriftCrossSystem(ctx);

    case "show_lineage":
      return showLineage(ctx, message);

    case "predict_next_step":
      return predictNext(ctx);

    case "wizard_explain":
      return explainWizard();

    case "wizard_question":
      return explainWizardStep(message, ctx);

    case "wizard_where_am_i":
      return whereAmI(ctx);

    case "wizard_what_next":
      return predictNext(ctx);

    case "wizard_navigate":
      return wizardNavigate(message);

    case "terraform_help":
      return {
        from: "bot",
        text: "I can help you understand Terraform plans, state, and drift.",
        suggestions: ["Explain this Terraform plan", "Analyse drift"]
      };

    case "general_help":
      return {
        from: "bot",
        text: "I can analyse plans, drift, lineage, and guide you through the wizard.",
        suggestions: ["Explain this Terraform plan", "Predict my next step"]
      };

    case "saviynt_lookup":
      return {
        from: "bot",
        text: "I can reason about Saviynt roles and entitlements once discovery is loaded.",
        suggestions: ["Show lineage for ROLE_X", "Analyse drift"]
      };

    default:
      return {
        from: "bot",
        text: "I’m not sure what you mean yet, but I can help with Terraform, drift, lineage, and wizard guidance.",
        suggestions: ["Explain this Terraform plan", "Predict my next step"]
      };
  }
}
