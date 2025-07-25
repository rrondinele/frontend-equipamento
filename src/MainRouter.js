import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import OFS_Materiais from './OFS_Materiais';

function MainRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/materiais" element={<OFS_Materiais />} />
      </Routes>
    </Router>
  );
}

export default MainRouter;