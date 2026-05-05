import React, { useState, useEffect } from "react";
import HubSidebar from "./Elements/HubSidebar";
import { CalendarDays, ChevronDown } from 'lucide-react';
import SquareGrid from "./Elements/GroupviewSquareGrid";
import LoadingSpinner from "./Elements/LoadingSpinner";
import api from "./services/api";
import { useData } from "./DataProvider";
import { useConfig } from "./ConfigContext";
import { scoreCommits, scoreMerges, countMergeCommitsInRange, countCommitsInRange, getAverageScore } from './scoreUtils';

const GroupHub: React.FC = () => {
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { repos, usersByRepo, commitsByEmail, loading, refresh } = useData();

  const configCtx = useConfig();
  const config = configCtx?.config;
  const selectedDemo = configCtx?.selectedDemo ?? "Demo 1";
  const setSelectedDemo = configCtx?.setSelectedDemo ?? (() => {});

  const demoRanges: Record<string, { start: string; end: string }> = {
    "Demo 1": { start: config?.Demo1Start ?? "", end: config?.Demo1End ?? "" },
    "Demo 2": { start: config?.Demo2Start ?? "", end: config?.Demo2End ?? "" },
    "Demo 3": { start: config?.Demo3Start ?? "", end: config?.Demo3End ?? "" },
    "Demo 4": { start: config?.Demo4Start ?? "", end: config?.Demo4End ?? "" },
  };
  const { start: demoStart, end: demoEnd } = demoRanges[selectedDemo];
  const options = Object.keys(demoRanges);

  useEffect(() => {
    const handleClickOutside = () => setDropdownOpen(false);
    if (dropdownOpen) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await api.syncAllRepos();
      await refresh();
    } catch {
      setError("Failed to sync repos");
    } finally {
      setSyncing(false);
    }
  };

const groups = repos.map((r) => ({
  id: r.id,
  name: r.name,
  totalCommits: r.total_commits,
  students: (usersByRepo[r.id] ?? []).map((u) => ({
    name: u.name,
    commitCount: countCommitsInRange(commitsByEmail[u.email] ?? [], demoStart, demoEnd),
    commitScore: scoreCommits(
      countCommitsInRange(commitsByEmail[u.email] ?? [], demoStart, demoEnd),
      config?.ExpectedCommitsWeekly ?? 1,
      demoStart,
      demoEnd,
    ),
    mergeScore: scoreMerges(
      countMergeCommitsInRange(commitsByEmail[u.email] ?? [], demoStart, demoEnd),
      config?.ExpectedMergesDemo ?? 1,
    ),
  })),
}));

  const filtered = groups.filter((g) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      g.name.toLowerCase().includes(q) ||
      g.students.some((s) => s.name.toLowerCase().includes(q))
    );
  });

const sorted = [...filtered].sort((a, b) => {
  const avg = (group: typeof a) =>
    group.students.length === 0 ? 0 :
    Math.round(
      group.students.reduce((sum, s) => sum + getAverageScore(s.commitScore, s.mergeScore), 0)
      / group.students.length * 10
    ) / 10;
  return avg(a) - avg(b);
});


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

            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                style={styles.button}
                onClick={(e) => { e.stopPropagation(); setDropdownOpen((o) => !o); }}
              >
                <CalendarDays style={styles.icon} />
                {selectedDemo}
                <ChevronDown style={{ width: 14, height: 14 }} />
              </button>
              {dropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  backgroundColor: "#822433",
                  borderRadius: "4px",
                  overflow: "hidden",
                  zIndex: 100,
                  minWidth: "100%",
                }}>
                  {options.map((opt) => (
                    <div
                      key={opt}
                      onClick={() => { setSelectedDemo(opt); setDropdownOpen(false); }}
                      style={{
                        padding: "8px 12px",
                        color: "white",
                        fontFamily: "monospace",
                        fontSize: "13px",
                        cursor: "pointer",
                        backgroundColor: selectedDemo === opt ? "rgba(0,0,0,0.2)" : "transparent",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.15)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selectedDemo === opt ? "rgba(0,0,0,0.2)" : "transparent")}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}
          {loading ? <LoadingSpinner /> : <SquareGrid groups={sorted} />}
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