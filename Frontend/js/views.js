/* Breathe Clean - View Components & UI Rendering */

const Views = {
  // Navigation Sidebar
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

  // Top Header Bar
  renderHeader(user, room) {
    const isAuto = room ? room.mode === 'AUTO' : true;
    const now = new Date();
    const formattedDate = Utils.formatDate(now);
    const formattedTime = Utils.formatTime(now);
    const userName = user ? user.name : 'Divam';

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
              <button class="mode-segment-btn ${isAuto ? 'active' : ''}" data-mode="AUTO">AUTO</button>
              <button class="mode-segment-btn ${!isAuto ? 'active' : ''}" data-mode="MANUAL">MANUAL</button>
            </div>
          </div>

          <!-- Live Mode Indicator Text -->
          <div class="mode-status-indicator ${isAuto ? 'status-auto' : 'status-manual'}">
            <span class="status-dot"></span>
            <div class="status-texts">
              <span class="status-primary">${isAuto ? 'Automatic control active' : 'Manual control active'}</span>
              <span class="status-secondary">${isAuto ? 'Breathe Clean is managing this room.' : 'You are controlling this room.'}</span>
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

  // Metrics Row
  renderMetricsBar(env) {
    const outdoorAqi = env.outdoorAQI || 0;
    const indoorAqi = env.indoorAQI || 0;
    const co2 = env.co2 || 0;
    const temp = env.temperature || 24;
    const humidity = env.humidity || 51;
    const occupancy = env.occupancy || 2;

    const outStatus = Utils.getAqiStatus(outdoorAqi);
    const inStatus = Utils.getAqiStatus(indoorAqi);
    const co2Status = Utils.getCo2Status(co2);
    const tempStatus = Utils.getTempStatus(temp);
    const humStatus = Utils.getHumidityStatus(humidity);

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
            <span class="metric-title">Outdoor AQI</span>
          </div>
          <div class="metric-body">
            <span class="metric-value">${outdoorAqi}</span>
            <span class="metric-pill pill-${outStatus.level}">${outStatus.label}</span>
          </div>
        </div>

        <!-- Indoor AQI -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Indoor AQI</span>
          </div>
          <div class="metric-body">
            <span class="metric-value">${indoorAqi}</span>
            <span class="metric-pill pill-${inStatus.level}">${inStatus.label}</span>
          </div>
        </div>

        <!-- CO2 -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">CO₂</span>
          </div>
          <div class="metric-body">
            <span class="metric-value">${co2} <small>ppm</small></span>
            <span class="metric-pill pill-${co2Status.level}">${co2Status.label}</span>
          </div>
        </div>

        <!-- Temperature -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Temperature</span>
          </div>
          <div class="metric-body">
            <span class="metric-value">${temp} <small>°C</small></span>
            <span class="metric-pill pill-${tempStatus.level}">${tempStatus.label}</span>
          </div>
        </div>

        <!-- Humidity -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Humidity</span>
          </div>
          <div class="metric-body">
            <span class="metric-value">${humidity} <small>%</small></span>
            <span class="metric-pill pill-${humStatus.level}">${humStatus.label}</span>
          </div>
        </div>

        <!-- Occupancy -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Occupancy</span>
          </div>
          <div class="metric-body">
            <span class="metric-value">${occupancy}</span>
            <span class="metric-pill pill-neutral">${occupancy > 1 ? 'People' : 'Person'}</span>
          </div>
        </div>
      </section>
    `;
  },

  // Main Dashboard View
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
    const decision = room.decision || Engine.decide(room.environment, room, room.devices);

    const winDev = room.devices.find(d => d.type === 'window') || { state: 'Closed' };
    const ventDev = room.devices.find(d => d.type === 'ventilation') || { state: 'Normal' };
    const purDev = room.devices.find(d => d.type === 'purifier') || { state: 'Active' };

    const recentActivity = room.activity ? room.activity.slice(0, 6) : [];

    const env = room.environment || {};
    const outdoorAqi = env.outdoorAQI || 112;
    const indoorAqi = env.indoorAQI || 38;
    const co2 = env.co2 || 620;

    // Filtration efficiency differential calculation
    const reductionPercent = Math.max(0, Math.min(99, Math.round(((outdoorAqi - indoorAqi) / (outdoorAqi || 1)) * 100)));
    const airChangesHour = isAuto && winDev.state === 'Open' ? '5.4' : (ventDev.state === 'High' ? '4.8' : (ventDev.state === 'Filtered' ? '3.9' : '2.8'));
    const cleanAirRate = purDev.state === 'High' ? '480' : (purDev.state === 'Active' ? '290' : (purDev.state === 'Low' ? '140' : '0'));

    return `
      <div class="view-content view-dashboard">
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
            <button class="toolbar-btn-secondary" id="btn-recalibrate-sensors" title="Perform zero-point optical & NDIR sensor recalibration">
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
              <span class="compliance-confidence">Deterministic Confidence: 99.4%</span>
            </div>

            <!-- Card Management Buttons -->
            <div class="card-actions-footer">
              <button class="card-btn card-btn-primary" id="btn-force-reevaluate" title="Force instant ASHRAE 62.1 decision re-evaluation">
                ${Utils.icons.zap} <span>Re-Evaluate</span>
              </button>
              <button class="card-btn card-btn-outline" id="btn-toggle-override" title="Switch between Auto and Manual Override">
                ${Utils.icons.sliders} <span>Override</span>
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
                    <button class="btn-ctrl ${purDev.state === 'Low' || purDev.state === 'Standby' ? 'active' : ''}" data-state="Low">Low</button>
                    <button class="btn-ctrl ${purDev.state === 'Active' || purDev.state === 'Normal' ? 'active' : ''}" data-state="Active">Auto</button>
                    <button class="btn-ctrl ${purDev.state === 'High' ? 'active' : ''}" data-state="High">Turbo</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actuators Global Management Bar -->
            <div class="devices-footer-actions">
              <button class="footer-btn-sync" id="btn-sync-all-devices" title="Synchronize all hardware actuators with current setpoints">
                ${Utils.icons.refresh} <span>Sync Actuators</span>
              </button>
              <button class="footer-btn-standby" id="btn-all-devices-standby" title="Put all actuators on safe standby">
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
              <span class="diag-badge badge-reduction">-${reductionPercent}% Particulate Load</span>
            </div>

            <div class="differential-bar-container">
              <div class="diff-bar-row">
                <span class="diff-bar-label">Outdoor Air (Raw)</span>
                <div class="diff-bar-track">
                  <div class="diff-bar-fill fill-outdoor" style="width: ${Math.min(100, (outdoorAqi / 200) * 100)}%"></div>
                </div>
                <span class="diff-bar-val">${outdoorAqi} AQI</span>
              </div>
              <div class="diff-bar-row">
                <span class="diff-bar-label">Indoor Air (Filtered)</span>
                <div class="diff-bar-track">
                  <div class="diff-bar-fill fill-indoor" style="width: ${Math.min(100, (indoorAqi / 200) * 100)}%"></div>
                </div>
                <span class="diff-bar-val val-clean">${indoorAqi} AQI</span>
              </div>
            </div>

            <div class="diff-stats-grid">
              <div class="diff-stat-item">
                <span class="stat-num">-${Math.max(0, outdoorAqi - indoorAqi)}</span>
                <span class="stat-desc">AQI Delta</span>
              </div>
              <div class="diff-stat-item">
                <span class="stat-num">${airChangesHour}</span>
                <span class="stat-desc">Air Changes/Hr</span>
              </div>
              <div class="diff-stat-item">
                <span class="stat-num">+${Math.max(0, co2 - 420)}</span>
                <span class="stat-desc">CO₂ Above Ambient</span>
              </div>
              <div class="diff-stat-item">
                <span class="stat-num">99.4%</span>
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
              <button class="btn-diag-run" id="btn-run-sensor-diagnostics">
                ${Utils.icons.activity} <span>Run Self-Diagnostic</span>
              </button>
              <button class="btn-diag-reset" id="btn-zero-baseline">
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

  // Visual Activity Item Generator (Icons, State Transition Badges, Sources)
  renderActivityCard(act) {
    const rawAction = act.action || '';
    const rawDetail = act.detail || '';
    const source = (act.source || 'SYSTEM').toUpperCase();
    const timeStr = Utils.formatTime(new Date(act.timestamp));
    const timeAgoStr = Utils.timeAgo(act.timestamp);

    // Determine category icon and styling
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

    // Parse state transition (e.g. "Low -> High" or "Closed -> Open" or "Normal -> High")
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
      // Don't duplicate the text if detail was just the transition
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

  // Interactive Executive-Grade ASHRAE 62.1-2022 Standards Compliance Modal
  renderStandardsModal(room) {
    const env = (room && room.environment) || {};
    const outdoorAQI = env.outdoorAQI || 112;
    const indoorAqi = env.indoorAQI || 38;
    const co2 = env.co2 || 640;
    const temp = env.temperature || 24;
    const occupancy = env.occupancy || 2;
    const area = (room && room.area) || 24;

    const areaSqFt = area * 10.76;
    const designCFM = Math.round((5 * occupancy) + (0.06 * areaSqFt));
    const deliveredCFM = 180;
    const complianceMargin = Math.round(((deliveredCFM - designCFM) / designCFM) * 100);

    return `
      <div class="modal-backdrop" id="standards-modal-backdrop">
        <div class="modal-dialog modal-dialog-lg" role="dialog" aria-modal="true">
          <div class="modal-header">
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
                <span class="legend-pill"><strong>P<sub>z</sub>:</strong> ${occupancy} Occupants</span>
                <span class="legend-pill"><strong>R<sub>a</sub>:</strong> 0.06 CFM/ft² (Area Rate)</span>
                <span class="legend-pill"><strong>A<sub>z</sub>:</strong> ${area} m² (${areaSqFt.toFixed(0)} ft²)</span>
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
                  <span class="rule-status-tag ${outdoorAQI > 60 ? 'tag-active' : 'tag-nominal'}">${outdoorAQI > 60 ? 'Currently Active (' + outdoorAQI + ' AQI)' : 'Nominal Standby'}</span>
                </div>
              </div>

              <div class="std-rule-item">
                <div class="rule-icon-box box-cyan">${Utils.icons.fan}</div>
                <div class="rule-info">
                  <span class="rule-name">CO₂ Displacement Flush</span>
                  <p class="rule-desc">When CO₂ exceeds 1,000 ppm, mechanical supply and exhaust ERV ventilation escalates to flush stale air and restore oxygen.</p>
                  <span class="rule-status-tag ${co2 > 1000 ? 'tag-active' : 'tag-nominal'}">${co2 > 1000 ? 'CO₂ Elevated (' + co2 + ' ppm)' : 'Optimal (' + co2 + ' ppm)'}</span>
                </div>
              </div>

              <div class="std-rule-item">
                <div class="rule-icon-box box-green">${Utils.icons.purifier}</div>
                <div class="rule-info">
                  <span class="rule-name">Sub-Micron Particulate Protection</span>
                  <p class="rule-desc">MERV-13 mechanical pre-filtration paired with H13 True HEPA ensures 99.97% removal efficiency at 0.3 micrometers.</p>
                  <span class="rule-status-tag tag-nominal">Indoor AQI: ${indoorAqi} (Clean)</span>
                </div>
              </div>

              <div class="std-rule-item">
                <div class="rule-icon-box box-purple">${Utils.icons.leaf}</div>
                <div class="rule-info">
                  <span class="rule-name">ASHRAE 55 Thermal Comfort</span>
                  <p class="rule-desc">Operative temperature target between 20°C - 25°C with relative humidity managed between 40% - 60%.</p>
                  <span class="rule-status-tag tag-nominal">Current: ${temp}°C · Comfort Band Met</span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer standards-modal-footer">
            <button class="btn btn-secondary" id="btn-recalc-standards">
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

  // Spaces Page View
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
            const inAqi = room.environment ? room.environment.indoorAQI : 38;
            const co2 = room.environment ? room.environment.co2 : 640;
            const aqiStatus = Utils.getAqiStatus(inAqi);

            let statusLabel = 'Healthy';
            let statusPillClass = 'pill-good';
            if (inAqi > 100 || co2 > 1200) {
              statusLabel = 'Needs attention';
              statusPillClass = 'pill-poor';
            } else if (inAqi > 50 || co2 > 800) {
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
                      <span class="val">${inAqi}</span>
                    </div>
                    <div class="space-metric-item">
                      <span class="lbl">CO₂</span>
                      <span class="val">${co2} <small>ppm</small></span>
                    </div>
                    <div class="space-metric-item">
                      <span class="lbl">Devices</span>
                      <span class="val">${room.devices ? room.devices.length : 3}</span>
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

  // Simulation Page View
  renderSimulation(room) {
    const env = room ? room.environment : { outdoorAQI: 112, indoorAQI: 38, co2: 640, temperature: 24, humidity: 51, occupancy: 2 };
    const decision = room ? room.decision || Engine.decide(env, room, room.devices) : null;
    const isAuto = room ? room.mode === 'AUTO' : true;

    return `
      <div class="view-content view-simulation">
        <div class="view-page-header">
          <div>
            <h2 class="page-title">Environment Simulation</h2>
            <p class="page-subtitle">Adjust environmental conditions to evaluate autonomous decisions and live system response.</p>
          </div>
          <div class="sim-mode-badge ${isAuto ? 'sim-auto' : 'sim-manual'}">
            System Mode: <strong>${room ? room.mode : 'AUTO'}</strong>
          </div>
        </div>

        <!-- Simulation Presets Bar -->
        <div class="sim-presets-bar">
          <span class="presets-label">Preset scenarios:</span>
          <button class="preset-btn" data-preset="smog">Outdoor Smog (AQI 165)</button>
          <button class="preset-btn" data-preset="fresh">Fresh Morning (AQI 22)</button>
          <button class="preset-btn" data-preset="crowded">Crowded Gathering (CO₂ 1,380 ppm)</button>
          <button class="preset-btn" data-preset="indoor-smoke">Indoor Smoke Spike (AQI 145)</button>
          <button class="preset-btn" data-preset="optimal">Balanced Clean Air</button>
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
                <input type="range" id="sim-outdoor-aqi" min="0" max="400" value="${env.outdoorAQI}" class="slider" />
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
                <input type="range" id="sim-temperature" min="10" max="40" value="${env.temperature}" class="slider" />
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
                <input type="range" id="sim-indoor-aqi" min="0" max="300" value="${env.indoorAQI}" class="slider" />
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
                <input type="range" id="sim-humidity" min="10" max="95" value="${env.humidity}" class="slider" />
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
                <input type="range" id="sim-co2" min="350" max="2200" value="${env.co2}" class="slider" />
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
                <input type="range" id="sim-occupancy" min="1" max="20" value="${env.occupancy}" class="slider" />
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

  // Analytics View
  renderAnalytics() {
    return `
      <div class="view-content view-analytics">
        <div class="view-page-header">
          <div>
            <h2 class="page-title">Analytics</h2>
            <p class="page-subtitle">Historical air quality trends, autonomous actions, and device efficiency.</p>
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
                <option value="indoorAQI">Indoor AQI</option>
                <option value="co2">CO₂ (ppm)</option>
                <option value="outdoorAQI">Outdoor AQI</option>
              </select>
            </div>
            <div class="chart-legend">
              <span class="legend-item"><span class="legend-dot" style="background:#16a34a"></span> Target Safe Zone (&lt;50)</span>
              <span class="legend-item"><span class="legend-dot" style="background:#059669"></span> Measured Level</span>
            </div>
          </div>

          <div class="canvas-chart-wrapper">
            <canvas id="analytics-chart-canvas" width="900" height="300"></canvas>
          </div>
        </div>

        <!-- Summary Statistics Row -->
        <div class="analytics-stats-grid">
          <div class="stat-card">
            <span class="stat-label">Automatic actions</span>
            <span class="stat-value">12</span>
            <span class="stat-sub">Last 24 hours</span>
          </div>

          <div class="stat-card">
            <span class="stat-label">Manual overrides</span>
            <span class="stat-value">3</span>
            <span class="stat-sub">Last 24 hours</span>
          </div>

          <div class="stat-card">
            <span class="stat-label">Avg. Indoor AQI</span>
            <span class="stat-value">38</span>
            <span class="stat-sub">Optimal healthy range</span>
          </div>

          <div class="stat-card">
            <span class="stat-label">HEPA Filter Life</span>
            <span class="stat-value">84%</span>
            <span class="stat-sub">Est. 142 days remaining</span>
          </div>
        </div>
      </div>
    `;
  },

  // Devices View
  renderDevices(rooms) {
    // Gather all devices from all rooms
    const allDevices = [];
    rooms.forEach(room => {
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
            <p class="page-subtitle">Connected environmental actuators, air purifiers, and automated windows.</p>
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
              ${allDevices.map(d => {
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
                      <span class="state-pill state-${(d.state || '').toLowerCase()}">${d.state}</span>
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
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // Settings View
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
                <p class="text-muted">${Utils.escapeHtml(user ? user.name : 'Divam')}</p>
              </div>
              <button class="btn btn-outline btn-sm" id="btn-edit-profile">Edit</button>
            </div>
            <div class="settings-row">
              <div>
                <strong>Email Address</strong>
                <p class="text-muted">${Utils.escapeHtml(user ? user.email : 'divam@breatheclean.io')}</p>
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
            <div class="settings-row" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9;">
              <div>
                <strong>Google Cloud OAuth Client ID (Optional)</strong>
                <p class="text-muted">Enter your GCP Client ID to authenticate directly with your own Google Cloud project.</p>
              </div>
              <div style="display: flex; gap: 8px;">
                <input type="text" id="setting-google-client-id" placeholder="e.g. 12345678-abc.apps.googleusercontent.com" value="${Utils.escapeHtml(API.getGoogleClientId())}" style="font-size: 12px; width: 240px; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px;" />
                <button class="btn btn-secondary btn-sm" id="btn-save-google-client-id">Save</button>
              </div>
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

          <!-- Data & Privacy Section -->
          <div class="settings-card">
            <h3 class="settings-card-title">Data & Privacy</h3>
            <p class="text-muted mb-3">All room, simulation, and device history are stored locally in your browser.</p>
            <div class="settings-row">
              <div>
                <strong>Reset Demo Data</strong>
                <p class="text-muted">Revert rooms, devices, and history to factory prototype defaults.</p>
              </div>
              <button class="btn btn-outline btn-danger btn-sm" id="btn-reset-demo-data">Reset to Defaults</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Auth Screen (Sign In / Sign Up split view matching reference)
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
                <h2 class="auth-form-title">Welcome back</h2>
                <p class="auth-form-sub">Sign in to your account</p>
              </div>

              <!-- Google One-Tap / OAuth Sign In Button -->
              <button type="button" class="btn-google-auth" id="btn-google-signin">
                <span class="google-icon-wrapper">${Utils.icons.google}</span>
                <span class="google-btn-text">Sign in with Google</span>
              </button>

              <div class="auth-divider">
                <span class="auth-divider-line"></span>
                <span class="auth-divider-text">or continue with email</span>
                <span class="auth-divider-line"></span>
              </div>

              <form id="form-sign-in" class="auth-form">
                <div class="form-field">
                  <label for="signin-email">Email</label>
                  <input type="email" id="signin-email" placeholder="you@example.com" value="divam@breatheclean.io" required />
                </div>

                <div class="form-field">
                  <div class="field-label-row">
                    <label for="signin-password">Password</label>
                    <a href="#" class="field-link" id="link-forgot-pw">Forgot password?</a>
                  </div>
                  <div class="input-password-wrapper">
                    <input type="password" id="signin-password" placeholder="Enter your password" value="BreatheClean#2026" required />
                    <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility">${Utils.icons.eye}</button>
                  </div>
                </div>

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

              <div class="auth-form-footer">
                <span>Don't have an account?</span>
                <button class="link-btn-toggle-auth" id="btn-goto-signup">Create one</button>
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

              <!-- Google Sign Up Button -->
              <button type="button" class="btn-google-auth" id="btn-google-signup">
                <span class="google-icon-wrapper">${Utils.icons.google}</span>
                <span class="google-btn-text">Sign up with Google</span>
              </button>

              <div class="auth-divider">
                <span class="auth-divider-line"></span>
                <span class="auth-divider-text">or register with email</span>
                <span class="auth-divider-line"></span>
              </div>

              <form id="form-sign-up" class="auth-form">
                <div class="form-field">
                  <label for="signup-name">Full name</label>
                  <input type="text" id="signup-name" placeholder="Divam Malik" required />
                </div>

                <div class="form-field">
                  <label for="signup-email">Email</label>
                  <input type="email" id="signup-email" placeholder="you@example.com" required />
                </div>

                <div class="form-field">
                  <label for="signup-password">Password</label>
                  <div class="input-password-wrapper">
                    <input type="password" id="signup-password" placeholder="Create a password" value="BreatheClean#2026" required />
                    <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility">${Utils.icons.eye}</button>
                  </div>
                </div>

                <div class="form-field">
                  <label for="signup-password-confirm">Confirm password</label>
                  <div class="input-password-wrapper">
                    <input type="password" id="signup-password-confirm" placeholder="Confirm your password" value="BreatheClean#2026" required />
                    <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility">${Utils.icons.eye}</button>
                  </div>
                </div>

                <button type="submit" class="btn btn-primary btn-block btn-auth-submit">
                  <span>Create account</span> ${Utils.icons.arrowRight}
                </button>
              </form>

              <div class="auth-form-footer">
                <span>Already have an account?</span>
                <button class="link-btn-toggle-auth" id="btn-goto-signin">Sign in</button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  },

  // First-Time Onboarding Flow (Account -> Spaces -> Devices -> Preferences -> Ready)
  renderOnboarding(step = 2) {
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
          ${step === 2 ? `
            <div class="onboarding-content-card">
              <h2 class="onboarding-title">Let's set up your spaces</h2>
              <p class="onboarding-subtitle">Add the rooms you want to monitor and protect.</p>

              <div class="onboarding-spaces-grid">
                <!-- Bedroom Card -->
                <div class="onboarding-room-card">
                  <div class="onb-room-meta">
                    <strong>Bedroom</strong>
                    <span>12.5 m²</span>
                    <small>1 window · 1 purifier</small>
                  </div>
                  <img src="assets/images/room-bedroom.jpg" alt="Bedroom" class="onb-room-img" />
                </div>

                <!-- Living Room Card -->
                <div class="onboarding-room-card">
                  <div class="onb-room-meta">
                    <strong>Living Room</strong>
                    <span>25 m²</span>
                    <small>2 windows · 1 purifier</small>
                  </div>
                  <img src="assets/images/room-livingroom.jpg" alt="Living Room" class="onb-room-img" />
                </div>

                <!-- Study Card -->
                <div class="onboarding-room-card">
                  <div class="onb-room-meta">
                    <strong>Study</strong>
                    <span>10 m²</span>
                    <small>1 window · No purifier</small>
                  </div>
                  <img src="assets/images/room-study.jpg" alt="Study" class="onb-room-img" />
                </div>

                <!-- Add another room card -->
                <button class="onboarding-add-card" id="btn-onboarding-add-room">
                  <span class="add-icon">${Utils.icons.plus}</span>
                  <span>Add another room</span>
                </button>
              </div>

              <div class="onboarding-actions-footer">
                <button class="btn btn-outline" id="btn-onboarding-back">Back</button>
                <button class="btn btn-primary" id="btn-onboarding-continue">
                  <span>Continue</span> ${Utils.icons.arrowRight}
                </button>
              </div>
            </div>
          ` : `
            <div class="onboarding-content-card ready-step-card text-center">
              <div class="ready-check-icon">${Utils.icons.shieldCheck}</div>
              <h2 class="onboarding-title">Welcome to Breathe Clean</h2>
              <p class="onboarding-subtitle">Your spaces and smart actuators are calibrated. Autonomous environmental orchestration is active.</p>
              <button class="btn btn-primary btn-lg" id="btn-onboarding-finish">
                <span>Enter Dashboard</span> ${Utils.icons.arrowRight}
              </button>
            </div>
          `}
        </main>
      </div>
    `;
  },

  // Add / Edit Space Multi-step Modal (Matching Reference Modal)
  renderSpaceModal(roomToEdit = null) {
    const isEdit = !!roomToEdit;
    const name = roomToEdit ? roomToEdit.name : 'Bedroom';
    const type = roomToEdit ? roomToEdit.type : 'Bedroom';
    const length = roomToEdit ? roomToEdit.length : 4.5;
    const width = roomToEdit ? roomToEdit.width : 3.0;
    const ceilingHeight = roomToEdit ? roomToEdit.ceilingHeight : 2.8;
    const windows = roomToEdit ? roomToEdit.windowsCount : 1;
    const doors = roomToEdit ? roomToEdit.doorsCount : 1;
    const occupants = roomToEdit ? roomToEdit.typicalOccupants : 2;

    return `
      <div class="modal-backdrop" id="space-modal-backdrop">
        <div class="modal-dialog modal-space-dialog">
          <div class="modal-sidebar-stepper">
            <div class="modal-step-tab active" data-step="1">
              <span class="step-num-pill">${Utils.icons.check}</span>
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
                <h3 class="modal-title">${isEdit ? 'Edit space' : 'Add a space'}</h3>
                <p class="modal-subtitle">Enter basic information about your room.</p>
              </div>
              <button class="modal-close-btn" id="btn-close-space-modal" aria-label="Close modal">&times;</button>
            </div>

            <form id="form-space-modal" data-edit-id="${isEdit ? roomToEdit.id : ''}">
              <div class="modal-form-fields">
                <div class="form-field">
                  <label for="room-input-name">Room name</label>
                  <input type="text" id="room-input-name" value="${Utils.escapeHtml(name)}" required />
                </div>

                <div class="form-field">
                  <label for="room-input-type">Room type</label>
                  <select id="room-input-type" class="settings-select">
                    <option value="Bedroom" ${type === 'Bedroom' ? 'selected' : ''}>Bedroom</option>
                    <option value="Living Room" ${type === 'Living Room' ? 'selected' : ''}>Living Room</option>
                    <option value="Study" ${type === 'Study' ? 'selected' : ''}>Study</option>
                    <option value="Office" ${type === 'Office' ? 'selected' : ''}>Office</option>
                    <option value="Classroom" ${type === 'Classroom' ? 'selected' : ''}>Classroom</option>
                  </select>
                </div>

                <div class="form-row-2">
                  <div class="form-field">
                    <label for="room-input-length">Length (m)</label>
                    <input type="number" step="0.1" id="room-input-length" value="${length}" required />
                  </div>
                  <div class="form-field">
                    <label for="room-input-width">Width (m)</label>
                    <input type="number" step="0.1" id="room-input-width" value="${width}" required />
                  </div>
                </div>

                <div class="form-field">
                  <label for="room-input-height">Ceiling height (m)</label>
                  <input type="number" step="0.1" id="room-input-height" value="${ceilingHeight}" required />
                </div>

                <div class="form-row-2">
                  <div class="form-field">
                    <label for="room-input-windows">Windows</label>
                    <input type="number" id="room-input-windows" value="${windows}" min="0" required />
                  </div>
                  <div class="form-field">
                    <label for="room-input-doors">Doors</label>
                    <input type="number" id="room-input-doors" value="${doors}" min="1" required />
                  </div>
                </div>

                <div class="form-field">
                  <label for="room-input-occupants">Typical occupants</label>
                  <input type="number" id="room-input-occupants" value="${occupants}" min="1" required />
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-outline" id="btn-cancel-space-modal">Cancel</button>
                <button type="submit" class="btn btn-primary" id="btn-submit-space-modal">
                  <span>${isEdit ? 'Save Changes' : 'Create Space'}</span> ${Utils.icons.arrowRight}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  // Mode Switch Confirmation Modal (Custom dialog)
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

  // Format Chat Markdown & lists
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

  // Full AI Assistant Workspace View
  renderAssistant(room) {
    const isAuto = room ? room.mode === 'AUTO' : true;
    const messages = Chatbot.messages || [];

    const promptSuggestions = [
      'Switch to Manual mode',
      'Turn purifier to High',
      'Simulate outdoor smog (AQI 175)',
      'Why are the windows closed?',
      'Switch to Living Room',
      'Open the windows',
      'Set CO₂ to 1,350 ppm',
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
            <p class="page-subtitle">Autonomous environmental orchestration with live account and hardware actuation.</p>
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
                  ${m.sender === 'bot' ? Utils.icons.sparkles : (State.user ? State.user.name.charAt(0).toUpperCase() : 'U')}
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
                    <div class="chat-action-badge">
                      <span class="badge-icon">✓</span>
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
                placeholder="Give a prompt to control devices, switch modes, adjust simulation, or ask about air quality..." 
                rows="1" 
                required
              ></textarea>
              <button type="submit" class="btn btn-primary btn-send-prompt" id="btn-send-prompt" aria-label="Send prompt">
                <span>Send</span> ${Utils.icons.send}
              </button>
            </div>
            <div class="composer-footnote">
              <span>Supports real-time device control, mode switching, space creation, telemetry simulation, and settings adjustment.</span>
              <span class="keyboard-hint">Press Enter to send</span>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  // Floating AI Assistant Drawer Widget (available across all views)
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
                <span class="drawer-sub">Autonomous Actuation</span>
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
            <button class="mini-chip" data-prompt="Turn purifier to High">Purifier High</button>
            <button class="mini-chip" data-prompt="Switch to Manual mode">Manual Mode</button>
            <button class="mini-chip" data-prompt="Why are windows closed?">Why closed?</button>
            <button class="mini-chip" data-prompt="Simulate outdoor smog (AQI 175)">Smog Spike</button>
          </div>

          <div class="floating-drawer-body" id="floating-drawer-messages">
            <!-- Messages rendered dynamically -->
          </div>

          <form class="floating-drawer-composer" id="floating-drawer-form">
            <input 
              type="text" 
              id="floating-prompt-input" 
              placeholder="Ask anything or command hardware..." 
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

  // Sign Out Confirmation Modal (Matching Bottom-Right Screenshot Reference)
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

  // Authentic Google OAuth Account Picker Modal
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
            <h3 class="google-dialog-title">Choose an account</h3>
            <p class="google-dialog-sub">to continue to <strong style="color:#0f172a;">Breathe Clean</strong></p>

            <div class="google-accounts-list">
              <!-- Primary Account -->
              <button class="google-account-item" id="btn-select-google-account-1">
                <div class="google-avatar-circle">
                  <span>D</span>
                </div>
                <div class="google-account-info">
                  <span class="google-user-name">Divam Malik</span>
                  <span class="google-user-email">divam.malik@gmail.com</span>
                </div>
                <span class="google-active-indicator">${Utils.icons.check}</span>
              </button>

              <!-- Secondary Account option -->
              <button class="google-account-item" id="btn-select-google-account-2">
                <div class="google-avatar-circle" style="background: #0d9488;">
                  <span>B</span>
                </div>
                <div class="google-account-info">
                  <span class="google-user-name">Breathe Clean Dev</span>
                  <span class="google-user-email">engineering@breatheclean.io</span>
                </div>
              </button>

              <!-- Use another account action -->
              <button class="google-account-item google-item-add" id="btn-toggle-custom-google">
                <div class="google-avatar-circle google-avatar-ghost">
                  ${Utils.icons.plus}
                </div>
                <div class="google-account-info">
                  <span class="google-user-name">Use another Google account</span>
                  <span class="google-user-email">Sign in with any @gmail.com address</span>
                </div>
              </button>
            </div>

            <!-- Custom Google Account Inline Form (collapsible) -->
            <form id="form-custom-google-auth" class="custom-google-form" style="display: none; margin-bottom: 16px;">
              <div class="form-field" style="margin-bottom: 10px;">
                <label for="custom-google-email" style="font-size: 12px; font-weight: 600; color: #475569;">Your Google Email</label>
                <input type="email" id="custom-google-email" placeholder="you@gmail.com" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px;" required />
              </div>
              <div class="form-field" style="margin-bottom: 12px;">
                <label for="custom-google-name" style="font-size: 12px; font-weight: 600; color: #475569;">Full Name (optional)</label>
                <input type="text" id="custom-google-name" placeholder="First & Last Name" style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px;" />
              </div>
              <button type="submit" class="btn btn-primary btn-block" style="padding: 10px; font-size: 13px;">
                Continue with this Google Account
              </button>
            </form>

            <div class="google-dialog-footer-text">
              To continue, Google will share your name, email address, language preference, and profile picture with Breathe Clean. Before using this app, review their <a href="#" onclick="return false;">Privacy Policy</a> and <a href="#" onclick="return false;">Terms of Service</a>.
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
