const API_BASE = "http://localhost:5000";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

// ── Types ──────────────────────────────────────────────────────────────────

export type AiDimension = {
  score: number;
  rationale: string;
};

export type AiIndividualScore = {
  author_email: string;
  author_name?: string;
  repo_id: number;
  total_score: number;
  dimensions: Record<string, AiDimension>;
  flags: string[];
  summary: string;
  raw_stats?: Record<string, unknown>;
  analysed_at?: string;
};

export type AiTeamScore = {
  repo_id: number;
  team_score: number;
  member_scores: { email: string; name?: string; score: number }[];
  team_flags: string[];
  team_summary: string;
  source?: string;
  raw_stats?: Record<string, unknown>;
  analysed_at?: string;
  individual_scores?: AiIndividualScore[];
};

export type AiTeamAnalysisResponse = {
  team: AiTeamScore;
  individuals: AiIndividualScore[];
};

export type AllTeamScores = {
  repo_id: number;
  repo_name: string;
  team_score: number;
  summary: string;
  analysed_at: string;
}[];

// ── API object ─────────────────────────────────────────────────────────────

const api = {
  // ── Data ────────────────────────────────────────────────────────────────

  getAllData: async () => fetchWithAuth(`${API_BASE}/gitrepo/debug/all`),

  syncRepo: async (repoId: string | number) =>
    fetchWithAuth(`${API_BASE}/gitrepo/projects/${repoId}/syncCommits`, {
      method: "POST",
    }),

  syncAllRepos: async () =>
    fetchWithAuth(`${API_BASE}/gitrepo/syncProjects`, {
      method: "POST",
    }),

  getConfig: async () => fetchWithAuth(`${API_BASE}/gitrepo/config`),

  setConfig: async (data: Record<string, unknown>) =>
    fetchWithAuth(`${API_BASE}/gitrepo/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // ── Auth ────────────────────────────────────────────────────────────────

  signup: async (email: string, password: string, name: string) => {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      throw new Error("Signup failed");
    }

    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    return response.json();
  },

  // ── AI Analysis ─────────────────────────────────────────────────────────

  runTeamAnalysis: async (
    repoId: number | string
  ): Promise<AiTeamAnalysisResponse> =>
    fetchWithAuth(`${API_BASE}/ai/repos/${repoId}/analyse`, {
      method: "POST",
    }),

  runTeamAnalysisLocal: async (
    repoId: number | string
  ): Promise<AiTeamAnalysisResponse> =>
    fetchWithAuth(`${API_BASE}/ai/repos/${repoId}/analyse-local`, {
      method: "POST",
    }),

  runContributorAnalysis: async (
    repoId: number | string,
    authorEmail: string
  ): Promise<AiIndividualScore> =>
    fetchWithAuth(
      `${API_BASE}/ai/repos/${repoId}/contributors/${encodeURIComponent(
        authorEmail
      )}/analyse`,
      { method: "POST" }
    ),

  getTeamScore: async (repoId: number | string): Promise<AiTeamScore> =>
    fetchWithAuth(`${API_BASE}/ai/repos/${repoId}/score`),

  getContributorScore: async (
    repoId: number | string,
    authorEmail: string
  ): Promise<AiIndividualScore> =>
    fetchWithAuth(
      `${API_BASE}/ai/repos/${repoId}/contributors/${encodeURIComponent(
        authorEmail
      )}/score`
    ),

  getAllTeamScores: async (): Promise<AllTeamScores> =>
    fetchWithAuth(`${API_BASE}/ai/scores/all`),
};

export default api;