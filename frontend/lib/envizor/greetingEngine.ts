// lib/envizor/greetingEngine.ts

import { EnvizorContext, ChatMessage } from "./types";
import { generatePredictiveGuidance } from "./predictiveGuidance";
import { CrossSystemDrift } from "./crossSystemDrift";

/**
 * Base V8 greeting text.
 */
const BASE_GREETING = `
👋 **Hi, I’m Envizor — your Terraform + Saviynt intelligence layer.**

I can analyse drift, interpret Terraform plans, understand object lineage, compare Saviynt vs Terraform, and guide you through the wizard with predictive insights.
`;

/**
 * Static V8 suggestions (always available).
 */
const STATIC_SUGGESTIONS = [
  // 🌟 Premium Wizard Q&As
  "🔍 How does Envizor detect my active Saviynt tenant?",
  "⚙️ What is the difference between target environments in IGA?",
  "📂 How do I map my local workspace directory safely?",
  "🕵️ What live endpoints and metadata does discovery fetch?",
  "⚡ How is configuration drift measured across tenants?",
  "📂 Explain the generated modular file layout",
  "🔒 How are sensitive credentials and variables handled?",
  "✨ What is the difference between Day-0 and Day-N wizard flows?",
  "💡 When should I choose STANDARD vs IMPORT/EXPORT?",
  "🔌 Explain Endpoint vs Connection structures",
  "📝 What is the difference between metadata and attributes?",
  "🛡️ How does Envizor validate form inputs before code generation?",

  // ⚙️ Standard Actions
  "Analyse cross-system drift",
  "Explain this Terraform plan",
  "Show lineage for a role",
  "Predict my next wizard step",
  "Check if my plan is safe",
];

/**
 * Wizard-aware suggestions.
 */
function wizardSuggestions(ctx: EnvizorContext): string[] {
  const suggestions: string[] = [];

  if (!ctx.hasDiscoveredTenants) {
    suggestions.push("Discover Saviynt tenants");
  }

  if (!ctx.selectedObjects || ctx.selectedObjects.length === 0) {
    suggestions.push("Select roles or entitlements");
  }

  if (!ctx.hasGeneratedTerraform) {
    suggestions.push("Generate Terraform files");
  }

  suggestions.push("Deploy Terraform");

  return suggestions;
}

/**
 * Drift-aware suggestions.
 */
function driftSuggestions(drift?: CrossSystemDrift | null): string[] {
  if (!drift) return [];

  const suggestions: string[] = [];

  if (drift.missingInTerraform.length > 0) {
    suggestions.push("Import missing Saviynt objects into Terraform");
  }

  if (drift.missingInSaviynt.length > 0) {
    suggestions.push("Clean up stale Terraform state");
  }

  return suggestions;
}

/**
 * Builds the full V8 greeting message.
 */
export function buildGreetingMessage(
  ctx: EnvizorContext,
  drift?: CrossSystemDrift | null
): ChatMessage {
  const predictive = generatePredictiveGuidance(ctx, drift);

  const suggestions = [
    ...STATIC_SUGGESTIONS,
    ...wizardSuggestions(ctx),
    ...driftSuggestions(drift),
  ];

  return {
    from: "bot",
    text:
      BASE_GREETING +
      (predictive
        ? `\n\n🔮 **Insight:** ${predictive}`
        : "\n\nAsk me anything about your tenant, Terraform, or wizard progress."),
    suggestions,
  };
}
