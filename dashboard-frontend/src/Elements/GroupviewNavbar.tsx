import React from "react";

type NavbarProps = {
  onAdd?: () => void;
  onReset?: () => void;
};

const Navbar: React.FC<NavbarProps> = ({ onAdd, onReset }) => {
  return (
    <nav style={styles.navbar}>
      <h3 style={styles.title}>COMS 309 Dashboard</h3>
      <div style={styles.buttons}>
        <button onClick={onAdd}>Other Button?</button>
        <button onClick={onReset}>Log Out</button>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100vw",
    height: "60px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 16px",
    backgroundColor: "#333",
    color: "white",
    boxSizing: "border-box" as const,
  },
  title: {
    margin: 0,
  },
  buttons: {
    display: "flex",
    gap: "10px",
  },
};

export default Navbar;
