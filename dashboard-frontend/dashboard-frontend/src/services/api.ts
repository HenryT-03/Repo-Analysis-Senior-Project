const API_BASE = 'http://localhost:5000';

const api = {
  // Repos
  getRepos: async () => {
    try {
      const response = await fetch(`${API_BASE}/gitlab/repos`);
      if (!response.ok) throw new Error('Failed to fetch repos');
      return await response.json();
    } catch (error) {
      console.error('getRepos error:', error);
      throw error;
    }
  },

  // Repo Stats
  getRepoStats: async (repoId: string) => {
    try {
      const response = await fetch(`${API_BASE}/gitlab/repos/${repoId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } catch (error) {
      console.error('getRepoStats error:', error);
      throw error;
    }
  },

  // Repo Commits
  getRepoCommits: async (repoId: string) => {
    try {
      const response = await fetch(`${API_BASE}/gitlab/repos/${repoId}/commits`);
      if (!response.ok) throw new Error('Failed to fetch commits');
      return await response.json();
    } catch (error) {
      console.error('getRepoCommits error:', error);
      throw error;
    }
  },

  // Sync Repo
  syncRepo: async (repoId: string) => {
    try {
      const response = await fetch(`${API_BASE}/gitlab/repos/${repoId}/sync`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to sync repo');
      return await response.json();
    } catch (error) {
      console.error('syncRepo error:', error);
      throw error;
    }
  },

  // Auth routes
  signup: async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      if (!response.ok) throw new Error('Signup failed');
      return await response.json();
    } catch (error) {
      console.error('signup error:', error);
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) throw new Error('Login failed');
      return await response.json();
    } catch (error) {
      console.error('login error:', error);
      throw error;
    }
  }
};

export default api;
