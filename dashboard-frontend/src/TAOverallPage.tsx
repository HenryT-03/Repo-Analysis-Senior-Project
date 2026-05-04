import React, { useMemo, useState, useEffect } from 'react';
import { Search, RefreshCw, ChevronDown, CalendarDays } from 'lucide-react';
import Sidebar from "./Elements/HubSidebar";
import CommitGraph from "./Elements/CommitGraph";
import api from "./services/api";
import { useParams } from "react-router-dom";
import { ConfigProvider, useConfig } from './ConfigContext';

type TeamRow = {
  team: string;
  student: string;
  username: string;
  role: 'FE' | 'BE';
  totalCommits: number;
  meaningful: number;
  merge: number;
  trivial: number;
  commitRating: 'Excellent' | 'Good' | 'Poor';
  linesPlusMinus: string;
  mergedToMain: 'YES' | 'NO' | 'N/A';
  issuesCreated: number;
  issuesUpdated: number;
  branches: 'YES' | 'NO' | 'PARTIAL' | 'NO DATA' | 'N/A';
  isKotlin: 'YES' | 'NO' | 'PARTIAL' | 'NO DATA' | 'N/A';
  feBeConsist: 'YES' | 'NO' | 'PARTIAL' | 'NO DATA' | 'N/A';
  autoNotes?: string;
};

type UnknownAuthor = {
  team: string;
  sha: string;
  author: string;
  email: string;
  message: string;
  date: string;
};

type KotlinFile = {
  team: string;
  filePath: string;
};

const CARDINAL = '#822433';
const LIGHT_CARDINAL = '#f7e8eb';
const GRID = '#d7d7d7';

const summaryRows: TeamRow[] = [
  {
    team: '5_mh_1', student: 'Thakker, Fioni', username: 'fioni', role: 'BE', totalCommits: 5, meaningful: 5, merge: 0, trivial: 0,
    commitRating: 'Excellent', linesPlusMinus: '+5064/-895', mergedToMain: 'YES', issuesCreated: 8, issuesUpdated: 4, branches: 'YES', isKotlin: 'NO', feBeConsist: 'NO', autoNotes: 'All commits in Experiments/ or main'
  },
  {
    team: '5_mh_1', student: 'Deshmukh, Deesha', username: 'ddeesha7', role: 'BE', totalCommits: 5, meaningful: 5, merge: 0, trivial: 0,
    commitRating: 'Excellent', linesPlusMinus: '+6045/-3340', mergedToMain: 'YES', issuesCreated: 4, issuesUpdated: 4, branches: 'YES', isKotlin: 'NO', feBeConsist: 'NO', autoNotes: 'All commits in Experiments/ or main'
  },
  {
    team: '5_mh_1', student: 'Alqahtani, Joud', username: 'joud', role: 'FE', totalCommits: 2, meaningful: 2, merge: 0, trivial: 0,
    commitRating: 'Good', linesPlusMinus: '+3284/-0', mergedToMain: 'YES', issuesCreated: 2, issuesUpdated: 3, branches: 'YES', isKotlin: 'NO', feBeConsist: 'NO', autoNotes: 'All commits in Experiments/ or main'
  },
  {
    team: '5_mh_1', student: 'Almutairi, Mary', username: 'maryam1', role: 'FE', totalCommits: 7, meaningful: 6, merge: 1, trivial: 0,
    commitRating: 'Excellent', linesPlusMinus: '+75295/-73068', mergedToMain: 'YES', issuesCreated: 8, issuesUpdated: 7, branches: 'YES', isKotlin: 'NO', feBeConsist: 'NO', autoNotes: ''
  },
];

const buildCommitChartData = (commits: any[]) => {
  const timeMap: Record<string, Record<string, number>> = {};

  commits.forEach((commit) => {
    const date = new Date(commit.committed_at);
    const time = `${date.toISOString().slice(0, 10)} ${date.getUTCHours().toString().padStart(2, "0")}:00`;
    const student = commit.author_name || "Unknown";

    timeMap[time] ||= {};
    timeMap[time][student] = (timeMap[time][student] || 0) + 1;
  });

  return Object.entries(timeMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, data]) => ({ time, ...data }));
};

const unknownAuthors: UnknownAuthor[] = [];
const kotlinFiles: KotlinFile[] = [];

function ratingBg(rating: TeamRow['commitRating']) {
  if (rating === 'Excellent') return '#c9f2cc';
  if (rating === 'Good') return '#fff2b4';
  return '#f5c1c1';
}

function buildRowsFromCommits(commits: any[], contributors: any[], teamLabel: string): TeamRow[] {
  // Aggregate per-author stats from the filtered commits
  const authorMap: Record<string, {
    name: string;
    email: string;
    totalCommits: number;
    additions: number;
    deletions: number;
  }> = {};

  commits.forEach((c) => {
    const key = c.author_email || c.author_name;
    if (!authorMap[key]) {
      authorMap[key] = {
        name: c.author_name || "Unknown",
        email: c.author_email || "",
        totalCommits: 0,
        additions: 0,
        deletions: 0,
      };
    }
    authorMap[key].totalCommits += 1;
    authorMap[key].additions += c.additions ?? 0;
    authorMap[key].deletions += c.deletions ?? 0;
  });

  // Fall back to contributors list for anyone with 0 commits in range
  contributors.forEach((c) => {
    const key = c.email || c.name;
    if (!authorMap[key]) {
      authorMap[key] = {
        name: c.name || "Unknown",
        email: c.email || "",
        totalCommits: 0,
        additions: 0,
        deletions: 0,
      };
    }
  });

  return Object.values(authorMap).map((c) => {
    const total = c.totalCommits;
    return {
      team: teamLabel,
      student: c.name,
      username: c.email?.split("@")[0] || c.name.toLowerCase().replace(/\s+/g, ""),
      role: Math.random() > 0.5 ? "FE" : "BE",
      totalCommits: total,
      meaningful: Math.floor(Math.random() * 2),
      merge: Math.floor(Math.random() * 2),
      trivial: Math.floor(Math.random() * 2),
      commitRating: total >= 5 ? "Excellent" : total >= 2 ? "Good" : "Poor",
      linesPlusMinus: `+${c.additions}/-${c.deletions}`,
      mergedToMain: Math.random() > 0.5 ? "YES" : "NO",
      issuesCreated: Math.floor(Math.random() * 10),
      issuesUpdated: Math.floor(Math.random() * 10),
      branches: Math.random() > 0.5 ? "YES" : "NO",
      isKotlin: "NO",
      feBeConsist: "NO",
      autoNotes: total === 0 ? "No commits in this period" : "",
    };
  });
}

function yesNoBg(value: string) {
  if (value === 'YES') return '#d9f3d9';
  if (value === 'NO') return '#f7d6d6';
  return '#f8f0c9';
}

export default function TAOverallViewPage() {
  const configCtx = useConfig();
  const config = configCtx?.config;

  const [search, setSearch] = useState('');
  const [timeRange, setTimeRange] = useState("Demo 1");
  
  const demoRanges: Record<string, { start: string; end: string }> = {
    "Demo 1": { start: config?.Demo1Start ?? "", end: config?.Demo1End ?? "" },
    "Demo 2": { start: config?.Demo2Start ?? "", end: config?.Demo2End ?? "" },
    "Demo 3": { start: config?.Demo3Start ?? "", end: config?.Demo3End ?? "" },
    "Demo 4": { start: config?.Demo4Start ?? "", end: config?.Demo4End ?? "" },
  };
  const options = Object.keys(demoRanges);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [repos, setRepos] = useState<any[]>([]);
  const { repoId: selectedRepoId } = useParams();
  const [loading, setLoading] = useState(false);
  const [attemptingSync, setAttemptingSync] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [commitData, setCommitData] = useState<any[]>([]);
  const { id } = useParams();

  // Fetch repos on component mount
  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const data = await api.getRepos();
        setRepos(data);
      } catch (err) {
        console.warn('Failed to fetch repos, using mock data:', err);
        setRows(summaryRows);
      }
    };
    fetchRepos();
  }, []);

// Initiating demo selection
useEffect(() => {
  const handleClickOutside = () => setDropdownOpen(false);
  if (dropdownOpen) document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, [dropdownOpen]);

// Refresh data when either selectedRepoId or TimeRange changes
useEffect(() => {
  if (!selectedRepoId) return;

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const { start, end } = demoRanges[timeRange];

    try {
      const commits = await api.getRepoCommits(selectedRepoId, { start, end });
      const contributorsRes = await api.getRepoContributors(selectedRepoId);

      setRows(buildRowsFromCommits(commits, contributorsRes.contributors, selectedRepoId));
      setCommitData(buildCommitChartData(commits));
    } catch (err) {
      console.error(err);
      setError("Failed to load commit data");
      setRows(summaryRows);
      setCommitData([]);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [selectedRepoId, timeRange]);

const filteredRows = useMemo(() => {
  const q = search.trim().toLowerCase();

  if (!q) return rows;

  return rows.filter((row) =>
    [row.team, row.student, row.username, row.role, row.commitRating, row.autoNotes ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
}, [search, rows]);

  return (
    <div style={styles.root}>
      <Sidebar  />
      <div style={styles.main}>
        <div style={styles.content}>
          <div style={styles.container}>
            <div style={styles.header}>
              <h1 style={styles.title}>COMS 309 Weekly Summary: 2026-02-10 to 2026-02-17</h1>
              <p style={styles.subtitle}>TA / instructor overview modeled after the spreadsheet layout</p>
            </div>

            <div style={styles.controls}>
              <div style={styles.searchContainer}>
                <Search style={styles.searchIcon} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students, teams, notes..."
                  style={styles.searchInput}
                />
              </div>
              <button 
                style={{
                  ...styles.button,
                  opacity: loading ? 0.6 : 1,
                  pointerEvents: loading ? 'none' : 'auto'
                }}
  onClick={async () => {
    if (!selectedRepoId) return;
    setAttemptingSync(true);
    try {
      await api.syncRepo(selectedRepoId);

      const { start, end } = demoRanges[timeRange];
      const commits = await api.getRepoCommits(selectedRepoId, { start, end });
      const contributorsRes = await api.getRepoContributors(selectedRepoId);

      setCommitData(buildCommitChartData(commits));

      setRows(buildRowsFromCommits(commits, contributorsRes.contributors, selectedRepoId));
    } catch (err) {
      console.error("Sync failed:", err);
      setError("Failed to sync repo");
    } finally {
      setAttemptingSync(false);
    }
  }}
              >
                <RefreshCw style={styles.icon} /> {attemptingSync ? 'Syncing...' : 'Refresh'}
              </button>
              <div style={{ position: "relative" }}>
                  <button
                    style={styles.button}
                    onClick={(e) => { e.stopPropagation(); setDropdownOpen((o) => !o); }}
                  >
                    <CalendarDays style={styles.icon} />
                  {timeRange}
                  <ChevronDown style={{ width: 14, height: 14 }} />
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    backgroundColor: "#822433",
                    borderRadius: "4px",
                    overflow: "hidden",
                    zIndex: 100,
                    minWidth: "100%",
                  }}>
                    {options.map((opt) => (
                      <div
                        key={opt}
                        onClick={() => { setTimeRange(opt); setDropdownOpen(false); }}
                        style={{
                          padding: "8px 12px",
                          color: "white",
                          fontFamily: "monospace",
                          fontSize: "13px",
                          cursor: "pointer",
                          backgroundColor: timeRange === opt ? "rgba(0,0,0,0.2)" : "transparent",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.15)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = timeRange === opt ? "rgba(0,0,0,0.2)" : "transparent")}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {repos.length > 0 && (
                <select 
                  value={selectedRepoId || ''} 
                  style={styles.groupSelect}
                >
                  <option value="">Select Repo</option>
                  {repos.map((repo) => (
                    <option key={repo.id} value={repo.id}>
                      {repo.name}
                    </option>
                  ))}
                </select>
              )}
             
            </div>

            {error && (
              <div style={styles.errorMessage}>
                ⚠️ {error}
              </div>
            )}
            {loading && (
              <div style={styles.loadingMessage}>
                Loading data...
              </div>
            )}

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.headerRow}>
                    {['Team', 'Student', 'Username', 'Role', 'Total Commits', 'Meaningful', 'Merge', 'Trivial', 'Commit Rating', 'Lines +/-', 'Merged to Main?', 'Issues Created', 'Issues Updated', 'Branches', 'Is Kotlin?', 'FE/BE Consist', 'Auto-Notes'].map((h) => (
                      <th key={h} style={styles.headerCell}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, idx) => (
                    <tr key={`${row.team}-${row.username}-${idx}`} style={idx % 2 ? styles.rowEven : styles.rowOdd}>
                      <td style={styles.cell}>{row.team}</td>
                      <td style={styles.cell}>{row.student}</td>
                      <td style={styles.cell}>{row.username}</td>
                      <td style={styles.cell}>{row.role}</td>
                      <td style={styles.cell}>{row.totalCommits}</td>
                      <td style={styles.cell}>{row.meaningful}</td>
                      <td style={styles.cell}>{row.merge}</td>
                      <td style={styles.cell}>{row.trivial}</td>
                      <td style={{ ...styles.cell, backgroundColor: ratingBg(row.commitRating) }}>{row.commitRating}</td>
                      <td style={styles.cell}>{row.linesPlusMinus}</td>
                      <td style={{ ...styles.cell, backgroundColor: yesNoBg(row.mergedToMain) }}>{row.mergedToMain}</td>
                      <td style={styles.cell}>{row.issuesCreated}</td>
                      <td style={styles.cell}>{row.issuesUpdated}</td>
                      <td style={{ ...styles.cell, backgroundColor: yesNoBg(row.branches) }}>{row.branches}</td>
                      <td style={{ ...styles.cell, backgroundColor: yesNoBg(row.isKotlin) }}>{row.isKotlin}</td>
                      <td style={{ ...styles.cell, backgroundColor: yesNoBg(row.feBeConsist) }}>{row.feBeConsist}</td>
                      <td style={styles.cell}>{row.autoNotes || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          <div style={styles.graphWrapper}>
            <div style={styles.graphHeader}>
              <h2 style={styles.graphTitle}>Commit Activity Summary</h2>
              <p style={styles.graphSubtitle}>Commits over time by student performance</p>
            </div>

            {commitData.length === 0 ? (
              <div style={{ padding: "16px", color: "#666" }}>
                No commit data available.
              </div>
            ) : (
              <CommitGraph data={commitData} loading={loading} />
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "row",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    backgroundColor: "#f0f0f0"
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    justifyContent: "flex-start"
  },
  container: {
    width: "100%",
    maxWidth: "1800px"
  },
  header: {
    backgroundColor: "white",
    padding: "16px",
    borderRadius: "4px",
    marginBottom: "16px",
    border: "1px solid #e0e0e0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#333"
  },
  subtitle: {
    margin: "0",
    fontSize: "13px",
    color: "#666"
  },
  controls: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
    alignItems: "center",
    flexWrap: "wrap"
  },
  searchContainer: {
    position: "relative",
    flex: "1 1 220px",
    minWidth: "220px"
  },
  searchInput: {
    width: "100%",
    height: "36px",
    padding: "0 28px 0 12px",
    border: "1px solid #d0d0d0",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "13px",
    boxSizing: "border-box"
  },
  searchIcon: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "16px",
    height: "16px",
    color: "#999",
    pointerEvents: "none"
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
  icon: {
    width: "16px",
    height: "16px"
  },
  groupSelect: {
    height: "36px",
    padding: "0 12px",
    border: "1px solid #d0d0d0",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "13px",
    backgroundColor: "white",
    color: "#333",
    cursor: "pointer"
  },
  tableWrapper: {
    overflowX: "auto",
    backgroundColor: "white",
    border: "1px solid #d0d0d0",
    borderRadius: "4px",
    marginBottom: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px"
  },
  headerRow: {
    backgroundColor: "#f5f5f5",
    borderBottom: "1px solid #d0d0d0"
  },
  headerCell: {
    padding: "8px 12px",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "11px",
    color: "#333",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderRight: "1px solid #d0d0d0",
    whiteSpace: "nowrap"
  },
  rowOdd: {
    backgroundColor: "#fcfcfc",
    borderBottom: "1px solid #e8e8e8"
  },
  rowEven: {
    backgroundColor: "white",
    borderBottom: "1px solid #e8e8e8"
  },
  cell: {
    padding: "8px 12px",
    borderRight: "1px solid #e8e8e8",
    whiteSpace: "nowrap",
    color: "#333"
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px"
  },
  section: {
    backgroundColor: "white",
    border: "1px solid #d0d0d0",
    borderRadius: "4px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "16px",
    padding: "12px 16px",
    borderBottom: "1px solid #d0d0d0"
  },
  sectionTitle: {
    margin: "0 0 4px 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#333"
  },
  sectionSubtitle: {
    margin: "0",
    fontSize: "12px",
    color: "#666"
  },
  rowCount: {
    fontSize: "12px",
    color: "#888"
  },
  graphWrapper: {
    backgroundColor: "white",
    border: "1px solid #d0d0d0",
    borderRadius: "4px",
    marginBottom: "16px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
  },
  graphHeader: {
    padding: "12px 16px",
    borderBottom: "1px solid #d0d0d0"
  },
  graphTitle: {
    margin: "0 0 4px 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#333"
  },
  graphSubtitle: {
    margin: "0",
    fontSize: "12px",
    color: "#666"
  },
  errorMessage: {
    backgroundColor: "#ffebee",
    border: "1px solid #ef5350",
    borderRadius: "4px",
    padding: "12px 16px",
    marginBottom: "16px",
    color: "#c62828",
    fontSize: "12px"
  },
  loadingMessage: {
    backgroundColor: "#e3f2fd",
    border: "1px solid #42a5f5",
    borderRadius: "4px",
    padding: "12px 16px",
    marginBottom: "16px",
    color: "#1565c0",
    fontSize: "12px"
  }
};