import React from "react";
import GroupCard from "./GroupviewSquare";

type Student = {
  name: string;
  quality: "excellent" | "good" | "poor";
};

type Group = {
  id: number;
  name: string;
  totalCommits: number;
  students: Student[];
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