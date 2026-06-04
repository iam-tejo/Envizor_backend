// lib/stagingManager.ts
import type { Hunk } from "./diffEngine2";

export type StagedHunk = {
  hunkIndex: number;

  // PRE coordinates
  targetStart: number;
  targetLength: number;

  // For patching
  replacementLines: string[];

  // For GitHub-style confirmation modal
  originalLines: string[];
};

export type StagedState = {
  [file: string]: {
    hunks: StagedHunk[];
    totalHunks: number;
  };
};

export function addStagedHunk(
  file: string,
  hunk: Hunk,
  hunkIndex: number,
  prev: StagedState,
  totalHunks: number
): StagedState {
  const existing = prev[file]?.hunks ?? [];

  const newHunk: StagedHunk = {
    hunkIndex,
    targetStart: hunk.targetStart,
    targetLength: hunk.targetLength,
    replacementLines: hunk.sourceLines,
    originalLines: hunk.targetLines,
  };

  const withoutDup = existing.filter((h) => h.hunkIndex !== hunkIndex);

  return {
    ...prev,
    [file]: {
      hunks: [...withoutDup, newHunk],
      totalHunks,
    },
  };
}
