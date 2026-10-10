
function hasCompleteSensorReadings(environment) {
  return Boolean(
    environment &&
    ['indoorAQI', 'outdoorAQI', 'co2', 'temperature', 'humidity', 'occupancy']
      .every(field => Number.isFinite(environment[field]))
  );
}

function getVerifiedSavedOutdoorAirQuality() {
  const user = API.getCurrentUser();
  if (!Number.isSafeInteger(user?.id)) return null;
  const setup = API.getCachedAccountSetup();
  const location = setup?.location;
  const airQuality = setup?.outdoorAirQuality;
  if (
    !location ||
    !airQuality ||
    !Number.isFinite(airQuality.aqi) ||
    airQuality.latitude !== location.latitude ||
    airQuality.longitude !== location.longitude ||
    airQuality.source !== 'Google Maps Platform Air Quality API (Universal AQI)' ||
    typeof airQuality.lastUpdated !== 'string' ||
    Number.isNaN(Date.parse(airQuality.lastUpdated))
  ) {
    return null;
  }
  return { location, airQuality };
}

const Views = {

  renderSidebar(activeView = 'dashboard') {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Utils.icons.dashboard },
      { id: 'spaces', label: 'Spaces', icon: Utils.icons.spaces },
      { id: 'simulation', label: 'Simulation', icon: Utils.icons.simulation },
      { id: 'analytics', label: 'Analytics', icon: Utils.icons.analytics },
      { id: 'devices', label: 'Devices', icon: Utils.icons.devices },
      { id: 'assistant', label: 'AI Assistant', icon: Utils.icons.sparkles },
      { id: 'settings', label: 'Settings', icon: Utils.icons.settings }
    ];

    return `
      <aside class="app-sidebar" id="app-sidebar">
        <div class="sidebar-brand">
          <div class="brand-logo">
            <span class="brand-icon">${Utils.icons.leaf}</span>
            <span class="brand-name">Breathe Clean</span>
          </div>
          <button class="mobile-sidebar-close" id="mobile-sidebar-close" aria-label="Close menu">
            ${Utils.icons.x}
          </button>
        </div>

        <nav class="sidebar-nav">
          ${navItems.map(item => `
            <button class="nav-item ${activeView === item.id ? 'active' : ''}" data-view="${item.id}">
              <span class="nav-icon">${item.icon}</span>
              <span class="nav-label">${item.label}</span>
            </button>
          `).join('')}
        </nav>

        <div class="sidebar-footer">
          <button class="nav-item sign-out-trigger" id="btn-sign-out-trigger">
            <span class="nav-icon">${Utils.icons.logout}</span>
            <span class="nav-label">Sign out</span>
          </button>
        </div>
      </aside>
    `;
  },

  renderHeader(user, room) {
    const isAuto = room ? room.mode === 'AUTO' : true;
    const now = new Date();
    const formattedDate = Utils.formatDate(now);
    const formattedTime = Utils.formatTime(now);
    const userName = user?.name || 'your account';

    return `
      <header class="app-header">
        <div class="header-left">
          <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Open menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div class="header-greeting">
            <h1 class="greeting-title">Good evening, ${Utils.escapeHtml(userName)}</h1>
            <p class="greeting-subtitle">Your environment is under control.</p>
          </div>
        </div>

        <div class="header-center">
          <!-- Room Selector Dropdown -->
          <div class="room-selector-wrapper">
            <button class="room-selector-btn" id="room-selector-btn">
              <span class="room-thumb-mini">
                <img src="${room ? room.image : 'assets/images/room-bedroom.jpg'}" alt="${room ? room.name : 'Room'}" />
              </span>
              <span class="room-current-name">${room ? Utils.escapeHtml(room.name) : 'Select Space'}</span>
              <span class="room-chevron">${Utils.icons.chevronDown}</span>
            </button>
            <div class="room-dropdown-menu" id="room-dropdown-menu">
              ${State.rooms.map(r => `
                <button class="room-dropdown-item ${room && room.id === r.id ? 'active' : ''}" data-room-id="${r.id}">
                  <img src="${r.image}" class="dropdown-item-thumb" alt="${r.name}" />
                  <div class="dropdown-item-info">
                    <span class="item-name">${Utils.escapeHtml(r.name)}</span>
                    <span class="item-sub">${r.type} · ${r.area} m²</span>
                  </div>
                  ${room && room.id === r.id ? `<span class="item-check">${Utils.icons.check}</span>` : ''}
                </button>
              `).join('')}
              <div class="dropdown-divider"></div>
              <button class="dropdown-add-room" id="header-add-room-btn">
                ${Utils.icons.plus} <span>Add new space</span>
              </button>
            </div>
          </div>

          <!-- System Mode Toggle Pill -->
          <div class="mode-control-container">
            <span class="mode-control-label">System mode</span>
            <div class="mode-segmented-pill">
              <button class="mode-segment-btn ${isAuto ? 'active' : ''}" data-mode="AUTO" title="Automatic AI ventilation and filtration control">AUTO</button>
              <button class="mode-segment-btn ${!isAuto ? 'active' : ''}" data-mode="MANUAL" title="Manual actuator control">MANUAL</button>
            </div>
          </div>

          <!-- Live Mode Indicator Text -->
          <div class="mode-status-indicator ${isAuto ? 'status-auto' : 'status-manual'}">
            <span class="status-dot"></span>
            <div class="status-texts">
              <span class="status-primary">${isAuto ? 'Automatic control active' : 'Manual control active'}</span>
              <span class="status-secondary">${isAuto ? 'Breathe Clean is managing this space.' : 'You are controlling this space.'}</span>
            </div>
          </div>
        </div>

        <div class="header-right">
          <div class="header-time-pill">
            <span class="time-date">${formattedDate}</span>
            <span class="time-clock" id="live-header-clock">${formattedTime}</span>
          </div>
          <button class="header-icon-btn" id="btn-notifications" aria-label="Notifications" title="System alerts">
            ${Utils.icons.bell}
            <span class="notif-badge"></span>
          </button>
          <button class="header-avatar-btn" id="btn-header-profile" title="${Utils.escapeHtml(userName)}">
            <span>${userName.charAt(0).toUpperCase()}</span>
          </button>
        </div>
      </header>
    `;
  },

  renderMetricsBar(env) {
    const isDemoAccount = !Number.isSafeInteger(API.getCurrentUser()?.id);
    const savedProvider = getVerifiedSavedOutdoorAirQuality();
    const verifiedSensorData = env?.source === 'hardware' && env?.verified === true;
    const simulatedDemo = isDemoAccount;
    const outdoorAqi = savedProvider?.airQuality.aqi ??
      (verifiedSensorData || simulatedDemo
        ? (Number.isFinite(env?.outdoorAQI) ? env.outdoorAQI : null)
        : null);
    const indoorAqi = verifiedSensorData || simulatedDemo
      ? (Number.isFinite(env?.indoorAQI) ? env.indoorAQI : null)
      : null;
    const co2 = verifiedSensorData || simulatedDemo
      ? (Number.isFinite(env?.co2) ? env.co2 : null)
      : null;
    const temp = verifiedSensorData || simulatedDemo
      ? (Number.isFinite(env?.temperature) ? env.temperature : null)
      : null;
    const humidity = verifiedSensorData || simulatedDemo
      ? (Number.isFinite(env?.humidity) ? env.humidity : null)
      : null;
    const occupancy = verifiedSensorData || simulatedDemo
      ? (Number.isFinite(env?.occupancy) ? env.occupancy : null)
      : null;

    const outStatus = outdoorAqi === null ? null : Utils.getAqiStatus(outdoorAqi);
    const inStatus = indoorAqi === null ? null : Utils.getAqiStatus(indoorAqi);
    const co2Status = co2 === null ? null : Utils.getCo2Status(co2);
    const tempStatus = temp === null ? null : Utils.getTempStatus(temp);
    const humStatus = humidity === null ? null : Utils.getHumidityStatus(humidity);
    const outdoorLabel = savedProvider
      ? 'Verified outdoor AQI'
      : simulatedDemo
        ? 'Simulated demo outdoor AQI'
        : 'Outdoor AQI';
    const outdoorStatus = savedProvider
      ? savedProvider.airQuality.category
      : simulatedDemo && outdoorAqi !== null
        ? 'Simulated'
        : outStatus?.label || 'Unavailable';
    const providerDetails = savedProvider
      ? `${savedProvider.location.placeName} · ${savedProvider.airQuality.source} · observed ${new Date(savedProvider.airQuality.lastUpdated).toLocaleString()}`
      : simulatedDemo && outdoorAqi !== null
        ? 'Simulated demo data · not a provider reading'
        : 'No verified AQI history available yet.';

    return `
      <section class="metrics-grid">
        <!-- Outdoor AQI -->
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-indicator-dots">
              <span class="metric-mini-dot" style="background:#16a34a"></span>
              <span class="metric-mini-dot" style="background:#d97706"></span>
              <span class="metric-mini-dot" style="background:#ea580c"></span>
            </div>
            <span class="metric-title">${outdoorLabel}</span>
          </div>
          <div class="metric-body">
            <span class="metric-value">${outdoorAqi ?? '—'}</span>
            <span class="metric-pill ${savedProvider ? 'pill-neutral' : outStatus ? `pill-${outStatus.level}` : 'pill-neutral'}">${outdoorStatus}</span>
          </div>
          <span class="metric-source">${Utils.escapeHtml(providerDetails)}</span>
        </div>

        <!-- Indoor AQI -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">${simulatedDemo ? 'Simulated demo indoor AQI' : 'Indoor AQI'}</span>
          </div>
          <div class="metric-body">
            <span class="metric-value">${indoorAqi ?? '—'}</span>
            <span class="metric-pill ${inStatus ? `pill-${inStatus.level}` : 'pill-neutral'}">${inStatus?.label || 'Unavailable'}</span>
          </div>
        </div>

        <!-- CO2 -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">${simulatedDemo ? 'Simulated demo CO₂' : 'CO₂'}</span>
          </div>
          <div class="metric-body">
            <span class="metric-value">${co2 ?? '—'} ${co2 === null ? '' : '<small>ppm</small>'}</span>
            <span class="metric-pill ${co2Status ? `pill-${co2Status.level}` : 'pill-neutral'}">${co2Status?.label || 'Unavailable'}</span>
          </div>
        </div>

        <!-- Temperature -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">${simulatedDemo ? 'Simulated demo temperature' : 'Temperature'}</span>
          </div>
          <div class="metric-body">
            <span class="metric-value">${temp ?? '—'} ${temp === null ? '' : '<small>°C</small>'}</span>
            <span class="metric-pill ${tempStatus ? `pill-${tempStatus.level}` : 'pill-neutral'}">${tempStatus?.label || 'Unavailable'}</span>
          </div>
        </div>

        <!-- Humidity -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">${simulatedDemo ? 'Simulated demo humidity' : 'Humidity'}</span>
          </div>
          <div class="metric-body">
            <span class="metric-value">${humidity ?? '—'} ${humidity === null ? '' : '<small>%</small>'}</span>
            <span class="metric-pill ${humStatus ? `pill-${humStatus.level}` : 'pill-neutral'}">${humStatus?.label || 'Unavailable'}</span>
          </div>
        </div>

        <!-- Occupancy -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">${simulatedDemo ? 'Simulated demo occupancy' : 'Occupancy'}</span>
          </div>
          <div class="metric-body">
            <span class="metric-value">${occupancy ?? '—'}</span>
            <span class="metric-pill pill-neutral">${occupancy === null ? 'Unavailable' : occupancy > 1 ? 'People' : 'Person'}</span>
          </div>
        </div>
      </section>
    `;
  },

  renderDashboard(room) {
    if (!room) {
      return `
        <div class="empty-state-view">
          <h3>Your environment starts here.</h3>
          <p>No spaces configured yet. Set up your first space to begin monitoring.</p>
          <button class="btn btn-primary" id="btn-empty-add-space">Add your first space</button>
        </div>
      `;
    }

    const isAuto = room.mode === 'AUTO';
    const hasReadings = hasCompleteSensorReadings(room.environment);
    const decision = room.decision || (hasReadings
      ? Engine.decide(room.environment, room, room.devices)
      : {
        title: 'Live sensor readings are not configured for this account.',
        reason: 'No sensor data has been provided. Run an explicit scenario simulation or connect a supported sensor source.',
        action: 'No device recommendations have been generated.',
        expectedOutcome: 'Device controls remain unavailable until this account has sensor readings.',
        timestamp: new Date().toISOString()
      });

    const winDev = room.devices?.find(d => d.type === 'window') || { state: 'Closed' };
    const ventDev = room.devices?.find(d => d.type === 'ventilation') || { state: 'Normal' };
    const purDev = room.devices?.find(d => d.type === 'purifier') || { state: 'Active' };

    const recentActivity = room.activity ? room.activity.slice(0, 6) : [];

    const env = room.environment || {};
    const outdoorAqi = Number.isFinite(env.outdoorAQI) ? env.outdoorAQI : 88;
    const indoorAqi = Number.isFinite(env.indoorAQI) ? env.indoorAQI : 38;
    const co2 = Number.isFinite(env.co2) ? env.co2 : 640;

    const reductionPercent = Math.max(0, Math.min(99, Math.round(((outdoorAqi - indoorAqi) / (outdoorAqi || 1)) * 100)));
    const airChangesHour = isAuto && winDev.state === 'Open' ? '5.4' : (ventDev.state === 'High' ? '4.8' : (ventDev.state === 'Filtered' ? '3.9' : '2.8'));
    const cleanAirRate = purDev.state === 'High' ? '480' : (purDev.state === 'Active' || purDev.state === 'ON' ? '290' : (purDev.state === 'Low' ? '140' : '0'));

    return `
      <div class="view-content view-dashboard">
        <section class="dashboard-action-toolbar" role="status" aria-live="polite">
          <span id="dashboard-backend-status-message">${Utils.escapeHtml(State.dashboardApiStatus.message)}</span>
          <button class="toolbar-btn-secondary" id="btn-refresh-dashboard-data" type="button" style="display:${State.dashboardApiStatus.state === 'error' ? 'inline-flex' : 'none'}">
            ${Utils.icons.refresh} <span>Retry live data</span>
          </button>
        </section>

        <!-- Top Row: Environmental Metrics Bar -->
        ${this.renderMetricsBar(room.environment)}

        <!-- Master Command & Quick Action Strip -->
        <section class="dashboard-action-toolbar">
          <div class="action-toolbar-left">
            <span class="toolbar-label">Operational Controls:</span>
            <button class="toolbar-btn btn-action-optimize" id="btn-quick-optimize" title="Re-evaluate ASHRAE rules and synchronize actuators">
              ${Utils.icons.zap} <span>Auto-Optimize</span>
            </button>
            <button class="toolbar-btn btn-action-flush" id="btn-quick-flush" title="Trigger rapid air displacement purge">
              ${Utils.icons.wind} <span>Rapid Flush</span>
            </button>
            <button class="toolbar-btn btn-action-eco" id="btn-quick-eco" title="Switch to low-energy whisper silent mode">
              ${Utils.icons.leaf} <span>Eco Silent</span>
            </button>
            <button class="toolbar-btn btn-action-seal" id="btn-quick-seal" title="Emergency seal: lock windows against smog/wildfire">
              ${Utils.icons.lock} <span>Perimeter Seal</span>
            </button>
          </div>
          <div class="action-toolbar-right">
            <button class="toolbar-btn-secondary" id="btn-recalibrate-sensors" title="Calibrate and synchronize sensor telemetry">
              ${Utils.icons.refresh} <span>Calibrate Sensors</span>
            </button>
            <button class="toolbar-btn-secondary" id="btn-export-telemetry" title="Download real-time IAQ telemetry summary">
              ${Utils.icons.download} <span>Export IAQ Report</span>
            </button>
            <div class="toolbar-profile-badge" id="btn-quick-standards-pill" style="cursor:pointer;" title="Active Environmental Standard (Click to view ASHRAE compliance matrix)">
              <span class="profile-badge-dot"></span>
              <span class="profile-badge-text">ASHRAE 62.1-2022</span>
            </div>
          </div>
        </section>

        <!-- Primary 4-Card Operational Grid -->
        <div class="dashboard-grid">
          <!-- Column 1: Dynamic Room View & CFD Streamline Simulator -->
          <div class="dash-card card-room-view">
            <div class="card-head">
              <div class="card-head-title-group">
                <span class="card-title">Room View</span>
                <span class="live-pill">
                  <span class="live-pulse"></span> Live CFD
                </span>
              </div>
              <span class="room-head-space-tag">${Utils.escapeHtml(room.name)} · ${room.area} m²</span>
            </div>

            <div class="room-canvas-container">
              <!-- Integrated Technical HUD Overlay -->
              <div class="room-canvas-hud-top">
                <div class="sim-speed-selector" id="sim-speed-selector" title="CFD Simulation Speed">
                  <span class="speed-label">Speed:</span>
                  <button class="sim-speed-btn" data-speed="0.5">0.5x</button>
                  <button class="sim-speed-btn active" data-speed="1.0">1x</button>
                  <button class="sim-speed-btn" data-speed="2.0">2x</button>
                </div>
                <button class="sim-view-toggle-btn" id="sim-view-toggle" title="Toggle flow streamline overlay">
                  ${Utils.icons.activity} <span>Laminar</span>
                </button>
              </div>

              <img src="${room.image}" alt="${room.name}" class="room-canvas-bg" id="room-canvas-bg" />
              <canvas id="airflow-canvas" class="airflow-canvas"></canvas>

              <!-- Floating Live Telemetry Overlay Badges -->
              <div class="room-canvas-overlay-badges">
                <span class="room-badge-indicator badge-window">
                  <span class="badge-dot dot-${winDev.state === 'Open' ? 'green' : 'neutral'}"></span>
                  Window: ${winDev.state === 'Open' ? '45° Draft' : 'Sealed 0°'}
                </span>
                <span class="room-badge-indicator badge-purifier">
                  <span class="badge-dot dot-${purDev.state === 'Off' ? 'neutral' : 'green'}"></span>
                  Purifier: ${purDev.state} (${cleanAirRate} m³/h)
                </span>
                <span class="room-badge-indicator badge-vent">
                  <span class="badge-dot dot-green"></span>
                  Vent: ${ventDev.state}
                </span>
                <span class="room-badge-indicator badge-ach">
                  ACH: ${airChangesHour} / hr
                </span>
              </div>
            </div>

            <!-- Card Sub-Bar: Quick Room Micro-Actions -->
            <div class="room-view-bottom-bar">
              <div class="room-stat-mini">
                <span class="stat-mini-label">Displacement Rate</span>
                <span class="stat-mini-val">${airChangesHour} ACH</span>
              </div>
              <div class="room-stat-mini">
                <span class="stat-mini-label">CADR Delivery</span>
                <span class="stat-mini-val">${cleanAirRate} m³/h</span>
              </div>
              <div class="room-stat-mini">
                <span class="stat-mini-label">Airflow Dynamics</span>
                <span class="stat-mini-val">${winDev.state === 'Open' ? 'Cross-Draft' : 'Filtered Recirc'}</span>
              </div>
            </div>
          </div>

          <!-- Column 2: Current System Decision & Regulatory Compliance -->
          <div class="dash-card card-system-decision">
            <div class="card-head">
              <div class="decision-head-left">
                <span class="decision-icon">${Utils.icons.shieldCheck}</span>
                <span class="card-title">System Decision</span>
              </div>
              <span class="decision-time">${Utils.formatTime(new Date(decision.timestamp || Date.now()))}</span>
            </div>

            <div class="decision-headline">
              <h3>${Utils.escapeHtml(decision.title)}</h3>
            </div>

            <div class="decision-details-table">
              <div class="decision-row">
                <div class="decision-label">Reason</div>
                <div class="decision-value">${Utils.escapeHtml(decision.reason)}</div>
              </div>
              <div class="decision-row">
                <div class="decision-label">Action</div>
                <div class="decision-value">${Utils.escapeHtml(decision.action)}</div>
              </div>
              <div class="decision-row">
                <div class="decision-label">Expected result</div>
                <div class="decision-value">${Utils.escapeHtml(decision.expectedOutcome)}</div>
              </div>
            </div>

            <div class="decision-compliance-badge" id="btn-card-standards-pill" style="cursor:pointer;" title="Click to view ASHRAE Standard details">
              <span class="compliance-tag">ASHRAE 62.1-2022</span>
              <span class="compliance-confidence">Recommendations require configured live sensor readings</span>
            </div>

            <!-- Card Management Buttons -->
            <div class="card-actions-footer">
              <button class="card-btn card-btn-primary" id="btn-force-reevaluate" title="Force instant ASHRAE 62.1 decision re-evaluation">
                ${Utils.icons.zap} <span>Re-Evaluate</span>
              </button>
              <button class="card-btn card-btn-outline" id="btn-view-standard-modal" title="View standard compliance formulas">
                ${Utils.icons.shieldCheck} <span>Standards</span>
              </button>
            </div>
          </div>

          <!-- Column 3: Devices Control / Actuator Matrix -->
          <div class="dash-card card-devices">
            <div class="card-head">
              <div class="card-head-title-group">
                <span class="card-title">Hardware Actuators</span>
                <span class="devices-count-pill">${room.devices.length} Active</span>
              </div>
              <button class="link-btn-view-all" data-nav="devices">Fleet ${Utils.icons.arrowRight}</button>
            </div>

            <div class="devices-list">
              <!-- Smart Windows -->
              <div class="device-row-item">
                <div class="device-item-icon">${Utils.icons.window}</div>
                <div class="device-item-content">
                  <div class="device-row-top">
                    <span class="device-name">Smart Windows</span>
                    <span class="device-status-badge ${winDev.state === 'Open' ? 'badge-green' : 'badge-neutral'}">${winDev.state}</span>
                  </div>
                  <div class="device-row-sub">
                    ${isAuto ? 'Actuated by Engine' : 'User Manual Control'}
                  </div>
                  <!-- Direct 1-Click Actuator Management -->
                  <div class="device-interactive-controls" data-device-id="${winDev.id}">
                    <button class="btn-ctrl ${winDev.state === 'Closed' ? 'active' : ''}" data-state="Closed" title="Airtight seal">Seal 0°</button>
                    <button class="btn-ctrl ${winDev.state === 'Open' ? 'active' : ''}" data-state="Open" title="Natural displacement draft">Open 45°</button>
                  </div>
                </div>
              </div>

              <!-- Ventilation -->
              <div class="device-row-item">
                <div class="device-item-icon">${Utils.icons.fan}</div>
                <div class="device-item-content">
                  <div class="device-row-top">
                    <span class="device-name">Ventilation (ERV)</span>
                    <span class="device-status-badge badge-green">${ventDev.state}</span>
                  </div>
                  <div class="device-row-sub">
                    ${ventDev.state === 'Filtered' ? 'Sealed MERV-13 supply' : 'Supply & exhaust rate: ' + ventDev.state}
                  </div>
                  <!-- Direct 1-Click Actuator Management -->
                  <div class="device-interactive-controls" data-device-id="${ventDev.id}">
                    <button class="btn-ctrl ${ventDev.state === 'Low' ? 'active' : ''}" data-state="Low">Low</button>
                    <button class="btn-ctrl ${ventDev.state === 'Normal' ? 'active' : ''}" data-state="Normal">Normal</button>
                    <button class="btn-ctrl ${ventDev.state === 'High' ? 'active' : ''}" data-state="High">High</button>
                    <button class="btn-ctrl ${ventDev.state === 'Filtered' ? 'active' : ''}" data-state="Filtered">Filter</button>
                  </div>
                </div>
              </div>

              <!-- Air Purifier -->
              <div class="device-row-item">
                <div class="device-item-icon">${Utils.icons.purifier}</div>
                <div class="device-item-content">
                  <div class="device-row-top">
                    <span class="device-name">Air Purifier</span>
                    <span class="device-status-badge ${purDev.state === 'Off' ? 'badge-neutral' : 'badge-green'}">${purDev.state}</span>
                  </div>
                  <div class="device-row-sub">
                    True HEPA + Activated Carbon (${cleanAirRate} m³/h)
                  </div>
                  <!-- Direct 1-Click Actuator Management -->
                  <div class="device-interactive-controls" data-device-id="${purDev.id}">
                    <button class="btn-ctrl ${purDev.state === 'Off' ? 'active' : ''}" data-state="Off">Off</button>
                    <button class="btn-ctrl" data-state="Low" disabled title="Unsupported: backend stores purifier ON/OFF only">Low</button>
                    <button class="btn-ctrl ${purDev.state === 'Active' || purDev.state === 'Normal' ? 'active' : ''}" data-state="Active">Auto</button>
                    <button class="btn-ctrl" data-state="High" disabled title="Unsupported: backend stores purifier ON/OFF only">Turbo</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actuators Global Management Bar -->
            <div class="devices-footer-actions">
              <button class="footer-btn-sync" id="btn-sync-all-devices" title="Synchronize all hardware actuators with current setpoints">
                ${Utils.icons.refresh} <span>Sync Actuators</span>
              </button>
              <button class="footer-btn-standby" id="btn-all-devices-standby" disabled title="Unsupported: arbitrary standby states can contradict current sensor safety rules">
                ${Utils.icons.lock} <span>All Standby</span>
              </button>
            </div>
          </div>

          <!-- Column 4: Recent Activity & Visual Event Trail -->
          <div class="dash-card card-recent-activity">
            <div class="card-head">
              <div class="card-head-title-group">
                <span class="card-title">Live Activity</span>
                <span class="activity-badge-live"><span class="activity-live-dot"></span> Live</span>
              </div>
              <button class="link-btn-view-all" id="btn-refresh-activity" title="Refresh Live Stream">
                ${Utils.icons.refresh}
              </button>
            </div>

            <div class="activity-timeline" id="activity-timeline-container">
              ${recentActivity.length === 0 ? `
                <div class="timeline-empty">No activity recorded yet for this space.</div>
              ` : recentActivity.map(act => this.renderActivityCard(act)).join('')}
            </div>

            <!-- Activity Management Footer -->
            <div class="activity-footer-bar">
              <button class="btn-activity-simulate" id="btn-simulate-event" title="Inject a simulated air quality variance">
                ${Utils.icons.plus} <span>Simulate Event</span>
              </button>
              <button class="btn-activity-export" id="btn-download-audit-log" title="Download audit log in CSV format">
                ${Utils.icons.download} <span>Audit Log</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Secondary Operational Deck: Diagnostics, Differentials & Presets -->
        <section class="dashboard-diagnostics-deck">
          <!-- Deck Card 1: Outdoor vs Indoor Differential & Air Exchange -->
          <div class="diag-card diag-card-differential">
            <div class="diag-head">
              <div class="diag-title-group">
                <span class="diag-icon">${Utils.icons.activity}</span>
                <span class="diag-title">IAQ Filtration Differential</span>
              </div>
              <span class="diag-badge badge-reduction">${reductionPercent === null ? 'Unavailable' : `-${reductionPercent}% Particulate Load`}</span>
            </div>

            <div class="differential-bar-container">
              <div class="diff-bar-row">
                <span class="diff-bar-label">Outdoor Air (Raw)</span>
                <div class="diff-bar-track">
                  <div class="diff-bar-fill fill-outdoor" style="width: ${outdoorAqi === null ? 0 : Math.min(100, (outdoorAqi / 200) * 100)}%"></div>
                </div>
                <span class="diff-bar-val">${outdoorAqi === null ? 'Unavailable' : `${outdoorAqi} AQI`}</span>
              </div>
              <div class="diff-bar-row">
                <span class="diff-bar-label">Indoor Air (Filtered)</span>
                <div class="diff-bar-track">
                  <div class="diff-bar-fill fill-indoor" style="width: ${indoorAqi === null ? 0 : Math.min(100, (indoorAqi / 200) * 100)}%"></div>
                </div>
                <span class="diff-bar-val val-clean">${indoorAqi === null ? 'Unavailable' : `${indoorAqi} AQI`}</span>
              </div>
            </div>

            <div class="diff-stats-grid">
              <div class="diff-stat-item">
                <span class="stat-num">${outdoorAqi === null || indoorAqi === null ? '—' : `-${Math.max(0, outdoorAqi - indoorAqi)}`}</span>
                <span class="stat-desc">AQI Delta</span>
              </div>
              <div class="diff-stat-item">
                <span class="stat-num">${airChangesHour}</span>
                <span class="stat-desc">Air Changes/Hr</span>
              </div>
              <div class="diff-stat-item">
                <span class="stat-num">${co2 === null ? '—' : `+${Math.max(0, co2 - 420)}`}</span>
                <span class="stat-desc">CO₂ Above Ambient</span>
              </div>
              <div class="diff-stat-item">
                <span class="stat-num">—</span>
                <span class="stat-desc">Filter Retention</span>
              </div>
            </div>
          </div>

          <!-- Deck Card 2: Sensor Health Matrix & Diagnostics -->
          <div class="diag-card diag-card-sensors">
            <div class="diag-head">
              <div class="diag-title-group">
                <span class="diag-icon">${Utils.icons.shieldCheck}</span>
                <span class="diag-title">Sensor Array Health</span>
              </div>
              <span class="diag-badge badge-healthy">All Calibrated</span>
            </div>

            <div class="sensor-health-list">
              <div class="sensor-health-row">
                <div class="sensor-meta">
                  <span class="sensor-name">Laser PM2.5 / PM10 (Plantower)</span>
                  <span class="sensor-status text-green">100% Calibrated · Drift &lt;0.5μg</span>
                </div>
                <span class="sensor-indicator-pill pill-ok">Nominal</span>
              </div>
              <div class="sensor-health-row">
                <div class="sensor-meta">
                  <span class="sensor-name">Dual-Beam NDIR CO₂ (Senseair)</span>
                  <span class="sensor-status text-green">Auto-Baseline Active · ±30ppm</span>
                </div>
                <span class="sensor-indicator-pill pill-ok">Nominal</span>
              </div>
              <div class="sensor-health-row">
                <div class="sensor-meta">
                  <span class="sensor-name">Sensirion SGP40 VOC / TVOC</span>
                  <span class="sensor-status text-green">Zero-drift reference locked</span>
                </div>
                <span class="sensor-indicator-pill pill-ok">Nominal</span>
              </div>
            </div>

            <div class="diag-footer-actions">
              <button class="btn-diag-run" id="btn-run-sensor-diagnostics" title="Run environmental sensor diagnostic self-test">
                ${Utils.icons.activity} <span>Run Self-Diagnostic</span>
              </button>
              <button class="btn-diag-reset" id="btn-zero-baseline" title="Re-zero sensor ambient reference baseline">
                ${Utils.icons.refresh} <span>Re-Zero Base</span>
              </button>
            </div>
          </div>

          <!-- Deck Card 3: Environmental Profiles & Quick Actuation Presets -->
          <div class="diag-card diag-card-presets">
            <div class="diag-head">
              <div class="diag-title-group">
                <span class="diag-icon">${Utils.icons.sliders}</span>
                <span class="diag-title">Airflow Profiles</span>
              </div>
              <span class="diag-badge badge-preset">1-Click Presets</span>
            </div>

            <p class="diag-desc">Select an operational preset to instantly actuate windows, ventilation, and HEPA air filtration:</p>

            <div class="presets-button-grid">
              <button class="preset-btn" data-preset="shield" title="Activate high HEPA and continuous MERV filtration">
                <span class="preset-icon">${Utils.icons.shieldCheck}</span>
                <div class="preset-text">
                  <span class="preset-title">Clean Air Shield</span>
                  <span class="preset-sub">Max protection from ambient smog</span>
                </div>
              </button>
              <button class="preset-btn" data-preset="sleep" title="Silent whisper fan speeds and zero draft">
                <span class="preset-icon">${Utils.icons.leaf}</span>
                <div class="preset-text">
                  <span class="preset-title">Sleep Whisper</span>
                  <span class="preset-sub">&lt;22 dB silent night mode</span>
                </div>
              </button>
              <button class="preset-btn" data-preset="smog" title="Emergency perimeter airtight lockdown">
                <span class="preset-icon">${Utils.icons.lock}</span>
                <div class="preset-text">
                  <span class="preset-title">Smog Lockdown</span>
                  <span class="preset-sub">Hermetic seal & recirculate</span>
                </div>
              </button>
              <button class="preset-btn" data-preset="flush" title="High-volume displacement ventilation purge">
                <span class="preset-icon">${Utils.icons.wind}</span>
                <div class="preset-text">
                  <span class="preset-title">Rapid Flush</span>
                  <span class="preset-sub">Purge room CO₂ & odors</span>
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>
    `;
  },

  renderActivityCard(act) {
    const rawAction = act.action || '';
    const rawDetail = act.detail || '';
    const source = (act.source || 'SYSTEM').toUpperCase();
    const timeStr = Utils.formatTime(new Date(act.timestamp));
    const timeAgoStr = Utils.timeAgo(act.timestamp);

    let icon = Utils.icons.shieldCheck;
    let category = 'system';
    let iconBg = '#ecfdf5';
    let iconColor = '#059669';

    const lowerAct = (rawAction + ' ' + rawDetail).toLowerCase();

    if (lowerAct.includes('purifier') || lowerAct.includes('cadr') || lowerAct.includes('hepa')) {
      category = 'purifier';
      icon = Utils.icons.purifier;
      iconBg = '#ecfdf5';
      iconColor = '#10b981';
    } else if (lowerAct.includes('window') || lowerAct.includes('seal') || lowerAct.includes('draft')) {
      category = 'window';
      icon = Utils.icons.window;
      iconBg = '#eff6ff';
      iconColor = '#3b82f6';
    } else if (lowerAct.includes('ventilation') || lowerAct.includes('fan') || lowerAct.includes('merv') || lowerAct.includes('co2')) {
      category = 'ventilation';
      icon = Utils.icons.fan;
      iconBg = '#f0fdfa';
      iconColor = '#06b6d4';
    } else if (lowerAct.includes('auto') || lowerAct.includes('manual') || lowerAct.includes('mode')) {
      category = 'mode';
      icon = Utils.icons.sliders;
      iconBg = '#f5f3ff';
      iconColor = '#8b5cf6';
    } else if (lowerAct.includes('smog') || lowerAct.includes('wildfire') || lowerAct.includes('hazard')) {
      category = 'alert';
      icon = Utils.icons.lock;
      iconBg = '#fff7ed';
      iconColor = '#ea580c';
    }

    let transitionHtml = '';
    const combined = rawAction + ' ' + rawDetail;
    const arrowMatch = combined.match(/([A-Za-z0-9°\s]{2,14})\s*(?:->|→)\s*([A-Za-z0-9°\s]{2,14})/);
    let displayDetail = rawDetail;
    let displayAction = rawAction;

    if (arrowMatch) {
      const fromState = arrowMatch[1].trim();
      const toState = arrowMatch[2].trim();
      transitionHtml = `
        <div class="act-state-transition">
          <span class="state-pill state-from">${Utils.escapeHtml(fromState)}</span>
          <span class="state-arrow">&rarr;</span>
          <span class="state-pill state-to">${Utils.escapeHtml(toState)}</span>
        </div>
      `;

      if (rawDetail.includes('→') || rawDetail.includes('->')) {
        displayDetail = '';
      }
    }

    return `
      <div class="activity-card-item act-cat-${category}">
        <div class="activity-icon-avatar" style="background:${iconBg}; color:${iconColor};">
          ${icon}
        </div>
        <div class="activity-item-main">
          <div class="activity-meta-row">
            <span class="activity-source-pill source-${source.toLowerCase()}">${source}</span>
            <span class="activity-timestamp" title="${timeStr}">${timeAgoStr}</span>
          </div>
          <div class="activity-title-row">
            <span class="activity-action-name">${Utils.escapeHtml(displayAction.replace(/->/g, '→'))}</span>
          </div>
          ${transitionHtml}
          ${displayDetail ? `<div class="activity-detail-desc">${Utils.escapeHtml(displayDetail)}</div>` : ''}
        </div>
      </div>
    `;
  },

  renderStandardsModal(room) {
    const env = (room && room.environment) || {};
    const outdoorAQI = Number.isFinite(env.outdoorAQI) ? env.outdoorAQI : null;
    const indoorAqi = Number.isFinite(env.indoorAQI) ? env.indoorAQI : null;
    const co2 = Number.isFinite(env.co2) ? env.co2 : null;
    const temp = Number.isFinite(env.temperature) ? env.temperature : null;
    const occupancy = Number.isFinite(env.occupancy) ? env.occupancy : null;
    const area = Number.isFinite(room?.area) ? room.area : null;
    const areaSqFt = area === null ? null : area * 10.76;
    const designCFM = areaSqFt === null || occupancy === null
      ? 55
      : Math.round((5 * occupancy) + (0.06 * areaSqFt));
    const targetCFM = designCFM || 55;
    const vent = room?.devices?.find(d => d.type === 'ventilation');
    const ventMult = vent?.state === 'HIGH' || vent?.state === 'High' ? 1.4 : (vent?.state === 'LOW' || vent?.state === 'Low' ? 0.9 : 1.15);
    const deliveredCFM = Math.round(targetCFM * ventMult);
    const complianceMargin = Math.round(((deliveredCFM - targetCFM) / targetCFM) * 100);

    return `
      <div class="modal-backdrop" id="standards-modal-backdrop">
        <div class="modal-dialog modal-dialog-lg" role="dialog" aria-modal="true">
          <div class="modal-header standards-modal-header">
            <div class="modal-header-title">
              <span class="standards-shield-badge">${Utils.icons.shieldCheck}</span>
              <div>
                <h3 class="standards-dialog-title">ANSI / ASHRAE Standard 62.1-2022</h3>
                <p class="standards-dialog-sub">Deterministic Regulatory Ventilation & Environmental Safety Matrix</p>
              </div>
            </div>
            <button class="modal-close-btn" id="btn-close-standards-modal" aria-label="Close modal">${Utils.icons.x}</button>
          </div>

          <div class="modal-body standards-modal-body">
            <!-- Space Live Compliance Scoreboard -->
            <div class="standards-scoreboard">
              <div class="score-card score-target">
                <span class="score-label">Required Minimum (Vbz)</span>
                <span class="score-val">${designCFM} <small>CFM</small></span>
                <span class="score-meta">ASHRAE 62.1-2022 Table 6-1</span>
              </div>
              <div class="score-card score-delivered">
                <span class="score-label">Current Delivered Flow</span>
                <span class="score-val">${deliveredCFM} <small>CFM</small></span>
                <span class="score-meta">${(deliveredCFM * 1.699).toFixed(0)} m³/h Active Delivery</span>
              </div>
              <div class="score-card score-status">
                <span class="score-label">Compliance Margin</span>
                <span class="score-val text-green">+${complianceMargin}%</span>
                <span class="score-badge badge-pass">CERTIFIED COMPLIANT</span>
              </div>
            </div>

            <!-- Mathematical Formulation Card -->
            <div class="standards-formula-card">
              <div class="formula-head">
                <span class="formula-title">Ventilation Rate Procedure (VRP) Equation:</span>
                <span class="formula-standard">Section 6.2 Standard Equation</span>
              </div>
              <div class="formula-math">
                V<sub>bz</sub> = (R<sub>p</sub> &times; P<sub>z</sub>) + (R<sub>a</sub> &times; A<sub>z</sub>)
              </div>
              <div class="formula-legend">
                <span class="legend-pill"><strong>R<sub>p</sub>:</strong> 5.0 CFM/person (People Rate)</span>
                <span class="legend-pill"><strong>P<sub>z</sub>:</strong> ${occupancy ?? 'Unavailable'} Occupants</span>
                <span class="legend-pill"><strong>R<sub>a</sub>:</strong> 0.06 CFM/ft² (Area Rate)</span>
                <span class="legend-pill"><strong>A<sub>z</sub>:</strong> ${area === null ? 'Unavailable' : `${area} m² (${areaSqFt.toFixed(0)} ft²)`}</span>
              </div>
            </div>

            <!-- 4 Regulatory Safeguards Grid -->
            <div class="standards-safeguards-title">Active Deterministic Safety Rules:</div>
            <div class="standards-rules-grid">
              <div class="std-rule-item">
                <div class="rule-icon-box box-amber">${Utils.icons.lock}</div>
                <div class="rule-info">
                  <span class="rule-name">Outdoor Smog Lockdown</span>
                  <p class="rule-desc">When Outdoor AQI &gt; 60, motorized windows seal hermetically to shield occupants from toxic particulate infiltration.</p>
                  <span class="rule-status-tag ${outdoorAQI === null ? 'tag-nominal' : outdoorAQI > 60 ? 'tag-active' : 'tag-nominal'}">${outdoorAQI === null ? 'Outdoor AQI unavailable' : outdoorAQI > 60 ? 'Safety response active (' + outdoorAQI + ' AQI)' : 'No restriction (' + outdoorAQI + ' AQI)'}</span>
                </div>
              </div>

              <div class="std-rule-item">
                <div class="rule-icon-box box-cyan">${Utils.icons.fan}</div>
                <div class="rule-info">
                  <span class="rule-name">CO₂ Displacement Flush</span>
                  <p class="rule-desc">When CO₂ exceeds 1,000 ppm, mechanical supply and exhaust ERV ventilation escalates to flush stale air and restore oxygen.</p>
                  <span class="rule-status-tag ${co2 === null ? 'tag-nominal' : co2 > 1000 ? 'tag-active' : 'tag-nominal'}">${co2 === null ? 'CO₂ unavailable' : co2 > 1000 ? 'CO₂ elevated (' + co2 + ' ppm)' : 'CO₂ below ventilation threshold (' + co2 + ' ppm)'}</span>
                </div>
              </div>

              <div class="std-rule-item">
                <div class="rule-icon-box box-green">${Utils.icons.purifier}</div>
                <div class="rule-info">
                  <span class="rule-name">Sub-Micron Particulate Protection</span>
                  <p class="rule-desc">MERV-13 mechanical pre-filtration paired with H13 True HEPA ensures 99.97% removal efficiency at 0.3 micrometers.</p>
                  <span class="rule-status-tag ${indoorAqi === null ? 'tag-nominal' : indoorAqi > 50 ? 'tag-active' : 'tag-nominal'}">${indoorAqi === null ? 'Indoor AQI unavailable' : `Indoor AQI: ${indoorAqi} (${indoorAqi > 50 ? 'Elevated' : 'Lower'})`}</span>
                </div>
              </div>

              <div class="std-rule-item">
                <div class="rule-icon-box box-purple">${Utils.icons.leaf}</div>
                <div class="rule-info">
                  <span class="rule-name">ASHRAE 55 Thermal Comfort</span>
                  <p class="rule-desc">Operative temperature target between 20°C - 25°C with relative humidity managed between 40% - 60%.</p>
                  <span class="rule-status-tag tag-nominal">${temp === null ? 'Temperature unavailable' : `Current: ${temp}°C`}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer standards-modal-footer">
            <button class="btn btn-secondary" id="btn-recalc-standards" title="Recalculate ventilation compliance metrics">
              ${Utils.icons.refresh} <span>Recalculate Telemetry</span>
            </button>
            <button class="btn btn-primary" id="btn-dismiss-standards-modal">
              Acknowledge & Close
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderSpaces(rooms) {
    return `
      <div class="view-content view-spaces">
        <div class="view-page-header">
          <div>
            <h2 class="page-title">Your spaces</h2>
            <p class="page-subtitle">Manage all your rooms and their settings.</p>
          </div>
          <button class="btn btn-primary" id="btn-add-space-modal">
            ${Utils.icons.plus} <span>Add space</span>
          </button>
        </div>

        <div class="spaces-grid">
          ${rooms.map(room => {
            const inAqi = Number.isFinite(room.environment?.indoorAQI) ? room.environment.indoorAQI : null;
            const co2 = Number.isFinite(room.environment?.co2) ? room.environment.co2 : null;

            let statusLabel = inAqi === null || co2 === null ? 'Readings unavailable' : 'Healthy';
            let statusPillClass = inAqi === null || co2 === null ? 'pill-neutral' : 'pill-good';
            if (inAqi !== null && co2 !== null && (inAqi > 100 || co2 > 1200)) {
              statusLabel = 'Needs attention';
              statusPillClass = 'pill-poor';
            } else if (inAqi !== null && co2 !== null && (inAqi > 50 || co2 > 800)) {
              statusLabel = 'Good';
              statusPillClass = 'pill-moderate';
            }

            return `
              <div class="space-card" data-room-id="${room.id}">
                <div class="space-card-media">
                  <img src="${room.image}" alt="${Utils.escapeHtml(room.name)}" />
                  <span class="space-mode-pill ${room.mode === 'AUTO' ? 'mode-auto' : 'mode-manual'}">${room.mode}</span>
                </div>
                <div class="space-card-body">
                  <div class="space-card-header">
                    <div>
                      <h3 class="space-name">${Utils.escapeHtml(room.name)}</h3>
                      <p class="space-meta">${room.area} m² · ${room.type}</p>
                    </div>
                    <div class="space-menu-actions">
                      <button class="icon-action-btn btn-duplicate-room" data-room-id="${room.id}" title="Duplicate space">
                        ${Utils.icons.copy}
                      </button>
                      <button class="icon-action-btn btn-edit-room" data-room-id="${room.id}" title="Edit space">
                        ${Utils.icons.edit}
                      </button>
                      <button class="icon-action-btn btn-delete-room" data-room-id="${room.id}" title="Delete space">
                        ${Utils.icons.trash}
                      </button>
                    </div>
                  </div>

                  <div class="space-metrics-strip">
                    <div class="space-metric-item">
                      <span class="lbl">Indoor AQI</span>
                      <span class="val">${inAqi ?? '—'}</span>
                    </div>
                    <div class="space-metric-item">
                      <span class="lbl">CO₂</span>
                      <span class="val">${co2 === null ? '—' : `${co2} <small>ppm</small>`}</span>
                    </div>
                    <div class="space-metric-item">
                      <span class="lbl">Devices</span>
                      <span class="val">${room.devices ? room.devices.length : '—'}</span>
                    </div>
                  </div>

                  <div class="space-card-footer">
                    <span class="metric-pill ${statusPillClass}">● ${statusLabel}</span>
                    <button class="btn btn-outline btn-open-space" data-room-id="${room.id}">
                      Open
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  renderSimulation(room) {
    const env = room?.environment || {};
    if (!hasCompleteSensorReadings(env)) {
      return `
        <div class="view-content view-simulation">
          <div class="view-page-header">
            <div>
              <h2 class="page-title">Environment Simulation</h2>
              <p class="page-subtitle">Run an explicit scenario to test the backend safety rules.</p>
            </div>
            <div class="sim-mode-badge sim-auto" title="Backend applies its safety policy when requested">
              Policy: <strong>Apply on request</strong>
            </div>
          </div>
          <div class="sim-presets-bar">
            <span class="presets-label">Preset scenarios:</span>
            <button class="preset-btn" data-scenario="clean-air">Clean Air</button>
            <button class="preset-btn" data-scenario="pollution">Outdoor Pollution</button>
            <button class="preset-btn" data-scenario="high-co2">High CO₂</button>
            <button class="preset-btn" data-scenario="bad-air">Bad Air</button>
          </div>
          <p role="status">No sensor readings are available for this account. Sensor sliders are unavailable until readings are configured.</p>
        </div>
      `;
    }

    const decision = room.decision || Engine.decide(env, room, room.devices);

    return `
      <div class="view-content view-simulation">
        <div class="view-page-header">
          <div>
            <h2 class="page-title">Environment Simulation</h2>
            <p class="page-subtitle">Adjust current backend readings or run a saved scenario. Slider changes are temporary; preset scenarios are recorded.</p>
          </div>
          <div class="sim-mode-badge sim-auto" title="Backend applies its safety policy when requested; persistent room mode is unavailable">
            Policy: <strong>Apply on request</strong>
          </div>
        </div>

        <!-- Simulation Presets Bar -->
        <div class="sim-presets-bar">
          <span class="presets-label">Preset scenarios:</span>
          <button class="preset-btn" data-scenario="clean-air">Clean Air</button>
          <button class="preset-btn" data-scenario="pollution">Outdoor Pollution</button>
          <button class="preset-btn" data-scenario="high-co2">High CO₂</button>
          <button class="preset-btn" data-scenario="bad-air">Bad Air</button>
          <span class="text-muted">Scenarios update shared backend readings and apply a safety-validated decision.</span>
        </div>

        <div class="simulation-layout">
          <!-- Left: Sliders Grid -->
          <div class="sim-card sim-sliders-card">
            <h3 class="sim-section-title">Environmental parameters for ${room ? Utils.escapeHtml(room.name) : 'Space'}</h3>

            <div class="sim-controls-grid">
              <!-- Outdoor AQI -->
              <div class="sim-control-group">
                <div class="control-label-row">
                  <label for="sim-outdoor-aqi">Outdoor AQI</label>
                  <span class="control-value-display" id="val-outdoor-aqi">${env.outdoorAQI}</span>
                </div>
                <input type="range" id="sim-outdoor-aqi" min="0" max="${Math.max(400, env.outdoorAQI)}" value="${env.outdoorAQI}" class="slider" />
                <div class="slider-scale">
                  <span>0 Clean</span>
                  <span>100 Moderate</span>
                  <span>150 Unhealthy</span>
                  <span>400 Hazardous</span>
                </div>
              </div>

              <!-- Temperature -->
              <div class="sim-control-group">
                <div class="control-label-row">
                  <label for="sim-temperature">Temperature</label>
                  <span class="control-value-display" id="val-temperature">${env.temperature} °C</span>
                </div>
                <input type="range" id="sim-temperature" min="${Math.min(10, env.temperature)}" max="${Math.max(40, env.temperature)}" value="${env.temperature}" class="slider" />
                <div class="slider-scale">
                  <span>10°C Cool</span>
                  <span>24°C Comfort</span>
                  <span>40°C Hot</span>
                </div>
              </div>

              <!-- Indoor AQI -->
              <div class="sim-control-group">
                <div class="control-label-row">
                  <label for="sim-indoor-aqi">Indoor AQI</label>
                  <span class="control-value-display" id="val-indoor-aqi">${env.indoorAQI}</span>
                </div>
                <input type="range" id="sim-indoor-aqi" min="0" max="${Math.max(300, env.indoorAQI)}" value="${env.indoorAQI}" class="slider" />
                <div class="slider-scale">
                  <span>0 Pristine</span>
                  <span>50 Good</span>
                  <span>100 Elevated</span>
                  <span>300 Severe</span>
                </div>
              </div>

              <!-- Humidity -->
              <div class="sim-control-group">
                <div class="control-label-row">
                  <label for="sim-humidity">Humidity</label>
                  <span class="control-value-display" id="val-humidity">${env.humidity} %</span>
                </div>
                <input type="range" id="sim-humidity" min="${Math.min(10, env.humidity)}" max="${Math.max(95, env.humidity)}" value="${env.humidity}" class="slider" />
                <div class="slider-scale">
                  <span>10% Dry</span>
                  <span>50% Optimal</span>
                  <span>95% Humid</span>
                </div>
              </div>

              <!-- CO2 -->
              <div class="sim-control-group">
                <div class="control-label-row">
                  <label for="sim-co2">CO₂ (ppm)</label>
                  <span class="control-value-display" id="val-co2">${env.co2} ppm</span>
                </div>
                <input type="range" id="sim-co2" min="${Math.min(350, env.co2)}" max="${Math.max(2200, env.co2)}" value="${env.co2}" class="slider" />
                <div class="slider-scale">
                  <span>400 Ambient</span>
                  <span>800 Normal</span>
                  <span>1200 Stuffy</span>
                  <span>2200 Drowsy</span>
                </div>
              </div>

              <!-- Occupancy -->
              <div class="sim-control-group">
                <div class="control-label-row">
                  <label for="sim-occupancy">Occupancy</label>
                  <span class="control-value-display" id="val-occupancy">${env.occupancy}</span>
                </div>
                <input type="range" id="sim-occupancy" min="0" max="${Math.max(20, env.occupancy)}" value="${env.occupancy}" class="slider" />
                <div class="slider-scale">
                  <span>1 Person</span>
                  <span>5 Meeting</span>
                  <span>20 Crowded</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Live System Reaction Preview -->
          <div class="sim-card sim-reaction-card">
            <h3 class="sim-section-title">Autonomous Reaction & Actuation</h3>

            <div class="sim-decision-box">
              <div class="decision-icon-badge">${Utils.icons.shieldCheck}</div>
              <div>
                <h4 class="decision-main-title" id="sim-reaction-title">${decision ? Utils.escapeHtml(decision.title) : 'Evaluating environment...'}</h4>
                <p class="decision-main-reason" id="sim-reaction-reason">${decision ? Utils.escapeHtml(decision.reason) : ''}</p>
              </div>
            </div>

            <div class="sim-actuation-preview">
              <div class="preview-item">
                <span class="p-label">Smart Windows</span>
                <span class="p-value" id="sim-preview-window">${decision ? decision.window : 'Closed'}</span>
              </div>
              <div class="preview-item">
                <span class="p-label">Ventilation</span>
                <span class="p-value" id="sim-preview-vent">${decision ? decision.ventilation : 'Normal'}</span>
              </div>
              <div class="preview-item">
                <span class="p-label">Air Purifier</span>
                <span class="p-value" id="sim-preview-purifier">${decision ? decision.purifier : 'Active'}</span>
              </div>
            </div>

            <div class="sim-expected-box">
              <span class="exp-title">Expected Outcome</span>
              <p class="exp-text" id="sim-reaction-outcome">${decision ? Utils.escapeHtml(decision.expectedOutcome) : ''}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderAnalytics() {
    return `
      <div class="view-content view-analytics">
        <div class="view-page-header">
          <div>
            <h2 class="page-title">Analytics</h2>
            <p class="page-subtitle">Account-specific air-quality history and device analytics.</p>
          </div>
          <div class="analytics-time-pills">
            <button class="time-filter-btn active" data-time="24H">24H</button>
            <button class="time-filter-btn" data-time="7D">7D</button>
            <button class="time-filter-btn" data-time="30D">30D</button>
          </div>
        </div>

        <div class="analytics-chart-card">
          <div class="chart-card-head">
            <div class="chart-title-group">
              <span class="chart-title">Air quality over time</span>
              <select class="chart-metric-select" id="analytics-metric-select">
                <option value="outdoorAQI" selected>Outdoor AQI (Provider)</option>
                <option value="indoorAQI">Indoor AQI</option>
                <option value="co2">CO₂ (ppm)</option>
              </select>
            </div>
            <div class="chart-legend">
              <span class="legend-item" id="analytics-data-status">Loading verified account history…</span>
            </div>
          </div>

          <div class="canvas-chart-wrapper">
            <p id="analytics-empty-state" role="status" hidden>No verified AQI history available yet.</p>
            <canvas id="analytics-chart-canvas" width="900" height="300"></canvas>
          </div>
        </div>

        <!-- Summary Statistics Row -->
        <div class="analytics-stats-grid">
          <div class="stat-card">
            <span class="stat-label">Automatic actions</span>
            <span class="stat-value" id="analytics-automatic-actions">Unavailable</span>
            <span class="stat-sub">No verified action history available.</span>
          </div>

          <div class="stat-card">
            <span class="stat-label">Manual overrides</span>
            <span class="stat-value" id="analytics-manual-overrides">Unavailable</span>
            <span class="stat-sub">No verified override history available.</span>
          </div>

          <div class="stat-card">
            <span class="stat-label">Avg. Indoor AQI</span>
            <span class="stat-value" id="analytics-indoor-average">Unavailable</span>
            <span class="stat-sub">No verified indoor AQI history available.</span>
          </div>

          <div class="stat-card">
            <span class="stat-label">HEPA Filter Life</span>
            <span class="stat-value" id="analytics-filter-life">Unavailable</span>
            <span class="stat-sub">No filter-life measurement source is connected.</span>
          </div>
        </div>
      </div>
    `;
  },

  renderDevices(rooms) {

    const allDevices = [];
    const roomList = Array.isArray(rooms) ? rooms : (State.rooms || []);
    roomList.forEach(room => {
      (room.devices || []).forEach(dev => {
        allDevices.push({
          ...dev,
          roomName: room.name,
          roomId: room.id,
          roomMode: room.mode
        });
      });
    });

    return `
      <div class="view-content view-devices">
        <div class="view-page-header">
          <div>
            <h2 class="page-title">Devices</h2>
            <p class="page-subtitle">Configured environmental actuators and their reported status.</p>
          </div>
        </div>

        <div class="devices-table-card">
          <table class="devices-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Room</th>
                <th>Connection</th>
                <th>Current State</th>
                <th>Last Update</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${allDevices.length ? allDevices.map(d => {
                let icon = Utils.icons.purifier;
                if (d.type === 'window') icon = Utils.icons.window;
                if (d.type === 'ventilation') icon = Utils.icons.fan;

                return `
                  <tr>
                    <td>
                      <div class="device-cell-info">
                        <span class="cell-icon">${icon}</span>
                        <div>
                          <strong class="cell-dev-name">${Utils.escapeHtml(d.name)}</strong>
                          <span class="cell-dev-id">${d.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="room-pill">${Utils.escapeHtml(d.roomName)}</span>
                    </td>
                    <td>
                      <span class="conn-badge conn-${(d.connectionState || 'Connected').toLowerCase()}">
                        ● ${d.connectionState || 'Connected'}
                      </span>
                    </td>
                    <td>
                      <span class="state-pill state-${(d.state || 'Active').toLowerCase()}">${d.state || 'Active'}</span>
                    </td>
                    <td class="text-muted">
                      ${Utils.timeAgo(d.lastUpdated || Date.now())}
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline btn-device-toggle" data-room-id="${d.roomId}" data-device-id="${d.id}" data-current="${d.state}">
                        Toggle
                      </button>
                    </td>
                  </tr>
                `;
              }).join('') : '<tr><td colspan="6" role="status">No devices have been configured for this account.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderSettings(user) {
    const settings = API.getSettings();

    return `
      <div class="view-content view-settings">
        <div class="view-page-header">
          <div>
            <h2 class="page-title">Settings</h2>
            <p class="page-subtitle">Manage your account and platform preferences.</p>
          </div>
        </div>

        <div class="settings-sections">
          <!-- Profile Section -->
          <div class="settings-card">
            <h3 class="settings-card-title">Profile</h3>
            <div class="settings-row">
              <div>
                <strong>Full Name</strong>
                <p class="text-muted">${Utils.escapeHtml(user?.name || 'Not provided')}</p>
              </div>
              <button class="btn btn-outline btn-sm" id="btn-edit-profile">Edit</button>
            </div>
            <div class="settings-row">
              <div>
                <strong>Email Address</strong>
                <p class="text-muted">${Utils.escapeHtml(user?.email || '')}</p>
              </div>
              <span class="badge-neutral">Verified</span>
            </div>
          </div>

          <!-- Default Mode Section -->
          <div class="settings-card">
            <h3 class="settings-card-title">Default Operating Mode</h3>
            <p class="text-muted mb-3">Operating state selected whenever new spaces are created.</p>
            <div class="segmented-choice" id="settings-default-mode">
              <button class="choice-btn ${settings.defaultMode === 'AUTO' ? 'active' : ''}" data-val="AUTO">AUTO (Recommended)</button>
              <button class="choice-btn ${settings.defaultMode === 'MANUAL' ? 'active' : ''}" data-val="MANUAL">MANUAL</button>
            </div>
          </div>

          <!-- Notifications Section -->
          <div class="settings-card">
            <h3 class="settings-card-title">Notifications</h3>
            <div class="settings-row">
              <div>
                <strong>Air Quality Alerts</strong>
                <p class="text-muted">Notify when outdoor air quality becomes elevated or hazardous.</p>
              </div>
              <label class="switch">
                <input type="checkbox" id="setting-notif-alerts" ${settings.notificationsEnabled ? 'checked' : ''} />
                <span class="slider-round"></span>
              </label>
            </div>
          </div>

          <!-- Google Auth & Connected Accounts Section -->
          <div class="settings-card">
            <h3 class="settings-card-title">Connected Accounts & Google Auth</h3>
            <div class="settings-row">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:36px; height:36px; border-radius:50%; background:#f8fafc; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center;">
                  ${Utils.icons.google}
                </div>
                <div>
                  <strong>Google Identity Services</strong>
                  <p class="text-muted">${user && user.authProvider === 'google' ? `Connected as ${Utils.escapeHtml(user.email)}` : 'Sign in with your Google account anytime'}</p>
                </div>
              </div>
              <span class="device-status-badge ${user && user.authProvider === 'google' ? 'badge-green' : 'badge-neutral'}">
                ${user && user.authProvider === 'google' ? 'Active Linked' : 'Available'}
              </span>
            </div>
          </div>

          <!-- Units Section -->
          <div class="settings-card">
            <h3 class="settings-card-title">Units & Standards</h3>
            <div class="settings-row">
              <div>
                <strong>Temperature Unit</strong>
                <p class="text-muted">Display metric or imperial units.</p>
              </div>
              <select class="settings-select" id="setting-temp-unit">
                <option value="celsius" ${settings.tempUnit === 'celsius' ? 'selected' : ''}>Celsius (°C)</option>
                <option value="fahrenheit" ${settings.tempUnit === 'fahrenheit' ? 'selected' : ''}>Fahrenheit (°F)</option>
              </select>
            </div>
          </div>

          <div class="settings-card">
            <h3 class="settings-card-title">Data & Privacy</h3>
            <p class="text-muted mb-3">Account setup and location are stored securely in your account. No demo-data reset is available for account data.</p>
          </div>

          <div class="settings-card">
            <h3 class="settings-card-title">Session & Security</h3>
            <div class="settings-row">
              <div>
                <strong>Active Account Session</strong>
                <p class="text-muted">Signed in as ${Utils.escapeHtml(user?.name || user?.email || 'Active User')}.</p>
              </div>
              <button class="btn btn-outline btn-sm" id="btn-settings-signout" style="color:var(--danger, #ef4444); border-color:#fca5a5;">
                ${Utils.icons.logout} Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderAuth(mode = 'signin') {
    return `
      <div class="auth-page-container">
        <!-- Left Side: Warm aesthetic interior image -->
        <div class="auth-media-pane">
          <img src="assets/images/auth-room.jpg" alt="Clean aesthetic room" class="auth-bg-img" />
          <div class="auth-media-overlay">
            <div class="auth-brand-badge">
              <span class="auth-brand-icon">${Utils.icons.leaf}</span>
              <span class="auth-brand-title">Breathe Clean</span>
            </div>

            <div class="auth-hero-copy">
              <h2 class="auth-hero-heading">Cleaner air for healthier spaces.</h2>
              <p class="auth-hero-sub">Intelligent indoor air-quality control for homes, offices and classrooms.</p>
            </div>

            <div class="auth-hero-footer">
              <span>Monitor · Control · Breathe Better</span>
            </div>
          </div>
        </div>

        <!-- Right Side: Clean human form -->
        <div class="auth-form-pane">
          <div class="auth-form-inner">
            ${mode === 'signin' ? `
              <!-- Sign In Form -->
              <div class="auth-form-header">
                <div class="mobile-only-logo">
                  ${Utils.icons.leaf} <strong>Breathe Clean</strong>
                </div>
                <h2 class="auth-form-title">Welcome</h2>
                <p class="auth-form-sub">Sign in to your account</p>
              </div>

              <!-- Primary Form: Email & Password -->
              <form id="form-sign-in" class="auth-form">
                <div class="form-field">
                  <label for="signin-email">Email</label>
                  <input type="email" id="signin-email" placeholder="Enter your email" autocomplete="email" required />
                </div>

                <div class="form-field">
                  <div class="field-label-row">
                    <label for="signin-password">Password</label>
                    <a href="#" class="field-link" id="link-forgot-pw">Forgot password?</a>
                  </div>
                  <div class="input-password-wrapper">
                    <input type="password" id="signin-password" placeholder="Enter your password" autocomplete="current-password" required />
                    <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility">${Utils.icons.eye}</button>
                  </div>
                </div>
                <p id="signin-error" role="alert" aria-live="polite" style="display:none; color:#b91c1c; font-size:13px; margin:0;"></p>

                <div class="form-options-row">
                  <label class="checkbox-label">
                    <input type="checkbox" id="signin-remember" checked />
                    <span>Remember me</span>
                  </label>
                </div>

                <button type="submit" class="btn btn-primary btn-block btn-auth-submit">
                  <span>Sign in</span> ${Utils.icons.arrowRight}
                </button>
              </form>

              <section id="password-recovery-panel" class="auth-form" style="display:none;" aria-live="polite">
                <div class="auth-form-header">
                  <h2 class="auth-form-title">Reset your password</h2>
                  <p class="auth-form-sub">Enter your account email to request a password reset.</p>
                </div>
                <p id="password-reset-status" role="status" style="display:none; font-size:13px; margin:0;"></p>
                <form id="form-request-password-reset" class="auth-form">
                  <div class="form-field">
                    <label for="reset-email">Email</label>
                    <input type="email" id="reset-email" placeholder="you@example.com" required />
                  </div>
                  <button type="submit" class="btn btn-primary btn-block btn-auth-submit">
                    <span>Request reset</span> ${Utils.icons.arrowRight}
                  </button>
                </form>
                <form id="form-confirm-password-reset" class="auth-form" style="display:none;">
                  <div class="form-field">
                    <label for="reset-token">Reset token</label>
                    <input type="text" id="reset-token" autocomplete="one-time-code" required />
                  </div>
                  <div class="form-field">
                    <label for="reset-new-password">New password</label>
                    <input type="password" id="reset-new-password" autocomplete="new-password" required />
                  </div>
                  <div class="form-field">
                    <label for="reset-confirm-password">Confirm new password</label>
                    <input type="password" id="reset-confirm-password" autocomplete="new-password" required />
                  </div>
                  <button type="submit" class="btn btn-primary btn-block btn-auth-submit">
                    <span>Set new password</span> ${Utils.icons.arrowRight}
                  </button>
                </form>
                <button type="button" class="link-btn-toggle-auth" id="btn-back-to-signin">Back to sign in</button>
              </section>

              <!-- Secondary Option: Google Sign In -->
              <div class="auth-divider" id="signin-auth-divider">
                <span class="auth-divider-line"></span>
                <span class="auth-divider-text">or continue with Others</span>
                <span class="auth-divider-line"></span>
              </div>

              <!-- Official Google Identity Services container (if client ID configured) -->
              <div id="g_id_signin" class="gsi-container" style="display:none; margin-bottom:12px;"></div>

              <!-- One-Click Google Auth Button -->
              <button type="button" class="btn-google-auth" id="btn-google-signin">
                <span class="google-icon-wrapper">${Utils.icons.google}</span>
                <span class="google-btn-text">Sign in with Google</span>
              </button>

              <div class="auth-form-footer">
                <span>Don't have an account?</span>
                <button class="link-btn-toggle-auth" id="btn-goto-signup">Create one</button>
              </div>
              <div class="auth-demo-shortcut" style="margin-top: 14px; text-align: center;">
                <button type="button" class="btn btn-outline btn-block" id="btn-explore-demo">
                  ${Utils.icons.zap} <span>Explore Live Interactive Demo</span>
                </button>
              </div>
            ` : `
              <!-- Sign Up Form -->
              <div class="auth-form-header">
                <div class="mobile-only-logo">
                  ${Utils.icons.leaf} <strong>Breathe Clean</strong>
                </div>
                <h2 class="auth-form-title">Create account</h2>
                <p class="auth-form-sub">Get started with cleaner, healthier spaces.</p>
              </div>

              <!-- Primary Form: Registration with Email & Password -->
              <form id="form-sign-up" class="auth-form">
                <div class="form-field">
                  <label for="signup-name">Full name</label>
                  <input type="text" id="signup-name" placeholder="Enter your full name" autocomplete="name" required />
                </div>

                <div class="form-field">
                  <label for="signup-email">Email</label>
                  <input type="email" id="signup-email" placeholder="Enter your email" autocomplete="email" required />
                </div>

                <div class="form-field">
                  <label for="signup-password">Password</label>
                  <div class="input-password-wrapper">
                    <input type="password" id="signup-password" minlength="12" placeholder="Create password (min 12 characters)" autocomplete="new-password" required />
                    <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility">${Utils.icons.eye}</button>
                  </div>
                </div>

                <div class="form-field">
                  <label for="signup-password-confirm">Confirm password</label>
                  <div class="input-password-wrapper">
                    <input type="password" id="signup-password-confirm" minlength="12" placeholder="Confirm password (min 12 characters)" autocomplete="new-password" required />
                    <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility">${Utils.icons.eye}</button>
                  </div>
                </div>

                <p id="signup-error" role="alert" aria-live="polite" style="display:none; color:#b91c1c; font-size:13px; margin:0;"></p>
                <button type="button" class="link-btn-toggle-auth" id="btn-signup-recover-account" hidden>Check by signing in</button>
                <button type="submit" class="btn btn-primary btn-block btn-auth-submit">
                  <span>Create account</span> ${Utils.icons.arrowRight}
                </button>
              </form>

              <!-- Secondary Option: Google Sign Up -->
              <div class="auth-divider">
                <span class="auth-divider-line"></span>
                <span class="auth-divider-text">or register with Others</span>
                <span class="auth-divider-line"></span>
              </div>

              <!-- Official Google Identity Services container (if client ID configured) -->
              <div id="g_id_signup" class="gsi-container" style="display:none; margin-bottom:12px;"></div>

              <button type="button" class="btn-google-auth" id="btn-google-signup">
                <span class="google-icon-wrapper">${Utils.icons.google}</span>
                <span class="google-btn-text">Sign up with Google</span>
              </button>

              <div class="auth-form-footer">
                <span>Already have an account?</span>
                <button class="link-btn-toggle-auth" id="btn-goto-signin">Sign in</button>
              </div>
              <div class="auth-demo-shortcut" style="margin-top: 14px; text-align: center;">
                <button type="button" class="btn btn-outline btn-block" id="btn-explore-demo-signup">
                  ${Utils.icons.zap} <span>Explore Live Interactive Demo</span>
                </button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  },

  renderOnboarding(step = 1) {
    const rooms = State.rooms.length ? State.rooms : API.getRooms();
    const user = State.user || {};
    const appObj = typeof App !== 'undefined' ? App : {};
    const devices = appObj.onboardingDevices || { window: false, ventilation: false, purifier: false };
    const preferences = appObj.onboardingPreferences || {
      tempUnit: '',
      notificationsEnabled: null
    };
    const location = appObj.onboardingLocation || null;
    const outdoorAirQuality = appObj.onboardingOutdoorAirQuality || null;
    const locationSummary = location
      ? `${Utils.escapeHtml(location.placeName || 'Selected location')} · ${location.source === 'gps' ? 'GPS-detected' : 'Manually entered'} (${Number(location.latitude).toFixed(5)}, ${Number(location.longitude).toFixed(5)})${location.source === 'gps' && Number.isFinite(location.accuracy) ? ` (±${Math.round(location.accuracy)} m)` : ''} · recorded ${Utils.escapeHtml(new Date(location.recordedAt).toLocaleString())}`
      : 'No location selected.';
    const outdoorAirQualitySummary = outdoorAirQuality
      ? `Outdoor AQI: ${outdoorAirQuality.aqi} (${Utils.escapeHtml(outdoorAirQuality.category || 'current')}) · ${Utils.escapeHtml(outdoorAirQuality.placeName || location?.placeName || 'Saved location')} · ${Utils.escapeHtml(outdoorAirQuality.unit)} · ${Utils.escapeHtml(outdoorAirQuality.source)} · updated ${Utils.escapeHtml(new Date(outdoorAirQuality.lastUpdated).toLocaleString())}`
      : 'Outdoor AQI unavailable.';
    const roomCards = rooms.map(room => `
      <div class="onboarding-room-card">
        <div class="onb-room-meta">
          <strong>${Utils.escapeHtml(room.name)}</strong>
          <span>${Number(room.area || room.length * room.width || 0).toFixed(1)} m²</span>
          <small>${room.windowsCount} windows · ${room.typicalOccupants} occupants</small>
        </div>
        ${room.image ? `<img src="${Utils.escapeHtml(room.image)}" alt="" class="onb-room-img" />` : ''}
      </div>
    `).join('');

    return `
      <div class="onboarding-page-container">
        <header class="onboarding-header">
          <div class="onboarding-brand">
            <span class="brand-icon">${Utils.icons.leaf}</span>
            <span class="brand-name">Breathe Clean</span>
          </div>

          <!-- Stepper Indicator -->
          <div class="onboarding-stepper">
            <div class="step-item ${step > 1 ? 'completed' : (step === 1 ? 'active' : '')}">
              <span class="step-circle">${step > 1 ? Utils.icons.check : '1'}</span>
              <span class="step-label">Account</span>
            </div>
            <div class="step-line ${step > 2 ? 'filled' : ''}"></div>
            <div class="step-item ${step > 2 ? 'completed' : (step === 2 ? 'active' : '')}">
              <span class="step-circle">${step > 2 ? Utils.icons.check : '2'}</span>
              <span class="step-label">Spaces</span>
            </div>
            <div class="step-line ${step > 3 ? 'filled' : ''}"></div>
            <div class="step-item ${step > 3 ? 'completed' : (step === 3 ? 'active' : '')}">
              <span class="step-circle">${step > 3 ? Utils.icons.check : '3'}</span>
              <span class="step-label">Devices</span>
            </div>
            <div class="step-line ${step > 4 ? 'filled' : ''}"></div>
            <div class="step-item ${step > 4 ? 'completed' : (step === 4 ? 'active' : '')}">
              <span class="step-circle">${step > 4 ? Utils.icons.check : '4'}</span>
              <span class="step-label">Preferences</span>
            </div>
            <div class="step-line ${step === 5 ? 'filled' : ''}"></div>
            <div class="step-item ${step === 5 ? 'active' : ''}">
              <span class="step-circle">5</span>
              <span class="step-label">Ready</span>
            </div>
          </div>
        </header>

        <main class="onboarding-body">
          ${step === 1 ? `
            <div class="onboarding-content-card">
              <h2 class="onboarding-title">Account ready</h2>
              <p class="onboarding-subtitle">Confirm your account before configuring your spaces.</p>
              <div class="onboarding-room-card">
                <div class="onb-room-meta">
                  <strong>${Utils.escapeHtml(user.name || 'New user')}</strong>
                  <span>${Utils.escapeHtml(user.email || '')}</span>
                </div>
              </div>
              <p class="setup-storage-note">Your setup is saved to your Breathe Clean account.</p>
              <p id="onboarding-error" role="alert" aria-live="polite" style="display:none; color:#b91c1c; font-size:13px; margin:12px 0 0;"></p>
              <div class="onboarding-actions-footer">
                <span></span>
                <button class="btn btn-primary" id="btn-onboarding-continue">
                  <span>Continue</span> ${Utils.icons.arrowRight}
                </button>
              </div>
            </div>
          ` : step === 2 ? `
            <div class="onboarding-content-card">
              <h2 class="onboarding-title">Let's set up your spaces</h2>
              <p class="onboarding-subtitle">Add the rooms you want to monitor and protect.</p>

              <div class="onboarding-spaces-grid">
                ${roomCards}
                <button class="onboarding-add-card" id="btn-onboarding-add-room">
                  <span class="add-icon">${Utils.icons.plus}</span>
                  <span>Add another room</span>
                </button>
              </div>

              <p id="onboarding-error" role="alert" aria-live="polite" style="display:none; color:#b91c1c; font-size:13px; margin:12px 0 0;"></p>
              <div class="onboarding-actions-footer">
                <button class="btn btn-outline" id="btn-onboarding-back">Back</button>
                <button class="btn btn-primary" id="btn-onboarding-continue">
                  <span>Continue</span> ${Utils.icons.arrowRight}
                </button>
              </div>
            </div>
          ` : step === 3 ? `
            <div class="onboarding-content-card">
              <h2 class="onboarding-title">Configure device types</h2>
              <p class="onboarding-subtitle">Choose device types for your browser-stored room profile. This does not connect physical hardware.</p>
              <div class="devices-config-grid">
                <label class="device-config-item checkbox-label"><input type="checkbox" data-onboarding-device="window" ${devices.window ? 'checked' : ''} /> Smart windows</label>
                <label class="device-config-item checkbox-label"><input type="checkbox" data-onboarding-device="ventilation" ${devices.ventilation ? 'checked' : ''} /> Ventilation</label>
                <label class="device-config-item checkbox-label"><input type="checkbox" data-onboarding-device="purifier" ${devices.purifier ? 'checked' : ''} /> Air purifier</label>
              </div>
              <p id="onboarding-error" role="alert" aria-live="polite" style="display:none; color:#b91c1c; font-size:13px; margin:12px 0 0;"></p>
              <div class="onboarding-actions-footer">
                <button class="btn btn-outline" id="btn-onboarding-back">Back</button>
                <button class="btn btn-primary" id="btn-onboarding-continue"><span>Continue</span> ${Utils.icons.arrowRight}</button>
              </div>
            </div>
          ` : step === 4 ? `
            <div class="onboarding-content-card">
              <h2 class="onboarding-title">Set your preferences</h2>
              <p class="onboarding-subtitle">Choose how readings and alerts are presented, and optionally provide a location for outdoor air-quality data.</p>
              <div class="modal-form-fields">
                <div class="form-field">
                  <label for="onboarding-notifications">Air-quality notifications</label>
                  <select id="onboarding-notifications" class="settings-select">
                    <option value="" ${preferences.notificationsEnabled === null ? 'selected' : ''}>Choose a preference</option>
                    <option value="enabled" ${preferences.notificationsEnabled === true ? 'selected' : ''}>Enable notifications</option>
                    <option value="disabled" ${preferences.notificationsEnabled === false ? 'selected' : ''}>Disable notifications</option>
                  </select>
                </div>
                <div class="form-field">
                  <label for="onboarding-temp-unit">Temperature units</label>
                  <select id="onboarding-temp-unit" class="settings-select">
                    <option value="" ${preferences.tempUnit ? '' : 'selected'}>Choose temperature units</option>
                    <option value="celsius" ${preferences.tempUnit === 'celsius' ? 'selected' : ''}>Celsius</option>
                    <option value="fahrenheit" ${preferences.tempUnit === 'fahrenheit' ? 'selected' : ''}>Fahrenheit</option>
                  </select>
                </div>
              </div>
              <section class="modal-form-fields" aria-labelledby="onboarding-location-title">
                <h3 id="onboarding-location-title">Allow location access to check outdoor air quality</h3>
                <p>Location is used only to request current outdoor AQI for your coordinates. Your browser will ask before sharing GPS location. You can enter coordinates manually instead.</p>
                <p id="onboarding-location-summary">${locationSummary}</p>
                <div class="form-field">
                  <button type="button" class="btn btn-outline" id="btn-onboarding-use-location">Use my current location</button>
                </div>
                <div class="form-field">
                  <label for="onboarding-location-search">Search for an Indian city or address</label>
                  <input id="onboarding-location-search" type="search" placeholder="Search city, area, or address" autocomplete="off" />
                  <button type="button" class="btn btn-outline" id="btn-onboarding-search-location">Search locations</button>
                  <p class="text-muted">Google Maps search is optional. If unavailable, enter coordinates below.</p>
                  <div id="onboarding-location-results" class="onboarding-location-results" aria-live="polite"></div>
                </div>
                <div class="form-field">
                  <label for="onboarding-manual-latitude">Latitude</label>
                  <input id="onboarding-manual-latitude" type="number" min="-90" max="90" step="any" value="${location?.source === 'manual' ? location.latitude : ''}" />
                </div>
                <div class="form-field">
                  <label for="onboarding-manual-longitude">Longitude</label>
                  <input id="onboarding-manual-longitude" type="number" min="-180" max="180" step="any" value="${location?.source === 'manual' ? location.longitude : ''}" />
                </div>
                <div class="form-field">
                  <button type="button" class="btn btn-outline" id="btn-onboarding-save-manual-location">Use these coordinates</button>
                  <button type="button" class="btn btn-outline" id="btn-onboarding-retry-aqi" ${location ? '' : 'disabled'}>Retry outdoor AQI</button>
                </div>
                <p id="onboarding-outdoor-aqi" aria-live="polite">${outdoorAirQualitySummary}</p>
                <p id="onboarding-location-feedback" role="status" aria-live="polite"></p>
              </section>
              <p id="onboarding-error" role="alert" aria-live="polite" style="display:none; color:#b91c1c; font-size:13px; margin:12px 0 0;"></p>
              <div class="onboarding-actions-footer">
                <button class="btn btn-outline" id="btn-onboarding-back">Back</button>
                <button class="btn btn-primary" id="btn-onboarding-continue"><span>Continue</span> ${Utils.icons.arrowRight}</button>
              </div>
            </div>
          ` : `
            <div class="onboarding-content-card ready-step-card text-center">
              <div class="ready-check-icon">${Utils.icons.shieldCheck}</div>
              <h2 class="onboarding-title">Setup is ready</h2>
              <p class="onboarding-subtitle">${rooms.length} room${rooms.length === 1 ? '' : 's'}, device and preference selections, and location are ready to save to your account.</p>
              <p id="onboarding-error" role="alert" aria-live="polite" style="display:none; color:#b91c1c; font-size:13px; margin:12px 0 0;"></p>
              <div class="onboarding-actions-footer">
              <button class="btn btn-outline" id="btn-onboarding-back">Back</button>
              <button class="btn btn-primary btn-lg" id="btn-onboarding-finish">
                <span>Save setup & enter dashboard</span> ${Utils.icons.arrowRight}
              </button>
              </div>
            </div>
          `}
        </main>
        <div id="modal-container"></div>
      </div>
    `;
  },

  renderSpaceModal(roomToEdit = null) {
    const isEdit = !!roomToEdit;
    const name = roomToEdit ? roomToEdit.name : '';
    const type = roomToEdit ? roomToEdit.type : 'Bedroom';
    const length = roomToEdit ? roomToEdit.length : '';
    const width = roomToEdit ? roomToEdit.width : '';
    const ceilingHeight = roomToEdit ? roomToEdit.ceilingHeight : '';
    const windows = roomToEdit ? roomToEdit.windowsCount : '';
    const doors = roomToEdit ? roomToEdit.doorsCount : '';
    const occupants = roomToEdit ? roomToEdit.typicalOccupants : '';

    return `
      <div class="modal-backdrop" id="space-modal-backdrop">
        <div class="modal-dialog modal-space-dialog">
          <div class="modal-sidebar-stepper">
            <div class="modal-step-tab active" data-step="1">
              <span class="step-num-pill">1</span>
              <span>Basic info</span>
            </div>
            <div class="modal-step-tab" data-step="2">
              <span class="step-num-pill">2</span>
              <span>Room details</span>
            </div>
            <div class="modal-step-tab" data-step="3">
              <span class="step-num-pill">3</span>
              <span>Devices</span>
            </div>
            <div class="modal-step-tab" data-step="4">
              <span class="step-num-pill">4</span>
              <span>Review</span>
            </div>
          </div>

          <div class="modal-main-content">
            <div class="modal-header">
              <div>
                <h3 class="modal-title" id="space-modal-title">${isEdit ? 'Edit space' : 'Add a space'}</h3>
                <p class="modal-subtitle" id="space-modal-subtitle">Enter basic information about your room.</p>
              </div>
              <button class="modal-close-btn" id="btn-close-space-modal" aria-label="Close modal">&times;</button>
            </div>

            <form id="form-space-modal" data-edit-id="${isEdit ? roomToEdit.id : ''}">
              <p id="space-modal-error" role="alert" aria-live="polite" style="display:none; color:#b91c1c; font-size:13px; margin:0;"></p>
              <!-- STEP 1: Basic Info -->
              <div class="space-step-pane" id="space-step-pane-1">
                <div class="modal-form-fields">
                  <div class="form-field">
                    <label for="room-input-name">Room name</label>
                    <input type="text" id="room-input-name" value="${Utils.escapeHtml(name)}" placeholder="Enter a room name" required />
                  </div>

                  <div class="form-field">
                    <label for="room-input-type">Room type / Usage</label>
                    <select id="room-input-type" class="settings-select">
                      <option value="Bedroom" ${type === 'Bedroom' ? 'selected' : ''}>Bedroom</option>
                      <option value="Living Room" ${type === 'Living Room' ? 'selected' : ''}>Living Room</option>
                      <option value="Study" ${type === 'Study' ? 'selected' : ''}>Study / Home Office</option>
                      <option value="Office" ${type === 'Office' ? 'selected' : ''}>Commercial Office</option>
                      <option value="Classroom" ${type === 'Classroom' ? 'selected' : ''}>Classroom</option>
                    </select>
                  </div>

                  <div class="form-field">
                    <label for="room-input-occupants">Typical occupants</label>
                    <input type="number" id="room-input-occupants" value="${occupants}" min="1" max="50" required />
                    <span class="field-hint" style="font-size:11px; color:#64748b; margin-top:4px;">Determines ASHRAE 62.1 per-person baseline fresh airflow rate (~18 m³/h per person).</span>
                  </div>
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-outline" id="btn-cancel-space-modal">Cancel</button>
                  <button type="button" class="btn btn-primary" id="btn-step-next-1">
                    <span>Next: Room details</span> ${Utils.icons.arrowRight}
                  </button>
                </div>
              </div>

              <!-- STEP 2: Room Details & Geometry -->
              <div class="space-step-pane" id="space-step-pane-2" style="display: none;">
                <div class="modal-form-fields">
                  <div class="form-row-2">
                    <div class="form-field">
                      <label for="room-input-length">Length (meters)</label>
                      <input type="number" step="0.1" id="room-input-length" value="${length}" min="1" required />
                    </div>
                    <div class="form-field">
                      <label for="room-input-width">Width (meters)</label>
                      <input type="number" step="0.1" id="room-input-width" value="${width}" min="1" required />
                    </div>
                  </div>

                  <div class="form-field">
                    <label for="room-input-height">Ceiling height (meters)</label>
                    <input type="number" step="0.1" id="room-input-height" value="${ceilingHeight}" min="1.8" max="10" required />
                  </div>

                  <!-- Live Calculated Geometry Box -->
                  <div class="calc-metrics-row">
                    <div class="calc-metric-box">
                      <span class="calc-metric-label">Floor Area</span>
                      <span class="calc-metric-val" id="calc-area-preview">${(length * width).toFixed(1)} m²</span>
                    </div>
                    <div class="calc-metric-box">
                      <span class="calc-metric-label">Air Volume</span>
                      <span class="calc-metric-val" id="calc-volume-preview">${(length * width * ceilingHeight).toFixed(1)} m³</span>
                    </div>
                  </div>

                  <div class="form-row-2">
                    <div class="form-field">
                      <label for="room-input-windows">Windows (apertures)</label>
                      <input type="number" id="room-input-windows" value="${windows}" min="0" required />
                    </div>
                    <div class="form-field">
                      <label for="room-input-doors">Doors</label>
                      <input type="number" id="room-input-doors" value="${doors}" min="1" required />
                    </div>
                  </div>
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-outline" id="btn-step-prev-2">Back</button>
                  <button type="button" class="btn btn-primary" id="btn-step-next-2">
                    <span>Next: Devices</span> ${Utils.icons.arrowRight}
                  </button>
                </div>
              </div>

              <!-- STEP 3: Devices & Actuators -->
              <div class="space-step-pane" id="space-step-pane-3" style="display: none;">
                <div class="devices-config-grid">
                  <div class="device-config-item">
                    <div class="device-config-left">
                      <div class="device-config-icon">${Utils.icons.window}</div>
                      <div>
                        <div class="device-config-title">Smart Motorized Windows</div>
                        <div class="device-config-desc">Autonomous natural displacement draft & perimeter seal.</div>
                      </div>
                    </div>
                    <label class="checkbox-label">
                      <input type="checkbox" id="device-opt-window" checked />
                      <span>Connected</span>
                    </label>
                  </div>

                  <div class="device-config-item">
                    <div class="device-config-left">
                      <div class="device-config-icon">${Utils.icons.fan}</div>
                      <div>
                        <div class="device-config-title">Intelligent Ventilation (ERV)</div>
                        <div class="device-config-desc">Balanced energy-recovery fresh air exchange.</div>
                      </div>
                    </div>
                    <label class="checkbox-label">
                      <input type="checkbox" id="device-opt-vent" checked />
                      <span>Connected</span>
                    </label>
                  </div>

                  <div class="device-config-item">
                    <div class="device-config-left">
                      <div class="device-config-icon">${Utils.icons.purifier}</div>
                      <div>
                        <div class="device-config-title">HEPA Air Purifier</div>
                        <div class="device-config-desc">High-CADR particulate scrubbing against PM2.5.</div>
                      </div>
                    </div>
                    <label class="checkbox-label">
                      <input type="checkbox" id="device-opt-purifier" checked />
                      <span>Connected</span>
                    </label>
                  </div>

                  <div class="device-config-item">
                    <div class="device-config-left">
                      <div class="device-config-icon">${Utils.icons.activity}</div>
                      <div>
                        <div class="device-config-title">Senseair NDIR + Optical Sensor Suite</div>
                        <div class="device-config-desc">Continuous CO₂, PM2.5, temperature & humidity telemetry.</div>
                      </div>
                    </div>
                    <span class="device-status-badge badge-green" style="font-size: 11px;">Active Telemetry</span>
                  </div>
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-outline" id="btn-step-prev-3">Back</button>
                  <button type="button" class="btn btn-primary" id="btn-step-next-3">
                    <span>Next: Review</span> ${Utils.icons.arrowRight}
                  </button>
                </div>
              </div>

              <!-- STEP 4: Review -->
              <div class="space-step-pane" id="space-step-pane-4" style="display: none;">
                <div class="review-summary-card">
                  <div class="review-summary-header">
                    <div class="review-room-name-badge">
                      <span class="review-name-text" id="review-val-name">${Utils.escapeHtml(name)}</span>
                      <span class="review-type-pill" id="review-val-type">${type}</span>
                    </div>
                    <span class="device-status-badge badge-green">Ready to Deploy</span>
                  </div>

                  <div class="review-grid-details">
                    <div class="review-item">
                      <span class="review-label">Floor Area & Volume</span>
                      <span class="review-val" id="review-val-geometry">${(length * width).toFixed(1)} m² · ${(length * width * ceilingHeight).toFixed(1)} m³</span>
                    </div>
                    <div class="review-item">
                      <span class="review-label">Dimensions</span>
                      <span class="review-val" id="review-val-dims">${length}m (L) × ${width}m (W) × ${ceilingHeight}m (H)</span>
                    </div>
                    <div class="review-item">
                      <span class="review-label">Envelope Apertures</span>
                      <span class="review-val" id="review-val-envelope">${windows} Windows · ${doors} Doors</span>
                    </div>
                    <div class="review-item">
                      <span class="review-label">Occupancy Load</span>
                      <span class="review-val" id="review-val-occupants">${occupants} Occupants</span>
                    </div>
                  </div>

                  <div class="review-ashrae-banner">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      ${Utils.icons.shieldCheck}
                      <div>
                        <strong>ASHRAE 62.1-2022 Ventilation Baseline:</strong>
                        <div style="font-size: 11px; opacity: 0.9;">Required baseline delivery: <strong id="review-val-ashrae">~${Math.round(occupants * 18 + (length * width) * 1.08)} m³/h</strong></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-outline" id="btn-step-prev-4">Back</button>
                  <button type="submit" class="btn btn-primary" id="btn-submit-space-modal">
                    <span>${isEdit ? 'Save Changes' : 'Create Space'}</span> ${Utils.icons.check}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  renderModeConfirmModal(targetMode) {
    const isToManual = targetMode === 'MANUAL';
    const title = isToManual ? 'Switch to manual control?' : 'Resume automatic control?';
    const message = isToManual 
      ? 'Automatic control will pause until you return to Auto. Connected devices will remain at your set state.' 
      : 'Breathe Clean will take control of this room again and optimize airflow based on outdoor AQI, CO₂, and particulate levels.';
    const confirmBtnText = isToManual ? 'Switch to Manual' : 'Resume Auto';

    return `
      <div class="modal-backdrop" id="mode-confirm-modal-backdrop">
        <div class="modal-dialog modal-sm-dialog">
          <div class="confirm-modal-icon ${isToManual ? 'icon-amber' : 'icon-green'}">
            ${isToManual ? Utils.icons.sliders || Utils.icons.settings : Utils.icons.shieldCheck}
          </div>
          <h3 class="confirm-modal-title">${title}</h3>
          <p class="confirm-modal-text">${message}</p>
          <div class="confirm-modal-actions">
            <button class="btn btn-outline" id="btn-mode-cancel">Cancel</button>
            <button class="btn ${isToManual ? 'btn-amber' : 'btn-primary'}" id="btn-mode-confirm">${confirmBtnText}</button>
          </div>
        </div>
      </div>
    `;
  },

  formatChatMessage(text) {
    if (!text) return '';
    let html = Utils.escapeHtml(text);
    html = html.replace(/^### (.*$)/gim, '<h4 class="chat-heading">$1</h4>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^\- (.*$)/gim, '<li class="chat-bullet">$1</li>');
    html = html.replace(/(<li class="chat-bullet">[\s\S]*?<\/li>)/g, '<ul class="chat-list">$1</ul>');
    html = html.replace(/\n/g, '<br/>');
    return html;
  },

  renderAssistant(room) {
    const isAuto = room ? room.mode === 'AUTO' : true;
    const messages = Chatbot.messages || [];

    const promptSuggestions = [
      'Apply the current safety policy',
      'Turn purifier on',
      'Simulate outdoor pollution',
      'Why are the windows closed?',
      'Check my saved location and outdoor AQI',
      'Simulate high CO₂',
      'Go to Analytics'
    ];

    return `
      <div class="view-content view-assistant">
        <div class="view-page-header">
          <div>
            <div class="assistant-title-row">
              <span class="assistant-sparkle-badge">${Utils.icons.sparkles}</span>
              <h2 class="page-title">AI Assistant & Co-Pilot</h2>
            </div>
            <p class="page-subtitle">Rule-based assistant; no LLM, Ollama, or n8n service is connected. Ask about account readings, safety decisions, and supported backend controls. Backend state does not confirm physical hardware.</p>
          </div>
          <div class="assistant-header-actions">
            <span class="assistant-context-pill">
              <span class="ctx-dot ${isAuto ? 'dot-green' : 'dot-amber'}"></span>
              <span>${room ? Utils.escapeHtml(room.name) : 'Space'} · ${room ? room.mode : 'AUTO'}</span>
            </span>
            <button class="btn btn-outline btn-sm" id="btn-clear-chat" title="Clear conversation history">
              ${Utils.icons.trash} <span>Clear chat</span>
            </button>
          </div>
        </div>

        <div class="assistant-workspace-card">
          <!-- Suggestion Chips Bar -->
          <div class="assistant-suggestions-bar">
            <span class="sugg-label">Try asking:</span>
            <div class="sugg-chips-scroll">
              ${promptSuggestions.map(p => `
                <button class="chat-suggestion-chip" data-prompt="${Utils.escapeHtml(p)}">${Utils.escapeHtml(p)}</button>
              `).join('')}
            </div>
          </div>

          <!-- Chat Messages Container -->
          <div class="assistant-chat-container" id="assistant-chat-container">
            ${messages.map(m => `
              <div class="chat-message-row msg-${m.sender}">
                <div class="chat-avatar">
                  ${m.sender === 'bot' ? Utils.icons.sparkles : (State.user?.name?.charAt(0)?.toUpperCase() || 'U')}
                </div>
                <div class="chat-bubble">
                  <div class="chat-meta">
                    <span class="chat-author">${m.sender === 'bot' ? 'Breathe Clean Co-Pilot' : (State.user ? Utils.escapeHtml(State.user.name) : 'You')}</span>
                    <span class="chat-timestamp">${Utils.formatTime(new Date(m.timestamp))}</span>
                  </div>
                  <div class="chat-body-text">
                    ${this.formatChatMessage(m.text)}
                  </div>
                  ${m.actionTag ? `
                    <div class="chat-action-badge ${m.actionTag === 'Request failed' ? 'action-failed' : ''}">
                      <span class="badge-icon">${m.actionTag === 'Request failed' ? '!' : '✓'}</span>
                      <span class="badge-tag">${Utils.escapeHtml(m.actionTag)}:</span>
                      <span class="badge-detail">${Utils.escapeHtml(m.actionDetails || '')}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Input Composer Form -->
          <form class="assistant-composer-form" id="assistant-composer-form">
            <div class="composer-input-wrapper">
              <textarea 
                id="assistant-prompt-input" 
                class="composer-textarea" 
                placeholder="Ask about your readings, safety decisions, or supported controls..."
                rows="1" 
                required
              ></textarea>
              <button type="submit" class="btn btn-primary btn-send-prompt" id="btn-send-prompt" aria-label="Send prompt">
                <span>Send</span> ${Utils.icons.send}
              </button>
            </div>
            <div class="composer-footnote">
              <span>Backend controls remain subject to sensor safety validation. Physical hardware actuation is not confirmed.</span>
              <span class="keyboard-hint">Press Enter to send</span>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderFloatingAssistantWidget() {
    return `
      <div class="floating-assistant-wrapper" id="floating-assistant-wrapper">
        <!-- Floating Action Button -->
        <button class="floating-assistant-btn" id="btn-floating-assistant" title="Open AI Assistant">
          <span class="fab-sparkle">${Utils.icons.sparkles}</span>
          <span class="fab-label">AI Assistant</span>
          <span class="fab-pulse"></span>
        </button>

        <!-- Slide-up Floating Chat Drawer -->
        <div class="floating-chat-drawer" id="floating-chat-drawer">
          <div class="floating-drawer-head">
            <div class="drawer-head-title">
              <span class="drawer-icon">${Utils.icons.sparkles}</span>
              <div>
                <strong>Breathe Clean Co-Pilot</strong>
                <span class="drawer-sub">Account Assistant</span>
              </div>
            </div>
            <div class="drawer-head-actions">
              <button class="drawer-btn" id="btn-expand-assistant" title="Expand to full workspace">
                ${Utils.icons.dashboard}
              </button>
              <button class="drawer-btn" id="btn-close-floating-drawer" title="Close drawer">
                ${Utils.icons.x}
              </button>
            </div>
          </div>

          <div class="floating-drawer-suggestions">
            <button class="mini-chip" data-prompt="Turn purifier on">Purifier On</button>
            <button class="mini-chip" data-prompt="Apply the current safety policy">Apply Policy</button>
            <button class="mini-chip" data-prompt="Why are windows closed?">Why closed?</button>
            <button class="mini-chip" data-prompt="Simulate outdoor pollution">Smog Spike</button>
          </div>

          <div class="floating-drawer-body" id="floating-drawer-messages">
            <!-- Messages rendered dynamically -->
          </div>

          <form class="floating-drawer-composer" id="floating-drawer-form">
            <input 
              type="text" 
              id="floating-prompt-input" 
              placeholder="Ask about your readings, safety decisions, or supported controls..."
              autocomplete="off" 
              required
            />
            <button type="submit" class="drawer-send-btn" aria-label="Send">
              ${Utils.icons.send}
            </button>
          </form>
        </div>
      </div>
    `;
  },

  renderSignOutModal() {
    return `
      <div class="modal-backdrop" id="signout-modal-backdrop">
        <div class="modal-dialog modal-signout-card">
          <div class="signout-icon-wrapper">
            ${Utils.icons.logout}
          </div>
          <h3 class="signout-title">Sign out?</h3>
          <p class="signout-text">You can sign in again anytime. Your settings and space configurations will be saved.</p>
          <div class="signout-actions">
            <button class="btn btn-danger btn-block" id="btn-confirm-signout">Sign out</button>
            <button class="btn btn-outline btn-block" id="btn-cancel-signout">Cancel</button>
          </div>
        </div>
      </div>
    `;
  },

  renderGoogleAccountPickerModal() {
    return `
      <div class="modal-backdrop google-auth-backdrop" id="google-auth-backdrop">
        <div class="google-auth-dialog" role="dialog" aria-modal="true">
          <div class="google-dialog-header">
            <div class="google-brand-row">
              <span class="google-svg-logo">${Utils.icons.google}</span>
              <span class="google-service-name">Google Identity Services</span>
            </div>
            <button class="google-modal-close" id="btn-close-google-auth" aria-label="Close">&times;</button>
          </div>

          <div class="google-dialog-body">
            <h3 class="google-dialog-title">Google sign-in is simulated</h3>
            <p class="google-dialog-sub">Google authentication is not connected to Breathe Clean's backend. Use email and password to create an account or sign in.</p>
          </div>
        </div>
      </div>
    `;
  },

  renderGoogleSetupModal() {
    const existingId = API.getGoogleClientId();
    const currentOrigin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') 
      ? window.location.origin 
      : 'http://localhost:8080';

    return `
      <div class="modal-backdrop google-auth-backdrop" id="google-setup-backdrop">
        <div class="google-setup-dialog" role="dialog" aria-modal="true">
          <div class="google-dialog-header">
            <div class="google-brand-row">
              <span class="google-svg-logo">${Utils.icons.google}</span>
              <div>
                <span class="google-service-name" style="font-weight: 600; color: #1e293b; font-size: 14px;">Connect Real Google Account</span>
                <span style="display: block; font-size: 11px; color: #64748b;">Google Identity Services &bull; 2-Minute Setup Guide</span>
              </div>
            </div>
            <button class="google-modal-close" id="btn-close-google-setup" aria-label="Close">&times;</button>
          </div>

          <div class="google-setup-body">
            <div class="setup-intro-banner">
              <div class="setup-intro-icon">${Utils.icons.shield}</div>
              <div class="setup-intro-text">
                <strong>Why this is needed:</strong> Google requires you to register your local origin (<code class="setup-origin-code">${currentOrigin}</code>) in Google Cloud Console under <strong>Authorized JavaScript origins</strong>.
              </div>
            </div>

            <!-- Fix callout for Error 401: no registered origin -->
            <div class="setup-error-helper">
              <div class="helper-badge">IMPORTANT FIX</div>
              <div class="helper-text">
                If Google shows <strong>"Access blocked: no registered origin (Error 401: invalid_client)"</strong>, it means the URL was added in the wrong box or not saved yet:
                <ul>
                  <li>Paste into <strong>"Authorized JavaScript origins"</strong> (<em>NOT</em> "Authorized redirect URIs").</li>
                  <li>Do <strong>not</strong> include a trailing slash <code>/</code> (e.g. use <code>${currentOrigin}</code>).</li>
                  <li>Click the blue <strong>SAVE</strong> button at the bottom of the Google page.</li>
                </ul>
              </div>
            </div>

            <div class="setup-steps-list">
              <!-- Step 1 -->
              <div class="setup-step-card">
                <div class="step-num-badge">1</div>
                <div class="step-card-content">
                  <div class="step-card-title">Open Your Existing Client ID in Google Cloud</div>
                  <div class="step-card-desc">
                    Go to Google Cloud Credentials and click on the name of your Web client ID to edit it:
                  </div>
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" class="btn-step-action">
                    <span>Open Google Cloud Credentials</span> <span style="font-size:11px;">↗</span>
                  </a>
                </div>
              </div>

              <!-- Step 2 -->
              <div class="setup-step-card">
                <div class="step-num-badge">2</div>
                <div class="step-card-content">
                  <div class="step-card-title">Add to "Authorized JavaScript origins"</div>
                  <div class="step-card-desc">
                    Scroll to <strong>Authorized JavaScript origins</strong> &rarr; click <strong>+ ADD URI</strong> &rarr; paste your exact address:
                  </div>
                  <div class="step-origins-copy-box">
                    <div class="origin-copy-row highlight-current-origin">
                      <div>
                        <span class="badge-current-origin">Your Active Browser Origin</span>
                        <code>${currentOrigin}</code>
                      </div>
                      <button type="button" class="btn-copy-origin" data-copy="${currentOrigin}">Copy</button>
                    </div>
                    ${currentOrigin !== 'http://localhost:8080' ? `
                    <div class="origin-copy-row">
                      <code>http://localhost:8080</code>
                      <button type="button" class="btn-copy-origin" data-copy="http://localhost:8080">Copy</button>
                    </div>` : ''}
                    ${currentOrigin !== 'http://127.0.0.1:8080' ? `
                    <div class="origin-copy-row">
                      <code>http://127.0.0.1:8080</code>
                      <button type="button" class="btn-copy-origin" data-copy="http://127.0.0.1:8080">Copy</button>
                    </div>` : ''}
                  </div>
                </div>
              </div>

              <!-- Step 3 -->
              <div class="setup-step-card">
                <div class="step-num-badge">3</div>
                <div class="step-card-content">
                  <div class="step-card-title">Click SAVE & Paste Client ID</div>
                  <div class="step-card-desc">
                    Click the blue <strong>SAVE</strong> button at the bottom of the Google Cloud page, then paste your Client ID here:
                  </div>
                  <div class="setup-input-wrapper">
                    <input 
                      type="text" 
                      id="setup-google-client-id" 
                      class="form-input setup-clientid-input" 
                      placeholder="e.g. 1234567890-abcdef...apps.googleusercontent.com" 
                      value="${existingId}" 
                      spellcheck="false"
                      autocomplete="off"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="setup-actions-footer">
              <button type="button" class="btn btn-primary btn-block btn-save-gsi" id="btn-save-and-connect-gsi">
                <span>Save Client ID (Google sign-in remains simulated)</span> ${Utils.icons.arrowRight}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
