export type Score = {
  label: "Excellent" | "Good" | "Okay" | "Poor";
  color: string;
  points: number;
};

export function computeScore(
  commitCount: number,
  totalAdditions: number,
  totalDeletions: number,
  branches?: string[]
): Score {
  let points = 0;

  // Commit volume
  if (commitCount >= 8) points += 30;
  else if (commitCount >= 5) points += 20;
  else if (commitCount >= 2) points += 10;

  // Net line contribution
  const net = totalAdditions + totalDeletions;
  if (net >= 200) points += 50;
  else if (net >= 50) points += 20;
  else if (net > 0) points += 10;

  // Branch merged to main
  if (branches?.includes("main")) points += 20;

  // AI penalty
  // placeholder

  points = Math.max(0, Math.min(100, points));

  if (points >= 80) return { label: "Excellent", color: "#00c05a", points };
  if (points >= 60) return { label: "Good",      color: "#dacf03", points };
  if (points >= 40) return { label: "Okay",      color: "#e45b00", points };
  return                   { label: "Poor",      color: "#be0000", points };
}