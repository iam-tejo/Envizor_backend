// lib/diffEngine.ts

export type Hunk = {
  id: string;
  targetStart: number;
  targetLength: number;
  targetLines: string[];
  sourceStart: number;
  sourceLength: number;
  sourceLines: string[];
};

export function computeHunks(
  targetContent: string,
  sourceContent: string
): Hunk[] {
  console.log("🧪 NEW DIFF ENGINE ACTIVE");

  const A = targetContent.split("\n"); // PRE
  const B = sourceContent.split("\n"); // DEV

  const m = A.length;
  const n = B.length;

  // Build LCS table
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] =
        A[i] === B[j]
          ? 1 + dp[i + 1][j + 1]
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const hunks: Hunk[] = [];
  let i = 0;
  let j = 0;

  while (i < m || j < n) {
    // Lines match → move forward
    if (i < m && j < n && A[i] === B[j]) {
      i++;
      j++;
      continue;
    }

    // Start of a hunk
    const tStart = i;
    const sStart = j;

    // Consume PRE deletions
    while (i < m && (j >= n || dp[i][j] === dp[i + 1][j])) {
      i++;
    }

    // Consume DEV additions
    while (j < n && (i >= m || dp[i][j] === dp[i][j + 1])) {
      j++;
    }

    const targetLines = A.slice(tStart, i);
    const sourceLines = B.slice(sStart, j);

    hunks.push({
      id: `${tStart}-${sStart}-${Math.random()}`,
      targetStart: tStart + 1,
      targetLength: targetLines.length,
      targetLines,
      sourceStart: sStart + 1,
      sourceLength: sourceLines.length,
      sourceLines,
    });
  }

  return hunks;
}
