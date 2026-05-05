import React from "react";
import GroupCard from "./GroupviewSquare";
import { type Score, scoreToColor, getAverageScore } from '../scoreUtils';

type Student = {
  name: string;
  commitScore: Score;
  mergeScore: Score;
  commitCount: number;  // ADD
};

type Group = {
  id: number;
  name: string;
  totalCommits: number;
  students: Student[];
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
