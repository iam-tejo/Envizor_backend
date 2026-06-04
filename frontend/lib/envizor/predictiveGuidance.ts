// lib/envizor/predictiveGuidance.ts

import { EnvizorContext } from "./types";
import { CrossSystemDrift } from "./crossSystemDrift";

export function generatePredictiveGuidance(
  ctx: EnvizorContext,
  drift?: CrossSystemDrift | null
): string | null {
  if (!ctx.hasDiscoveredTenants) {
    return "You haven't run Tenant Discovery yet. I recommend discovering tenants before selecting objects or generating Terraform.";
  }

  if (!ctx.selectedObjects || ctx.selectedObjects.length === 0) {
    return "You haven't selected any objects yet. I recommend selecting roles or entitlements before generating Terraform.";
  }

  if (drift) {
    if (drift.missingInTerraform.length > 0) {
      return `There are Saviynt objects not represented in Terraform (${drift.missingInTerraform.length} items). You may want to import them before deploying.`;
    }

    if (drift.missingInSaviynt.length > 0) {
      return `There are Terraform resources not present in Saviynt (${drift.missingInSaviynt.length} items). This may indicate stale state or drift.`;
    }
  }

  if (!ctx.hasGeneratedTerraform) {
    return "You're ready to generate Terraform. I recommend running the Terraform Generator step next.";
  }

  return null;
}
