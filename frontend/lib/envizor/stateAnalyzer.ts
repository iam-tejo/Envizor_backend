// lib/envizor/stateAnalyzer.ts

import { TerraformStateModel } from "./terraformModel";

export function findResourcesByType(
  state: TerraformStateModel,
  type: string
) {
  const results: { module: string; address: string }[] = [];

  for (const m of state.modules) {
    for (const r of m.resources) {
      if (r.type === type) {
        results.push({ module: m.name, address: r.address });
      }
    }
  }

  return results;
}

export function findOrphanedResources(
  state: TerraformStateModel,
  knownIds: string[]
) {
  const orphans: string[] = [];

  for (const m of state.modules) {
    for (const r of m.resources) {
      if (!knownIds.includes(r.name)) {
        orphans.push(r.address);
      }
    }
  }

  return orphans;
}
