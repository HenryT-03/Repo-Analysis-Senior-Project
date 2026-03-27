import { useEffect, useState } from "react";

const BACKEND = "http://localhost:5000";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [dbTime, setDbTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for token on load (returned from Microsoft login)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, "", "/");
    }

    const stored = token || localStorage.getItem("token");
    if (!stored) { setLoading(false); return; }

    fetch(`${BACKEND}/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((r) => r.json())
      .then((data) => { if (data.email) setUser(data); })
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  function pingDb() {
    fetch(`${BACKEND}/testdb`)
      .then((r) => r.json())
      .then((data) => setDbTime(data.db_time))
      .catch(() => setDbTime("error"));
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: 32, fontFamily: "sans-serif" }}>
      <h2>Repo Analysis Dashboard</h2>
      <hr />

      {!user ? (
        <div>
          <p>Not logged in.</p>
          <button onClick={() => (window.location.href = `${BACKEND}/auth/login`)}>
            Sign in with Microsoft
          </button>
        </div>
      ) : (
        <div>
          <p>✓ Logged in as <strong>{user.name}</strong> ({user.email})</p>
          <p>Role: <strong>{user.role}</strong></p>
          <button onClick={logout}>Sign out</button>
        </div>
      )}

      <hr />

      <div>
        <button onClick={pingDb}>Ping Database</button>
        {dbTime && <p>✓ DB time: <strong>{dbTime}</strong></p>}
      </div>
    </div>
  );
}