import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./services/api";

export type Commit = {
  sha: string;
  author_name: string;
  author_email: string;
  message: string;
  additions: number;
  deletions: number;
  branch: string;
  committed_at: string;
  is_merge: boolean;
  issues_created: number;
  issues_closed: number;
  issues_updated: number;
};

export type Contributor = {
  id: number;
  name: string;
  email: string;
  commits: number;
  additions: number;
  deletions: number;
};

export type Repo = {
  id: number;
  name: string;
  total_commits: number;
};

type DataContextType = {
  repos: Repo[];
  usersByRepo: Record<number, Contributor[]>;
  commitsByEmail: Record<string, Commit[]>;
  loading: boolean;
  syncing: boolean;          
  setSyncing: (v: boolean) => void
  error: string | null;
  refresh: () => Promise<void>;
};

const DataContext = createContext<DataContextType>({
  repos: [],
  usersByRepo: {},
  commitsByEmail: {},
  loading: true,
  syncing: false,             
  setSyncing: () => {},     
  error: null,
  refresh: async () => {},
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [usersByRepo, setUsersByRepo] = useState<Record<number, Contributor[]>>({});
  const [commitsByEmail, setCommitsByEmail] = useState<Record<string, Commit[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);  

const load = async () => {
setLoading(true);
setError(null);
    try {
        const data = await api.getAllData();
        const repoList: Repo[] = data.repos.map((r: any) => ({
            id: r.id,
            name: r.name,
            total_commits: r.total_commits,
        }));

        const usersMap: Record<number, Contributor[]> = {};
        const commitsMap: Record<string, Commit[]> = {};

        for (const r of data.repos) {

            usersMap[r.id] = r.contributors.map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            commits: c.commits,
            additions: c.additions,
            deletions: c.deletions,
            }));

            for (const c of r.contributors) {
            if (!c.email) {
                continue;
            }
            const sorted: Commit[] = (c.commit_history ?? []).sort(
                (a: Commit, b: Commit) =>
                new Date(b.committed_at).getTime() - new Date(a.committed_at).getTime()
            );
            commitsMap[c.email] = [
                ...(commitsMap[c.email] ?? []),
                ...sorted,
            ].sort(
                (a, b) =>
                new Date(b.committed_at).getTime() - new Date(a.committed_at).getTime()
            );
            }
        }
    setRepos(repoList);
    setUsersByRepo(usersMap);
    setCommitsByEmail(commitsMap);
    } catch (e) {
    console.error("[DataProvider] Load failed:", e);
    setError("Failed to load data");
    } finally {
    setLoading(false);
    }
};

  useEffect(() => {
    load();
  }, []);

  return (
    <DataContext.Provider
      value={{ repos, usersByRepo, commitsByEmail, loading, syncing, setSyncing, error, refresh: load }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
