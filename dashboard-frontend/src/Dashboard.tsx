import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "./Elements/Sidebar";
import TopBar from "./Elements/TopBar";
import AlertCard from "./Elements/AlertCard";
import CommitGraph from "./Elements/CommitGraph";
import api from "./services/api";

type CommitChartPoint = {
  time: string;
  [student: string]: number | string;
};

const CARDINAL = "#822433";

const Dashboard: React.FC = () => {
  const { repoId } = useParams<{ repoId: string }>();
  const navigate = useNavigate();

  const [commitData, setCommitData] = useState<CommitChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoId) return;

    const fetchData = async () => {
      try {
        const commits = await api.getRepoCommits(repoId);

        // Transform commits → chart format
        const timeMap = new Map<string, Record<string, number>>();

        commits.forEach((commit: any) => {
          const date = new Date(commit.committed_at);
          const time =
            date.getHours().toString().padStart(2, "0") + ":00";

          if (!timeMap.has(time)) {
            timeMap.set(time, {});
          }

          const student = commit.author_name || "Unknown";
          const current = timeMap.get(time)!;

          current[student] = (current[student] || 0) + 1;
        });

        const chartData: CommitChartPoint[] = Array.from(timeMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([time, data]) => ({
            time,
            ...data,
          }));

        setCommitData(chartData);
      } catch (err) {
        console.error(err);
        setError("Failed to load repository data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [repoId]);

  return (
    <div style={styles.root}>
      <Sidebar />
      <div style={styles.main}>
        <TopBar />
        <div style={styles.content}>
          <div style={styles.breadcrumb}>
            <span
              style={styles.breadcrumbLink}
              onClick={() => navigate("/")}
            >
              Dashboard
            </span>
            <span style={styles.breadcrumbSep}> / </span>
            <span>{repoId ? `Repo ${repoId}` : "Repo"}</span>
          </div>

          {error && (
            <p style={{ color: "#c62828", padding: "12px 16px" }}>
              {error}
            </p>
          )}

          <AlertCard />

          {loading ? (
            <p style={{ padding: "16px" }}>Loading commits…</p>
          ) : commitData.length === 0 ? (
            <p style={{ padding: "16px", color: "#888" }}>
              No commit data available.
            </p>
          ) : (
            <CommitGraph data={commitData} />
          )}
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
    width: "100vw",
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
  breadcrumb: {
    padding: "12px 16px 4px",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.9rem",
    color: "#555",
  },
  breadcrumbLink: {
    color: CARDINAL,
    cursor: "pointer",
    textDecoration: "underline",
  },
  breadcrumbSep: {
    margin: "0 4px",
  },
};

export default Dashboard;