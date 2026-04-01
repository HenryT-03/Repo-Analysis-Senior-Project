import React from "react";
import HubSidebar from "./Elements/HubSidebar";
import TopBar from "./Elements/TopBar";
import SquareGrid from "./Elements/GroupviewSquareGrid";

const GROUPS = [
  { id: 1, name: "Group 1", totalCommits: 142, students: [
    { name: "alicej",    quality: "excellent" as const },
    { name: "bsmith",    quality: "good"      as const },
    { name: "cwhite",    quality: "excellent" as const },
    { name: "dlee",      quality: "poor"      as const },
  ]},
  { id: 2, name: "Group 2", totalCommits: 98, students: [
    { name: "emartinez", quality: "good"      as const },
    { name: "fbrown",    quality: "poor"      as const },
    { name: "gkim",      quality: "excellent" as const },
  ]},
  { id: 3, name: "Group 3", totalCommits: 211, students: [
    { name: "hdavis",    quality: "excellent" as const },
    { name: "iwilson",   quality: "excellent" as const },
    { name: "jtaylor",   quality: "good"      as const },
    { name: "kmoore",    quality: "good"      as const },
  ]},
  { id: 4, name: "Group 4", totalCommits: 75, students: [
    { name: "landerson", quality: "poor"      as const },
    { name: "mthomas",   quality: "good"      as const },
    { name: "njackson",  quality: "poor"      as const },
  ]},
  { id: 5, name: "Group 5", totalCommits: 163, students: [
    { name: "oharris",   quality: "excellent" as const },
    { name: "pmartin",   quality: "good"      as const },
    { name: "qthompson", quality: "excellent" as const },
    { name: "rgarcia",   quality: "good"      as const },
  ]},
  { id: 6, name: "Group 6", totalCommits: 54, students: [
    { name: "smartinez", quality: "poor"      as const },
    { name: "trobinson", quality: "poor"      as const },
    { name: "uclark",    quality: "good"      as const },
  ]},
  { id: 7, name: "Group 7", totalCommits: 189, students: [
    { name: "vrodriguez", quality: "excellent" as const },
    { name: "wlewis",    quality: "good"      as const },
    { name: "xlee",      quality: "excellent" as const },
    { name: "ywalker",   quality: "good"      as const },
  ]},
  { id: 8, name: "Group 8", totalCommits: 120, students: [
    { name: "zhall",     quality: "excellent" as const },
    { name: "aallen",    quality: "good"      as const },
    { name: "byoung",    quality: "poor"      as const },
  ]},
  { id: 9, name: "Group 9", totalCommits: 37, students: [
    { name: "chernandez", quality: "poor"     as const },
    { name: "dking",     quality: "poor"      as const },
    { name: "ewright",   quality: "good"      as const },
    { name: "fscott",    quality: "poor"      as const },
  ]},
];

const GroupHub: React.FC = () => {
  return (
    <div style={styles.root}>
      <HubSidebar />
      <div style={styles.main}>
        <TopBar />
        <div style={styles.content}>
          <SquareGrid groups={GROUPS} />
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "row",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    overflowY: "auto",
  },
};

export default GroupHub;
