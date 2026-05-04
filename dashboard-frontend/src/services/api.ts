const API_BASE = 'http://localhost:5000';

// Helper function to include Authorization header
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token'); // Make sure your login stores token here
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

const api = {
  
  //get all
  getAllData: async () => {
    return fetchWithAuth(`${API_BASE}/gitrepo/debug/all`);
  },

  // Repos
  getRepos: async () => {
    return fetchWithAuth(`${API_BASE}/gitrepo/repos`);
  },

  // Repo Stats
  getRepoStats: async (repoId: string) => {
    return fetchWithAuth(`${API_BASE}/gitrepo/repos/${repoId}/stats`);
  },

  // Repo Commits
  getRepoCommits: async (repoId: string, params?: { start?: string; end?: string }) => {
    const url = new URL(`${API_BASE}/gitrepo/projects/${repoId}/commits`);
    if (params?.start) url.searchParams.set("start", params.start);
    if (params?.end) url.searchParams.set("end", params.end);
    return fetchWithAuth(url.toString());
  },
  // Repo Commits
  getRepoContributors: async (projectId: string) => {
    return fetchWithAuth(`${API_BASE}/gitrepo/projects/${projectId}/contributors`);
  },
  // Sync Repo
  syncRepo: async (repoId: string) => {
    return fetchWithAuth(`${API_BASE}/gitrepo/projects/${repoId}/syncCommits`, { method: 'POST' });
  },
  syncAllRepos: async () => 
    {
      return fetchWithAuth(`${API_BASE}/gitrepo/syncProjects`, { method: 'POST'})
    },

  // Config routes
  getConfig: async () => {
    return fetchWithAuth(`${API_BASE}/gitrepo/config`);
  },
  setConfig: async (data: Record<string, any>) => {
    return fetchWithAuth(`${API_BASE}/gitrepo/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  // Auth routes (no auth header needed)
  signup: async (email: string, password: string, name: string) => {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    if (!response.ok) throw new Error('Signup failed');
    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  }
  
};

export default api;