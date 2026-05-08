const API_BASE = "http://localhost:5000";

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed: ${res.status} ${text}`);
  }

  if (res.status === 204) return null;

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export type AllTeamScores = {
  repo_id: number;
  team_score: number;
  summary: string;
}[];

const api = {
  async getConfig() {
    return fetchWithAuth("/gitrepo/config");
  },

  async setConfig(updates: any) {
    return fetchWithAuth("/gitrepo/config", {
      method: "POST",
      body: JSON.stringify(updates),
    });
  },

  async getAllData() {
    return fetchWithAuth("/gitrepo/debug/all");
  },

  async syncAllRepos() {
    return fetchWithAuth("/gitrepo/sync", {
      method: "POST",
    });
  },

  async syncRepo(repoId: string | number) {
    return fetchWithAuth(`/gitrepo/repos/${repoId}/sync`, {
      method: "POST",
    });
  },

  async getRepoCommits(
    repoId: string | number,
    range?: { start?: string; end?: string }
  ) {
    const params = new URLSearchParams();

    if (range?.start) params.set("start", range.start);
    if (range?.end) params.set("end", range.end);

    const qs = params.toString() ? `?${params.toString()}` : "";

    return fetchWithAuth(`/gitrepo/repos/${repoId}/commits${qs}`);
  },

  async getAllTeamScores(): Promise<AllTeamScores> {
    return fetchWithAuth("/ai/scores/all");
  },

  async runTeamAnalysis(repoId: number, demo?: string) {
    const params = new URLSearchParams();

    if (demo) params.set("demo", demo);

    const qs = params.toString() ? `?${params.toString()}` : "";

    return fetchWithAuth(`/ai/repos/${repoId}/analyse${qs}`, {
      method: "POST",
    });
  },

  async runTeamAnalysisLocal(repoId: number, demo?: string) {
    const params = new URLSearchParams();

    if (demo) params.set("demo", demo);

    const qs = params.toString() ? `?${params.toString()}` : "";

    return fetchWithAuth(`/ai/repos/${repoId}/analyse-local${qs}`, {
      method: "POST",
    });
  },
};

export default api;