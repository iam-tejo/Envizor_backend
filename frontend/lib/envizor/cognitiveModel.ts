// lib/envizor/cognitiveModel.ts

import { EnvizorContext } from "./types";

export function wizardNextStep(ctx: EnvizorContext): string | null {
  if (!ctx.hasDiscoveredTenants) {
    return "Tenant Discovery";
  }

  if (!ctx.selectedObjects || ctx.selectedObjects.length === 0) {
    return "Object Selection";
  }

  if (!ctx.hasGeneratedTerraform) {
    return "Terraform Generation";
  }

  return null;
}
