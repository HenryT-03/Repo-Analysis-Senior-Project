import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GroupHub from './GroupHub';
import Dashboard from './Dashboard';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GroupHub />} />
        <Route path="/group/:groupId" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
