// lib/envizor/intentDetector.ts

export type EnvizorIntent =
  | "greeting"
  | "explain_plan"
  | "explain_destroys"
  | "explain_creates"
  | "explain_updates"
  | "plan_safety"
  | "analyse_drift"
  | "show_lineage"
  | "predict_next_step"
  | "wizard_navigation"
  | "saviynt_lookup"
  | "terraform_help"
  | "general_help"
  | "wizard_question"
| "wizard_explain"
| "wizard_where_am_i"
| "wizard_what_next"
| "wizard_navigate"

  | "unknown";

export function detectIntent(msg: string): EnvizorIntent {
  if (!msg) return "unknown";

  const normalized = msg.toLowerCase().trim();

  // Greetings
  if (
    normalized.startsWith("hi") ||
    normalized.startsWith("hello") ||
    normalized.startsWith("hey") ||
    normalized.includes("who are you")
  ) {
    return "greeting";
  }

  // Plan explanation
  if (normalized.includes("explain") && normalized.includes("plan")) {
    return "explain_plan";
  }

  if (normalized.includes("explain") && normalized.includes("destroy")) {
    return "explain_destroys";
  }

  if (normalized.includes("explain") && normalized.includes("create")) {
    return "explain_creates";
  }

  if (normalized.includes("explain") && normalized.includes("update")) {
    return "explain_updates";
  }

  // Plan safety
  if (
    normalized.includes("safe") ||
    normalized.includes("is this ok") ||
    normalized.includes("is this risky")
  ) {
    return "plan_safety";
  }

  // Drift
  if (
    normalized.includes("analyse drift") ||
    normalized.includes("analyze drift") ||
    normalized.includes("drift")
  ) {
    return "analyse_drift";
  }

  // Lineage
  if (
    normalized.includes("lineage") ||
    normalized.includes("show lineage") ||
    normalized.includes("role lineage")
  ) {
    return "show_lineage";
  }

  // Next step
  if (
    normalized.includes("next step") ||
    normalized.includes("what should i do next") ||
    normalized.includes("predict")
  ) {
    return "predict_next_step";
  }

  // Wizard navigation
  if (
    normalized.includes("go to") ||
    normalized.includes("navigate") ||
    normalized.includes("open") &&
      normalized.includes("wizard")
  ) {
    return "wizard_navigation";
  }

  if (
    normalized.includes("discovery") ||
    normalized.includes("environment") ||
    normalized.includes("compare") ||
    normalized.includes("comparison") ||
    normalized.includes("diff") ||
    normalized.includes("drift") ||
    normalized.includes("generate") ||
    normalized.includes("generation") ||
    normalized.includes("summary") ||
    normalized.includes("welcome") ||
    normalized.includes("operation") ||
    normalized.includes("object type") ||
    normalized.includes("object-type") ||
    normalized.includes("objecttype") ||
    normalized.includes("dynamic") ||
    normalized.includes("form") ||
    normalized.includes("input") ||
    normalized.includes("attribute") ||
    normalized.includes("metadata") ||
    normalized.includes("review") ||
    normalized.includes("dry run") ||
    normalized.includes("dryrun") ||
    normalized.includes("tenant") ||
    normalized.includes("active") ||
    normalized.includes("detect") ||
    normalized.includes("workspace") ||
    normalized.includes("directory") ||
    normalized.includes("sensitive") ||
    normalized.includes("variable") ||
    normalized.includes("credential") ||
    normalized.includes("hcl") ||
    normalized.includes("layout") ||
    normalized.includes("import/export") ||
    normalized.includes("bulk") ||
    normalized.includes("upload") ||
    normalized.includes("reconciliation") ||
    normalized.includes("job") ||
    normalized.includes("endpoint") ||
    normalized.includes("connection") ||
    normalized.includes("group") ||
    normalized.includes("privilege") ||
    normalized.includes("role") ||
    normalized.includes("entitlement") ||
    normalized.includes("validation") ||
    normalized.includes("compile") ||
    normalized.includes("syntactically") ||
    normalized.includes("day-0") ||
    normalized.includes("day-n") ||
    normalized.includes("wizard flow")
  ) {
    return "wizard_question";
  }

  // Saviynt lookup
  if (
    normalized.includes("security system") ||
    normalized.includes("endpoint") ||
    normalized.includes("entitlement") ||
    normalized.includes("role") ||
    normalized.includes("application")
  ) {
    return "saviynt_lookup";
  }

  // Terraform help
  if (
    normalized.includes("terraform") ||
    normalized.includes("tf") ||
    (normalized.includes("plan") && !normalized.includes("explain"))
  ) {
    return "terraform_help";
  }

  // General help
  if (
    normalized.includes("help") ||
    normalized.includes("what can you do")
  ) {
    return "general_help";
  }

  if (normalized.includes("what is") && normalized.includes("wizard"))
    return "wizard_explain";

  if (normalized.includes("where am i"))
    return "wizard_where_am_i";

  if (normalized.includes("what should i do next"))
    return "wizard_what_next";

  if (
    normalized.includes("go to") ||
    normalized.includes("open") ||
    normalized.includes("take me to")
  )
    return "wizard_navigate";

  return "unknown";
}

