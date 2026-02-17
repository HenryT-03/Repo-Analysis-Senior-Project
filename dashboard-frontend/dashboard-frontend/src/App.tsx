import { useState } from 'react'
import './App.css'
import Navbar from "./Elements/GroupviewNavbar";
import SquareGrid from "./Elements/GroupviewSquareGrid";

const App: React.FC = () => {
  const [squareCount, setSquareCount] = useState(9);

  return (
    <>
      <Navbar
        onAdd={() => setSquareCount((prev) => prev + 1)}
        onReset={() => setSquareCount(0)}
      />
      <SquareGrid count={squareCount} />
    </>
  );
};

fetch("http://localhost:5000/api/hello")
  .then(res => res.json())
  .then(data => console.log(data.message));
  
fetch("http://localhost:5000/api/add", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ a: 2, b: 3 })
})
  .then(res => res.json())
  .then(data => console.log(data.result));

export default App
