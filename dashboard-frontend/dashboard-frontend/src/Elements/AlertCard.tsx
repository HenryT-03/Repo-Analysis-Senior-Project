import React, { useState } from "react";

const CARDINAL = "#822433";

type Alert = {
  type: "Warning" | "Information";
  message: string;
  student?: string;
};

const defaultAlerts: Alert[] = [
  {
    type: "Warning",
    message: "Potential AI Generated content detected.",
    student: "Student 3",
  },
  {
    type: "Information",
    message: "Student 3's commit history flagged as potentially AI generated.",
  },
];

const AlertCard: React.FC = () => {
  const [alerts] = useState<Alert[]>(defaultAlerts);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || alerts.length === 0) return null;

  return (
    <div style={styles.card}>
      <div style={styles.messageArea}>
        {alerts.map((a, i) => (
          <div key={i} style={styles.alertLine}>
            <span style={styles.alertType}>{a.type}: </span>
            <span>{a.message}</span>
          </div>
        ))}
      </div>
      <div style={styles.actions}>
        <button style={styles.ignoreBtn} onClick={() => setDismissed(true)}>
          Ignore
        </button>
        <button
          style={styles.goBtn}
          onClick={() => alert("Navigating to Student 3...")}
        >
          Go to Student 3
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    border: `2px solid ${CARDINAL}`,
    borderRadius: "4px",
    padding: "12px 16px",
    backgroundColor: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "16px",
    margin: "12px",
  },
  messageArea: {
    flex: 1,
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.95rem",
    color: CARDINAL,
  },
  alertLine: {
    marginBottom: "4px",
  },
  alertType: {
    fontWeight: "bold",
  },
  actions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  ignoreBtn: {
    padding: "6px 16px",
    border: `2px solid ${CARDINAL}`,
    borderRadius: "3px",
    backgroundColor: "white",
    color: CARDINAL,
    cursor: "pointer",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.9rem",
  },
  goBtn: {
    padding: "6px 16px",
    border: "none",
    borderRadius: "3px",
    backgroundColor: CARDINAL,
    color: "white",
    cursor: "pointer",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.9rem",
  },
};

export default AlertCard;
