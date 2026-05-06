import type { Commit } from "./DataProvider";

export type Score = 0 | 1 | 2 | 3;

export type QualityScore = {
  label: "Excellent" | "Good" | "Okay" | "Poor";
  color: string;
  points: number;
};

// ── Existing threshold-based scoring (unchanged) ───────────────────────────

export const SCORE_COLORS_MUTED: Record<Score, string> = {
  0: "#f5c1c1",
  1: "#fff2b4",
  2: "#c9f2cc",
  3: "#bbdefb",
};

export const SCORE_COLORS_VIVID: Record<Score, string> = {
  0: "#e53935",
  1: "#fdd835",
  2: "#43a047",
  3: "#1e88e5",
};

export function scoreToColor(score: Score, vivid = false): string {
  return vivid ? SCORE_COLORS_VIVID[score] : SCORE_COLORS_MUTED[score];
}

export function scoreThreshold(value: number, expected: number): Score {
  if (value === 0) return 0;
  if (value >= expected * 2) return 3;
  if (value >= expected) return 2;
  return 1;
}

export function scoreCommits(
  totalCommits: number,
  expectedCommitsWeekly: number,
  demoStart: string,
  demoEnd: string
): Score {
  const start = new Date(demoStart);
  const end = new Date(demoEnd);
  const weeks = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
  );
  const expected = expectedCommitsWeekly * weeks;
  return scoreThreshold(totalCommits, expected);
}

export function scoreMerges(mergeCommits: number, expectedMergesDemo: number): Score {
  return scoreThreshold(mergeCommits, expectedMergesDemo);
}

export function getAverageScore(score1: number, score2: number): number {
  return Math.floor((score1 + score2) / 2);
}

export function countMergeCommitsInRange(
  commits: Commit[],
  start: string,
  end: string
): number {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  return commits.filter((c) => {
    if (!c.is_merge) return false;
    const date = new Date(c.committed_at);
    return (!startDate || date >= startDate) && (!endDate || date <= endDate);
  }).length;
}

export function countCommitsInRange(
  commits: Commit[],
  start: string,
  end: string
): number {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  return commits.filter((c) => {
    const date = new Date(c.committed_at);
    return (!startDate || date >= startDate) && (!endDate || date <= endDate);
  }).length;
}

// ── AI-based quality score (0-100, four dimensions) ───────────────────────

/**
 * Heuristic fallback scoring used client-side before / without AI results.
 * Mirrors the schema the Gemini agent produces so the UI can render both.
 */
export function computeScore(
  commitCount: number,
  totalAdditions: number,
  totalDeletions: number,
  branches?: string[]
): QualityScore {
  let points = 0;

  // 1. Commit volume (0-25)
  if (commitCount >= 8) points += 25;
  else if (commitCount >= 5) points += 18;
  else if (commitCount >= 2) points += 10;

  // 2. Code contribution – net lines (0-25)
  const net = totalAdditions + totalDeletions;
  if (net >= 200) points += 25;
  else if (net >= 50) points += 15;
  else if (net > 0) points += 8;

  // 3. Commit quality proxy – merge to main (0-25)
  if (branches?.includes("main")) points += 25;
  else if (branches && branches.length > 1) points += 12;

  // 4. AI / integrity placeholder (starts at full 25, deductions applied server-side)
  points += 25;

  points = Math.max(0, Math.min(100, points));

  if (points >= 80) return { label: "Excellent", color: "#00c05a", points };
  if (points >= 60) return { label: "Good", color: "#dacf03", points };
  if (points >= 40) return { label: "Okay", color: "#e45b00", points };
  return { label: "Poor", color: "#be0000", points };
}

/** Map a 0-100 AI score to a colour for UI rendering. */
export function aiScoreToColor(score: number): string {
  if (score >= 80) return "#00c05a";
  if (score >= 60) return "#dacf03";
  if (score >= 40) return "#e45b00";
  return "#be0000";
}

/** Map a 0-100 AI score to a label. */
export function aiScoreToLabel(score: number): "Excellent" | "Good" | "Okay" | "Poor" {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Okay";
  return "Poor";
}