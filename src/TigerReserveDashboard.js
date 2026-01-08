import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LVSimulation from './components/LVSimulation';
import './TigerReserveDashboard.css';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { reserves } from './data/reserves';

const TigerReserveDashboard = () => {
  const [activeReserve, setActiveReserve] = useState('Bandipur');
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [simulationData, setSimulationData] = useState([]);
  const mapRef = useRef(null);
  const navigate = useNavigate();


  // Lotka-Volterra simulation parameters with more realistic values
  const alpha = 0.4; // prey growth rate (reduced to slow down reproduction cycles)
  const beta = 0.008; // predation rate (reduced to slow down decline cycles)
  const delta = 0.2; // predator death rate (increased to keep predator population lower)
  const gamma = 0.0005; // predator growth rate (reduced significantly to ensure prey > predator)
  const r = 0.1; // NDVI growth rate (reduced to reflect slower vegetation growth)
  const K = 0.8; // NDVI carrying capacity (reduced to reflect typical forest coverage)
  const c = 0.05; // vegetation consumption rate by prey (reduced to reflect lower impact)

  // Generate simulation data using modified Lotka-Volterra equations
  const generateSimulationData = (reserve) => {
    // ... (your generateSimulationData function)
    const tigerDensity = typeof reserve.tigerDensity === 'number' ? reserve.tigerDensity : 10;
    const data = [];
    const timeSteps = 100;
    const dt = 1; // Time step in months

    // Initial conditions based on reserve characteristics
    // Scale initial populations based on reserve area and tiger density
    const areaFactor = reserve.totalArea / 1000; // Normalize by 1000 sq km
    let prey = Math.min(5000, Math.max(500, areaFactor * 400)); // Base prey population (start lower to match new equilibrium)
    let predator = Math.min(100, Math.max(10, tigerDensity * 2)); // Base tiger population
    let ndvi = Math.min(0.8, Math.max(0.3, tigerDensity / 50)); // Initial vegetation index

    // Adjust initial conditions based on reserve characteristics
    if (reserve.coreArea > 1000) {
      prey *= 1.2; // Larger core area supports more prey
    }
    if (reserve.bufferArea > 500) {
      prey *= 1.1; // Larger buffer area provides additional habitat
    }

    for (let t = 0; t < timeSteps; t++) {
      // Modified Lotka-Volterra equations with density dependence
      const preyGrowth = alpha * prey * (1 - prey / (10000 * areaFactor)); // Increased carrying capacity to reduce damping
      const preyDeath = beta * prey * predator;
      const predatorGrowth = gamma * predator * prey;
      const predatorDeath = delta * predator;

      // NDVI logistic growth with seasonal variation and consumption
      const seasonalFactor = 0.1 * Math.sin(2 * Math.PI * t / 12); // Seasonal variation
      const ndviGrowth = r * ndvi * (1 - ndvi / K) + seasonalFactor;
      const ndviConsumption = c * ndvi * prey;

      // Update populations with improved stability
      prey += (preyGrowth - preyDeath) * dt;
      predator += (predatorGrowth - predatorDeath) * dt;
      ndvi += (ndviGrowth - ndviConsumption) * dt;

      // Ensure values stay within reasonable bounds
      prey = Math.max(100, prey);
      predator = Math.max(1, predator);
      ndvi = Math.max(0.2, Math.min(1, ndvi));

      // Add some stochastic variation
      prey *= (1 + (Math.random() - 0.5) * 0.1);
      predator *= (1 + (Math.random() - 0.5) * 0.05);
      ndvi *= (1 + (Math.random() - 0.5) * 0.02);

      data.push({
        time: t * dt,
        prey: Math.round(prey),
        predator: Math.round(predator),
        ndvi: Number(ndvi.toFixed(2)),
      });
    }

    return data;
  };

  // Generate spatial distribution data
  const generateSpatialData = (reserve) => {
    // ... (your generateSpatialData function)
    const tigerDensity = typeof reserve.tigerDensity === 'number' ? reserve.tigerDensity : 10;
    const areaFactor = reserve.totalArea / 1000;

    // Generate NDVI distribution (0-1 scale)
    const ndviData = {
      high: Math.min(0.8, Math.max(0.6, tigerDensity / 50)),
      medium: Math.min(0.6, Math.max(0.4, tigerDensity / 70)),
      low: Math.min(0.4, Math.max(0.2, tigerDensity / 100)),
    };

    // Generate prey density (per sq km)
    const basePreyDensity = Math.min(50, Math.max(20, areaFactor * 10));
    const preyData = {
      high: Math.min(60, Math.max(40, basePreyDensity * 1.2)),
      medium: Math.min(40, Math.max(20, basePreyDensity)),
      low: Math.min(20, Math.max(10, basePreyDensity * 0.8)),
    };

    // Generate predator density (per 100 sq km)
    const predatorData = {
      high: Math.min(40, Math.max(20, tigerDensity * 1.2)),
      medium: Math.min(20, Math.max(10, tigerDensity)),
      low: Math.min(10, Math.max(5, tigerDensity * 0.8)),
    };

    return {
      ndvi: ndviData,
      prey: preyData,
      predator: predatorData,
    };
  };

  // Update simulation data when active reserve changes
  useEffect(() => {
    const activeReserveInfo = reserves.find((r) => r.name === activeReserve);
    const newData = generateSimulationData(activeReserveInfo);
    setSimulationData(newData);
  }, [activeReserve]);

  const activeReserveInfo = reserves.find((r) => r.name === activeReserve);
  const spatialData = generateSpatialData(activeReserveInfo);

  // Ecological insights based on reserve characteristics
  const getReserveInsights = (reserve) => {
    // ... (your getReserveInsights function)
    const tigerDensity = typeof reserve.tigerDensity === 'number' ? reserve.tigerDensity : 'Undetermined';
    const coreToBufferRatio = reserve.coreArea / (reserve.bufferArea || 1);

    let insights = {
      description: `${reserve.name} Tiger Reserve is located in ${reserve.region} with a total area of ${reserve.totalArea} sq km.`,
      status: `Tiger density: ${tigerDensity} per 100 sq km. Core area: ${reserve.coreArea} sq km. Buffer zone: ${reserve.bufferArea} sq km.`,
      insights: [],
    };

    // Generate insights based on reserve data
    if (tigerDensity > 30) {
      insights.insights.push('High tiger density suggests excellent prey base and habitat management.');
    } else if (tigerDensity < 10) {
      insights.insights.push('Lower tiger density indicates potential for habitat improvement and anti-poaching measures.');
    }

    if (coreToBufferRatio > 1.5) {
      insights.insights.push('Large core area relative to buffer zone may provide better protection for tigers.');
    } else if (coreToBufferRatio < 0.5) {
      insights.insights.push('Small core area relative to buffer zone may increase human-wildlife conflict.');
    }

    if (reserve.totalArea > 2000) {
      insights.insights.push('Large reserve area supports greater biodiversity and ecosystem resilience.');
    }

    // Add reserve-specific notes
    insights.insights.push(reserve.notes);

    return insights;
  };

  const reserveInsights = getReserveInsights(activeReserveInfo);

  // Generate conservation recommendations based on reserve characteristics
  const generateConservationRecommendations = (reserve, spatialData) => {
    // ... (your generateConservationRecommendations function)
    const tigerDensity = typeof reserve.tigerDensity === 'number' ? reserve.tigerDensity : 10;
    const coreToBufferRatio = reserve.coreArea / (reserve.bufferArea || 1);
    const recommendations = [];

    // Habitat Management Recommendations
    if (spatialData.ndvi.low < 0.4) {
      recommendations.push({
        priority: 'high',
        text: 'Implement habitat restoration programs to improve vegetation cover',
      });
    }
    if (reserve.coreArea < 500) {
      recommendations.push({
        priority: 'high',
        text: 'Expand core area to provide better protection for tiger populations',
      });
    }

    // Prey Base Management
    if (spatialData.prey.low < 15) {
      recommendations.push({
        priority: 'high',
        text: 'Enhance prey base through habitat improvement and water management',
      });
    }
    if (spatialData.prey.medium < 25) {
      recommendations.push({
        priority: 'medium',
        text: 'Monitor and manage prey population dynamics',
      });
    }

    // Tiger Population Management
    if (tigerDensity < 10) {
      recommendations.push({
        priority: 'high',
        text: 'Strengthen anti-poaching measures and habitat protection',
      });
    }
    if (tigerDensity > 40) {
      recommendations.push({
        priority: 'medium',
        text: 'Consider translocation to maintain optimal tiger density',
      });
    }

    // Buffer Zone Management
    if (coreToBufferRatio < 0.5) {
      recommendations.push({
        priority: 'high',
        text: 'Improve buffer zone management to reduce human-wildlife conflict',
      });
    }
    if (reserve.bufferArea < 300) {
      recommendations.push({
        priority: 'medium',
        text: 'Expand buffer zone to provide better habitat connectivity',
      });
    }

    // Connectivity Recommendations
    if (reserve.notes.includes('contiguous') || reserve.notes.includes('connects')) {
      recommendations.push({
        priority: 'medium',
        text: 'Maintain and enhance corridor connectivity with neighboring reserves',
      });
    }

    // Area-specific Recommendations
    if (reserve.totalArea > 2000) {
      recommendations.push({
        priority: 'low',
        text: 'Implement zone-based management for better resource allocation',
      });
    }
    if (reserve.totalArea < 1000) {
      recommendations.push({
        priority: 'medium',
        text: 'Focus on habitat quality improvement within limited area',
      });
    }

    // Sort recommendations by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  };

  function MapZoom({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
      map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
  }

  const getReservePolygon = (reserve) => {
    if (!reserve) return [];

    const latMin = reserve.latMin;
    const lonMin = reserve.lonMin;
    const latMax = reserve.latMax;
    const lonMax = reserve.lonMax;

    return [
      [latMin, lonMin],
      [latMax, lonMin],
      [latMax, lonMax],
      [latMin, lonMax],
      [latMin, lonMin],
    ];
  };

  const reservePolygon = getReservePolygon(activeReserveInfo);

  return (
    <div className="dashboard-container">
      {/* Header with title */}
      <header className="dashboard-header">
        <h1 className="header-title">Tiger Reserve Eco-Balance Dashboard</h1>
        <p className="header-subtitle">Predator-Prey Dynamics & NDVI Analysis</p>
      </header>

      {/* Main content area */}
      <div className="main-content">
        {/* Side navigation with reserve tabs */}
        <div className="side-nav">
          {reserves.map((reserve) => (
            <div
              key={reserve.id}
              className={`reserve-tab ${activeReserve === reserve.name ? 'active' : ''}`}
              onClick={() => setActiveReserve(reserve.name)}
            >
              <img src={reserve.image} alt={reserve.name} className="reserve-image" />
              <p className={`reserve-name ${activeReserve === reserve.name ? 'text-green' : ''}`}>
                {reserve.name.length > 10 ? reserve.name.substring(0, 9) + '...' : reserve.name}
              </p>
            </div>
          ))}
        </div>

        {/* Main visualization area */}
        <div className="main-visualization">
          {/* Map and visualization area */}
          <div className="visualization-content">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">{activeReserve} Tiger Reserve</h2>
              <p className="text-gray-600 mb-4">{reserveInsights.description}</p>

              {/* Reserve status overview */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                <h3 className="font-semibold text-green-800">Current Status:</h3>
                <p className="text-gray-700">{reserveInsights.status}</p>
              </div>

              <div style={{ height: '300px', width: '100%' }}>
                <MapContainer
                  center={[
                    (activeReserveInfo.latMin + activeReserveInfo.latMax) / 2,
                    (activeReserveInfo.lonMin + activeReserveInfo.lonMax) / 2,
                  ]}
                  zoom={8}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Polygon
                    positions={reservePolygon}
                    color="red"
                    eventHandlers={{
                      click: () => navigate(`/3d/${activeReserve}`)
                    }}
                    style={{ cursor: 'pointer' }}
                  />

                  <MapZoom center={[
                    (activeReserveInfo.latMin + activeReserveInfo.latMax) / 2,
                    (activeReserveInfo.lonMin + activeReserveInfo.lonMax) / 2,
                  ]} zoom={8} />
                </MapContainer>
              </div>

              {/* NDVI and Population Trends */}
              <h3 className="text-lg font-bold text-gray-800 mb-3">Ecological Simulation</h3>
              <div className="chart-container">
                <LVSimulation reserveData={simulationData} width={800} height={400} />
              </div>

              {/* Spatial Distribution Visualization */}
              <h3 className="text-lg font-bold text-gray-800 mb-3">Spatial Distribution</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="insight-card">
                  <h4 className="text-sm font-semibold text-center mb-2">NDVI Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">High:</span>
                      <span className="font-semibold">{(spatialData.ndvi.high * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Medium:</span>
                      <span className="font-semibold">{(spatialData.ndvi.medium * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Low:</span>
                      <span className="font-semibold">{(spatialData.ndvi.low * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="insight-card">
                  <h4 className="text-sm font-semibold text-center mb-2">Prey Density (per sq km)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">High:</span>
                      <span className="font-semibold">{spatialData.prey.high.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Medium:</span>
                      <span className="font-semibold">{spatialData.prey.medium.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Low:</span>
                      <span className="font-semibold">{spatialData.prey.low.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="insight-card">
                  <h4 className="text-sm font-semibold text-center mb-2">Predator Density (per 100 sq km)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">High:</span>
                      <span className="font-semibold">{spatialData.predator.high.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Medium:</span>
                      <span className="font-semibold">{spatialData.predator.medium.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Low:</span>
                      <span className="font-semibold">{spatialData.predator.low.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">VR Simulation</h3>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                onClick={() => navigate(`/3d/${activeReserve}`)}
              >
                View Simulation
              </button>
            </div>
          </div>

          {/* Side panel for detailed insights */}
          {showSidePanel && (
            <div className="side-panel">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700">Ecological Insights</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowSidePanel(false)}>
                  ✕
                </button>
              </div>

              {/* Reserve key metrics */}
              <div className="insight-card">
                <h4 className="insight-title">Key Metrics</h4>
                <ul className="insight-list">
                  <li className="insight-item">
                    <span>Tiger Density:</span>
                    <span className="font-semibold">{activeReserveInfo.tigerDensity} per 100 sq km</span>
                  </li>
                  <li className="insight-item">
                    <span>Total Area:</span>
                    <span className="font-semibold">{activeReserveInfo.totalArea} sq km</span>
                  </li>
                  <li className="insight-item">
                    <span>Core Area:</span>
                    <span className="font-semibold">{activeReserveInfo.coreArea} sq km</span>
                  </li>
                  <li className="insight-item">
                    <span>Buffer Area:</span>
                    <span className="font-semibold">{activeReserveInfo.bufferArea} sq km</span>
                  </li>
                </ul>
              </div>

              {/* Ecological insights */}
              <div className="insight-card">
                <h4 className="insight-title">Notes</h4>
                <ul className="insight-list">
                  {reserveInsights.insights.map((insight, index) => (
                    <li key={index} className="insight-item">
                      <span className="text-green mr-2">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Conservation recommendations */}
              <div className="insight-card">
                <h4 className="insight-title">Conservation Recommendations</h4>
                <ul className="insight-list">
                  {generateConservationRecommendations(activeReserveInfo, spatialData).map((rec, index) => (
                    <li key={index} className="insight-item">
                      <span
                        className={`mr-2 ${rec.priority === 'high' ? 'text-red' : rec.priority === 'medium' ? 'text-amber' : 'text-green'
                          }`}
                      >
                        •
                      </span>
                      <span>{rec.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Toggle button for side panel when collapsed */}
          {!showSidePanel && (
            <button className="panel-toggle" onClick={() => setShowSidePanel(true)}>
              ≡
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TigerReserveDashboard;
