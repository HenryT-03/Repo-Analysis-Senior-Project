const API_BASE = 'http://localhost:5000';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

const api = {
  getRepos: async () => {
    const response = await fetch(`${API_BASE}/gitlab/repos`, {
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch repos');
    return response.json();
  },

  getRepoStats: async (repoId: string) => {
    const response = await fetch(`${API_BASE}/gitlab/repos/${repoId}/stats`, {
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  getRepoCommits: async (repoId: string) => {
    const response = await fetch(`${API_BASE}/gitlab/repos/${repoId}/commits`, {
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch commits');
    return response.json();
  },

  syncRepo: async (repoId: string) => {
    const response = await fetch(`${API_BASE}/gitlab/repos/${repoId}/sync`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to sync repo');
    return response.json();
  },

  login: () => {
    window.location.href = `${API_BASE}/auth/login`;
  },

  signup: async (email: string, password: string, name: string) => {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    if (!response.ok) throw new Error('Signup failed');
    return response.json();
  },
};

export default api;