const BACKEND = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

function getToken(): string | null {
  return localStorage.getItem("token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// Auth
export async function fetchMe() {
  return apiFetch<any>("/auth/me");
}

// Repos
export async function fetchRepos() {
  return apiFetch<any[]>("/gitrepo/repos");
}

export async function addRepo(projectPath: string) {
  return apiFetch<any>("/gitrepo/repos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_path: projectPath }),
  });
}

export async function syncRepo(repoId: number | string) {
  return apiFetch<any>(`/gitrepo/repos/${repoId}/sync`, { method: "POST" });
}

// Stats
export async function fetchRepoStats(repoId: number | string) {
  return apiFetch<any[]>(`/gitrepo/repos/${repoId}/stats`);
}

export async function fetchCommits(repoId: number | string, authorEmail?: string) {
  const url = authorEmail
    ? `/gitrepo/repos/${repoId}/commits?author_email=${authorEmail}`
    : `/gitrepo/repos/${repoId}/commits`;
  return apiFetch<any[]>(url);
}

// AI
export async function fetchAiSummary(repoId: number | string) {
  return apiFetch<any>(`/ai/repos/${repoId}/summary`);
}

export async function runAiAnalysis(repoId: number | string) {
  return apiFetch<any>(`/ai/repos/${repoId}/analyze`, { method: "POST" });
}

// DB ping
export async function pingDb() {
  return apiFetch<any>("/testdb");
}

// Default export object for RepoPage which uses api.getRepos() etc.
const api = {
  getRepos: fetchRepos,
  getRepoStats: fetchRepoStats,
  getRepoCommits: fetchCommits,
  syncRepo,
  addRepo,
  fetchMe,
  pingDb,
};

export default api;