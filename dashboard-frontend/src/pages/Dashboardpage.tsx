import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRepos, addRepo } from "../api";
import type { User } from "../App";

type Repo = {
  id: number;
  gitlab_id: number;
  name: string;
  namespace: string;
  url: string;
  created_at: string;
};

type Props = {
  user: User;
  onLogout: () => void;
};

export default function DashboardPage({ user, onLogout }: Props) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [search, setSearch] = useState("");
  const [addInput, setAddInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRepos()
      .then(setRepos)
      .catch(() => setError("Failed to load repos"));
  }, []);

  const filtered = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.namespace?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddRepo() {
    if (!addInput.trim()) return;

    // Extract path from full URL if pasted (e.g. https://gitlab.com/group/repo → group/repo)
    let path = addInput.trim();
    if (path.includes("gitlab.com/")) {
      path = path.split("gitlab.com/")[1].replace(/\/$/, "");
    }

    setAdding(true);
    setError(null);
    try {
      await addRepo(path);
      const updated = await fetchRepos();
      setRepos(updated);
      setAddInput("");
    } catch {
      setError("Failed to add repo. Check the path and try again.");
    } finally {
      setAdding(false);
    }
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
        <strong>Repo Analysis Dashboard</strong>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ color: "#666", fontSize: 14 }}>{user.name} · {user.role}</span>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <main style={{ padding: "24px 32px", maxWidth: 900, margin: "0 auto" }}>

        {/* Search bar */}
        <input
          type="text"
          placeholder="Search repos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: 15,
            border: "1px solid #ccc",
            borderRadius: 4,
            marginBottom: 24,
            boxSizing: "border-box",
          }}
        />

        {/* Add repo — instructors and TAs only */}
        {(user.role === "instructor" || user.role === "ta") && (
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <input
              type="text"
              placeholder="Paste GitLab repo URL or path (e.g. group/repo)"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddRepo()}
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: 14,
                border: "1px solid #ccc",
                borderRadius: 4,
              }}
            />
            <button onClick={handleAddRepo} disabled={adding}>
              {adding ? "Adding..." : "Add Repo"}
            </button>
          </div>
        )}

        {error && <p style={{ color: "red", marginBottom: 16 }}>{error}</p>}

        {/* Repo list */}
        {filtered.length === 0 ? (
          <p style={{ color: "#888" }}>
            {repos.length === 0 ? "No repos added yet." : "No results."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((repo) => (
              <div
                key={repo.id}
                onClick={() => navigate(`/repo/${repo.id}`)}
                style={{
                  padding: "14px 16px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  cursor: "pointer",
                  background: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#f9f9f9")}
                onMouseOut={(e) => (e.currentTarget.style.background = "#fff")}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{repo.name}</div>
                  <div style={{ fontSize: 13, color: "#888" }}>{repo.namespace}</div>
                </div>
                <span style={{ fontSize: 13, color: "#aaa" }}>→</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}