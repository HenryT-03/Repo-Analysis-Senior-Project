import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { fetchMe } from "./api";
import LoginPage from "./pages/Loginpage";
import GroupHub from "./pages/GroupHub";
import TAOverallViewPage from "./pages/Repopage";

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

  if (loading) return <p style={{ padding: 32, fontFamily: "sans-serif" }}>Loading...</p>;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user
              ? <Navigate to="/dashboard" replace />
              : <LoginPage onLoginSuccess={() => {}} />
          }
        />
        <Route
          path="/dashboard"
          element={user ? <GroupHub /> : <Navigate to="/" replace />}
        />
        {/* /group/:id used by GroupviewSquare onClick */}
        <Route
          path="/group/:repoId"
          element={user ? <TAOverallViewPage /> : <Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}