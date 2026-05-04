import React, { useMemo, useState, useEffect } from 'react';
import { Search, RefreshCw, ChevronDown, CalendarDays } from 'lucide-react';
import Sidebar from "./Elements/HubSidebar";
import CommitGraph from "./Elements/CommitGraph";
import api from "./services/api";
import { useParams } from "react-router-dom";
import { ConfigProvider, useConfig } from './ConfigContext';
import { useData } from './DataProvider';

type TeamRow = {
  team: string;
  student: string;
  username: string;
  role: 'FE' | 'BE';
  totalCommits: number;
  meaningful: number;
  merge: number;
  trivial: number;
  commitRating: 'Outstanding' | 'Excellent' | 'Good' | 'Poor';
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
  if (rating === 'Outstanding') return '#bbdefb';
  if (rating === 'Excellent') return '#c9f2cc';
  if (rating === 'Good') return '#fff2b4';
  return '#f5c1c1';
}
function commitCountBg(total: number, expected: number): string {
  if (total === 0) return '#f5c1c1';           // red
  if (total >= expected * 2) return '#bbdefb'; // blue
  if (total >= expected) return '#c9f2cc';     // green
  return '#fff2b4';                            // yellow
}

function mergeBg(merges: number, expected: number): string {
  if (merges === 0) return '#f5c1c1';           // red
  if (merges >= expected * 2) return '#bbdefb'; // blue
  if (merges >= expected) return '#c9f2cc';     // green
  return '#fff2b4';                             // yellow
}

function buildRowsFromCommits(
  commits: any[],
  contributors: any[],
  teamLabel: string,
  expectedCommitsWeekly: number,
  expectedMergesDemo: number,
  demoStart: string,
  demoEnd: string,
): TeamRow[] {
  // Calculate number of weeks in the demo period
  const start = new Date(demoStart);
  const end = new Date(demoEnd);
  const weeks = Math.max(1, Math.round((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const expectedCommitsTotal = expectedCommitsWeekly * weeks;

  const authorMap: Record<string, {
    name: string;
    email: string;
    totalCommits: number;
    mergeCommits: number;
    additions: number;
    deletions: number;
    issuesCreated: number;
    issuesUpdated: number;
  }> = {};

  commits.forEach((c) => {
    const key = c.author_email || c.author_name;
    if (!authorMap[key]) {
      authorMap[key] = {
        name: c.author_name || "Unknown",
        email: c.author_email || "",
        totalCommits: 0,
        mergeCommits: 0,
        additions: 0,
        deletions: 0,
        issuesCreated: c.issues_created ?? 0,
        issuesUpdated: c.issues_updated ?? 0,
      };
    }
    authorMap[key].totalCommits += 1;
    authorMap[key].mergeCommits += c.is_merge ? 1 : 0;
    authorMap[key].additions += c.additions ?? 0;
    authorMap[key].deletions += c.deletions ?? 0;
    authorMap[key].issuesCreated = Math.max(authorMap[key].issuesCreated, c.issues_created ?? 0);
    authorMap[key].issuesUpdated = Math.max(authorMap[key].issuesUpdated, c.issues_updated ?? 0);
  });

  contributors.forEach((c) => {
    const key = c.email || c.name;
    if (!authorMap[key]) {
      authorMap[key] = {
        name: c.name || "Unknown",
        email: c.email || "",
        totalCommits: 0,
        mergeCommits: 0,
        additions: 0,
        deletions: 0,
        issuesCreated: 0,
        issuesUpdated: 0,
      };
    }
  });

  return Object.values(authorMap).map((c) => {
    
    
    const total = c.totalCommits;
    const meaningful = total - c.mergeCommits;

    const commitRating = 'Outstanding'

    const notes: string[] = [];
    if (total === 0) {
      notes.push("No commits in this period");
    } else {
      if (total >= expectedCommitsTotal * 2) {
        notes.push(`Commits: ${total} (≥2x expected of ${expectedCommitsTotal})`);
      } else if (total >= expectedCommitsTotal) {
        notes.push(`Commits: ${total} (meets expected of ${expectedCommitsTotal})`);
      } else {
        notes.push(`Commits: ${total} (below expected of ${expectedCommitsTotal})`);
      }

      if (c.mergeCommits === 0) {
        notes.push(`No merge commits (expected ${expectedMergesDemo})`);
      } else if (c.mergeCommits >= expectedMergesDemo * 2) {
        notes.push(`Merges: ${c.mergeCommits} (≥2x expected of ${expectedMergesDemo})`);
      } else if (c.mergeCommits >= expectedMergesDemo) {
        notes.push(`Merges: ${c.mergeCommits} (meets expected of ${expectedMergesDemo})`);
      } else {
        notes.push(`Merges: ${c.mergeCommits} (below expected of ${expectedMergesDemo})`);
      }
    }

    return {
      team: teamLabel,
      student: c.name,
      username: c.email?.split("@")[0] || c.name.toLowerCase().replace(/\s+/g, ""),
      role: "BE" as const,
      totalCommits: total,
      meaningful,
      merge: c.mergeCommits,
      trivial: 0,
      commitRating,
      linesPlusMinus: `+${c.additions}/-${c.deletions}`,
      mergedToMain: "N/A" as const,
      issuesCreated: c.issuesCreated,
      issuesUpdated: c.issuesUpdated,
      branches: "N/A" as const,
      isKotlin: "NO" as const,
      feBeConsist: "NO" as const,
      autoNotes: notes.join(", "),
    };
  });
}

export default function TAOverallViewPage() {
  const configCtx = useConfig();
  const config = configCtx?.config;

  const [search, setSearch] = useState('');
  const [timeRange, setTimeRange] = useState("Demo 1");
  const { repos, usersByRepo, commitsByEmail, loading, refresh } = useData();

  const demoRanges: Record<string, { start: string; end: string }> = {
    "Demo 1": { start: config?.Demo1Start ?? "", end: config?.Demo1End ?? "" },
    "Demo 2": { start: config?.Demo2Start ?? "", end: config?.Demo2End ?? "" },
    "Demo 3": { start: config?.Demo3Start ?? "", end: config?.Demo3End ?? "" },
    "Demo 4": { start: config?.Demo4Start ?? "", end: config?.Demo4End ?? "" },
  };
  const options = Object.keys(demoRanges);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { repoId: selectedRepoId } = useParams();
  const [attemptingSync, setAttemptingSync] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [commitData, setCommitData] = useState<any[]>([]);
  const expectedCommits = config?.ExpectedCommitsWeekly ?? 1;
  const expectedMerges = config?.ExpectedMergesDemo ?? 1;
  const { id } = useParams();


// Initiating demo selection
useEffect(() => {
  const handleClickOutside = () => setDropdownOpen(false);
  if (dropdownOpen) document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, [dropdownOpen]);

useEffect(() => {
  if (!selectedRepoId || loading) return;

  const { start, end } = demoRanges[timeRange];
  const contributors = usersByRepo[Number(selectedRepoId)] ?? [];

  // Only grab commits for emails that belong to this repo's contributors
  const repoEmails = new Set(contributors.map((c) => c.email).filter(Boolean));

  const repoCommits = [...repoEmails]
    .flatMap((email) => commitsByEmail[email] ?? [])
    .filter((c) => {
      const date = new Date(c.committed_at);
      return (
        (!start || date >= new Date(start)) &&
        (!end || date <= new Date(end))
      );
    });

  setRows(buildRowsFromCommits(
    repoCommits,
    contributors,
    selectedRepoId,
    expectedCommits,
    expectedMerges,
    start,
    end,
  ));
  setCommitData(buildCommitChartData(repoCommits));
}, [selectedRepoId, timeRange, commitsByEmail, usersByRepo]);

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
            <h1 style={styles.title}>
              {repos.find(r => String(r.id) === String(selectedRepoId))?.name ?? "Viewing Repo"} — {timeRange}
            </h1>
            <p style={styles.subtitle}>
              {demoRanges[timeRange].start} to {demoRanges[timeRange].end}
            </p>
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
                  await refresh(); 
                } catch (err) {
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
                    {['Team', 'Student', 'Username', 'Role', 'Total Commits', 'Meaningful', 'Merge', 'Trivial', 'Lines +/-', 'Issues Created', 'Issues Updated', 'Auto-Notes'].map((h) => (
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
                      <td style={{ ...styles.cell, backgroundColor: commitCountBg(row.totalCommits, (config?.ExpectedCommitsWeekly ?? 1)) }}>
                        {row.totalCommits}
                      </td>
                      <td style={styles.cell}>{row.meaningful}</td>
                      <td style={{ ...styles.cell, backgroundColor: mergeBg(row.merge, config?.ExpectedMergesDemo ?? 1) }}>
                        {row.merge}
                      </td>                   
                     <td style={styles.cell}>{row.trivial}</td>
                      <td style={styles.cell}>{row.linesPlusMinus}</td>
                      <td style={styles.cell}>{row.issuesCreated}</td>
                      <td style={styles.cell}>{row.issuesUpdated}</td>
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