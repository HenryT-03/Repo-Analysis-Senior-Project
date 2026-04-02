import React from "react";
import Square from "./GroupviewSquare";

type SquareGridProps = {
  count: number;
};

const SquareGrid: React.FC<SquareGridProps> = ({ count }) => {
  return (
    <div style={styles.container}>
      {Array.from({ length: count }, (_, i) => (
        <Square key={i} id={i + 1} TA_Group="MK"/>
      ))}
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "12px",
    padding: "72px 12px 12px",
  },
};



export default SquareGrid;
