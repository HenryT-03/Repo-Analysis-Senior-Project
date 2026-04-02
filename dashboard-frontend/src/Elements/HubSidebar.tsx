import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CARDINAL = "#822433";

const NAV_ITEMS = ["Dashboard", "Calendar", "Inbox", "Help", "Account"];

const HubSidebar: React.FC = () => {
  const [active, setActive] = useState("Dashboard");
  const navigate = useNavigate();

  const handleNav = (item: string) => {
    setActive(item);
    if (item === "Dashboard") {
      navigate("/");
    }
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.avatarSection}>
        <div style={styles.avatar} />
        <div style={styles.userInfo}>
          <div style={styles.userName}>Instructor</div>
          <div style={styles.userClass}>[class]</div>
        </div>
      </div>
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item;
          return (
            <div
              key={item}
              style={{
                ...styles.navRow,
                ...(isActive ? styles.activeRow : {}),
              }}
              onClick={() => handleNav(item)}
            >
              <span
                style={{
                  ...styles.navLabel,
                  ...(isActive ? styles.activeLabel : {}),
                }}
              >
                {item}
              </span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: "220px",
    minWidth: "220px",
    backgroundColor: CARDINAL,
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    minHeight: "100vh",
  },
  avatarSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 12px 16px",
  },
  avatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "white",
    marginBottom: "10px",
  },
  userInfo: {
    textAlign: "center",
    fontFamily: "'Courier New', Courier, monospace",
  },
  userName: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    letterSpacing: "2px",
  },
  userClass: {
    fontSize: "0.95rem",
    letterSpacing: "2px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    marginTop: "8px",
  },
  navRow: {
    display: "flex",
    alignItems: "center",
    padding: "12px 24px",
    cursor: "pointer",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "1rem",
    color: "white",
    userSelect: "none",
    borderBottom: `1px solid rgba(255,255,255,0.08)`,
  },
  activeRow: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  navLabel: {
    letterSpacing: "1px",
  },
  activeLabel: {
    fontWeight: "bold",
  },
};

export default HubSidebar;
