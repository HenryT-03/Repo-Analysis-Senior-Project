import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { fetchMe } from "./api.ts";
import LoginPage from "./pages/Loginpage";
import DashboardPage from "./pages/GroupHub";
import RepoPage from "./pages/Repopage";

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
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // Came back from OAuth redirect — process token and go to dashboard
      localStorage.setItem("token", token);
      window.history.replaceState({}, "", "/");

      fetchMe()
        .then((data: unknown) => {
          const u = data as User;
          if (u?.id && u?.email) setUser(u);
          else throw new Error("Invalid user response");
        })
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      // No token in URL — always show the login page, let the user click
      setLoading(false);
    }
  }, []);

  function onLoginSuccess(token: string) {
    localStorage.setItem("token", token);
    fetchMe()
      .then((data: unknown) => {
        const u = data as User;
        if (u?.id && u?.email) setUser(u);
        else throw new Error("Invalid user response");
      })
      .catch(() => localStorage.removeItem("token"));
  }

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
              : <LoginPage onLoginSuccess={onLoginSuccess} />
          }
        />
        {/* Alias in case anything links to /loginpage */}
        <Route path="/loginpage" element={<Navigate to="/" replace />} />
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