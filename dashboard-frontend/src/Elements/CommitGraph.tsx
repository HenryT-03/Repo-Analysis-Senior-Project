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

const defaultData = [
  { time: "00:00", student1: 42, student2: 28 },
  { time: "02:00", student1: 22, student2: 35 },
  { time: "04:00", student1: 34, student2: 32 },
  { time: "06:00", student1: 55, student2: 30 },
  { time: "08:00", student1: 30, student2: 28 },
  { time: "10:00", student1: 40, student2: 50 },
  { time: "12:00", student1: 20, student2: 32 },
  { time: "14:00", student1: 28, student2: 22 },
];

interface CommitGraphProps {
  data?: Array<Record<string, any>>;
  loading?: boolean;
}

const CommitGraph: React.FC<CommitGraphProps> = ({ data = defaultData, loading = false }) => {
  const chartData = data && data.length > 0 ? data : defaultData;
  
  // Generate line colors dynamically based on available data keys
  const getDataKeys = () => {
    if (!chartData || chartData.length === 0) return [];
    const keys = Object.keys(chartData[0]).filter(key => key !== 'time');
    return keys;
  };

  const dataKeys = getDataKeys();
  const colors = ['#CC0000', '#FDCA2F', '#0066CC', '#00CC66', '#FF9900', '#9900FF'];

  return (
    <div style={styles.wrapper}>
      {loading ? (
        <div style={styles.loadingPlaceholder}>Loading commit data...</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={chartData}
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
              wrapperStyle={{ fontFamily: "'Courier New', monospace" }}
            />
            {dataKeys.map((key, idx) => (
              <Line
                key={key}
                type="linear"
                dataKey={key}
                name={key}
                stroke={colors[idx % colors.length]}
                strokeWidth={3}
                dot={<Dot r={6} fill={colors[idx % colors.length]} stroke={colors[idx % colors.length]} />}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
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
  loadingPlaceholder: {
    width: "100%",
    height: "280px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    color: "#999",
  },
};

export default CommitGraph;