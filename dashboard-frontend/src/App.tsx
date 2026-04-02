import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { fetchMe } from "./api.ts";
import LoginPage from "./pages/Loginpage";
import DashboardPage from "./pages/Dashboardpage";
import RepoPage from "./pages/Repopage";
import GroupHub from './GroupHub';


export type User = {
  id: number;
  name: string;
  email: string;
  role: "student" | "ta" | "instructor";
  gitlab_username: string | null;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pick up token from Microsoft/dev login redirect
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, "", "/");
    }

    const stored = token || localStorage.getItem("token");
    if (!stored) { setLoading(false); return; }

    fetchMe()
      .then(setUser)
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  if (loading) return <p style={{ padding: 32 }}>Loading...</p>;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user
              ? <Navigate to="/dashboard" replace />
              : <LoginPage />
          }
        />
        <Route
          path="/groups"
          element={
            user
              ? <GroupHub />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/dashboard"
          element={
            user
              ? <DashboardPage user={user} onLogout={logout} />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/repo/:repoId"
          element={
            user
              ? <RepoPage user={user} onLogout={logout} />
              : <Navigate to="/" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}