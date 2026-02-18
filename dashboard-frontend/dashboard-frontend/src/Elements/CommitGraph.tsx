import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Dot,
} from "recharts";

const data = [
  { time: "00:00", student1: 42, student2: 28 },
  { time: "02:00", student1: 22, student2: 35 },
  { time: "04:00", student1: 34, student2: 32 },
  { time: "06:00", student1: 55, student2: 30 },
  { time: "08:00", student1: 30, student2: 28 },
  { time: "10:00", student1: 40, student2: 50 },
  { time: "12:00", student1: 20, student2: 32 },
  { time: "14:00", student1: 28, student2: 22 },
];

const CommitLineChart: React.FC = () => {
  return (
    <div style={styles.wrapper}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid stroke="#e0e0e0" />
          <XAxis
            dataKey="time"
            tick={{ fontFamily: "'Courier New', monospace", fontSize: 12 }}
          />
          <YAxis
            tick={{ fontFamily: "'Courier New', monospace", fontSize: 12 }}
          />
          <Tooltip />
          <Legend
            formatter={(value) =>
              value === "student1" ? "Student 1" : "Student 2"
            }
            wrapperStyle={{ fontFamily: "'Courier New', monospace" }}
          />
          <Line
            type="linear"
            dataKey="student1"
            name="student1"
            stroke="#CC0000"
            strokeWidth={3}
            dot={<Dot r={6} fill="#CC0000" stroke="#CC0000" />}
            activeDot={{ r: 8 }}
          />
          <Line
            type="linear"
            dataKey="student2"
            name="student2"
            stroke="#FDCA2F"
            strokeWidth={3}
            dot={<Dot r={6} fill="#FDCA2F" stroke="#FDCA2F" />}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    backgroundColor: "white",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "12px",
    margin: "12px",
  },
};

export default CommitLineChart;