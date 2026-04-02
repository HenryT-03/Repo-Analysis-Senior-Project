import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./Dashboard";
import TAOverallPage from "./TAOverallPage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ta" element={<TAOverallPage />} />
      </Routes>
    </Router>
  );
};

export default App;