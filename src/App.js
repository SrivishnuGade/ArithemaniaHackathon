import React from "react";
import TigerReserveDashboard from "./TigerReserveDashboard";
import './App.css';

import { Routes, Route } from 'react-router-dom';
import ThreeScene from './ThreeJSView/ThreeScene';

function App() {
  return (
    <Routes>
      <Route path="/" element={<TigerReserveDashboard />} />
      <Route path="/3d/:reserveName" element={<ThreeScene />} />
    </Routes>
  );
}

export default App;
