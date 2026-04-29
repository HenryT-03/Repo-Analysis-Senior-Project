import React, { useEffect, useState } from "react";
import HubSidebar from "../Elements/HubSidebar";
import TopBar from "../Elements/TopBar";
import SquareGrid from "../Elements/GroupviewSquareGrid";
import { computeScore } from "../utils/scoring";
import api from "../api";

type Repo = {
  id: number;
  gitlab_id: number;
  name: string;
  description: string | null;
  namespace: string;
  url: string;
  created_at: string;
};

type ContributorStat = {
  author_name: string;
  author_email: string;
  commit_count: number;
  total_additions: number;
  total_deletions: number;
  branches: string[];
};

type Student = {
  name: string;
  color: string;
};

type GroupOverview = {
  id: number;
  name: string;
  totalCommits: number;
  students: Student[];
};

const GroupHub: React.FC = () => {
  const [groups, setGroups] = useState<GroupOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getRepos()
      .then((repos: Repo[]) => {
        // Set repos immediately with empty students so cards appear
        setGroups(repos.map((r) => ({
          id: r.id,
          name: r.name,
          totalCommits: 0,
          students: [],
        })));
        setLoading(false);

        // Then fetch stats for each repo in parallel
        repos.forEach((repo) => {
          api.getRepoStats(repo.id)
            .then((stats: ContributorStat[]) => {
              const students: Student[] = stats.map((c) => {
                const score = computeScore(
                  c.commit_count,
                  c.total_additions,
                  c.total_deletions,
                  c.branches
                );
                return { name: c.author_name, color: score.color };
              });

              setGroups((prev) =>
                prev.map((g) =>
                  g.id === repo.id
                    ? {
                        ...g,
                        students,
                        totalCommits: stats.reduce((a, c) => a + c.commit_count, 0),
                      }
                    : g
                )
              );
            })
            .catch(() => {}); // leave students empty on failure
        });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load repos");
        setLoading(false);
      });
  }, []);

  return (
    <div style={styles.root}>
      <HubSidebar />
      <div style={styles.main}>
        <TopBar />
        <div style={styles.content}>
          {loading && <p style={styles.message}>Loading groups…</p>}
          {error && <p style={{ ...styles.message, color: "#c62828" }}>{error}</p>}
          {!loading && !error && <SquareGrid groups={groups} />}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "row",
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    overflowY: "auto",
  },
  message: {
    fontFamily: "'Courier New', Courier, monospace",
    padding: "24px",
    color: "#555",
  },
};

export default GroupHub;