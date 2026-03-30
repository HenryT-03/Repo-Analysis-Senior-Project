const BACKEND = "http://localhost:5000";

function getToken(): string | null {
  return localStorage.getItem("token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function fetchMe() {
  const res = await fetch(`${BACKEND}/auth/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

// ── Repos ─────────────────────────────────────────────────────────────────────

export async function fetchRepos() {
  const res = await fetch(`${BACKEND}/gitlab/repos`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch repos");
  return res.json();
}

export async function addRepo(projectPath: string) {
  const res = await fetch(`${BACKEND}/gitlab/repos`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ project_path: projectPath }),
  });
  if (!res.ok) throw new Error("Failed to add repo");
  return res.json();
}

export async function syncRepo(repoId: number) {
  const res = await fetch(`${BACKEND}/gitlab/repos/${repoId}/sync`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to sync repo");
  return res.json();
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function fetchRepoStats(repoId: number) {
  const res = await fetch(`${BACKEND}/gitlab/repos/${repoId}/stats`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchCommits(repoId: number, authorEmail?: string) {
  const url = authorEmail
    ? `${BACKEND}/gitlab/repos/${repoId}/commits?author_email=${authorEmail}`
    : `${BACKEND}/gitlab/repos/${repoId}/commits`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch commits");
  return res.json();
}

// ── AI Analysis ───────────────────────────────────────────────────────────────

export async function fetchAiSummary(repoId: number) {
  const res = await fetch(`${BACKEND}/ai/repos/${repoId}/summary`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch AI summary");
  return res.json();
}

export async function runAiAnalysis(repoId: number) {
  const res = await fetch(`${BACKEND}/ai/repos/${repoId}/analyze`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to run AI analysis");
  return res.json();
}

// ── DB ping ───────────────────────────────────────────────────────────────────

export async function pingDb() {
  const res = await fetch(`${BACKEND}/testdb`);
  if (!res.ok) throw new Error("DB ping failed");
  return res.json();
}