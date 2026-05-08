import React from "react";
import { useNavigate } from "react-router-dom";
import type { Score } from "./scoring";

const CARDINAL = "#822433";

type Student = {
  name: string;
};

type SquareProps = {
  name: string;
  id: number;
  totalCommits: number;
  students: Student[];
  teamScore: Score | null;
  onClick?: () => void;
};

const GroupCard: React.FC<SquareProps> = ({ name, id, totalCommits, students, teamScore }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      style={{
        ...styles.card,
        borderColor: teamScore ? teamScore.color : CARDINAL,
        ...(hovered ? styles.cardHover : {}),
      }}
      onClick={() => navigate(`/group/${id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header: name + team score badge */}
      <div style={styles.titleRow}>
        <span style={styles.label}>{name}</span>
        {teamScore ? (
          <span style={{ ...styles.scoreBadge, backgroundColor: teamScore.color }}>
            {teamScore.label} · {teamScore.points}
          </span>
        ) : (
          <span style={{ ...styles.scoreBadge, backgroundColor: "#bbb" }}>
            No data
          </span>
        )}
      </div>

      <div style={styles.divider} />

      {/* Two-column body */}
      <div style={styles.body}>
        {/* Left: commits */}
        <div style={styles.commitCol}>
          <span style={styles.metaLabel}>Commits</span>
          <span style={{ ...styles.commitCount, color: teamScore ? teamScore.color : CARDINAL }}>
            {totalCommits}
          </span>
        </div>

        {/* Vertical separator */}
        <div style={styles.vDivider} />

        {/* Right: students (names only — score is shown at team level) */}
        <div style={styles.studentCol}>
          <span style={styles.metaLabel}>Students</span>
          {students.map((s) => (
            <div key={s.name} style={styles.studentRow}>
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
    transition: "box-shadow 0.15s, background-color 0.15s, border-color 0.15s",
  },
  cardHover: {
    backgroundColor: "#e8d8dc",
    boxShadow: `0 4px 16px rgba(130,36,51,0.18)`,
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },
  label: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: CARDINAL,
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  scoreBadge: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.7rem",
    fontWeight: "bold",
    color: "white",
    padding: "2px 8px",
    borderRadius: "999px",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
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
  },
  studentName: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.78rem",
    color: "#333",
    lineHeight: "1.4",
  },
};

export default GroupCard;