import React from "react";
import { useNavigate } from "react-router-dom";

const CARDINAL = "#822433";

const QUALITY_COLOR: Record<"excellent" | "good" | "poor", string> = {
  excellent: "#2e7d32",
  good: "#f9a825",
  poor: "#c62828",
};

type Student = {
  name: string;
  quality: "excellent" | "good" | "poor";
};

type SquareProps = {
  name: string;
  id: number;
  totalCommits: number;
  students: Student[];
};

const GroupCard: React.FC<SquareProps> = ({ name, id, totalCommits, students }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      style={{
        ...styles.card,
        ...(hovered ? styles.cardHover : {}),
      }}
      onClick={() => navigate(`/group/${id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <span style={styles.label}>{name}</span>
      <div style={styles.divider} />

      {/* Two-column body */}
      <div style={styles.body}>
        {/* Left: commits */}
        <div style={styles.commitCol}>
          <span style={styles.metaLabel}>Commits</span>
          <span style={styles.commitCount}>{totalCommits}</span>
        </div>

        {/* Vertical separator */}
        <div style={styles.vDivider} />

        {/* Right: students */}
        <div style={styles.studentCol}>
          <span style={styles.metaLabel}>Students</span>
          {students.map((s) => (
            <div key={s.name} style={styles.studentRow}>
              <span
                style={{
                  ...styles.dot,
                  backgroundColor: QUALITY_COLOR[s.quality],
                }}
              />
              <span style={styles.studentName}>{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: "#f0f0f0",
    border: `2px solid ${CARDINAL}`,
    borderRadius: "12px",
    cursor: "pointer",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    transition: "box-shadow 0.15s, background-color 0.15s",
  },
  cardHover: {
    backgroundColor: "#e8d8dc",
    boxShadow: `0 4px 16px rgba(130,36,51,0.18)`,
  },
  label: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: CARDINAL,
  },
  divider: {
    borderTop: `1px solid rgba(130,36,51,0.2)`,
  },
  body: {
    display: "flex",
    flexDirection: "row",
    gap: "12px",
    alignItems: "flex-start",
  },
  commitCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "60px",
    gap: "4px",
  },
  commitCount: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "1.6rem",
    fontWeight: "bold",
    color: CARDINAL,
    lineHeight: 1,
  },
  metaLabel: {
    fontFamily: "'Courier New', Courier, monospace",
    fontWeight: "bold",
    fontSize: "0.68rem",
    color: "#777",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  vDivider: {
    width: "1px",
    alignSelf: "stretch",
    backgroundColor: "rgba(130,36,51,0.2)",
    flexShrink: 0,
  },
  studentCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  studentRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  studentName: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.78rem",
    color: "#333",
    lineHeight: "1.4",
  },
};

export default GroupCard;
