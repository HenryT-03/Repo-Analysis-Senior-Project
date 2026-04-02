import React, { useMemo, useState, useEffect } from 'react';
import { Search, RefreshCw, CalendarDays } from 'lucide-react';
import Sidebar from "./Elements/Sidebar";
import TopBar from "./Elements/TopBar";
import CommitGraph from "./Elements/CommitGraph";
import api from "./services/api";

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
  mergedToMain: 'YES' | 'NO';
  issuesCreated: number;
  issuesUpdated: number;
  branches: string;
  isKotlin: 'YES' | 'NO' | 'PARTIAL' | 'NO DATA';
  feBeConsist: 'YES' | 'NO' | 'PARTIAL' | 'NO DATA';
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

const unknownAuthors: UnknownAuthor[] = [
  {
    team: '5_mh_3', sha: '2654eddc', author: 'Shea', email: 'shea.keister@...', message: 'Frontend Volly', date: '2026-02-16',
  },
];

const kotlinFiles: KotlinFile[] = [
  { team: '5_mh_5', filePath: 'Frontend/Roundtrip1/app/build.gradle.kts' },
  { team: '5_mh_5', filePath: 'Frontend/Roundtrip1/app/src/androidTest/java/com/example/roundtrip1/ExampleInstrumentedTest.kt' },
];

function ratingBg(rating: TeamRow['commitRating']) {
  if (rating === 'Excellent') return '#c9f2cc';
  if (rating === 'Good') return '#fff2b4';
  return '#f5c1c1';
}

function yesNoBg(value: string) {
  if (value === 'YES') return '#d9f3d9';
  if (value === 'NO') return '#f7d6d6';
  return '#f8f0c9';
}

export default function TAOverallViewPage() {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('5_mh_1');
  const [timeRange, setTimeRange] = useState('2026-02-10 to 2026-02-17');
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [commitData, setCommitData] = useState<any[]>([]);

  // Fetch repos on component mount
  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const data = await api.getRepos();
        setRepos(data);
        if (data.length > 0) {
          setSelectedRepoId(data[0].id);
        }
      } catch (err) {
        console.warn('Failed to fetch repos, using mock data:', err);
        setRows(summaryRows);
      }
    };
    fetchRepos();
  }, []);

  // Fetch stats when repo is selected
  useEffect(() => {
    if (!selectedRepoId) return;

    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getRepoStats(selectedRepoId);
        setRows(data);
      } catch (err) {
        console.error('Failed to fetch repo stats:', err);
        setError('Failed to load student statistics');
        setRows(summaryRows);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedRepoId]);

  // Fetch commits when repo is selected
  useEffect(() => {
    if (!selectedRepoId) return;

    const fetchCommits = async () => {
      try {
        const commits = await api.getRepoCommits(selectedRepoId);

        // Transform commits into time-series data
        const timeMap = new Map<string, { [student: string]: number }>();

        commits.forEach((commit: any) => {
          const time = new Date(commit.committed_at).getHours().toString().padStart(2, "0") + ":00";
          if (!timeMap.has(time)) {
            timeMap.set(time, {});
          }
          const student = commit.author_name || "Unknown";
          const current = timeMap.get(time)!;
          current[student] = (current[student] || 0) + 1;
        });

        // Convert to array format for recharts
        const chartData = Array.from(timeMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([time, data]) => ({ time, ...data }));

        setCommitData(chartData);
      } catch (err) {
        console.warn('Failed to fetch commits:', err);
        setCommitData([]);
      }
    };

    fetchCommits();
  }, [selectedRepoId]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = rows.filter((row) => row.team === selectedGroup);
    if (!q) return filtered;
    return filtered.filter((row) =>
      [row.team, row.student, row.username, row.role, row.commitRating, row.autoNotes ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [search, selectedGroup, rows]);

  return (
    <div style={styles.root}>
      <Sidebar />
      <div style={styles.main}>
        <TopBar />
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
                  if (selectedRepoId) {
                    setLoading(true);
                    try {
                      await api.syncRepo(selectedRepoId);
                      const data = await api.getRepoStats(selectedRepoId);
                      setRows(data);
                    } catch (err) {
                      console.error('Sync failed:', err);
                      setError('Failed to sync repo');
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
              >
                <RefreshCw style={styles.icon} /> {loading ? 'Syncing...' : 'Refresh'}
              </button>
              <button style={styles.button}>
                <CalendarDays style={styles.icon} />
                {timeRange}
              </button>
              {repos.length > 0 && (
                <select 
                  value={selectedRepoId || ''} 
                  onChange={(e) => setSelectedRepoId(e.target.value || null)}
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
              <select 
                value={selectedGroup} 
                onChange={(e) => setSelectedGroup(e.target.value)}
                style={styles.groupSelect}
              >
                <option value="5_mh_1">Group 5_mh_1</option>
                <option value="5_mh_2">Group 5_mh_2</option>
                <option value="5_mh_3">Group 5_mh_3</option>
                <option value="5_mh_4">Group 5_mh_4</option>
                <option value="5_mh_5">Group 5_mh_5</option>
                <option value="5_mh_6">Group 5_mh_6</option>
              </select>
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
              <CommitGraph data={commitData} loading={loading} />
            </div>

            <div style={styles.gridContainer}>
              <section style={styles.section}>
                <div style={styles.sectionHeader}>
                  <div>
                    <h2 style={styles.sectionTitle}>Unknown Authors</h2>
                    <p style={styles.sectionSubtitle}>Commits that did not map to a known student account</p>
                  </div>
                  <div style={styles.rowCount}>{unknownAuthors.length} rows</div>
                </div>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.headerRow}>
                        {['Team', 'SHA', 'Author', 'Email', 'Message', 'Date'].map((h) => (
                          <th key={h} style={styles.headerCell}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {unknownAuthors.map((r, idx) => (
                        <tr key={idx} style={idx % 2 ? styles.rowEven : styles.rowOdd}>
                          <td style={styles.cell}>{r.team}</td>
                          <td style={styles.cell}>{r.sha}</td>
                          <td style={styles.cell}>{r.author}</td>
                          <td style={styles.cell}>{r.email}</td>
                          <td style={styles.cell}>{r.message}</td>
                          <td style={styles.cell}>{r.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section style={styles.section}>
                <div style={styles.sectionHeader}>
                  <div>
                    <h2 style={styles.sectionTitle}>Kotlin Files in Repo</h2>
                    <p style={styles.sectionSubtitle}>Flagged files found in frontend/backend repos</p>
                  </div>
                  <div style={styles.rowCount}>{kotlinFiles.length} rows</div>
                </div>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.headerRow}>
                        {['Team', 'File Path'].map((h) => (
                          <th key={h} style={styles.headerCell}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {kotlinFiles.map((r, idx) => (
                        <tr key={idx} style={idx % 2 ? styles.rowEven : styles.rowOdd}>
                          <td style={styles.cell}>{r.team}</td>
                          <td style={{ ...styles.cell, fontFamily: 'monospace', fontSize: '12px' }}>{r.filePath}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
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
