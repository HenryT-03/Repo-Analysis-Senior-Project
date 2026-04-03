import React, { useEffect, useState } from "react";
import HubSidebar from "./Elements/HubSidebar";
import TopBar from "./Elements/TopBar";
import SquareGrid from "./Elements/GroupviewSquareGrid";
import { fetchGroupsOverview, type GroupOverview } from "./api";

const GroupHub: React.FC = () => {
  const [groups, setGroups] = useState<GroupOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroupsOverview()
      .then(setGroups)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load groups")
      )
      .finally(() => setLoading(false));
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
