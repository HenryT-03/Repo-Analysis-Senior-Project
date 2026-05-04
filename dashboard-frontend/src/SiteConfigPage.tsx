import React, { useEffect, useState } from "react";
import Sidebar from "./Elements/HubSidebar";
import api from "./services/api";
import { useConfig, type AppConfig } from "./ConfigContext";


type Config = {
  Demo1Start: string;
  Demo1End: string;
  Demo2Start: string;
  Demo2End: string;
  Demo3Start: string;
  Demo3End: string;
  Demo4Start: string;
  Demo4End: string;
  ExpectedCommitsWeekly: number;
  ExpectedMergesDemo: number;
  GITLAB_GROUP_NAME: string;
};

export default function SiteConfigPage() {
  const configCtx = useConfig();
  const config = configCtx?.config ?? null;
  const updateConfig = configCtx?.updateConfig;
  const contextLoading = configCtx?.loading ?? true; 

  const [form, setForm] = useState<AppConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const handleDateChange = (key: keyof Config, value: string) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
    setSuccess(false);
  };

const handleSave = async () => {
  if (!form) return;
  setSaving(true);
  try {
    await updateConfig?.(form);
    setSuccess(true);
  } catch {
    setError("Failed to save config");
  } finally {
    setSaving(false);
  }
};

  const demos = [
    { label: "Demo 1", startKey: "Demo1Start", endKey: "Demo1End" },
    { label: "Demo 2", startKey: "Demo2Start", endKey: "Demo2End" },
    { label: "Demo 3", startKey: "Demo3Start", endKey: "Demo3End" },
    { label: "Demo 4", startKey: "Demo4Start", endKey: "Demo4End" },
  ] as const;

  return (
    <div style={styles.root}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.content}>
          <div style={styles.container}>

            <div style={styles.header}>
              <h1 style={styles.title}>Site Configuration</h1>
              <p style={styles.subtitle}>Manage demo date ranges and global settings</p>
            </div>

            {error && (
              <div style={styles.errorMessage}>⚠️ {error}</div>
            )}
            {success && (
              <div style={styles.successMessage}>Configuration saved successfully</div>
            )}
            {contextLoading || !form ? (
            <div style={styles.loadingMessage}>Loading config...</div>
            ) : (
                  <>
                {/* Demo Date Ranges */}
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h2 style={styles.cardTitle}>Demo Date Ranges</h2>
                    <p style={styles.cardSubtitle}>Set the start and end dates for each demo period</p>
                  </div>
                  <div style={styles.cardBody}>
                    <div style={styles.demoGrid}>
                      {demos.map(({ label, startKey, endKey }) => (
                        <div key={label} style={styles.demoCard}>
                          <div style={styles.demoLabel}>{label}</div>
                          <div style={styles.dateRow}>
                            <div style={styles.fieldGroup}>
                              <label style={styles.label}>Start</label>
                              <input
                                type="date"
                                value={form[startKey]}
                                onChange={(e) => handleDateChange(startKey, e.target.value)}
                                style={styles.dateInput}
                              />
                            </div>
                            <div style={styles.dateSep}>→</div>
                            <div style={styles.fieldGroup}>
                              <label style={styles.label}>End</label>
                              <input
                                type="date"
                                value={form[endKey]}
                                onChange={(e) => handleDateChange(endKey, e.target.value)}
                                style={styles.dateInput}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* General Settings */}
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h2 style={styles.cardTitle}>General Settings</h2>
                    <p style={styles.cardSubtitle}>Global parameters for commit analysis</p>
                  </div>
                    <div style={styles.cardBody}>
                        <div style={styles.fieldRow}>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Expected Merges Per Demo</label>
                            <input
                            type="number"
                            min={0}
                            value={form.ExpectedMergesDemo}
                            onChange={(e) => handleDateChange("ExpectedMergesDemo", e.target.value as any)}
                            style={styles.textInput}
                            />
                        </div>
                        </div>
                    </div>
                  <div style={styles.cardBody}>
                    <div style={styles.fieldRow}>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Expected Commits (Weekly)</label>
                        <input
                          type="number"
                          min={0}
                          value={form.ExpectedCommitsWeekly}
                          onChange={(e) => handleDateChange("ExpectedCommitsWeekly", e.target.value as any)}
                          style={styles.textInput}
                        />
                      </div>
                      <div style={{ ...styles.fieldGroup, flex: 2 }}>
                        <label style={styles.label}>GitLab Group Name</label>
                        <input
                          type="text"
                          value={form.GITLAB_GROUP_NAME}
                          onChange={(e) => handleDateChange("GITLAB_GROUP_NAME", e.target.value)}
                          style={styles.textInput}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={styles.actions}>
                  <button
                    style={{
                      ...styles.button,
                      opacity: saving ? 0.6 : 1,
                      pointerEvents: saving ? "none" : "auto",
                    }}
                    onClick={handleSave}
                  >
                    {saving ? "Saving..." : "Save Configuration"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "row", height: "100vh", width: "100vw", overflow: "hidden", backgroundColor: "#f0f0f0" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  content: { flex: 1, overflowY: "auto", padding: "16px" },
  container: { width: "100%", maxWidth: "900px" },
  header: { backgroundColor: "white", padding: "16px", borderRadius: "4px", marginBottom: "16px", border: "1px solid #e0e0e0", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  title: { margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600", color: "#333" },
  subtitle: { margin: 0, fontSize: "13px", color: "#666" },
  card: { backgroundColor: "white", border: "1px solid #d0d0d0", borderRadius: "4px", marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" },
  cardHeader: { padding: "12px 16px", borderBottom: "1px solid #d0d0d0" },
  cardTitle: { margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600", color: "#333" },
  cardSubtitle: { margin: 0, fontSize: "12px", color: "#666" },
  cardBody: { padding: "16px" },
  demoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  demoCard: { border: "1px solid #e0e0e0", borderRadius: "4px", padding: "12px", backgroundColor: "#fafafa" },
  demoLabel: { fontSize: "12px", fontWeight: "600", color: "#822433", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px", fontFamily: "monospace" },
  dateRow: { display: "flex", alignItems: "flex-end", gap: "8px" },
  dateSep: { color: "#999", fontSize: "16px", paddingBottom: "6px" },
  fieldRow: { display: "flex", gap: "16px", alignItems: "flex-end" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  label: { fontSize: "11px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "0.4px", fontFamily: "monospace" },
  dateInput: { height: "32px", padding: "0 8px", border: "1px solid #d0d0d0", borderRadius: "4px", fontFamily: "monospace", fontSize: "13px", color: "#333", backgroundColor: "white" },
  textInput: { height: "32px", padding: "0 8px", border: "1px solid #d0d0d0", borderRadius: "4px", fontFamily: "monospace", fontSize: "13px", color: "#333", backgroundColor: "white" },
  actions: { display: "flex", justifyContent: "flex-end" },
  button: { display: "inline-flex", alignItems: "center", gap: "8px", height: "36px", padding: "0 16px", backgroundColor: "#822433", color: "white", border: "none", borderRadius: "4px", fontFamily: "monospace", fontSize: "13px", cursor: "pointer" },
  errorMessage: { backgroundColor: "#ffebee", border: "1px solid #ef5350", borderRadius: "4px", padding: "12px 16px", marginBottom: "16px", color: "#c62828", fontSize: "12px" },
  successMessage: { backgroundColor: "#e8f5e9", border: "1px solid #66bb6a", borderRadius: "4px", padding: "12px 16px", marginBottom: "16px", color: "#2e7d32", fontSize: "12px" },
  loadingMessage: { backgroundColor: "#e3f2fd", border: "1px solid #42a5f5", borderRadius: "4px", padding: "12px 16px", color: "#1565c0", fontSize: "12px" },
};