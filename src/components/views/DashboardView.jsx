import React from 'react';
import {
  Sparkles,
  Flame,
  AlertTriangle,
  RotateCcw,
  Wind,
  Home,
  Waves,
  Thermometer,
  CloudSun,
  Droplets,
  Maximize2,
  Leaf,
  Layers,
  Cpu,
  Sliders,
  Power,
  ChevronRight
} from 'lucide-react';
import AirflowCanvas from '../AirflowCanvas';
import LiveChart from '../LiveChart';

export default function DashboardView({
  outdoorAQI,
  indoorAQI,
  co2Level,
  temperature,
  humidity,
  pm25Outdoor,
  pm10Outdoor,
  weatherCondition,
  windowLOpen,
  windowROpen,
  hvacLevel,
  setHvacLevel,
  purifierOn,
  sensorsOnline,
  currentRoom,
  setCurrentRoom,
  roomImageSrc,
  roomImageFallback,
  setIsModalOpen,
  controlMode,
  setControlMode,
  aiAction,
  timeRange,
  setTimeRange,
  chartData,
  activities,
  addActivity,
  toggleWindows,
  togglePurifier,
  handleSimulatePollution,
  handleSimulateHighCO2,
  handleResetClean,
  currentUser
}) {
  return (
    <>
      {/* Interactive Simulation Trigger Banner */}
      <div className="demo-banner">
        <div className="demo-banner-left">
          <Sparkles size={18} color="#10b981" />
          <span>
            <strong>Interactive IoT Simulator:</strong> Test AI automated response to environmental triggers.
          </span>
        </div>
        <div className="demo-action-btns">
          <button className="btn-demo-pill btn-spike" onClick={handleSimulatePollution}>
            <Flame size={14} /> Simulate Pollution Spike (AQI 220)
          </button>
          <button
            className="btn-demo-pill btn-spike"
            style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fcd34d' }}
            onClick={handleSimulateHighCO2}
          >
            <AlertTriangle size={14} /> Simulate High CO₂ (1240 ppm)
          </button>
          <button className="btn-demo-pill btn-reset" onClick={handleResetClean}>
            <RotateCcw size={14} /> Reset Clean Air
          </button>
        </div>
      </div>

      {/* Top KPI Cards Grid */}
      <div className="kpi-grid">
        {/* Outdoor AQI */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="kpi-icon-pill" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <Wind size={20} />
              </div>
              <span className="kpi-title">Outdoor AQI</span>
            </div>
            <span className={`kpi-badge ${outdoorAQI <= 50 ? 'badge-good' : outdoorAQI <= 100 ? 'badge-normal' : 'active-rose'}`}>
              ● {outdoorAQI <= 50 ? 'Excellent' : outdoorAQI <= 100 ? 'Good' : 'Unhealthy'}
            </span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{outdoorAQI}</span>
            <span className="kpi-unit">AQI</span>
          </div>
          <div className="kpi-bar">
            <div
              className="kpi-bar-fill"
              style={{
                width: `${Math.min(100, (outdoorAQI / 300) * 100)}%`,
                background: outdoorAQI <= 100 ? '#10b981' : '#ef4444'
              }}
            />
          </div>
          <div className="kpi-footer-text">
            <span>PM2.5: <strong>{pm25Outdoor} µg/m³</strong></span>
            <span>PM10: <strong>{pm10Outdoor} µg/m³</strong></span>
          </div>
        </div>

        {/* Indoor AQI */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="kpi-icon-pill" style={{ background: '#ecfdf5', color: '#10b981' }}>
                <Home size={20} />
              </div>
              <span className="kpi-title">Indoor AQI</span>
            </div>
            <span className={`kpi-badge ${indoorAQI <= 50 ? 'badge-good' : 'badge-normal'}`}>
              ● {indoorAQI <= 50 ? 'Good' : 'Moderate'}
            </span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{indoorAQI}</span>
            <span className="kpi-unit">AQI</span>
          </div>
          <div className="kpi-bar">
            <div
              className="kpi-bar-fill"
              style={{
                width: `${Math.min(100, (indoorAQI / 150) * 100)}%`,
                background: '#10b981'
              }}
            />
          </div>
          <div className="kpi-footer-text">
            <span>PM2.5: <strong>{(pm25Outdoor * 0.6).toFixed(1)} µg/m³</strong></span>
            <span>Target: <strong>&lt; 25 µg/m³</strong></span>
          </div>
        </div>

        {/* CO2 Level */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="kpi-icon-pill" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <Waves size={20} />
              </div>
              <span className="kpi-title">CO₂ Level</span>
            </div>
            <span className={`kpi-badge ${co2Level <= 800 ? 'badge-good' : co2Level <= 1000 ? 'badge-normal' : 'active-rose'}`}>
              ● {co2Level <= 800 ? 'Normal' : co2Level <= 1000 ? 'Moderate' : 'Elevated'}
            </span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{co2Level}</span>
            <span className="kpi-unit">ppm</span>
          </div>
          <div className="kpi-bar">
            <div
              className="kpi-bar-fill"
              style={{
                width: `${Math.min(100, (co2Level / 1500) * 100)}%`,
                background: co2Level <= 800 ? '#10b981' : co2Level <= 1000 ? '#f59e0b' : '#ef4444'
              }}
            />
          </div>
          <div className="kpi-footer-text">
            <span>Ideal: <strong>400 &ndash; 800 ppm</strong></span>
            <span>Freshness: <strong>96%</strong></span>
          </div>
        </div>

        {/* Temperature & Humidity */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="kpi-icon-pill" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                <Thermometer size={20} />
              </div>
              <span className="kpi-title">Temperature</span>
            </div>
            <span className="kpi-badge badge-comfortable">● Comfortable</span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{temperature}&deg;C</span>
            <span className="kpi-unit">Ambient</span>
          </div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: '65%', background: '#f59e0b' }} />
          </div>
          <div className="kpi-footer-text">
            <span>Humidity: <strong>{humidity}%</strong></span>
            <span>Dew Point: <strong>16&deg;C</strong></span>
          </div>
        </div>

        {/* Outdoor Weather */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="kpi-icon-pill" style={{ background: '#fef9c3', color: '#ca8a04' }}>
                <CloudSun size={20} />
              </div>
              <span className="kpi-title">Outdoor Weather</span>
            </div>
            <span className="kpi-badge badge-good">● {weatherCondition.title}</span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{temperature}&deg;C</span>
            <span className="kpi-unit">Live Sync</span>
          </div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: '45%', background: '#38bdf8' }} />
          </div>
          <div className="kpi-footer-text">
            <span>Wind: <strong>{weatherCondition.wind}</strong></span>
            <span>Humidity: <strong>{weatherCondition.humidity}</strong></span>
          </div>
        </div>
      </div>

      {/* Environment at a Glance Strip */}
      <div className="glance-strip">
        <div className="glance-item">
          <div className="glance-icon-box"><Wind size={18} /></div>
          <div className="glance-labels">
            <div className="glance-name">Outdoor AQI</div>
            <div className="glance-val">{outdoorAQI} <span style={{ color: '#10b981', fontSize: '11px' }}>Good</span></div>
          </div>
        </div>

        <div className="glance-item">
          <div className="glance-icon-box"><Home size={18} /></div>
          <div className="glance-labels">
            <div className="glance-name">Indoor AQI</div>
            <div className="glance-val">{indoorAQI} <span style={{ color: '#10b981', fontSize: '11px' }}>Good</span></div>
          </div>
        </div>

        <div className="glance-item">
          <div className="glance-icon-box"><Waves size={18} /></div>
          <div className="glance-labels">
            <div className="glance-name">CO₂ Level</div>
            <div className="glance-val">{co2Level} ppm <span style={{ color: '#10b981', fontSize: '11px' }}>Good</span></div>
          </div>
        </div>

        <div className="glance-item">
          <div className="glance-icon-box"><Thermometer size={18} /></div>
          <div className="glance-labels">
            <div className="glance-name">Temperature</div>
            <div className="glance-val">{temperature}&deg;C <span style={{ color: '#10b981', fontSize: '11px' }}>Comfortable</span></div>
          </div>
        </div>

        <div className="glance-item">
          <div className="glance-icon-box"><Droplets size={18} /></div>
          <div className="glance-labels">
            <div className="glance-name">Humidity</div>
            <div className="glance-val">{humidity}% <span style={{ color: '#10b981', fontSize: '11px' }}>Comfortable</span></div>
          </div>
        </div>
      </div>

      {/* Center 2-Column Section */}
      <div className="center-grid">
        {/* Left Column: Room View + AI Decision Engine */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Live Room View Hero Card */}
          <div className="room-view-card">
            <div className="room-view-header">
              <div className="room-view-title-group">
                <div className="live-indicator">
                  <span className="live-green-dot" />
                  <span>Live Room View</span>
                </div>
                <span className="room-simulation-sub">&bull; Real-time CFD simulation</span>
              </div>

              <div className="room-view-controls">
                <select
                  className="room-select-dropdown"
                  value={currentRoom}
                  onChange={(e) => setCurrentRoom(e.target.value)}
                >
                  <option value="Classroom 301">Classroom 301</option>
                  <option value="Campus Library Lounge">Campus Library Lounge</option>
                  <option value="Science Lab 4">Science Lab 4</option>
                </select>
                <button
                  className="icon-btn-ghost"
                  onClick={() => setIsModalOpen(true)}
                  title="Expand Simulation Inspector"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>

            <div className="room-viewport">
              <img
                src={roomImageSrc}
                alt={currentRoom}
                className="room-bg-image"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = roomImageFallback;
                }}
              />

              <AirflowCanvas
                windowLOpen={windowLOpen}
                windowROpen={windowROpen}
                hvacLevel={hvacLevel}
                purifierOn={purifierOn}
              />

              {/* Floating Interactive Device Tags */}
              <div
                className="floating-overlay-tag"
                style={{ left: '16%', top: '48%' }}
                onClick={() => toggleWindows(!windowLOpen)}
                title="Click to toggle Left Window actuator"
              >
                <span>Window L</span>
                <span className={`tag-badge-pill ${windowLOpen ? 'tag-badge-open' : 'tag-badge-closed'}`}>
                  {windowLOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>

              <div
                className="floating-overlay-tag"
                style={{ left: '49%', top: '22%' }}
                onClick={() => {
                  if (currentUser.role === 'admin') {
                    setHvacLevel(hvacLevel >= 70 ? 35 : 70);
                  } else {
                    alert('Central HVAC damper is managed by building administration. Personal comfort controls allowed on room window.');
                  }
                }}
                title={currentUser.role === 'admin' ? 'Click to toggle HVAC boost' : 'Managed by admin'}
              >
                <Wind size={14} color="#0284c7" />
                <span>HVAC</span>
                <span className="tag-badge-pill tag-badge-hvac">{hvacLevel}%</span>
              </div>

              <div
                className="floating-overlay-tag"
                style={{ left: '56%', top: '68%' }}
                onClick={() => togglePurifier(!purifierOn)}
                title="Click to toggle Air Purifier"
              >
                <Leaf size={14} color={purifierOn ? '#10b981' : '#94a3b8'} />
                <span>Air Purifier</span>
                <span className={`tag-badge-pill ${purifierOn ? 'tag-badge-purifier' : 'tag-badge-closed'}`}>
                  {purifierOn ? 'ON' : 'OFF'}
                </span>
              </div>

              <div
                className="floating-overlay-tag"
                style={{ left: '84%', top: '48%' }}
                onClick={() => toggleWindows(!windowROpen)}
                title="Click to toggle Right Window actuator"
              >
                <span>Window R</span>
                <span className={`tag-badge-pill ${windowROpen ? 'tag-badge-open' : 'tag-badge-closed'}`}>
                  {windowROpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
            </div>

            <div className="room-view-footer">
              <div className="legend-group">
                <div className="legend-item">
                  <span className="legend-color-dot" style={{ background: '#10b981' }} />
                  <span>Fresh Air ({windowLOpen || windowROpen ? 'Active' : 'Closed'})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color-dot" style={{ background: '#0284c7' }} />
                  <span>Filtered ({hvacLevel}%)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color-dot" style={{ background: '#8b5cf6' }} />
                  <span>Purified ({purifierOn ? 'Active' : 'Eco Standby'})</span>
                </div>
              </div>

              <div className="flow-controls-quick">
                <span>Total Flow: <strong>{((hvacLevel * 7.5) + (purifierOn ? 280 : 0) + (windowLOpen ? 210 : 0)).toFixed(0)} m³/h</strong></span>
              </div>
            </div>
          </div>

          {/* Explainable AI Decision Engine Card */}
          <div className="ai-decision-card">
            <div className="ai-decision-header">
              <div className="ai-title-wrap">
                <div className="ai-icon-chip">
                  <Layers size={18} />
                </div>
                <div>
                  <div className="ai-card-title">AI Decision Engine</div>
                  <div className="ai-card-sub">Real-time reasoning & autonomous control rules</div>
                </div>
              </div>
              <span className={`kpi-badge ${aiAction.statusType === 'good' ? 'badge-good' : aiAction.statusType === 'amber' ? 'badge-comfortable' : 'active-rose'}`}>
                ● {aiAction.action}
              </span>
            </div>

            <p className="ai-desc-text">{aiAction.desc}</p>

            <div className="ai-reasons-grid">
              {aiAction.reasons.map((r, i) => (
                <div key={i} className="ai-reason-pill">
                  <span className="reason-check">&bull;</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Status Ring + Quick Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Ring Card */}
          <div className="status-ring-card">
            <div className="status-card-header">
              <div className="status-card-title">
                <Cpu size={18} color="#10b981" />
                <span>Overall System State</span>
              </div>
              <span className="kpi-badge badge-good">Optimal</span>
            </div>

            <div className="ring-center-display">
              <div className="circular-progress-wrap">
                <svg viewBox="0 0 100 100" className="progress-ring-svg">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="var(--border-color)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset="35"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="ring-center-icon">
                  <Leaf size={22} />
                </div>
              </div>

              <div className="ring-status-info">
                <div className="ring-quality-label">AIR QUALITY</div>
                <div className="ring-quality-value">GOOD</div>
                <div className="ring-quality-desc">
                  Conditions are healthy, balanced, and comfortable.
                </div>
              </div>
            </div>

            {/* Device Status Rows */}
            <div className="device-status-list">
              <div className="device-status-row" onClick={() => toggleWindows(!windowLOpen)}>
                <div className="device-name-side">
                  <Home size={16} color="#0284c7" />
                  <span>Windows</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`device-status-pill ${windowLOpen ? 'badge-good' : 'active-rose'}`}>
                    {windowLOpen ? 'OPEN' : 'CLOSED'}
                  </span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              </div>

              <div className="device-status-row" onClick={() => setHvacLevel(hvacLevel === 35 ? 70 : 35)}>
                <div className="device-name-side">
                  <Wind size={16} color="#0284c7" />
                  <span>HVAC Ventilation</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="device-status-pill badge-normal">{hvacLevel}%</span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              </div>

              <div className="device-status-row" onClick={() => togglePurifier(!purifierOn)}>
                <div className="device-name-side">
                  <Leaf size={16} color="#10b981" />
                  <span>Air Purifier</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`device-status-pill ${purifierOn ? 'badge-good' : 'badge-normal'}`}>
                    {purifierOn ? 'ON' : 'OFF'}
                  </span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              </div>

              <div className="device-status-row">
                <div className="device-name-side">
                  <Cpu size={16} color="#8b5cf6" />
                  <span>IoT Sensors</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="device-status-pill badge-good">{sensorsOnline}/4 Online</span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Controls Card */}
          <div className="quick-controls-card">
            <div className="status-card-header">
              <div className="status-card-title">
                <Sliders size={18} color="#0284c7" />
                <span>Quick Controls</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Direct Actuation</span>
            </div>

            <div className="quick-controls-grid">
              <button
                className={`qc-btn ${controlMode === 'auto' ? 'active-green' : ''}`}
                onClick={() => {
                  setControlMode('auto');
                  addActivity('Auto Mode engaged: AI will optimize room air quality', 'green');
                }}
              >
                <Cpu size={20} />
                <span>Auto Mode</span>
              </button>

              <button
                className={`qc-btn ${controlMode === 'manual' ? 'active-green' : ''}`}
                onClick={() => {
                  setControlMode('manual');
                  addActivity('Manual Mode selected: System waits for user commands', 'blue');
                }}
              >
                <Sliders size={20} />
                <span>Manual Mode</span>
              </button>

              <button
                className="qc-btn"
                onClick={() => toggleWindows(true)}
              >
                <Home size={20} />
                <span>Open Windows</span>
              </button>

              <button
                className="qc-btn"
                onClick={() => toggleWindows(false)}
              >
                <Home size={20} style={{ opacity: 0.5 }} />
                <span>Close Windows</span>
              </button>

              <button
                className="qc-btn active-green"
                onClick={() => togglePurifier(true)}
              >
                <Power size={20} />
                <span>Purifier ON</span>
              </button>

              <button
                className="qc-btn active-rose"
                onClick={() => togglePurifier(false)}
              >
                <Power size={20} />
                <span>Purifier OFF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Live Chart & Recent Activity Feed */}
      <div className="bottom-grid">
        <LiveChart
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          chartData={chartData}
        />

        <div className="activity-card">
          <div className="activity-header">
            <div className="activity-title">Recent Activity</div>
            <button
              className="view-all-link"
              onClick={() => addActivity('Diagnostic routine completed: Zero anomalies detected', 'blue')}
            >
              View All
            </button>
          </div>

          <div className="activity-timeline">
            {activities.map((item, idx) => (
              <div key={idx} className="activity-item">
                <span className={`activity-dot ${item.type}`} />
                <div className="activity-details">
                  <span className="activity-time">{item.time}</span>
                  <span className="activity-text">{item.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
