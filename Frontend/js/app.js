/* Breathe Clean - Main Application Controller & Orchestration */

const App = {
  airflowAnimId: null,
  particles: [],
  analyticsData: null,
  pendingTargetMode: null,

  init() {
    State.init();
    Chatbot.init();

    // Check hash route if present
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (['dashboard', 'spaces', 'simulation', 'analytics', 'devices', 'assistant', 'settings'].includes(hash)) {
      State.activeView = hash;
    } else if (hash === 'signin') {
      State.user = null;
    } else if (hash === 'onboarding') {
      State.user = { id: 'usr_new', name: 'Divam', email: 'divam@breatheclean.io', isOnboarded: false };
    }

    // Check auth & onboarding state
    this.renderCurrentApplicationState();

    // Subscribe to state changes
    State.subscribe((event, data) => {
      this.handleStateChange(event, data);
    });

    // Hash change listener
    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash.replace('#', '').toLowerCase();
      if (['dashboard', 'spaces', 'simulation', 'analytics', 'devices', 'assistant', 'settings'].includes(newHash)) {
        if (State.activeView !== newHash) {
          State.setActiveView(newHash);
        }
      } else if (newHash === 'signin') {
        State.user = null;
        this.renderCurrentApplicationState();
      } else if (newHash === 'onboarding') {
        State.user = { id: 'usr_new', name: 'Divam', email: 'divam@breatheclean.io', isOnboarded: false };
        this.renderCurrentApplicationState();
      }
    });

    // Start background live clock
    setInterval(() => this.updateClock(), 1000);
  },

  renderCurrentApplicationState() {
    const appRoot = document.getElementById('app-root');
    const user = State.user;

    // Check if user is logged in
    if (!user) {
      this.stopAirflowSimulation();
      appRoot.innerHTML = Views.renderAuth('signin');
      this.attachAuthEvents();
      return;
    }

    // Check if user needs onboarding
    if (user.isOnboarded === false) {
      this.stopAirflowSimulation();
      appRoot.innerHTML = Views.renderOnboarding(2);
      this.attachOnboardingEvents();
      return;
    }

    // Render Main Shell
    const activeRoom = State.getActiveRoom();
    appRoot.innerHTML = `
      <div class="app-layout" id="app-layout">
        ${Views.renderSidebar(State.activeView)}
        <div class="app-main-area">
          ${Views.renderHeader(user, activeRoom)}
          <main class="app-body-container" id="app-body-container">
            ${this.renderActiveViewContent()}
          </main>
        </div>
      </div>
      <div id="modal-container"></div>
      <div id="toast-container" class="toast-container"></div>
      ${Views.renderFloatingAssistantWidget()}
    `;

    this.attachGlobalShellEvents();
    this.attachFloatingAssistantEvents();
    this.attachViewSpecificEvents();

    const floatingWidget = document.getElementById('floating-assistant-wrapper');
    if (floatingWidget) {
      floatingWidget.style.display = (State.activeView === 'assistant') ? 'none' : '';
    }

    if (State.activeView === 'dashboard') {
      this.startAirflowSimulation();
    } else if (State.activeView === 'analytics') {
      this.renderAnalyticsChart();
    }
  },

  renderActiveViewContent() {
    const activeRoom = State.getActiveRoom();
    switch (State.activeView) {
      case 'dashboard':
        return Views.renderDashboard(activeRoom);
      case 'spaces':
        return Views.renderSpaces(State.rooms);
      case 'simulation':
        return Views.renderSimulation(activeRoom);
      case 'analytics':
        return Views.renderAnalytics();
      case 'devices':
        return Views.renderDevices(State.rooms);
      case 'assistant':
        return Views.renderAssistant(activeRoom);
      case 'settings':
        return Views.renderSettings(State.user);
      default:
        return Views.renderDashboard(activeRoom);
    }
  },

  handleStateChange(event, data) {
    if (event === 'view_changed') {
      const floatingWidget = document.getElementById('floating-assistant-wrapper');
      if (floatingWidget) {
        floatingWidget.style.display = (data === 'assistant') ? 'none' : '';
      }

      const container = document.getElementById('app-body-container');
      if (container) {
        this.stopAirflowSimulation();
        container.innerHTML = this.renderActiveViewContent();
        this.updateSidebarActiveNav(data);
        this.attachViewSpecificEvents();

        if (data === 'dashboard') {
          this.startAirflowSimulation();
        } else if (data === 'analytics') {
          this.renderAnalyticsChart();
        }
      }
    } else if (event === 'room_changed' || event === 'mode_changed' || event === 'evaluated' || event === 'device_updated' || event === 'environment_updated') {
      // Re-render header & current view to keep synchronized
      const activeRoom = State.getActiveRoom();
      const user = State.user;
      
      const headerElem = document.querySelector('.app-header');
      if (headerElem && user) {
        headerElem.outerHTML = Views.renderHeader(user, activeRoom);
        this.attachHeaderEvents();
      }

      const bodyContainer = document.getElementById('app-body-container');
      if (bodyContainer) {
        if (State.activeView === 'dashboard' || State.activeView === 'simulation') {
          bodyContainer.innerHTML = this.renderActiveViewContent();
          this.attachViewSpecificEvents();
          if (State.activeView === 'dashboard') {
            this.startAirflowSimulation();
          }
        }
      }
    } else if (event === 'room_created' || event === 'room_deleted' || event === 'room_updated') {
      this.renderCurrentApplicationState();
    }
  },

  updateSidebarActiveNav(viewName) {
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      if (btn.dataset.view === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  updateClock() {
    const clock = document.getElementById('live-header-clock');
    if (clock) {
      clock.textContent = Utils.formatTime(new Date());
    }
  },

  // -------------------------------------------------------------
  // Events: Shell & Navigation
  // -------------------------------------------------------------
  attachGlobalShellEvents() {
    this.attachHeaderEvents();

    // Sidebar navigation
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (view) {
          window.location.hash = view;
          State.setActiveView(view);
          const sidebar = document.getElementById('app-sidebar');
          if (sidebar) sidebar.classList.remove('mobile-open');
        }
      });
    });

    // Mobile sidebar toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileSidebarClose = document.getElementById('mobile-sidebar-close');
    const sidebar = document.getElementById('app-sidebar');

    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.add('mobile-open');
      });
    }
    if (mobileSidebarClose && sidebar) {
      mobileSidebarClose.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
      });
    }

    // Sign out trigger button
    const signOutBtn = document.getElementById('btn-sign-out-trigger');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        this.openSignOutModal();
      });
    }
  },

  attachHeaderEvents() {
    // Room Selector Dropdown
    const roomBtn = document.getElementById('room-selector-btn');
    const roomDropdown = document.getElementById('room-dropdown-menu');

    if (roomBtn && roomDropdown) {
      roomBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        roomDropdown.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (!roomDropdown.contains(e.target) && !roomBtn.contains(e.target)) {
          roomDropdown.classList.remove('open');
        }
      });

      roomDropdown.querySelectorAll('.room-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
          const roomId = item.dataset.roomId;
          if (roomId) {
            State.setActiveRoom(roomId);
            roomDropdown.classList.remove('open');
          }
        });
      });

      const addRoomHeaderBtn = document.getElementById('header-add-room-btn');
      if (addRoomHeaderBtn) {
        addRoomHeaderBtn.addEventListener('click', () => {
          roomDropdown.classList.remove('open');
          this.openSpaceModal();
        });
      }
    }

    // Mode Toggle Segmented Control (AUTO / MANUAL)
    document.querySelectorAll('.mode-segmented-pill .mode-segment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetMode = btn.dataset.mode;
        const activeRoom = State.getActiveRoom();
        if (!activeRoom || activeRoom.mode === targetMode) return;

        // Custom Confirmation Dialog (Requirement 23)
        this.openModeConfirmModal(targetMode);
      });
    });

    // Profile button shortcut to settings
    const profileBtn = document.getElementById('btn-header-profile');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        State.setActiveView('settings');
      });
    }

    // Notifications button
    const notifBtn = document.getElementById('btn-notifications');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        const room = State.getActiveRoom();
        const aqi = room ? room.environment.outdoorAQI : 112;
        Utils.showToast(`Outdoor air quality currently at AQI ${aqi}. System actively managing indoor environment.`, 'info');
      });
    }
  },

  attachViewSpecificEvents() {
    const view = State.activeView;

    if (view === 'dashboard') {
      // Manual mode interactive controls
      document.querySelectorAll('.device-interactive-controls').forEach(group => {
        const deviceId = group.dataset.deviceId;
        const activeRoom = State.getActiveRoom();

        group.querySelectorAll('.btn-ctrl').forEach(btn => {
          btn.addEventListener('click', async () => {
            const newState = btn.dataset.state;
            if (activeRoom && deviceId) {
              await State.setDeviceStateManual(activeRoom.id, deviceId, newState);
              Utils.showToast(`Device state updated to ${newState}`, 'success');
            }
          });
        });
      });

      // Quick links
      document.querySelectorAll('[data-nav]').forEach(el => {
        el.addEventListener('click', () => {
          const target = el.dataset.nav;
          if (target) State.setActiveView(target);
        });
      });

      const emptyAddBtn = document.getElementById('btn-empty-add-space');
      if (emptyAddBtn) {
        emptyAddBtn.addEventListener('click', () => this.openSpaceModal());
      }
    } else if (view === 'spaces') {
      const addSpaceBtn = document.getElementById('btn-add-space-modal');
      if (addSpaceBtn) {
        addSpaceBtn.addEventListener('click', () => this.openSpaceModal());
      }

      document.querySelectorAll('.btn-open-space').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.roomId;
          State.setActiveRoom(id);
          State.setActiveView('dashboard');
        });
      });

      document.querySelectorAll('.btn-duplicate-room').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.dataset.roomId;
          await State.duplicateRoom(id);
          Utils.showToast('Space duplicated successfully', 'success');
        });
      });

      document.querySelectorAll('.btn-edit-room').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.roomId;
          const room = State.getRoom(id);
          if (room) this.openSpaceModal(room);
        });
      });

      document.querySelectorAll('.btn-delete-room').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.dataset.roomId;
          try {
            await State.deleteRoom(id);
            Utils.showToast('Space deleted', 'info');
          } catch (err) {
            Utils.showToast(err.message, 'warning');
          }
        });
      });
    } else if (view === 'simulation') {
      this.attachSimulationEvents();
    } else if (view === 'analytics') {
      this.attachAnalyticsEvents();
    } else if (view === 'devices') {
      document.querySelectorAll('.btn-device-toggle').forEach(btn => {
        btn.addEventListener('click', async () => {
          const roomId = btn.dataset.roomId;
          const devId = btn.dataset.deviceId;
          const current = btn.dataset.current;
          const room = State.getRoom(roomId);
          if (!room) return;
          const dev = room.devices.find(d => d.id === devId);
          if (!dev) return;

          let next = 'Normal';
          if (dev.type === 'window') next = current === 'Open' ? 'Closed' : 'Open';
          else if (dev.type === 'ventilation') next = current === 'Normal' ? 'High' : (current === 'High' ? 'Filtered' : 'Normal');
          else if (dev.type === 'purifier') next = current === 'Active' ? 'High' : (current === 'High' ? 'Off' : 'Active');

          await API.sendDeviceCommand(roomId, devId, next, 'YOU');
          State.rooms = API.getRooms();
          State.setActiveView('devices');
          Utils.showToast(`${dev.name} toggled to ${next}`, 'success');
        });
      });
    } else if (view === 'assistant') {
      this.attachAssistantViewEvents();
    } else if (view === 'settings') {
      this.attachSettingsEvents();
    }
  },

  // -------------------------------------------------------------
  // AI Assistant Full Workspace Events
  // -------------------------------------------------------------
  attachAssistantViewEvents() {
    const form = document.getElementById('assistant-composer-form');
    const input = document.getElementById('assistant-prompt-input');
    const container = document.getElementById('assistant-chat-container');
    const clearBtn = document.getElementById('btn-clear-chat');

    const scrollToBottom = () => {
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    };
    scrollToBottom();

    // Auto-scroll on initial render
    setTimeout(scrollToBottom, 60);

    // Suggestion chips
    document.querySelectorAll('.chat-suggestion-chip').forEach(chip => {
      chip.addEventListener('click', async () => {
        const prompt = chip.dataset.prompt;
        if (prompt) {
          await Chatbot.sendUserPrompt(prompt);
          this.refreshAssistantChatUI();
        }
      });
    });

    // Clear chat
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        Chatbot.clearHistory();
        this.refreshAssistantChatUI();
        Utils.showToast('Conversation reset', 'info');
      });
    }

    // Submit prompt
    if (form && input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        input.style.height = 'auto';

        await Chatbot.sendUserPrompt(text);
        this.refreshAssistantChatUI();
      });
    }
  },

  refreshAssistantChatUI() {
    const container = document.getElementById('assistant-chat-container');
    if (container) {
      container.innerHTML = (Chatbot.messages || []).map(m => `
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
              ${Views.formatChatMessage(m.text)}
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
      `).join('');
      container.scrollTop = container.scrollHeight;
    }

    // Also refresh floating messages if drawer exists
    this.refreshFloatingDrawerMessages();
  },

  // -------------------------------------------------------------
  // Floating AI Assistant Drawer Events
  // -------------------------------------------------------------
  attachFloatingAssistantEvents() {
    const toggleBtn = document.getElementById('btn-floating-assistant');
    const drawer = document.getElementById('floating-chat-drawer');
    const closeBtn = document.getElementById('btn-close-floating-drawer');
    const expandBtn = document.getElementById('btn-expand-assistant');
    const form = document.getElementById('floating-drawer-form');
    const input = document.getElementById('floating-prompt-input');

    if (toggleBtn && drawer) {
      toggleBtn.addEventListener('click', () => {
        drawer.classList.toggle('open');
        if (drawer.classList.contains('open')) {
          this.refreshFloatingDrawerMessages();
          if (input) input.focus();
        }
      });
    }

    if (closeBtn && drawer) {
      closeBtn.addEventListener('click', () => {
        drawer.classList.remove('open');
      });
    }

    if (expandBtn && drawer) {
      expandBtn.addEventListener('click', () => {
        drawer.classList.remove('open');
        window.location.hash = 'assistant';
        State.setActiveView('assistant');
      });
    }

    // Mini suggestions in floating drawer
    document.querySelectorAll('.floating-drawer-suggestions .mini-chip').forEach(chip => {
      chip.addEventListener('click', async () => {
        const prompt = chip.dataset.prompt;
        if (prompt) {
          await Chatbot.sendUserPrompt(prompt);
          this.refreshFloatingDrawerMessages();
          if (State.activeView === 'assistant') {
            this.refreshAssistantChatUI();
          }
        }
      });
    });

    // Floating form submission
    if (form && input) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        await Chatbot.sendUserPrompt(text);
        this.refreshFloatingDrawerMessages();
        if (State.activeView === 'assistant') {
          this.refreshAssistantChatUI();
        }
      });
    }
  },

  refreshFloatingDrawerMessages() {
    const msgBox = document.getElementById('floating-drawer-messages');
    if (!msgBox) return;

    msgBox.innerHTML = (Chatbot.messages || []).map(m => `
      <div class="mini-chat-msg mini-msg-${m.sender}">
        <div class="mini-chat-text">${Views.formatChatMessage(m.text)}</div>
        ${m.actionTag ? `
          <div class="mini-action-tag">
            ✓ ${Utils.escapeHtml(m.actionTag)}: ${Utils.escapeHtml(m.actionDetails || '')}
          </div>
        ` : ''}
      </div>
    `).join('');

    msgBox.scrollTop = msgBox.scrollHeight;
  },

  // -------------------------------------------------------------
  // Simulation Page Event Listeners
  // -------------------------------------------------------------
  attachSimulationEvents() {
    const activeRoom = State.getActiveRoom();
    if (!activeRoom) return;

    const sliders = [
      { id: 'sim-outdoor-aqi', key: 'outdoorAQI', disp: 'val-outdoor-aqi', suffix: '' },
      { id: 'sim-indoor-aqi', key: 'indoorAQI', disp: 'val-indoor-aqi', suffix: '' },
      { id: 'sim-co2', key: 'co2', disp: 'val-co2', suffix: ' ppm' },
      { id: 'sim-temperature', key: 'temperature', disp: 'val-temperature', suffix: ' °C' },
      { id: 'sim-humidity', key: 'humidity', disp: 'val-humidity', suffix: ' %' },
      { id: 'sim-occupancy', key: 'occupancy', disp: 'val-occupancy', suffix: '' }
    ];

    sliders.forEach(s => {
      const el = document.getElementById(s.id);
      const disp = document.getElementById(s.disp);
      if (el && disp) {
        el.addEventListener('input', async (e) => {
          const val = Number(e.target.value);
          disp.textContent = `${val}${s.suffix}`;
          
          // Live update active room environment & re-evaluate
          await State.updateEnvironment(activeRoom.id, { [s.key]: val });
          this.updateSimulationReactionUI();
        });
      }
    });

    // Preset Buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const preset = btn.dataset.preset;
        let updates = {};

        if (preset === 'smog') {
          updates = { outdoorAQI: 165, indoorAQI: 58, co2: 680, temperature: 26, humidity: 45, occupancy: 2 };
        } else if (preset === 'fresh') {
          updates = { outdoorAQI: 22, indoorAQI: 30, co2: 520, temperature: 21, humidity: 52, occupancy: 1 };
        } else if (preset === 'crowded') {
          updates = { outdoorAQI: 45, indoorAQI: 62, co2: 1380, temperature: 25, humidity: 58, occupancy: 8 };
        } else if (preset === 'indoor-smoke') {
          updates = { outdoorAQI: 35, indoorAQI: 145, co2: 740, temperature: 24, humidity: 50, occupancy: 2 };
        } else if (preset === 'optimal') {
          updates = { outdoorAQI: 32, indoorAQI: 24, co2: 580, temperature: 23, humidity: 48, occupancy: 1 };
        }

        await State.updateEnvironment(activeRoom.id, updates);
        
        // Update slider positions & displays
        sliders.forEach(s => {
          const el = document.getElementById(s.id);
          const disp = document.getElementById(s.disp);
          if (el && disp && updates[s.key] !== undefined) {
            el.value = updates[s.key];
            disp.textContent = `${updates[s.key]}${s.suffix}`;
          }
        });

        this.updateSimulationReactionUI();
        Utils.showToast(`Applied preset scenario: ${btn.textContent}`, 'info');
      });
    });
  },

  updateSimulationReactionUI() {
    const activeRoom = State.getActiveRoom();
    if (!activeRoom) return;

    const decision = activeRoom.decision || Engine.decide(activeRoom.environment, activeRoom, activeRoom.devices);
    
    const titleEl = document.getElementById('sim-reaction-title');
    const reasonEl = document.getElementById('sim-reaction-reason');
    const outcomeEl = document.getElementById('sim-reaction-outcome');
    const winEl = document.getElementById('sim-preview-window');
    const ventEl = document.getElementById('sim-preview-vent');
    const purEl = document.getElementById('sim-preview-purifier');

    if (titleEl) titleEl.textContent = decision.title;
    if (reasonEl) reasonEl.textContent = decision.reason;
    if (outcomeEl) outcomeEl.textContent = decision.expectedOutcome;
    if (winEl) winEl.textContent = decision.window;
    if (ventEl) ventEl.textContent = decision.ventilation;
    if (purEl) purEl.textContent = decision.purifier;
  },

  // -------------------------------------------------------------
  // Analytics Canvas Line Chart
  // -------------------------------------------------------------
  attachAnalyticsEvents() {
    document.querySelectorAll('.analytics-time-pills .time-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.analytics-time-pills .time-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderAnalyticsChart(btn.dataset.time);
      });
    });

    const select = document.getElementById('analytics-metric-select');
    if (select) {
      select.addEventListener('change', () => {
        const activeTime = document.querySelector('.analytics-time-pills .time-filter-btn.active')?.dataset.time || '24H';
        this.renderAnalyticsChart(activeTime);
      });
    }
  },

  renderAnalyticsChart(timeframe = '24H') {
    const canvas = document.getElementById('analytics-chart-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = (rect.width || 900) * dpr;
    canvas.height = (rect.height || 300) * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width || 900;
    const height = rect.height || 300;

    // Generate mock realistic trend points based on selected metric
    const metricSelect = document.getElementById('analytics-metric-select');
    const metric = metricSelect ? metricSelect.value : 'indoorAQI';

    let points = [];
    let labels = [];

    if (timeframe === '24H') {
      labels = ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM', 'Now'];
      if (metric === 'indoorAQI') {
        points = [32, 28, 30, 48, 62, 54, 42, 38, 36];
      } else if (metric === 'co2') {
        points = [580, 520, 540, 780, 890, 810, 720, 640, 620];
      } else {
        points = [75, 70, 85, 120, 135, 115, 110, 112, 110];
      }
    } else if (timeframe === '7D') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      if (metric === 'indoorAQI') points = [35, 42, 38, 52, 45, 30, 36];
      else if (metric === 'co2') points = [620, 710, 680, 840, 790, 590, 640];
      else points = [90, 115, 128, 140, 112, 85, 110];
    } else {
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      if (metric === 'indoorAQI') points = [38, 44, 40, 35];
      else if (metric === 'co2') points = [660, 720, 690, 630];
      else points = [105, 125, 118, 98];
    }

    // Determine Min & Max bounds
    const minVal = Math.min(...points) * 0.75;
    const maxVal = Math.max(...points) * 1.25;

    ctx.clearRect(0, 0, width, height);

    const padLeft = 50;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 45;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // Grid lines & Y Axis Labels
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';

    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padTop + (plotH / gridSteps) * i;
      const val = Math.round(maxVal - (i / gridSteps) * (maxVal - minVal));

      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      ctx.fillText(val, padLeft - 10, y + 4);
    }

    // X Axis Labels
    ctx.textAlign = 'center';
    const xStep = plotW / (points.length - 1);
    labels.forEach((lbl, i) => {
      const x = padLeft + i * xStep;
      ctx.fillText(lbl, x, height - 15);
    });

    // Map data to coordinates
    const coords = points.map((val, i) => {
      const x = padLeft + i * xStep;
      const y = padTop + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
      return { x, y, val };
    });

    // Draw Smooth Spline Area
    const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    gradient.addColorStop(0, 'rgba(21, 128, 61, 0.22)');
    gradient.addColorStop(1, 'rgba(21, 128, 61, 0.01)');

    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 0; i < coords.length - 1; i++) {
      const cpX = (coords[i].x + coords[i + 1].x) / 2;
      ctx.bezierCurveTo(cpX, coords[i].y, cpX, coords[i + 1].y, coords[i + 1].x, coords[i + 1].y);
    }
    ctx.lineTo(coords[coords.length - 1].x, padTop + plotH);
    ctx.lineTo(coords[0].x, padTop + plotH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Spline Line
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 0; i < coords.length - 1; i++) {
      const cpX = (coords[i].x + coords[i + 1].x) / 2;
      ctx.bezierCurveTo(cpX, coords[i].y, cpX, coords[i + 1].y, coords[i + 1].x, coords[i + 1].y);
    }
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw Points
    coords.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#15803d';
      ctx.stroke();
    });
  },

  // -------------------------------------------------------------
  // Settings Events
  // -------------------------------------------------------------
  attachSettingsEvents() {
    const defaultModeChoice = document.getElementById('settings-default-mode');
    if (defaultModeChoice) {
      defaultModeChoice.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          defaultModeChoice.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const settings = API.getSettings();
          settings.defaultMode = btn.dataset.val;
          API.saveSettings(settings);
          Utils.showToast(`Default mode saved as ${settings.defaultMode}`, 'success');
        });
      });
    }

    const notifToggle = document.getElementById('setting-notif-alerts');
    if (notifToggle) {
      notifToggle.addEventListener('change', (e) => {
        const settings = API.getSettings();
        settings.notificationsEnabled = e.target.checked;
        API.saveSettings(settings);
        Utils.showToast(`Notifications ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
      });
    }

    const tempUnit = document.getElementById('setting-temp-unit');
    if (tempUnit) {
      tempUnit.addEventListener('change', (e) => {
        const settings = API.getSettings();
        settings.tempUnit = e.target.value;
        API.saveSettings(settings);
        Utils.showToast(`Temperature unit updated`, 'info');
      });
    }

    const btnReset = document.getElementById('btn-reset-demo-data');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        State.init();
        this.renderCurrentApplicationState();
        Utils.showToast('Demo data successfully restored to defaults', 'success');
      });
    }
  },

  // -------------------------------------------------------------
  // Dynamic Airflow & Technical Room View Simulation Engine
  // -------------------------------------------------------------
  startAirflowSimulation() {
    this.stopAirflowSimulation();

    const canvas = document.getElementById('airflow-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const container = canvas.parentElement;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    // Initialize streamline particles
    this.particles = [];
    const count = 38;
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(canvas, i / count));
    }

    const loop = () => {
      if (!document.getElementById('airflow-canvas')) {
        this.stopAirflowSimulation();
        return;
      }

      const activeRoom = State.getActiveRoom();
      const winDev = activeRoom ? activeRoom.devices.find(d => d.type === 'window') : { state: 'Closed' };
      const purDev = activeRoom ? activeRoom.devices.find(d => d.type === 'purifier') : { state: 'Active' };
      const ventDev = activeRoom ? activeRoom.devices.find(d => d.type === 'ventilation') : { state: 'Normal' };
      const outdoorAQI = activeRoom ? activeRoom.environment.outdoorAQI : 112;

      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Draw subtle technical airflow grid & zone guides
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(15, 15, w - 30, h - 30);

      // Window Anchor (left wall)
      const winX = w * 0.18;
      const winY = h * 0.38;
      // Purifier Anchor (right floor unit)
      const purX = w * 0.88;
      const purY = h * 0.74;

      const isWindowOpen = winDev && winDev.state === 'Open';
      const isPurifierOn = purDev && (purDev.state === 'Active' || purDev.state === 'High');
      const isHighPurifier = purDev && purDev.state === 'High';

      // Animate Airflow Streamlines
      this.particles.forEach(p => {
        p.progress += p.speed * (isHighPurifier ? 1.5 : 1.0);
        if (p.progress > 1) {
          p.progress = 0;
          p.seed = Math.random();
        }

        // Particle stream behavior
        let x, y, alpha, color;

        if (p.type === 'window') {
          if (!isWindowOpen) {
            // Window closed: particle stays dormant or near window frame
            x = winX + (Math.sin(p.progress * Math.PI * 2) * 8);
            y = winY + (p.seed - 0.5) * 40;
            alpha = 0.08;
            color = 'rgba(200, 200, 200, ';
          } else {
            // Window Open: Fresh air curves across room towards floor / bed
            const t = p.progress;
            x = winX + t * (w * 0.55);
            y = winY + Math.sin(t * Math.PI) * 50 + (p.seed - 0.5) * 35;
            alpha = Math.sin(t * Math.PI) * 0.75;
            
            // Outdoor AQI color coding
            if (outdoorAQI > 100) {
              color = 'rgba(217, 119, 6, '; // Amber warning
            } else {
              color = 'rgba(16, 185, 129, '; // Crisp emerald green
            }
          }
        } else if (p.type === 'purifier') {
          // Air circulation into and out of purifier unit
          const t = p.progress;
          if (isPurifierOn) {
            if (t < 0.45) {
              // Room air drawing towards purifier base
              const s = t / 0.45;
              x = w * 0.65 + s * (purX - w * 0.65) + Math.cos(s * Math.PI) * 15;
              y = h * 0.82 + (s * (purY - h * 0.82));
              alpha = s * 0.6;
              color = 'rgba(147, 197, 253, '; // Soft ambient blue
            } else {
              // Pure cleaned air jet rising from top of purifier
              const s = (t - 0.45) / 0.55;
              x = purX + Math.sin(s * Math.PI * 2) * 14 - (s * 30);
              y = (purY - 20) - s * (h * 0.45);
              alpha = (1 - s) * 0.85;
              color = 'rgba(52, 211, 153, '; // Luminous pristine green
            }
          } else {
            x = purX;
            y = purY - 10;
            alpha = 0.05;
            color = 'rgba(156, 163, 175, ';
          }
        } else {
          // Ambient room drift / ventilation
          const t = p.progress;
          x = (w * 0.3) + t * (w * 0.45) + (Math.sin(t * 4) * 20);
          y = (h * 0.2) + t * (h * 0.5) + (p.seed * 30);
          alpha = Math.sin(t * Math.PI) * 0.35;
          color = 'rgba(96, 165, 250, ';
        }

        // Render particle head and trail
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${alpha})`;
        ctx.fill();

        // Subtle glow halo
        ctx.beginPath();
        ctx.arc(x, y, p.size * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${alpha * 0.3})`;
        ctx.fill();
      });

      this.airflowAnimId = requestAnimationFrame(loop);
    };

    this.airflowAnimId = requestAnimationFrame(loop);
  },

  createParticle(canvas, initialProgress = 0) {
    const types = ['window', 'purifier', 'ambient'];
    return {
      type: types[Math.floor(Math.random() * types.length)],
      progress: initialProgress,
      speed: 0.0035 + Math.random() * 0.004,
      size: 1.8 + Math.random() * 1.6,
      seed: Math.random()
    };
  },

  stopAirflowSimulation() {
    if (this.airflowAnimId) {
      cancelAnimationFrame(this.airflowAnimId);
      this.airflowAnimId = null;
    }
  },

  // -------------------------------------------------------------
  // Modals & Confirmations
  // -------------------------------------------------------------
  openModeConfirmModal(targetMode) {
    const container = document.getElementById('modal-container');
    if (!container) return;

    this.pendingTargetMode = targetMode;
    container.innerHTML = Views.renderModeConfirmModal(targetMode);

    const backdrop = document.getElementById('mode-confirm-modal-backdrop');
    const cancelBtn = document.getElementById('btn-mode-cancel');
    const confirmBtn = document.getElementById('btn-mode-confirm');

    const closeModal = () => {
      if (container) container.innerHTML = '';
      this.pendingTargetMode = null;
    };

    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        const activeRoom = State.getActiveRoom();
        if (activeRoom && this.pendingTargetMode) {
          await State.setMode(activeRoom.id, this.pendingTargetMode);
          Utils.showToast(`Switched to ${this.pendingTargetMode} mode`, 'success');
        }
        closeModal();
      });
    }
  },

  openSpaceModal(roomToEdit = null) {
    const container = document.getElementById('modal-container');
    if (!container) return;

    container.innerHTML = Views.renderSpaceModal(roomToEdit);

    const backdrop = document.getElementById('space-modal-backdrop');
    const closeBtn = document.getElementById('btn-close-space-modal');
    const cancelBtn = document.getElementById('btn-cancel-space-modal');
    const form = document.getElementById('form-space-modal');

    const closeModal = () => {
      if (container) container.innerHTML = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = form.dataset.editId;
        const name = document.getElementById('room-input-name').value.trim();
        const type = document.getElementById('room-input-type').value;
        const length = parseFloat(document.getElementById('room-input-length').value);
        const width = parseFloat(document.getElementById('room-input-width').value);
        const ceilingHeight = parseFloat(document.getElementById('room-input-height').value);
        const windowsCount = parseInt(document.getElementById('room-input-windows').value, 10);
        const doorsCount = parseInt(document.getElementById('room-input-doors').value, 10);
        const typicalOccupants = parseInt(document.getElementById('room-input-occupants').value, 10);

        if (editId) {
          await State.updateRoom(editId, {
            name,
            type,
            length,
            width,
            area: Number((length * width).toFixed(1)),
            ceilingHeight,
            windowsCount,
            doorsCount,
            typicalOccupants
          });
          Utils.showToast('Space updated successfully', 'success');
        } else {
          await State.addRoom({
            name,
            type,
            length,
            width,
            ceilingHeight,
            windowsCount,
            doorsCount,
            typicalOccupants
          });
          Utils.showToast(`Space "${name}" created`, 'success');
        }

        closeModal();
      });
    }
  },

  openSignOutModal() {
    const container = document.getElementById('modal-container');
    if (!container) return;

    container.innerHTML = Views.renderSignOutModal();

    const backdrop = document.getElementById('signout-modal-backdrop');
    const cancelBtn = document.getElementById('btn-cancel-signout');
    const confirmBtn = document.getElementById('btn-confirm-signout');

    const closeModal = () => {
      if (container) container.innerHTML = '';
    };

    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        await API.logout();
        State.user = null;
        closeModal();
        this.renderCurrentApplicationState();
        Utils.showToast('Signed out successfully', 'info');
      });
    }
  },

  // -------------------------------------------------------------
  // Authentication & Onboarding Forms
  // -------------------------------------------------------------
  attachAuthEvents() {
    const formSignIn = document.getElementById('form-sign-in');
    const formSignUp = document.getElementById('form-sign-up');
    const btnGotoSignUp = document.getElementById('btn-goto-signup');
    const btnGotoSignIn = document.getElementById('btn-goto-signin');

    if (btnGotoSignUp) {
      btnGotoSignUp.addEventListener('click', () => {
        const root = document.getElementById('app-root');
        root.innerHTML = Views.renderAuth('signup');
        this.attachAuthEvents();
      });
    }

    if (btnGotoSignIn) {
      btnGotoSignIn.addEventListener('click', () => {
        const root = document.getElementById('app-root');
        root.innerHTML = Views.renderAuth('signin');
        this.attachAuthEvents();
      });
    }

    // Toggle password visibility
    document.querySelectorAll('.btn-toggle-pw').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        if (input) {
          input.type = input.type === 'password' ? 'text' : 'password';
        }
      });
    });

    if (formSignIn) {
      formSignIn.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;
        const remember = document.getElementById('signin-remember').checked;

        try {
          const user = await API.login(email, password, remember);
          State.user = user;
          this.renderCurrentApplicationState();
          Utils.showToast(`Welcome back, ${user.name}`, 'success');
        } catch (err) {
          Utils.showToast(err.message, 'warning');
        }
      });
    }

    if (formSignUp) {
      formSignUp.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const pw = document.getElementById('signup-password').value;
        const confirmPw = document.getElementById('signup-password-confirm').value;

        if (pw !== confirmPw) {
          Utils.showToast('Passwords do not match', 'warning');
          return;
        }

        try {
          const user = await API.signup(name, email, pw);
          State.user = user;
          this.renderCurrentApplicationState();
          Utils.showToast('Account created successfully', 'success');
        } catch (err) {
          Utils.showToast(err.message, 'warning');
        }
      });
    }
  },

  attachOnboardingEvents() {
    const continueBtn = document.getElementById('btn-onboarding-continue');
    const backBtn = document.getElementById('btn-onboarding-back');
    const addRoomBtn = document.getElementById('btn-onboarding-add-room');
    const finishBtn = document.getElementById('btn-onboarding-finish');

    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        const root = document.getElementById('app-root');
        root.innerHTML = Views.renderOnboarding(5); // Ready step
        this.attachOnboardingEvents();
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        Utils.showToast('Account already calibrated', 'info');
      });
    }

    if (addRoomBtn) {
      addRoomBtn.addEventListener('click', () => {
        this.openSpaceModal();
      });
    }

    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        API.updateUser({ isOnboarded: true });
        State.user = API.getCurrentUser();
        this.renderCurrentApplicationState();
        Utils.showToast('Setup complete! Live environmental monitoring active.', 'success');
      });
    }
  }
};

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
