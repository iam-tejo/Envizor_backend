// lib/patchEngine.ts
import type { StagedHunk } from "./stagingManager";

export function applyHunksToTarget(
  targetContent: string,
  staged: StagedHunk[]
): string {
  const lines = targetContent.split("\n");

  // Apply bottom → top to avoid index shifting
  const sorted = [...staged].sort(
    (a, b) => b.targetStart - a.targetStart
  );

  for (const h of sorted) {
    const startIdx = h.targetStart - 1;
    const deleteCount = h.targetLength;

    lines.splice(startIdx, deleteCount, ...h.replacementLines);
  }

  return lines.join("\n");
}
