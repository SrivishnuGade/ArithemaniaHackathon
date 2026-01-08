import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { init } from './scenes/mainScene';
import { reserves } from '../data/reserves';

const ThreeScene = () => {
  const containerRef = useRef(null);
  const { reserveName } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ tigers: 0, deers: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Find the active reserve data
    const activeReserve = reserves.find(r => r.name === reserveName) || {};

    // Initialize the scene with the container, reserve name, reserve data, and a callback for stats
    const dispose = init(containerRef.current, reserveName, activeReserve, (newStats) => {
      setStats(newStats);
    });

    return () => {
      if (dispose) dispose();
    };
  }, [reserveName]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* 3D Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* UI Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
        }}
      >
        <div style={{ marginBottom: '10px' }}>
          <p style={{ margin: '5px 0' }}>Tigers: <strong>{stats.tigers}</strong></p>
          <p style={{ margin: '5px 0' }}>Deers: <strong>{stats.deers}</strong></p>
        </div>

        <div>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>NDVI Legend</h4>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
            <div style={{ width: '20px', height: '20px', marginRight: '5px', background: 'rgb(0, 0, 0)' }}></div>
            <span>Low NDVI (0.0)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
            <div style={{ width: '20px', height: '20px', marginRight: '5px', background: 'rgb(0, 128, 0)' }}></div>
            <span>Medium NDVI (0.5)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
            <div style={{ width: '20px', height: '20px', marginRight: '5px', background: 'rgb(0, 255, 0)' }}></div>
            <span>High NDVI (1.0)</span>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          padding: '8px 16px',
          background: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 1000,
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default ThreeScene;
