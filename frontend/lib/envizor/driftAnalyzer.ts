// lib/envizor/driftAnalyzer.ts

export type DriftSummary = {
  destroys: number;
};

export function analyzeDrift(
  plan: string,
  discoveredObjects: any
): DriftSummary {
  if (!plan) {
    return { destroys: 0 };
  }

  const destroys = (plan.match(/- destroy/g) || []).length;

  return { destroys };
}
