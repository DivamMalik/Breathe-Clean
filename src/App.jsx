import React, { useState, useEffect } from 'react';
import {
  Wind,
  Leaf,
  LayoutDashboard,
  Home,
  Waves,
  BarChart3,
  Sliders,
  Cpu,
  Settings,
  Bell,
  Sun,
  Moon,
  Maximize2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Flame,
  CloudSun,
  Thermometer,
  Droplets,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Power,
  RefreshCw
} from 'lucide-react';

import AirflowCanvas from './components/AirflowCanvas';
import LiveChart from './components/LiveChart';
import SimulationModal from './components/SimulationModal';
import NotificationModal from './components/NotificationModal';

export default function App() {
  // Theme state: light or dark
  const [theme, setTheme] = useState('light');

  // Navigation
  const [activeNav, setActiveNav] = useState('dashboard');

  // Control Mode: 'auto' (AI adjusted) or 'manual'
  const [controlMode, setControlMode] = useState('auto');

  // Room Selection
  const [currentRoom, setCurrentRoom] = useState('Classroom 301');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Environmental Metrics
  const [outdoorAQI, setOutdoorAQI] = useState(55);
  const [indoorAQI, setIndoorAQI] = useState(40);
  const [co2Level, setCo2Level] = useState(620);
  const [temperature, setTemperature] = useState(27);
  const [humidity, setHumidity] = useState(52);
  const [weatherCondition, setWeatherCondition] = useState({
    title: 'Sunny',
    wind: '12 km/h',
    humidity: '45%'
  });

  // Actuator Devices
  const [windowLOpen, setWindowLOpen] = useState(true);
  const [windowROpen, setWindowROpen] = useState(true);
  const [hvacLevel, setHvacLevel] = useState(35);
  const [purifierOn, setPurifierOn] = useState(true);
  const [purifierSpeed, setPurifierSpeed] = useState('Auto'); // 'Auto', 'Medium', 'Turbo'
  const [sensorsOnline, setSensorsOnline] = useState(4);

  // Live Chart Time Range & Data
  const [timeRange, setTimeRange] = useState('1H');
  const [chartData, setChartData] = useState([
    { time: '12:00', indoor: 38, outdoor: 52, co2: 590, temp: 26.5 },
    { time: '12:15', indoor: 42, outdoor: 54, co2: 605, temp: 26.8 },
    { time: '12:30', indoor: 45, outdoor: 58, co2: 630, temp: 27.0 },
    { time: '12:45', indoor: 41, outdoor: 56, co2: 618, temp: 27.1 },
    { time: '13:00', indoor: 39, outdoor: 53, co2: 612, temp: 27.0 },
    { time: '13:15', indoor: 40, outdoor: 55, co2: 620, temp: 27.0 }
  ]);

  // Notifications
  const [notifications, setNotifications] = useState([
    {
      title: 'Optimal Air Quality Maintained',
      message: 'Classroom 301 indoor PM2.5 is at 12 µg/m³. Ventilation normalized.',
      time: '2 mins ago',
      type: 'success'
    },
    {
      title: 'Filter Health Good',
      message: 'HEPA & Activated Carbon filter life currently at 94%.',
      time: '1 hour ago',
      type: 'info'
    },
    {
      title: 'Campus Climate Sync',
      message: 'Outdoor temperature rose to 27°C. Ambient humidity 52%.',
      time: '3 hours ago',
      type: 'info'
    }
  ]);

  // Activity Feed
  const [activities, setActivities] = useState([
    {
      time: '01:22 PM',
      text: 'Outdoor AQI increased to 220 → Windows closed, Purifier turned ON',
      type: 'red'
    },
    {
      time: '01:10 PM',
      text: 'CO₂ level high (1200 ppm) → Ventilation increased to 70%',
      type: 'amber'
    },
    {
      time: '12:48 PM',
      text: 'Air quality normal → Windows opened',
      type: 'green'
    },
    {
      time: '12:15 PM',
      text: 'Indoor AQI reached 160 → Purifier turned ON',
      type: 'red'
    },
    {
      time: '10:24 AM',
      text: 'System checked air quality → No action needed',
      type: 'blue'
    }
  ]);

  // Apply Theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // AI Decision Engine Logic
  const getAiAction = () => {
    if (controlMode === 'manual') {
      return {
        action: 'Manual Override Active',
        desc: 'Manual commands are active. The AI is observing and will alert if hazards arise.',
        reasons: [
          'User manual controls active',
          'AI automated rules suspended',
          'Threshold alerts remaining armed'
        ],
        statusType: 'amber'
      };
    }

    if (outdoorAQI > 150) {
      return {
        action: 'Pollution Barrier Active',
        desc: 'Hazardous outdoor air detected. Windows locked sealed, HEPA purifier at maximum power.',
        reasons: [
          `Outdoor AQI is high (${outdoorAQI} Unhealthy)`,
          'Smart windows closed to prevent particulate entry',
          'HEPA purifier running at Turbo to extract PM2.5',
          'HVAC recirculating filtered indoor air'
        ],
        statusType: 'red'
      };
    }

    if (co2Level > 900) {
      return {
        action: 'CO₂ Flush & Fresh Oxygen',
        desc: 'Elevated CO₂ detected in classroom. Fresh air intake boosted to 75% for optimal alertness.',
        reasons: [
          `CO₂ level is elevated (${co2Level} ppm)`,
          'Ventilation speed increased to 75%',
          'Fresh air intake allowed since outdoor air is safe',
          'Preventing drowsiness and cognitive fatigue'
        ],
        statusType: 'amber'
      };
    }

    return {
      action: 'Normal Ventilation',
      desc: 'Outdoor air quality is good. Fresh air intake is allowed and circulating freely.',
      reasons: [
        `Outdoor AQI is ${outdoorAQI} (Good)`,
        `Indoor AQI is ${indoorAQI} (Good)`,
        'Temperature and humidity are in comfortable range',
        `CO₂ level is balanced at ${co2Level} ppm`
      ],
      statusType: 'green'
    };
  };

  const aiState = getAiAction();

  // Helper to log a new activity
  const addActivity = (text, type = 'green') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActivities((prev) => [{ time: timeStr, text, type }, ...prev.slice(0, 8)]);
  };

  // Periodic sensor ticker to simulate live real-time IoT stream
  useEffect(() => {
    const interval = setInterval(() => {
      // Subtle natural fluctuations
      const deltaAQI = (Math.random() - 0.5) * 1.5;
      const deltaCO2 = (Math.random() - 0.5) * 6;
      setIndoorAQI((prev) => Math.round(Math.max(20, Math.min(220, prev + deltaAQI))));
      setCo2Level((prev) => Math.round(Math.max(400, Math.min(1400, prev + deltaCO2))));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Simulation Demos
  const handleSimulatePollution = () => {
    setOutdoorAQI(220);
    setIndoorAQI(85);
    setCo2Level(680);
    if (controlMode === 'auto') {
      setWindowLOpen(false);
      setWindowROpen(false);
      setPurifierOn(true);
      setPurifierSpeed('Turbo');
      setHvacLevel(75);
    }
    addActivity('Outdoor AQI spiked to 220 (Unhealthy) → AI sealed windows & engaged Turbo Purifier', 'red');
    setNotifications((prev) => [
      {
        title: 'Severe Outdoor Pollution Spike',
        message: 'Outdoor AQI reached 220. Windows automatically sealed and HEPA purification boosted.',
        time: 'Just now',
        type: 'alert'
      },
      ...prev
    ]);
  };

  const handleSimulateHighCO2 = () => {
    setCo2Level(1240);
    if (controlMode === 'auto') {
      setHvacLevel(80);
      setWindowLOpen(true);
      setWindowROpen(true);
    }
    addActivity('CO₂ level high (1240 ppm) → AI increased ventilation to 80% to flush room', 'amber');
    setNotifications((prev) => [
      {
        title: 'Elevated CO₂ Warning',
        message: 'Indoor CO₂ surpassed 1200 ppm threshold. High ventilation protocol initiated.',
        time: 'Just now',
        type: 'warning'
      },
      ...prev
    ]);
  };

  const handleResetClean = () => {
    setOutdoorAQI(55);
    setIndoorAQI(40);
    setCo2Level(620);
    setTemperature(27);
    setWindowLOpen(true);
    setWindowROpen(true);
    setHvacLevel(35);
    setPurifierOn(true);
    setPurifierSpeed('Auto');
    setControlMode('auto');
    addActivity('Air quality restored to optimal healthy baselines. Normal ventilation resumed.', 'green');
  };

  // Manual Quick Controls
  const toggleWindows = (open) => {
    setWindowLOpen(open);
    setWindowROpen(open);
    addActivity(`Windows manually ${open ? 'opened' : 'closed'} by Divam Malik`, 'blue');
  };

  const togglePurifier = (on) => {
    setPurifierOn(on);
    addActivity(`Air Purifier manually turned ${on ? 'ON' : 'OFF'} by Divam Malik`, on ? 'green' : 'amber');
  };

  // Room Image selection
  const roomImageSrc = currentRoom.includes('Library') ? '/library.jpg' : '/classroom.jpg';

  // Current Date display
  const todayFormatted = 'Mon, 4 Oct 2026';
  const timeFormatted = '01:24 PM';

  return (
    <div className="app-container">
      {/* Simulation Modal (CFD view) */}
      <SimulationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentRoom={currentRoom}
        roomImage={roomImageSrc}
        windowLOpen={windowLOpen}
        windowROpen={windowROpen}
        hvacLevel={hvacLevel}
        purifierOn={purifierOn}
        indoorAQI={indoorAQI}
        outdoorAQI={outdoorAQI}
        co2Level={co2Level}
        temperature={temperature}
        humidity={humidity}
      />

      {/* Notifications Drawer */}
      <NotificationModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onClear={() => setNotifications([])}
      />

      {/* Sidebar - Combining Image 1 & Image 2 Design */}
      <aside className="sidebar">
        <div>
          {/* Brand */}
          <div className="sidebar-brand">
            <div className="brand-icon-box">
              <Leaf size={24} />
            </div>
            <div>
              <div className="brand-title">Breathe Clean</div>
              <div className="brand-tagline">Smart Air. Healthier Spaces.</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveNav('dashboard')}
            >
              <span className="nav-item-icon"><LayoutDashboard size={19} /></span>
              <span>Dashboard</span>
            </button>

            <button
              className={`nav-item ${activeNav === 'room' ? 'active' : ''}`}
              onClick={() => {
                setActiveNav('room');
                setIsModalOpen(true);
              }}
            >
              <span className="nav-item-icon"><Home size={19} /></span>
              <span>Live Room</span>
              <span className="nav-badge">Live</span>
            </button>

            <button
              className={`nav-item ${activeNav === 'air' ? 'active' : ''}`}
              onClick={() => setActiveNav('air')}
            >
              <span className="nav-item-icon"><Waves size={19} /></span>
              <span>Air Quality</span>
            </button>

            <button
              className={`nav-item ${activeNav === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveNav('analytics')}
            >
              <span className="nav-item-icon"><BarChart3 size={19} /></span>
              <span>Analytics</span>
            </button>

            <button
              className={`nav-item ${activeNav === 'controls' ? 'active' : ''}`}
              onClick={() => setActiveNav('controls')}
            >
              <span className="nav-item-icon"><Sliders size={19} /></span>
              <span>Controls</span>
            </button>

            <button
              className={`nav-item ${activeNav === 'automation' ? 'active' : ''}`}
              onClick={() => setActiveNav('automation')}
            >
              <span className="nav-item-icon"><Cpu size={19} /></span>
              <span>Automation</span>
            </button>

            <button
              className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveNav('settings')}
            >
              <span className="nav-item-icon"><Settings size={19} /></span>
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom Controls */}
        <div className="sidebar-footer">
          {/* Light / Dark Mode Toggle Pill */}
          <div className="theme-switch-pill">
            <button
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              <Sun size={15} /> Light
            </button>
            <button
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              <Moon size={15} /> Dark
            </button>
          </div>

          {/* User Profile */}
          <div className="user-profile-badge">
            <div className="user-avatar">
              DM
              <span className="user-status-dot" />
            </div>
            <div className="user-info">
              <div className="user-name">Divam Malik</div>
              <div className="user-role">System Administrator</div>
            </div>
          </div>

          {/* AWS Platform Pill (Image 2) */}
          <div className="aws-badge-pill">
            <Leaf size={16} color="#fb923c" />
            <span>Powered by AWS Smart Platform</span>
          </div>
        </div>
      </aside>

      {/* Main App Canvas */}
      <main className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <div className="greeting-row">
              <h1 className="greeting-title">Good Afternoon, Divam</h1>
            </div>
            <div className="greeting-subtitle">Your space is breathing clean.</div>
          </div>

          <div className="header-right">
            {/* Auto / Manual Mode Badge */}
            <div
              className={`mode-status-badge ${controlMode}`}
              onClick={() => {
                const nextMode = controlMode === 'auto' ? 'manual' : 'auto';
                setControlMode(nextMode);
                addActivity(`Mode switched to ${nextMode.toUpperCase()} by user`, 'blue');
              }}
              title="Click to toggle between Auto and Manual control"
            >
              <span className="pulse-dot" />
              <span>{controlMode === 'auto' ? 'AUTO MODE' : 'MANUAL MODE'}</span>
            </div>

            {/* Date & Time */}
            <div className="datetime-location-box">
              <div className="datetime-text">{todayFormatted} &bull; {timeFormatted}</div>
              <div className="location-tag">📍 College Campus &bull; {currentRoom}</div>
            </div>

            {/* Notification Bell */}
            <button
              className="notification-btn"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              title="View Notifications"
            >
              <Bell size={20} />
              {notifications.length > 0 && <span className="notification-badge" />}
            </button>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <div className="dashboard-content">
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
              <button className="btn-demo-pill btn-spike" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fcd34d' }} onClick={handleSimulateHighCO2}>
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
                <span>PM2.5: <strong>18 µg/m³</strong></span>
                <span>PM10: <strong>32 µg/m³</strong></span>
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
                <span>PM2.5: <strong>12 µg/m³</strong></span>
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

            {/* Outdoor Weather (from Image 2) */}
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
                <span className="kpi-value">26&deg;C</span>
                <span className="kpi-unit">Sunny</span>
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

          {/* Environment at a Glance Strip (from Image 2) */}
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

          {/* Center 2-Column Section: Hero Room View & AI Controls + Right Status */}
          <div className="center-grid">
            {/* Left Column: Room View + AI Decision Engine */}
            <div style={{ display: 'flex', flexChange: 'column', flexDirection: 'column', gap: '20px' }}>
              {/* Live Room View Hero Card (Image 1 & 2) */}
              <div className="room-view-card">
                {/* Header */}
                <div className="room-view-header">
                  <div className="room-view-title-group">
                    <div className="live-indicator">
                      <span className="live-green-dot" />
                      <span>Live Room View</span>
                    </div>
                    <span className="room-simulation-sub">&bull; Real-time CFD simulation</span>
                  </div>

                  <div className="room-header-actions">
                    <select
                      className="room-select-dropdown"
                      value={currentRoom}
                      onChange={(e) => {
                        setCurrentRoom(e.target.value);
                        addActivity(`Switched room monitoring view to ${e.target.value}`, 'blue');
                      }}
                    >
                      <option value="Classroom 301">Classroom 301</option>
                      <option value="Campus Library Lounge">Campus Library Lounge</option>
                      <option value="Classroom 101">Classroom 101</option>
                      <option value="Science Lab 4">Science Lab 4</option>
                    </select>

                    <button
                      className="room-btn-icon"
                      onClick={() => setIsModalOpen(true)}
                      title="Open Fullscreen CFD Inspector"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Visualizer Viewport */}
                <div className="room-viewport">
                  <img
                    src={roomImageSrc}
                    alt={currentRoom}
                    className="room-bg-image"
                  />

                  {/* Dynamic HTML5 Canvas Airflow Simulation */}
                  <AirflowCanvas
                    windowLOpen={windowLOpen}
                    windowROpen={windowROpen}
                    hvacLevel={hvacLevel}
                    purifierOn={purifierOn}
                    flowSpeedMultiplier={1.1}
                  />

                  {/* Interactive Floating Overlays matching Image 1 */}
                  {/* Window L */}
                  <div
                    className="floating-overlay-tag"
                    style={{ left: '16%', top: '48%' }}
                    onClick={() => {
                      setWindowLOpen(!windowLOpen);
                      addActivity(`Left Window turned ${!windowLOpen ? 'OPEN' : 'CLOSED'}`, 'blue');
                    }}
                    title="Click to toggle Left Window"
                  >
                    <span>Window L</span>
                    <span className={`tag-badge-pill ${windowLOpen ? 'tag-badge-open' : 'tag-badge-closed'}`}>
                      {windowLOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>

                  {/* Ceiling HVAC Vent */}
                  <div
                    className="floating-overlay-tag"
                    style={{ left: '48%', top: '22%' }}
                    onClick={() => {
                      const newLev = hvacLevel >= 70 ? 35 : 70;
                      setHvacLevel(newLev);
                      addActivity(`HVAC ventilation changed to ${newLev}%`, 'blue');
                    }}
                    title="Click to toggle HVAC Ventilation speed"
                  >
                    <Wind size={14} color="#0284c7" />
                    <span>HVAC</span>
                    <span className="tag-badge-pill tag-badge-hvac">{hvacLevel}%</span>
                  </div>

                  {/* Smart Air Purifier Unit in Center */}
                  <div
                    className="floating-overlay-tag"
                    style={{ left: '55%', top: '65%' }}
                    onClick={() => {
                      togglePurifier(!purifierOn);
                    }}
                    title="Click to toggle Air Purifier"
                  >
                    <Leaf size={14} color={purifierOn ? '#10b981' : '#94a3b8'} />
                    <span>Air Purifier</span>
                    <span className={`tag-badge-pill ${purifierOn ? 'tag-badge-purifier' : 'tag-badge-closed'}`}>
                      {purifierOn ? 'ON' : 'OFF'}
                    </span>
                  </div>

                  {/* Window R */}
                  <div
                    className="floating-overlay-tag"
                    style={{ left: '84%', top: '48%' }}
                    onClick={() => {
                      setWindowROpen(!windowROpen);
                      addActivity(`Right Window turned ${!windowROpen ? 'OPEN' : 'CLOSED'}`, 'blue');
                    }}
                    title="Click to toggle Right Window"
                  >
                    <span>Window R</span>
                    <span className={`tag-badge-pill ${windowROpen ? 'tag-badge-open' : 'tag-badge-closed'}`}>
                      {windowROpen ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>
                </div>

                {/* Footer Legend matching Image 2 */}
                <div className="room-view-footer">
                  <div className="legend-group">
                    <div className="legend-item">
                      <span className="legend-color-dot" style={{ background: '#10b981' }} />
                      <span>Fresh Air Inflow ({windowLOpen || windowROpen ? 'Active' : 'Closed'})</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color-dot" style={{ background: '#0284c7' }} />
                      <span>Filtered Air ({hvacLevel}%)</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color-dot" style={{ background: '#8b5cf6' }} />
                      <span>Purified Air ({purifierOn ? 'Active' : 'Standby'})</span>
                    </div>
                  </div>

                  <div className="flow-controls-quick">
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Air Exchange:</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>{(2.4 + hvacLevel / 50).toFixed(1)} ACH</span>
                  </div>
                </div>
              </div>

              {/* Automatic Control Card - AI Active (Image 2) */}
              <div className="ai-control-card">
                <div className="ai-card-header">
                  <div className="ai-header-left">
                    <div className="ai-icon-pill">
                      <Cpu size={22} />
                    </div>
                    <div>
                      <div className="ai-title">Automatic Control</div>
                      <div className="ai-desc-text">
                        Breathe Clean is automatically adjusting your environment based on real-time data.
                      </div>
                    </div>
                  </div>
                  <div className="ai-active-chip">
                    <span className="live-green-dot" style={{ width: '7px', height: '7px' }} />
                    <span>AI Active</span>
                  </div>
                </div>

                <div className="ai-decision-split">
                  {/* Current Action */}
                  <div className="action-status-box">
                    <div className="action-meta-label">Current Action</div>
                    <div className="action-main-title">
                      <Leaf size={20} />
                      <span>{aiState.action}</span>
                    </div>
                    <div className="action-explanation">{aiState.desc}</div>
                  </div>

                  {/* Why? checklist */}
                  <div className="why-reasons-box">
                    <div className="action-meta-label" style={{ marginBottom: '4px' }}>Why?</div>
                    <div className="why-list">
                      {aiState.reasons.map((r, i) => (
                        <div key={i} className="why-item">
                          <CheckCircle2 size={16} className="why-check" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Device Status granular toggles (Image 2) */}
                <div className="device-matrix-grid">
                  {/* Smart Windows */}
                  <div className="device-tile">
                    <div className="device-tile-top">
                      <div className="device-tile-title">
                        <Home size={16} color="#0284c7" />
                        <span>Smart Windows</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={windowLOpen && windowROpen}
                          onChange={(e) => toggleWindows(e.target.checked)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                    <div className="device-tile-state-row">
                      <div className="device-value-badge" style={{ color: windowLOpen ? '#10b981' : '#94a3b8' }}>
                        {windowLOpen ? 'OPEN' : 'CLOSED'}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {controlMode === 'auto' ? 'Auto mode' : 'Manual'}
                      </span>
                    </div>
                  </div>

                  {/* Ventilation System */}
                  <div className="device-tile">
                    <div className="device-tile-top">
                      <div className="device-tile-title">
                        <Wind size={16} color="#0284c7" />
                        <span>Ventilation System</span>
                      </div>
                      <span className="tag-badge-pill tag-badge-hvac">{hvacLevel}%</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={hvacLevel}
                        onChange={(e) => setHvacLevel(Number(e.target.value))}
                        className="hvac-slider"
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>Eco (20%)</span>
                        <span>Boost (100%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Air Purifier */}
                  <div className="device-tile">
                    <div className="device-tile-top">
                      <div className="device-tile-title">
                        <Leaf size={16} color="#10b981" />
                        <span>Air Purifier</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={purifierOn}
                          onChange={(e) => togglePurifier(e.target.checked)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                    <div className="device-tile-state-row">
                      <div className="device-value-badge" style={{ color: purifierOn ? '#10b981' : '#94a3b8' }}>
                        {purifierOn ? 'ON' : 'OFF'}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {['Low', 'Med', 'Turbo'].map((spd) => (
                          <button
                            key={spd}
                            className={`flow-chip-btn ${purifierSpeed === spd ? 'active' : ''}`}
                            onClick={() => {
                              setPurifierSpeed(spd);
                              if (!purifierOn) setPurifierOn(true);
                              addActivity(`Purifier speed set to ${spd}`, 'blue');
                            }}
                          >
                            {spd}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column Stack: System Status Ring & Quick Controls */}
            <div className="right-column-stack">
              {/* System Status Card (from Image 1 & 2) */}
              <div className="system-status-card">
                <div className="status-card-header">
                  <div className="status-card-title">
                    <span className="live-green-dot" />
                    <span>System Status</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>All systems operational</span>
                </div>

                <div className="status-ring-container">
                  <div className="ring-outer">
                    <svg className="ring-svg" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="var(--border-light)"
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

                {/* Device Status Rows (Image 1) */}
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
                      <span className={`device-status-pill ${purifierOn ? 'badge-good' : 'active-rose'}`}>
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

              {/* Quick Controls Card (Image 1 & 2) */}
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

          {/* Bottom Grid: Live Chart & Recent Activity Feed (Image 1) */}
          <div className="bottom-grid">
            {/* Live Chart */}
            <LiveChart
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              chartData={chartData}
            />

            {/* Recent Activity Card */}
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
        </div>

        {/* Global Footer */}
        <footer className="app-footer">
          <div className="footer-left">
            <Leaf size={16} color="#10b981" />
            <span><strong>Breathe Clean</strong> &bull; AI-Powered Indoor Air Quality & Ventilation Control Platform</span>
          </div>
          <div className="footer-right">
            <span>Clean Air</span>
            <span>&bull;</span>
            <span>Smart Spaces</span>
            <span>&bull;</span>
            <span>Better Health</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
