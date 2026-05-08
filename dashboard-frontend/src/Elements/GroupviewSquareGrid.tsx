import React from "react";
import GroupCard from "./GroupviewSquare";
import type { Score } from "./scoring";

type Student = {
  name: string;
};

type Group = {
  id: number;
  name: string;
  totalCommits: number;
  students: Student[];
  teamScore: Score | null;
  onClick?: () => void;
};

type SquareGridProps = {
  groups: Group[];
};

const SquareGrid: React.FC<SquareGridProps> = ({ groups }) => {
  return (
    <div style={styles.container}>
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          id={group.id}
          name={group.name}
          totalCommits={group.totalCommits}
          students={group.students}
          teamScore={group.teamScore}
          onClick={group.onClick}
        />
      ))}
    </div>
  );
};

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    padding: "16px",
  },
};

export default SquareGrid;