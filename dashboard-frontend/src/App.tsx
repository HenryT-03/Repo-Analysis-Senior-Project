import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { fetchMe } from "./api.ts";
import api from "./services/api";
import DashboardPage from './pages/Dashboardpage.tsx';
import TAOverallViewPage from './TAOverallPage';
import SiteConfigPage from "./SiteConfigPage.tsx";
import { ConfigProvider } from "./ConfigContext.tsx";
import { DataProvider } from "./DataProvider.tsx";
import LoginPage from "./pages/Loginpage.tsx";
import GroupHub from "./GroupHub.tsx";

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
  const [userRepos, setUserRepos] = useState<any[]>([]);

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
      .then(async (userData) => {
        setUser(userData);

        // For students, fetch their repos to determine redirect destination
        if (userData.role === "student") {
          try {
            const repos = await api.getUserRepos();
            setUserRepos(repos);
          } catch (error) {
            console.error("Failed to fetch user repos:", error);
          }
        }
      })
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    setUserRepos([]);
  }

  // Determine redirect destination based on user role
  const getRedirectPath = () => {
    if (!user) return "/";

    if (user.role === "student" && userRepos.length === 1) {
      // Students with exactly one repo go directly to their repo page
      return `/group/${userRepos[0].id}`;
    }

    // All other cases (TAs, instructors, students with multiple/no repos) go to dashboard
    return "/dashboard";
  };

  if (loading) return <p style={{ padding: 32 }}>Loading...</p>;

  return (
    <DataProvider>
        <ConfigProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  user
                    ? <Navigate to={getRedirectPath()} replace />
                    : <LoginPage />
                }
              />
              {/* <Route
                path="/groups"
                element={
                  user
                    ? <GroupHub />
                    : <Navigate to="/" replace />
                }
              /> */}
              <Route
                path="/dashboard"
                element={user ? <GroupHub /> : <Navigate to="/" replace />}
              />

              // To:
              <Route
                path="/dashboard"
                element={user ? <DashboardPage user={user} onLogout={logout} /> : <Navigate to="/" replace />}
              />
              <Route
                path="/group/:repoId"
                element={
                  user
                    ? <TAOverallViewPage />
                    : <Navigate to="/" replace />
                }
              />
              <Route path="/config" element={<SiteConfigPage />} />
            </Routes>
          </BrowserRouter>
        </ConfigProvider>
      </DataProvider>
  );
}