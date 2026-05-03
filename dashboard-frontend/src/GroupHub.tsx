import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HubSidebar from "./Elements/HubSidebar";
import TopBar from "./Elements/TopBar";
import SquareGrid from "./Elements/GroupviewSquareGrid";
import LoadingSpinner from "./Elements/LoadingSpinner";
import { fetchRepos } from "./api";

type Repo = {
  id: number;
  name: string;
  namespace: string;
};

type GroupOverview = {
  id: number;
  name: string;
  totalCommits: number;
  students: { name: string; quality: "excellent" | "good" | "poor" }[];
};

const GroupHub: React.FC = () => {
  const [groups, setGroups] = useState<GroupOverview[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchRepos()
    .then((res) => {
        setGroups(res.data);
      })
    .catch(() => {
        setError("Failed to load projects");
    })
    .finally(() => {
      setLoading(false);
    });      
  }, []);
    
  const transformed = groups.map((g) => ({
    id: g.id,
    name: g.name,
    totalCommits: g.totalCommits,
    students: g.students
  }));

  return (
    <div style={styles.root}>
      <HubSidebar />
      <div style={styles.main}>
        <TopBar />
        <div style={styles.content}>

          {/* Search */}
          <input
            type="text"
            placeholder="Search repos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.search}
          />

        {error && <p style={styles.error}>{error}</p>}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <SquareGrid 
            groups={transformed.map((g) => ({
              ...g,
            }))}
          />
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
    padding: "16px",
  },
  search: {
    width: "100%",
    padding: "8px 12px",
    fontSize: 15,
    border: "1px solid #ccc",
    borderRadius: 4,
    marginBottom: 16,
    boxSizing: "border-box",
  },
  error: {
    color: "#c62828",
    marginBottom: 12,
  },
};

export default GroupHub;