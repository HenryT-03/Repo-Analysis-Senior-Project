import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchRepoStats, fetchCommits, syncRepo, fetchAiSummary } from "../api";
import type { User } from "../App";

type ContributorStat = {
  author_name: string;
  author_email: string;
  commit_count: number;
  total_additions: number;
  total_deletions: number;
  branches: string[];
  // AI fields (may be absent if analysis hasn't run)
  avg_ai_score?: number;
  flagged_commits?: number;
};

type Commit = {
  id: number;
  sha: string;
  message: string;
  additions: number;
  deletions: number;
  branch: string;
  committed_at: string;
};

type Props = {
  user: User;
  onLogout: () => void;
};

export default function RepoPage({ user, onLogout }: Props) {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const id = Number(repoId);

  const [stats, setStats] = useState<ContributorStat[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null); // author_email
  const [commits, setCommits] = useState<Commit[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRepoStats(id)
      .then((data) => setStats(Array.isArray(data) ? data : [data]))
      .catch(() => setError("Failed to load stats"));
  }, [id]);

  async function handleExpand(email: string) {
    if (expanded === email) { setExpanded(null); return; }
    setExpanded(email);
    try {
      const data = await fetchCommits(id, email);
      setCommits(data);
    } catch {
      setError("Failed to load commits");
    }
  }

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      await syncRepo(id);
      const updated = await fetchRepoStats(id);
      setStats(Array.isArray(updated) ? updated : [updated]);
    } catch {
      setError("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  function aiColor(score?: number) {
    if (score == null) return "#aaa";
    if (score >= 55) return "#e53e3e";
    if (score >= 30) return "#dd6b20";
    return "#38a169";
  }

  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh" }}>

      {/* Header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        borderBottom: "1px solid #eee",
      }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <button onClick={() => navigate("/dashboard")} style={{ fontSize: 13 }}>
            ← Back
          </button>
          <strong>Repo #{repoId}</strong>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {(user.role === "instructor" || user.role === "ta") && (
            <button onClick={handleSync} disabled={syncing}>
              {syncing ? "Syncing..." : "Sync Commits"}
            </button>
          )}
          <span style={{ color: "#666", fontSize: 14 }}>{user.name}</span>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <main style={{ padding: "24px 32px", maxWidth: 900, margin: "0 auto" }}>
        {error && <p style={{ color: "red", marginBottom: 16 }}>{error}</p>}

        {stats.length === 0 ? (
          <p style={{ color: "#888" }}>No contributor data. Try syncing first.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
                <th style={th}>Contributor</th>
                <th style={th}>Commits</th>
                <th style={th}>Additions</th>
                <th style={th}>Deletions</th>
                <th style={th}>Branches</th>
                <th style={th}>AI Score</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <>
                  <tr
                    key={s.author_email}
                    style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                    onClick={() => handleExpand(s.author_email)}
                  >
                    <td style={td}>
                      <div style={{ fontWeight: 500 }}>{s.author_name}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>{s.author_email}</div>
                    </td>
                    <td style={td}>{s.commit_count}</td>
                    <td style={{ ...td, color: "#38a169" }}>+{s.total_additions}</td>
                    <td style={{ ...td, color: "#e53e3e" }}>-{s.total_deletions}</td>
                    <td style={td}>
                      {s.branches?.map((b) => (
                        <span key={b} style={badge}>{b}</span>
                      ))}
                    </td>
                    <td style={td}>
                      {s.avg_ai_score != null ? (
                        <span style={{ color: aiColor(s.avg_ai_score), fontWeight: 500 }}>
                          {s.avg_ai_score}
                          {s.flagged_commits ? ` (${s.flagged_commits} flagged)` : ""}
                        </span>
                      ) : (
                        <span style={{ color: "#aaa" }}>—</span>
                      )}
                    </td>
                    <td style={td}>{expanded === s.author_email ? "▲" : "▼"}</td>
                  </tr>

                  {/* Expanded commit list */}
                  {expanded === s.author_email && (
                    <tr key={`${s.author_email}-detail`}>
                      <td colSpan={7} style={{ padding: "0 0 12px 24px", background: "#fafafa" }}>
                        {commits.length === 0 ? (
                          <p style={{ color: "#888", padding: "12px 0" }}>No commits found.</p>
                        ) : (
                          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ color: "#888" }}>
                                <th style={th}>Message</th>
                                <th style={th}>Branch</th>
                                <th style={th}>+/-</th>
                                <th style={th}>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {commits.map((c) => (
                                <tr key={c.sha} style={{ borderBottom: "1px solid #eee" }}>
                                  <td style={td}>{c.message?.split("\n")[0]}</td>
                                  <td style={td}><span style={badge}>{c.branch}</span></td>
                                  <td style={td}>
                                    <span style={{ color: "#38a169" }}>+{c.additions}</span>
                                    {" / "}
                                    <span style={{ color: "#e53e3e" }}>-{c.deletions}</span>
                                  </td>
                                  <td style={{ ...td, color: "#888" }}>
                                    {new Date(c.committed_at).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

const th: React.CSSProperties = { padding: "8px 12px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "10px 12px", verticalAlign: "top" };
const badge: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 6px",
  background: "#eee",
  borderRadius: 3,
  fontSize: 11,
  marginRight: 4,
};