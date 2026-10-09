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

    const recentActivity = room.activity ? room.activity.slice(0, 5) : [];

    return `
      <div class="view-content view-dashboard">
        ${this.renderMetricsBar(room.environment)}

        <div class="dashboard-grid">
          <!-- Column 1: Technical & Realistic Room View Canvas -->
          <div class="dash-card card-room-view">
            <div class="card-head">
              <span class="card-title">Room view</span>
              <span class="live-pill">
                <span class="live-pulse"></span> Live view (Simulated)
              </span>
            </div>

            <div class="room-canvas-container">
              <img src="${room.image}" alt="${room.name}" class="room-canvas-bg" id="room-canvas-bg" />
              <canvas id="airflow-canvas" class="airflow-canvas"></canvas>
              <div class="room-canvas-overlay-badges">
                <span class="room-badge-indicator badge-window">Window: ${winDev.state}</span>
                <span class="room-badge-indicator badge-purifier">Purifier: ${purDev.state}</span>
                <span class="room-badge-indicator badge-vent">Ventilation: ${ventDev.state}</span>
              </div>
            </div>
          </div>

          <!-- Column 2: Current System Decision -->
          <div class="dash-card card-system-decision">
            <div class="card-head">
              <div class="decision-head-left">
                <span class="decision-icon">${Utils.icons.shieldCheck}</span>
                <span class="card-title">Current system decision</span>
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
          </div>

          <!-- Column 3: Devices Control/Status -->
          <div class="dash-card card-devices">
            <div class="card-head">
              <span class="card-title">Devices</span>
              <button class="link-btn-view-all" data-nav="devices">View all ${Utils.icons.arrowRight}</button>
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
                    ${isAuto ? 'Controlled automatically' : 'Manual control'}
                  </div>
                  ${!isAuto ? `
                    <div class="device-interactive-controls" data-device-id="${winDev.id}">
                      <button class="btn-ctrl ${winDev.state === 'Open' ? 'active' : ''}" data-state="Open">Open</button>
                      <button class="btn-ctrl ${winDev.state === 'Closed' ? 'active' : ''}" data-state="Closed">Close</button>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Ventilation -->
              <div class="device-row-item">
                <div class="device-item-icon">${Utils.icons.fan}</div>
                <div class="device-item-content">
                  <div class="device-row-top">
                    <span class="device-name">Ventilation</span>
                    <span class="device-status-badge badge-green">${ventDev.state}</span>
                  </div>
                  <div class="device-row-sub">
                    ${isAuto ? (ventDev.state === 'Filtered' ? 'Running sealed MERV filtration' : 'Running at standard rate') : 'Manual control'}
                  </div>
                  ${!isAuto ? `
                    <div class="device-interactive-controls" data-device-id="${ventDev.id}">
                      <button class="btn-ctrl ${ventDev.state === 'Low' ? 'active' : ''}" data-state="Low">Low</button>
                      <button class="btn-ctrl ${ventDev.state === 'Normal' ? 'active' : ''}" data-state="Normal">Normal</button>
                      <button class="btn-ctrl ${ventDev.state === 'High' ? 'active' : ''}" data-state="High">High</button>
                      <button class="btn-ctrl ${ventDev.state === 'Filtered' ? 'active' : ''}" data-state="Filtered">Filtered</button>
                    </div>
                  ` : ''}
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
                    ${isAuto ? `Filtering indoor air (${purDev.state})` : 'Manual control'}
                  </div>
                  ${!isAuto ? `
                    <div class="device-interactive-controls" data-device-id="${purDev.id}">
                      <button class="btn-ctrl ${purDev.state === 'Off' ? 'active' : ''}" data-state="Off">Off</button>
                      <button class="btn-ctrl ${purDev.state === 'Low' || purDev.state === 'Standby' ? 'active' : ''}" data-state="Low">Low</button>
                      <button class="btn-ctrl ${purDev.state === 'Active' || purDev.state === 'Normal' ? 'active' : ''}" data-state="Active">Medium</button>
                      <button class="btn-ctrl ${purDev.state === 'High' ? 'active' : ''}" data-state="High">High</button>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>

          <!-- Column 4: Recent Activity -->
          <div class="dash-card card-recent-activity">
            <div class="card-head">
              <span class="card-title">Recent activity</span>
              <button class="link-btn-view-all" id="btn-refresh-activity" title="Refresh">View all ${Utils.icons.arrowRight}</button>
            </div>

            <div class="activity-timeline">
              ${recentActivity.length === 0 ? `
                <div class="timeline-empty">No activity recorded yet for this space.</div>
              ` : recentActivity.map(act => `
                <div class="timeline-item">
                  <div class="timeline-meta">
                    <span class="timeline-time">${Utils.formatTime(new Date(act.timestamp))}</span>
                    <span class="timeline-source source-${act.source ? act.source.toLowerCase() : 'system'}">
                      <span class="source-dot"></span> ${act.source || 'SYSTEM'}
                    </span>
                  </div>
                  <div class="timeline-content">
                    <span class="timeline-title">${Utils.escapeHtml(act.action)}</span>
                    <span class="timeline-detail">${Utils.escapeHtml(act.detail)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
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
                    <input type="password" id="signin-password" placeholder="Enter your password" value="••••••••" required />
                    <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility">👁️</button>
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

              <form id="form-sign-up" class="auth-form">
                <div class="form-field">
                  <label for="signup-name">Full name</label>
                  <input type="text" id="signup-name" placeholder="John Doe" required />
                </div>

                <div class="form-field">
                  <label for="signup-email">Email</label>
                  <input type="email" id="signup-email" placeholder="you@example.com" required />
                </div>

                <div class="form-field">
                  <label for="signup-password">Password</label>
                  <div class="input-password-wrapper">
                    <input type="password" id="signup-password" placeholder="Create a password" required />
                    <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility">👁️</button>
                  </div>
                </div>

                <div class="form-field">
                  <label for="signup-password-confirm">Confirm password</label>
                  <div class="input-password-wrapper">
                    <input type="password" id="signup-password-confirm" placeholder="Confirm your password" required />
                    <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility">👁️</button>
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
  }
};
