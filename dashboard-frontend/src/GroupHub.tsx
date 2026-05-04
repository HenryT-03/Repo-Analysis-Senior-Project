import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HubSidebar from "./Elements/HubSidebar";
import { RefreshCw } from 'lucide-react';
import SquareGrid from "./Elements/GroupviewSquareGrid";
import LoadingSpinner from "./Elements/LoadingSpinner";
import { fetchRepos } from "./api";
import api from "./services/api";


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
  const [syncing, setSyncing] = useState(false);

const handleSync = async () => {
  setSyncing(true);
  try {
    await api.syncAllRepos();
    const res = await fetchRepos();
    setGroups(res.data);
  } catch {
    setError("Failed to sync repos");
  } finally {
    setSyncing(false);
  }
};

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
        <div style={styles.content}>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search repos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...styles.search, marginBottom: 0, flex: 1 }}
          />
          <button
            style={{
              ...styles.button,
              opacity: syncing ? 0.6 : 1,
              pointerEvents: syncing ? "none" : "auto",
              flexShrink: 0,
            }}
            onClick={handleSync}
          >
            <RefreshCw style={styles.icon} /> {syncing ? "Syncing..." : "Sync Repos"}
          </button>
        </div>
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
    button: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    height: "36px",
    padding: "0 12px",
    backgroundColor: "#822433",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "13px",
    cursor: "pointer"
  },

};

export default GroupHub;