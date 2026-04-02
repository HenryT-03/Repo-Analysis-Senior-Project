const BACKEND = "http://localhost:5000";

export default function LoginPage() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      gap: 16,
      fontFamily: "sans-serif",
    }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>Repo Analysis Dashboard</h1>
      <p style={{ color: "#666", margin: 0 }}>
        Sign in to view repository contributions and analysis.
      </p>
      <button
        onClick={() => (window.location.href = `${BACKEND}/auth/login`)}
        style={{
          marginTop: 8,
          padding: "10px 24px",
          fontSize: 15,
          cursor: "pointer",
          border: "1px solid #ccc",
          borderRadius: 4,
          background: "#fff",
          color: "#333",
        }}
      >
        Sign in with Microsoft
      </button>
    </div>
  );
}