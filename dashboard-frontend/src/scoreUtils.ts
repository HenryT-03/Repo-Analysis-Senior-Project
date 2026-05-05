import type { Commit } from "./DataProvider";

export type Score = 0 | 1 | 2 | 3;

export const SCORE_COLORS_MUTED: Record<Score, string> = {
  0: '#f5c1c1', // red    - poor
  1: '#fff2b4', // yellow - below expected
  2: '#c9f2cc', // green  - meets expected
  3: '#bbdefb', // blue   - outstanding
};

export const SCORE_COLORS_VIVID: Record<Score, string> = {
  0: '#e53935', // red    - poor
  1: '#fdd835', // yellow - below expected
  2: '#43a047', // green  - meets expected
  3: '#1e88e5', // blue   - outstanding
};

export function scoreToColor(score: Score, vivid = false): string {
  return vivid ? SCORE_COLORS_VIVID[score] : SCORE_COLORS_MUTED[score];
}

// Generic threshold scorer
// Returns 0 if zero, 1 if below expected, 2 if meets, 3 if 2x or more
export function scoreThreshold(value: number, expected: number): Score {
  if (value === 0) return 0;
  if (value >= expected * 2) return 3;
  if (value >= expected) return 2;
  return 1;
}

export function scoreCommits(totalCommits: number, expectedCommitsWeekly: number, demoStart: string, demoEnd: string): Score {
  const start = new Date(demoStart);
  const end = new Date(demoEnd);
  const weeks = Math.max(1, Math.round((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const expected = expectedCommitsWeekly * weeks;
  return scoreThreshold(totalCommits, expected);
}

export function scoreMerges(mergeCommits: number, expectedMergesDemo: number): Score {
  return scoreThreshold(mergeCommits, expectedMergesDemo);
}

export function getAverageScore(score1: number, score2: number): number
{
    return Math.floor((score1 + score2) / 2);
}

export function countMergeCommitsInRange(
  commits: Commit[],
  start: string,
  end: string,
): number {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  return commits.filter((c) => {
    if (!c.is_merge) return false;
    const date = new Date(c.committed_at);
    return (
      (!startDate || date >= startDate) &&
      (!endDate || date <= endDate)
    );
  }).length;
}

export function countCommitsInRange(commits: Commit[], start: string, end: string): number {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  return commits.filter((c) => {
    const date = new Date(c.committed_at);
    return (
      (!startDate || date >= startDate) &&
      (!endDate || date <= endDate)
    );
  }).length;
}