import React from "react";

type SquareProps = {
  TA_Group: string;
  id: number;
};

const Square: React.FC<SquareProps> = ({ TA_Group, id }) => {
  return (
    <div style={styles.square}>
      <button onClick={() => alert(`${TA_Group}_${id}`)}>
        {`${TA_Group}_${id}`}
      </button>
    </div>
  );
};


const styles = {
  square: {
    padding: "5px",
    width: "150px",
    display: "flex",
    flexDirection: "column" as const,
  },
};

export default Square;
