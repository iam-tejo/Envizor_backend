// lib/envizor/suggestionEngine.ts

export function getSuggestionsForStep(step?: string): string[] {
  switch (step) {
    case "environmentSelection":
      return [
        "Explain the wizard",
        "Which environment should I pick",
        "Go to Tenant Discovery",
        "What should I do next"
      ];

    case "tenantDiscovery":
      return [
        "Explain roles",
        "Explain entitlements",
        "Show lineage for a role",
        "What should I do next"
      ];

    case "terraformGeneration":
      return [
        "Explain this Terraform plan",
        "Explain creates",
        "Explain destroys",
        "Is this plan safe"
      ];

    case "summary":
      return [
        "Review my changes",
        "Predict next step",
        "Help me deploy Terraform"
      ];

    default:
      return [
        "Explain the wizard",
        "What should I do next"
      ];
  }
}
