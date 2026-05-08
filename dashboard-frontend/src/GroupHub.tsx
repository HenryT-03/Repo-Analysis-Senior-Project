import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HubSidebar from "./Elements/HubSidebar";
import { RefreshCw, CalendarDays, ChevronDown, Cpu } from "lucide-react";
import LoadingSpinner from "./Elements/LoadingSpinner";
import api from "./services/api";
import { useData } from "./DataProvider";
import { useConfig } from "./ConfigContext";
import {
  type Score,
  scoreToColor,
  getAverageScore,
  scoreCommits,
  scoreMerges,
  countMergeCommitsInRange,
  countCommitsInRange,
  aiScoreToColor,
  aiScoreToLabel,
} from "./scoreUtils";

const CARDINAL = "#822433";

const GroupHub: React.FC = () => {
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [analysingRepoId, setAnalysingRepoId] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [analysisCache, setAnalysisCache] = useState<
    Record<string, { team_score: number; team_summary: string }>
  >({});
  const [aiScores, setAiScores] = useState<Record<number, number>>({});
  const [aiSummaries, setAiSummaries] = useState<Record<number, string>>({});

  const configCtx = useConfig();
  const config = configCtx?.config;
  const selectedDemo = configCtx?.selectedDemo ?? "Demo 1";
  const setSelectedDemo = configCtx?.setSelectedDemo ?? (() => {});
  const { repos, usersByRepo, commitsByEmail, loading, refresh } = useData();

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

    if (dropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen]);

  const ANALYSIS_STORAGE_KEY = "repo-analysis-demo-cache";

  const getAnalysisKey = (repoId: number, demo: string) => `${demo}::${repoId}`;

  const loadAnalysisCache = () => {
    try {
      const stored = localStorage.getItem(ANALYSIS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const persistAnalysisCache = (
    nextCache: Record<string, { team_score: number; team_summary: string }>
  ) => {
    try {
      localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(nextCache));
    } catch {
      // ignore local storage failures
    }
  };

  useEffect(() => {
    setAnalysisCache(loadAnalysisCache());
  }, []);

  useEffect(() => {
    const prefix = `${selectedDemo}::`;
    const currentScores: Record<number, number> = {};
    const currentSummaries: Record<number, string> = {};

    Object.entries(analysisCache).forEach(([key, value]) => {
      if (key.startsWith(prefix)) {
        const repoId = Number(key.split("::")[1]);
        if (!Number.isNaN(repoId)) {
          currentScores[repoId] = value.team_score;
          currentSummaries[repoId] = value.team_summary;
        }
      }
    });

    setAiScores(currentScores);
    setAiSummaries(currentSummaries);
  }, [analysisCache, selectedDemo]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);

    try {
      await api.syncAllRepos();
      await refresh();
    } catch (err) {
      console.error("[sync] failed:", err);
      setError("Failed to sync repos");
    } finally {
      setSyncing(false);
    }
  };

  const handleAnalyseRepo = async (repoId: number) => {
    setAnalysingRepoId(repoId);
    setError(null);

    try {
      const result = await api.runTeamAnalysis(repoId, selectedDemo);
      const team = result.team;

      if (!team) {
        throw new Error("Missing team result response");
      }

      const key = getAnalysisKey(repoId, selectedDemo);
      const nextCache = {
        ...analysisCache,
        [key]: {
          team_score: team.team_score,
          team_summary: team.team_summary,
        },
      };

      setAnalysisCache(nextCache);
      persistAnalysisCache(nextCache);
    } catch (err) {
      console.error("[local analysis] failed:", err);
      setError(`Local analysis failed for repo ${repoId}`);
    } finally {
      setAnalysingRepoId(null);
    }
  };

  const groups = repos.map((r) => {
    const students = (usersByRepo[r.id] ?? []).map((u) => {
      const commits = commitsByEmail[u.email] ?? [];
      const commitCount = countCommitsInRange(commits, demoStart, demoEnd);
      const mergeCount = countMergeCommitsInRange(commits, demoStart, demoEnd);

      return {
        name: u.name,
        commitCount,
        commitScore: scoreCommits(
          commitCount,
          config?.ExpectedCommitsWeekly ?? 1,
          demoStart,
          demoEnd
        ),
        mergeScore: scoreMerges(
          mergeCount,
          config?.ExpectedMergesDemo ?? 1
        ),
      };
    });

    return {
      id: r.id,
      name: r.name,
      totalCommits: r.total_commits,
      aiScore: aiScores[r.id] ?? null,
      aiSummary: aiSummaries[r.id] ?? null,
      onAnalyse: () => handleAnalyseRepo(r.id),
      analysing: analysingRepoId === r.id,
      students,
    };
  });

  const filtered = groups.filter((g) => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return true;
    }

    return (
      g.name.toLowerCase().includes(q) ||
      g.students.some((s) => s.name.toLowerCase().includes(q)) ||
      (g.aiSummary ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={styles.root}>
      <HubSidebar />

      <div style={styles.main}>
        <div style={styles.content}>
          <div style={styles.toolbar}>
            <input
              type="text"
              placeholder="Search repos, students, AI summaries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.search}
            />

            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                style={styles.button}
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen((open) => !open);
                }}
              >
                <CalendarDays style={styles.icon} />
                {selectedDemo}
                <ChevronDown style={{ width: 14, height: 14 }} />
              </button>

              {dropdownOpen && (
                <div style={styles.dropdown}>
                  {options.map((opt) => (
                    <div
                      key={opt}
                      onClick={() => {
                        setSelectedDemo(opt);
                        setDropdownOpen(false);
                      }}
                      style={{
                        ...styles.dropdownItem,
                        backgroundColor:
                          selectedDemo === opt
                            ? "rgba(0,0,0,0.2)"
                            : "transparent",
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              style={{
                ...styles.button,
                opacity: syncing ? 0.6 : 1,
                pointerEvents: syncing ? "none" : "auto",
              }}
              onClick={handleSync}
            >
              <RefreshCw style={styles.icon} />
              {syncing ? "Syncing..." : "Sync Repos"}
            </button>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div style={gridStyles.container}>
              {filtered.map((g) => (
                <EnhancedGroupCard key={g.id} {...g} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type GroupWithAi = {
  id: number;
  name: string;
  totalCommits: number;
  aiScore: number | null;
  aiSummary: string | null;
  onAnalyse: () => void;
  analysing: boolean;
  students: {
    name: string;
    commitScore: Score;
    mergeScore: Score;
    commitCount: number;
  }[];
};

const EnhancedGroupCard: React.FC<GroupWithAi> = ({
  id,
  name,
  aiScore,
  aiSummary,
  onAnalyse,
  analysing,
  students,
}) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const demoCommits = students.reduce((sum, s) => sum + s.commitCount, 0);

  const rawAvg =
    students.length === 0
      ? 0
      : students.reduce(
          (sum, s) => sum + getAverageScore(s.commitScore, s.mergeScore),
          0
        ) / students.length;

  const avgScore = Math.round(rawAvg * 10) / 10;
  const avgScoreColor = scoreToColor(Math.floor(rawAvg) as Score);

  return (
    <div
      style={{
        ...cardStyles.card,
        ...(hovered ? cardStyles.cardHover : {}),
      }}
      onClick={() => navigate(`/group/${id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={cardStyles.label}>{name}</span>
      <div style={cardStyles.divider} />

      <div style={cardStyles.body}>
        <div style={cardStyles.commitCol}>
          <span style={cardStyles.metaLabel}>Commits</span>
          <span style={cardStyles.commitCount}>{demoCommits}</span>

          <span style={cardStyles.metaLabel}>Avg Score</span>
          <span
            style={{
              ...cardStyles.commitCount,
              backgroundColor: avgScoreColor,
              borderRadius: 4,
              padding: "2px 6px",
            }}
          >
            {avgScore.toFixed(1)}
          </span>

          <span style={{ ...cardStyles.metaLabel, marginTop: 8 }}>
            Analysis
          </span>

          {aiScore !== null ? (
            <>
              <span
                style={{
                  ...cardStyles.commitCount,
                  backgroundColor: aiScoreToColor(aiScore),
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontSize: "1.1rem",
                }}
              >
                {aiScore}
              </span>
              <span
                style={{
                  ...cardStyles.metaLabel,
                  color: aiScoreToColor(aiScore),
                }}
              >
                {aiScoreToLabel(aiScore)}
              </span>
            </>
          ) : (
            <button
              style={{
                ...cardStyles.analyseBtn,
                opacity: analysing ? 0.6 : 1,
                pointerEvents: analysing ? "none" : "auto",
              }}
              disabled={analysing}
              onClick={(e) => {
                e.stopPropagation();
                onAnalyse();
              }}
            >
              <Cpu size={12} />
              {analysing ? "Analysing..." : "Analyse"}
            </button>
          )}
        </div>

        <div style={cardStyles.vDivider} />

        <div style={cardStyles.studentCol}>
          <span style={cardStyles.metaLabel}>Students</span>

          {students.map((s, idx) => (
            <div key={`${s.name}-${idx}`} style={cardStyles.studentRow}>
              <span
                style={{
                  ...cardStyles.dot,
                  backgroundColor: scoreToColor(
                    Math.floor(
                      getAverageScore(s.commitScore, s.mergeScore)
                    ) as Score,
                    true
                  ),
                }}
              />
              <span style={cardStyles.studentName}>{s.name}</span>
            </div>
          ))}

          {aiSummary && (
            <div style={cardStyles.aiSummaryBox}>
              <span style={cardStyles.aiSummaryTitle}>Analysis Brief</span>
              <p style={cardStyles.aiSummaryText}>{aiSummary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const gridStyles = {
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    padding: "16px",
  } as React.CSSProperties,
};

const cardStyles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: "#f0f0f0",
    border: `2px solid ${CARDINAL}`,
    borderRadius: "12px",
    cursor: "pointer",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    transition: "box-shadow 0.15s, background-color 0.15s",
    position: "relative",
  },
  cardHover: {
    backgroundColor: "#e8d8dc",
    boxShadow: "0 4px 16px rgba(130,36,51,0.18)",
  },
  label: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: CARDINAL,
  },
  divider: {
    borderTop: "1px solid rgba(130,36,51,0.2)",
  },
  body: {
    display: "flex",
    flexDirection: "row",
    gap: "12px",
    alignItems: "flex-start",
  },
  commitCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "72px",
    gap: "4px",
  },
  commitCount: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "1.6rem",
    fontWeight: "bold",
    color: CARDINAL,
    lineHeight: 1,
  },
  metaLabel: {
    fontFamily: "'Courier New', Courier, monospace",
    fontWeight: "bold",
    fontSize: "0.68rem",
    color: "#777",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  vDivider: {
    width: "1px",
    alignSelf: "stretch",
    backgroundColor: "rgba(130,36,51,0.2)",
    flexShrink: 0,
  },
  studentCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    minWidth: 0,
  },
  studentRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  studentName: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.78rem",
    color: "#333",
    lineHeight: "1.4",
  },
  analyseBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "4px",
    padding: "3px 8px",
    fontSize: "11px",
    fontFamily: "monospace",
    backgroundColor: CARDINAL,
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  aiSummaryBox: {
    marginTop: "8px",
    padding: "8px",
    border: "1px solid rgba(130,36,51,0.25)",
    borderRadius: "6px",
    backgroundColor: "white",
  },
  aiSummaryTitle: {
    display: "block",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.68rem",
    fontWeight: "bold",
    color: CARDINAL,
    textTransform: "uppercase",
    marginBottom: "4px",
  },
  aiSummaryText: {
    margin: 0,
    fontSize: "0.75rem",
    lineHeight: 1.35,
    color: "#333",
  },
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
  toolbar: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginBottom: 16,
  },
  search: {
    width: "100%",
    padding: "8px 12px",
    fontSize: 15,
    border: "1px solid #ccc",
    borderRadius: 4,
    boxSizing: "border-box",
    flex: 1,
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
    backgroundColor: CARDINAL,
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "13px",
    cursor: "pointer",
  },
  icon: {
    width: "16px",
    height: "16px",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    right: 0,
    backgroundColor: CARDINAL,
    borderRadius: "4px",
    overflow: "hidden",
    zIndex: 100,
    minWidth: "100%",
  },
  dropdownItem: {
    padding: "8px 12px",
    color: "white",
    fontFamily: "monospace",
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};

export default GroupHub;