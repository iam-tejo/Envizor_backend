// lib/envizor/crossSystemDrift.ts

import { SaviyntModel } from "./saviyntModel";
import { TerraformStateModel } from "./terraformModel";

export type CrossSystemDrift = {
  missingInTerraform: string[];
  missingInSaviynt: string[];
};

export function analyzeCrossSystemDrift(
  saviynt: SaviyntModel,
  tfState: TerraformStateModel
): CrossSystemDrift {
  const missingInTerraform: string[] = [];
  const missingInSaviynt: string[] = [];

  const saviyntRoleNames = saviynt.roles.map((r) => r.name);
  const tfRoleNames: string[] = [];

  for (const m of tfState.modules) {
    for (const r of m.resources) {
      if (r.type === "saviynt_role") {
        tfRoleNames.push(r.name);
      }
    }
  }

  for (const name of saviyntRoleNames) {
    if (!tfRoleNames.includes(name)) {
      missingInTerraform.push(`role:${name}`);
    }
  }

  for (const name of tfRoleNames) {
    if (!saviyntRoleNames.includes(name)) {
      missingInSaviynt.push(`role:${name}`);
    }
  }

  return { missingInTerraform, missingInSaviynt };
}
