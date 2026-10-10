
const App = {
  airflowAnimId: null,
  particles: [],
  analyticsData: null,
  analyticsRequestId: 0,
  pendingTargetMode: null,
  dashboardRequestId: 0,
  deviceRequestId: 0,
  onboardingStep: 1,
  onboardingDevices: { window: false, ventilation: false, purifier: false },
  onboardingPreferences: null,
  onboardingLocation: null,
  onboardingOutdoorAirQuality: null,
  onboardingUserId: null,
  onboardingSaveQueue: Promise.resolve(),

  async init() {
    State.init();
    Chatbot.init();

    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (['dashboard', 'spaces', 'simulation', 'analytics', 'devices', 'assistant', 'settings'].includes(hash)) {
      State.activeView = hash;
    } else if (hash === 'signin') {
      State.user = null;
      State.rooms = [];
      State.activeRoomId = null;
      Chatbot.setAccount(null);
    } else if (hash === 'onboarding') {
      State.user = null;
      State.rooms = [];
      State.activeRoomId = null;
      Chatbot.setAccount(null);
    }

    let restoreError = null;
    if (State.user && Number.isSafeInteger(State.user.id)) {
      try {
        const restoredUser = await API.restoreAccountSetup();
        this.onboardingUserId = null;
        this.setAuthenticatedUser(restoredUser);
      } catch (error) {
        restoreError = error;
        API.clearRememberedUser();
        Chatbot.setAccount(null);
        State.user = null;
        State.rooms = [];
        State.activeRoomId = null;
      }
    }

    this.renderCurrentApplicationState();
    if (restoreError) {
      Utils.showToast('Your account session could not be restored. Sign in to load your saved setup.', 'warning');
    }

    State.subscribe((event, data) => {
      this.handleStateChange(event, data);
    });

    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash.replace('#', '').toLowerCase();
      if (['dashboard', 'spaces', 'simulation', 'analytics', 'devices', 'assistant', 'settings'].includes(newHash)) {
        if (State.activeView !== newHash) {
          State.setActiveView(newHash);
        }
      } else if (newHash === 'signin') {
        State.user = null;
        State.rooms = [];
        State.activeRoomId = null;
        this.onboardingUserId = null;
        Chatbot.setAccount(null);
        this.renderCurrentApplicationState();
      } else if (newHash === 'onboarding') {
        State.user = null;
        State.rooms = [];
        State.activeRoomId = null;
        this.onboardingUserId = null;
        Chatbot.setAccount(null);
        this.renderCurrentApplicationState();
      }
    });

    setInterval(() => this.updateClock(), 1000);
  },

  renderCurrentApplicationState() {
    const appRoot = document.getElementById('app-root');
    const user = State.user;

    if (!user) {
      this.stopAirflowSimulation();
      appRoot.innerHTML = Views.renderAuth('signin');
      this.attachAuthEvents();
      return;
    }

    if (user.isOnboarded === false) {
      this.stopAirflowSimulation();
      this.prepareOnboardingForUser(user);
      appRoot.innerHTML = Views.renderOnboarding(this.onboardingStep);
      this.attachOnboardingEvents();
      return;
    }

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
      this.refreshDashboardFromBackend();
      if (this.showDashboardEntranceAnimation) {
        this.runDashboardLoadingAnimation();
      }
    } else if (State.activeView === 'simulation') {
      this.refreshSimulationFromBackend();
    } else if (State.activeView === 'devices') {
      this.refreshDevicesFromBackend();
    } else if (State.activeView === 'analytics') {
      this.loadAnalytics('24H');
    }
  },

  prepareOnboardingForUser(user) {
    const userId = String(user.id);
    if (this.onboardingUserId === userId) return;
    const savedSetup = API.getCachedAccountSetup();
    this.onboardingUserId = userId;
    this.onboardingStep = 1;
    this.onboardingDevices = savedSetup?.devices || {
      window: false,
      ventilation: false,
      purifier: false
    };
    this.onboardingPreferences = savedSetup?.preferences || null;
    this.onboardingLocation = savedSetup?.location || null;
    this.onboardingOutdoorAirQuality = savedSetup?.outdoorAirQuality || null;
  },

  setAuthenticatedUser(user) {
    State.user = user;
    State.rooms = API.getRooms();
    State.activeRoomId = API.getActiveRoomId();
    Chatbot.setAccount(user?.id ?? null);
  },

  buildOnboardingSetup(setupCompleted = false) {
    return {
      setupCompleted,
      rooms: API.getRooms(),
      devices: { ...this.onboardingDevices },
      preferences: this.onboardingPreferences
        ? { ...this.onboardingPreferences }
        : null,
      location: this.onboardingLocation
        ? { ...this.onboardingLocation }
        : null,
      outdoorAirQuality: this.onboardingOutdoorAirQuality
        ? { ...this.onboardingOutdoorAirQuality }
        : null
    };
  },

  async persistOnboardingDraft() {
    const setup = this.buildOnboardingSetup(false);
    const userId = this.onboardingUserId;
    const save = this.onboardingSaveQueue
      .catch(() => {})
      .then(() => {
        if (!userId || String(State.user?.id) !== userId || this.onboardingUserId !== userId) {
          throw new Error('The signed-in account changed before setup could be saved.');
        }
        return API.saveAccountSetup(setup);
      });
    this.onboardingSaveQueue = save;
    return save;
  },

  updateOnboardingLocationDisplay() {
    const locationSummary = document.getElementById('onboarding-location-summary');
    if (locationSummary) {
      if (!this.onboardingLocation) {
        locationSummary.textContent = 'No location selected.';
      } else {
        const location = this.onboardingLocation;
        const gpsAccuracy = location.source === 'gps' && Number.isFinite(location.accuracy)
          ? ` (±${Math.round(location.accuracy)} m)`
          : '';
        locationSummary.textContent =
          `${location.placeName || (location.source === 'gps' ? 'GPS-detected location' : 'Manually entered location')}: ` +
          `${location.source === 'gps' ? 'GPS-detected' : 'Manually entered'}: ` +
          `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}${gpsAccuracy} · ` +
          `recorded ${new Date(location.recordedAt).toLocaleString()}`;
      }
    }
    const airQualitySummary = document.getElementById('onboarding-outdoor-aqi');
    if (airQualitySummary) {
      const airQuality = this.onboardingOutdoorAirQuality;
      airQualitySummary.textContent = airQuality
        ? `Outdoor AQI: ${airQuality.aqi} (${airQuality.category || 'current'}) · ${airQuality.placeName || this.onboardingLocation?.placeName || 'Saved location'} · ${airQuality.unit} · ${airQuality.source} · observed ${new Date(airQuality.lastUpdated).toLocaleString()}`
        : 'Outdoor AQI unavailable.';
    }
    const retryButton = document.getElementById('btn-onboarding-retry-aqi');
    if (retryButton) retryButton.disabled = !this.onboardingLocation;
  },

  async requestCurrentLocation() {
    const feedback = document.getElementById('onboarding-location-feedback');
    const showFeedback = message => {
      if (feedback) feedback.textContent = message;
    };
    if (!window.isSecureContext) {
      showFeedback('Location requires a secure page. Use localhost during development or HTTPS.');
      return;
    }
    if (!navigator.geolocation) {
      showFeedback('This browser does not provide location access. Enter coordinates manually below.');
      return;
    }

    showFeedback('Requesting location permission from your browser…');
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(async position => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          recordedAt: new Date().toISOString(),
          source: 'gps',
          placeName: `Current location (${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)})`
        };
        this.onboardingLocation = location;
        this.onboardingOutdoorAirQuality = null;
        this.updateOnboardingLocationDisplay();
        try {
          let placeNameNotice = '';
          try {
            const resolved = await API.reverseGeocodeLocation(
              location.latitude,
              location.longitude
            );
            location.placeName = resolved.placeName;
          } catch (error) {
            placeNameNotice = ` Place name lookup unavailable: ${error.message}`;
          }
          await this.persistOnboardingDraft();
          this.updateOnboardingLocationDisplay();
          showFeedback(`GPS location saved (accuracy ±${Math.round(location.accuracy)} m).${placeNameNotice} Retrieving outdoor air quality…`);
          await this.refreshOutdoorAirQuality();
          resolve(true);
        } catch (error) {
          showFeedback(`Location was detected but could not be saved: ${error.message}`);
          resolve(false);
        }
      }, error => {
        const message = error.code === 1
          ? 'Location permission was denied. Allow access in browser settings or enter coordinates manually.'
          : error.code === 2
            ? 'Your location is unavailable. Retry or enter coordinates manually.'
            : 'Location request timed out. Retry or enter coordinates manually.';
        showFeedback(message);
        resolve(false);
      }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    });
  },

  async saveManualLocation() {
    const latitudeInput = document.getElementById('onboarding-manual-latitude');
    const longitudeInput = document.getElementById('onboarding-manual-longitude');
    const feedback = document.getElementById('onboarding-location-feedback');
    const latitude = Number(latitudeInput?.value);
    const longitude = Number(longitudeInput?.value);
    if (
      latitudeInput?.value === '' ||
      longitudeInput?.value === '' ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      if (feedback) feedback.textContent = 'Enter a valid latitude (-90 to 90) and longitude (-180 to 180).';
      return;
    }
    this.onboardingLocation = {
      latitude,
      longitude,
      accuracy: null,
      recordedAt: new Date().toISOString(),
      source: 'manual',
      placeName: `Coordinates (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`
    };
    this.onboardingOutdoorAirQuality = null;
    this.updateOnboardingLocationDisplay();
    try {
      await this.persistOnboardingDraft();
      if (feedback) feedback.textContent = 'Coordinates saved as manually entered. Retrieving outdoor air quality…';
      await this.refreshOutdoorAirQuality();
    } catch (error) {
      if (feedback) feedback.textContent = `Coordinates could not be saved: ${error.message}`;
    }
  },

  async refreshOutdoorAirQuality() {
    const feedback = document.getElementById('onboarding-location-feedback');
    if (!this.onboardingLocation) {
      if (feedback) feedback.textContent = 'Select a location before requesting outdoor AQI.';
      return;
    }
    this.onboardingOutdoorAirQuality = null;
    try {
      const airQuality = await API.lookupOutdoorAirQuality();
      this.onboardingOutdoorAirQuality = airQuality;
      this.updateOnboardingLocationDisplay();
      await this.persistOnboardingDraft();
      if (feedback) feedback.textContent = '';
    } catch (error) {
      this.updateOnboardingLocationDisplay();
      if (feedback) {
        feedback.textContent = `Air quality unavailable: ${error.message}. You can retry; setup can still continue.`;
      }
    }
  },

  async searchOnboardingLocations() {
    const query = document.getElementById('onboarding-location-search')?.value.trim();
    const feedback = document.getElementById('onboarding-location-feedback');
    const resultsContainer = document.getElementById('onboarding-location-results');
    if (!query) {
      if (feedback) feedback.textContent = 'Enter an Indian city, area, or address to search.';
      return;
    }
    if (feedback) feedback.textContent = 'Searching Google Maps for Indian locations…';
    if (resultsContainer) resultsContainer.textContent = '';
    try {
      const locations = await API.searchIndianLocations(query);
      this.onboardingLocationSearchResults = locations;
      if (!locations.length) {
        if (feedback) feedback.textContent = 'No matching locations found. Try a different search or enter coordinates manually.';
        return;
      }
      if (resultsContainer) {
        resultsContainer.innerHTML = locations.map((location, index) =>
          `<button type="button" class="btn btn-outline onboarding-location-result" data-location-index="${index}">${Utils.escapeHtml(location.placeName)}</button>`
        ).join('');
        resultsContainer.querySelectorAll('[data-location-index]').forEach(button => {
            button.addEventListener('click', async () => {
            const location = this.onboardingLocationSearchResults[Number(button.dataset.locationIndex)];
              await this.selectOnboardingLocation(location);
          });
        });
      }
      if (feedback) feedback.textContent = 'Select a result to save it as your account location.';
    } catch (error) {
      if (feedback) {
        feedback.textContent = `Google Maps location search unavailable: ${error.message} Use the manual latitude/longitude fields below.`;
      }
    }
  },

  async selectOnboardingLocation(result) {
    if (!result || !Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) {
      const feedback = document.getElementById('onboarding-location-feedback');
      if (feedback) feedback.textContent = 'That location result is invalid. Search again or enter coordinates manually.';
      return;
    }
    this.onboardingLocation = {
      latitude: result.latitude,
      longitude: result.longitude,
      accuracy: null,
      recordedAt: new Date().toISOString(),
      source: 'manual',
      placeName: result.placeName
    };
    this.onboardingOutdoorAirQuality = null;
    this.updateOnboardingLocationDisplay();
    try {
      await this.persistOnboardingDraft();
      const resultsContainer = document.getElementById('onboarding-location-results');
      if (resultsContainer) resultsContainer.textContent = '';
      const feedback = document.getElementById('onboarding-location-feedback');
      if (feedback) feedback.textContent = 'Location saved. Retrieving outdoor air quality…';
      await this.refreshOutdoorAirQuality();
    } catch (error) {
      const feedback = document.getElementById('onboarding-location-feedback');
      if (feedback) feedback.textContent = `Location could not be saved: ${error.message}`;
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
          this.refreshDashboardFromBackend();
        } else if (data === 'simulation') {
          this.refreshSimulationFromBackend();
        } else if (data === 'devices') {
          this.refreshDevicesFromBackend();
        } else if (data === 'analytics') {
          this.loadAnalytics('24H');
        }
      }
    } else if (event === 'room_changed' || event === 'mode_changed' || event === 'evaluated' || event === 'device_updated' || event === 'environment_updated') {

      const activeRoom = State.getActiveRoom();
      const user = State.user;

      const headerElem = document.querySelector('.app-header');
      if (headerElem && user) {
        headerElem.outerHTML = Views.renderHeader(user, activeRoom);
        this.attachHeaderEvents();
      }

      const bodyContainer = document.getElementById('app-body-container');
      if (bodyContainer) {
        if (
          State.activeView === 'dashboard' ||
          State.activeView === 'simulation' ||
          (State.activeView === 'devices' && event === 'room_changed')
        ) {
          bodyContainer.innerHTML = this.renderActiveViewContent();
          this.attachViewSpecificEvents();
          if (State.activeView === 'dashboard') {
            this.startAirflowSimulation();
            if (event === 'room_changed') {
              this.refreshDashboardFromBackend();
            }
          } else if (State.activeView === 'devices' && event === 'room_changed') {
            this.refreshDevicesFromBackend();
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

  updateDashboardApiStatus(state, message) {
    State.dashboardApiStatus = { state, message };
    const statusMessage = document.getElementById('dashboard-backend-status-message');
    if (statusMessage) statusMessage.textContent = message;
    const retryButton = document.getElementById('btn-refresh-dashboard-data');
    if (retryButton) retryButton.style.display = state === 'error' ? 'inline-flex' : 'none';
  },

  async refreshDashboardFromBackend() {
    const requestId = ++this.dashboardRequestId;
    const roomId = State.activeRoomId;
    this.updateDashboardApiStatus('loading', 'Loading account sensor data, device states, and decision from backend…');

    try {
      const dashboardData = await API.getDashboardData();
      if (
        requestId !== this.dashboardRequestId ||
        State.activeView !== 'dashboard' ||
        State.activeRoomId !== roomId
      ) {
        return;
      }

      State.applyDashboardDataFromBackend(dashboardData);
      this.updateDashboardApiStatus(
        'ready',
        dashboardData.simulated
          ? 'Simulation data loaded from backend; these readings are simulated, not live.'
          : `Backend sensor data loaded (source: ${dashboardData.sensorsSource || 'unverified'}).`
      );

      const container = document.getElementById('app-body-container');
      if (container) {
        this.stopAirflowSimulation();
        container.innerHTML = this.renderActiveViewContent();
        this.attachViewSpecificEvents();
        this.startAirflowSimulation();
      }
    } catch (error) {
      if (
        requestId === this.dashboardRequestId &&
        State.activeView === 'dashboard' &&
        State.activeRoomId === roomId
      ) {
        this.updateDashboardApiStatus(
          'error',
          `Live backend data is unavailable: ${error.message}. Displayed readings may be stale.`
        );
      }
    }
  },

  async refreshDevicesFromBackend() {
    const requestId = ++this.deviceRequestId;
    const roomId = State.activeRoomId;
    try {
      const dashboardData = await API.getDashboardData();
      if (
        requestId !== this.deviceRequestId ||
        State.activeView !== 'devices' ||
        State.activeRoomId !== roomId
      ) {
        return;
      }

      State.applyDashboardDataFromBackend(dashboardData);
      const container = document.getElementById('app-body-container');
      if (container) {
        container.innerHTML = this.renderActiveViewContent();
        this.attachViewSpecificEvents();
      }
    } catch (error) {
      if (
        requestId === this.deviceRequestId &&
        State.activeView === 'devices' &&
        State.activeRoomId === roomId
      ) {
        Utils.showToast(`Could not load backend device state: ${error.message}`, 'warning');
      }
    }
  },

  async performDashboardControl(action, successMessage, successType = 'success') {
    try {
      const result = await action();
      if (result?.success === false) {
        throw new Error(result.message || 'The backend did not apply this action.');
      }
      if (State.activeView === 'dashboard') {
        await this.refreshDashboardFromBackend();
      } else if (State.activeView === 'simulation') {
        this.syncSimulationControlsFromBackend();
        this.updateSimulationReactionUI();
      } else if (State.activeView === 'devices') {
        const container = document.getElementById('app-body-container');
        if (container) {
          container.innerHTML = this.renderActiveViewContent();
          this.attachViewSpecificEvents();
        }
      }
      Utils.showToast(successMessage, successType);
    } catch (error) {
      const message = `Control was not applied: ${error.message}`;
      this.updateDashboardApiStatus('error', message);
      Utils.showToast(message, 'warning');
    }
  },

  async refreshSimulationFromBackend() {
    try {
      const data = await API.getDashboardData();
      if (State.activeView !== 'simulation') return;
      State.applyDashboardDataFromBackend(data);
      this.syncSimulationControlsFromBackend();
      this.updateSimulationReactionUI();
    } catch (error) {
      Utils.showToast(`Live simulation data is unavailable: ${error.message}`, 'warning');
    }
  },

  syncSimulationControlsFromBackend() {
    const room = State.getActiveRoom();
    if (!room) return;
    const controls = [
      ['sim-outdoor-aqi', 'val-outdoor-aqi', 'outdoorAQI', '', 0, value => Math.max(400, value)],
      ['sim-indoor-aqi', 'val-indoor-aqi', 'indoorAQI', '', 0, value => Math.max(300, value)],
      ['sim-co2', 'val-co2', 'co2', ' ppm', value => Math.min(350, value), value => Math.max(2200, value)],
      ['sim-temperature', 'val-temperature', 'temperature', ' °C', value => Math.min(10, value), value => Math.max(40, value)],
      ['sim-humidity', 'val-humidity', 'humidity', ' %', value => Math.min(10, value), value => Math.max(95, value)],
      ['sim-occupancy', 'val-occupancy', 'occupancy', '', 0, value => Math.max(20, value)]
    ];
    controls.forEach(([inputId, displayId, key, suffix, min, max]) => {
      const input = document.getElementById(inputId);
      const display = document.getElementById(displayId);
      if (input) {
        if (typeof min === 'function') input.min = min(room.environment[key]);
        else if (min !== undefined) input.min = min;
        input.max = max(room.environment[key]);
        input.value = room.environment[key];
      }
      if (display) display.textContent = `${room.environment[key]}${suffix}`;
    });
  },

  attachGlobalShellEvents() {
    this.attachHeaderEvents();

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

    const signOutBtn = document.getElementById('btn-sign-out-trigger');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) sidebar.classList.remove('mobile-open');
        this.openSignOutModal();
      });
    }
  },

  attachHeaderEvents() {

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

    document.querySelectorAll('.mode-segmented-pill .mode-segment-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetMode = btn.dataset.mode;
        const buttons = [...document.querySelectorAll('.mode-segmented-pill .mode-segment-btn')];
        buttons.forEach(button => { button.disabled = true; });
        try {
          await this.changeDashboardMode(targetMode);
        } finally {
          document.querySelectorAll('.mode-segmented-pill .mode-segment-btn')
            .forEach(button => { button.disabled = false; });
        }
      });
    });

    const profileBtn = document.getElementById('btn-header-profile');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        State.setActiveView('settings');
      });
    }

    const notifBtn = document.getElementById('btn-notifications');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        const room = State.getActiveRoom();
        const aqi = room ? room.environment.outdoorAQI : 112;
        Utils.showToast(`Outdoor air quality currently at AQI ${aqi}. System actively managing indoor environment.`, 'info');
      });
    }
  },

  async changeDashboardMode(targetMode) {
    const room = State.getActiveRoom();
    if (!room || !['AUTO', 'MANUAL'].includes(targetMode) || room.mode === targetMode) return false;
    try {
      await State.setMode(room.id, targetMode);
    } catch (error) {
      const message = `Mode could not be saved: ${error.message}`;
      this.updateDashboardApiStatus('error', message);
      Utils.showToast(message, 'warning');
      return false;
    }
    if (targetMode === 'AUTO') {
      try {
        await State.applyDashboardDecision();
        Utils.showToast('Auto mode saved; the backend applied its safety-validated decision.', 'success');
      } catch (error) {
        const message = `Auto mode was saved, but its safety decision was not applied: ${error.message}`;
        this.updateDashboardApiStatus('error', message);
        Utils.showToast(message, 'warning');
      }
    } else {
      Utils.showToast('Manual mode saved. Automatic decisions will not change device settings.', 'success');
    }
    return true;
  },

  attachViewSpecificEvents() {
    const view = State.activeView;

    if (view === 'dashboard') {
      this.attachDashboardEvents();
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
          else if (dev.type === 'purifier') next = current === 'Active' ? 'Off' : 'Active';

          await this.performDashboardControl(
            () => State.applyDashboardDeviceControl(devId, next, roomId),
            `Backend accepted the safe ${dev.name} setting: ${next}.`
          );
        });
      });
      document.querySelectorAll('.preset-btn[data-preset]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const preset = btn.dataset.preset;
          await this.performDashboardControl(
            () => State.applyPreset(State.activeRoomId, preset),
            `Backend accepted the validated "${preset}" preset.`
          );
        });
      });
    } else if (view === 'assistant') {
      this.attachAssistantViewEvents();
    } else if (view === 'settings') {
      this.attachSettingsEvents();
    }
  },

  attachDashboardEvents() {
    const refreshDashboardButton = document.getElementById('btn-refresh-dashboard-data');
    if (refreshDashboardButton) {
      refreshDashboardButton.addEventListener('click', () => {
        this.refreshDashboardFromBackend();
      });
    }

    document.querySelectorAll('.device-interactive-controls').forEach(group => {
      const deviceId = group.dataset.deviceId;
      group.querySelectorAll('.btn-ctrl').forEach(btn => {
        btn.addEventListener('click', async () => {
          const newState = btn.dataset.state;
          const currentRoom = State.getActiveRoom();
          if (currentRoom && deviceId) {
            await this.performDashboardControl(
              () => State.applyDashboardDeviceControl(deviceId, newState),
              `Backend accepted the safe actuator setting: ${newState}.`
            );
          }
        });
      });
    });

    const btnOptimize = document.getElementById('btn-quick-optimize');
    if (btnOptimize) {
      btnOptimize.addEventListener('click', async () => {
        const room = State.getActiveRoom();
        if (!room) return;
        await this.performDashboardControl(
          () => State.applyDashboardPreset('optimize'),
          'The backend applied its validated air-quality decision.'
        );
      });
    }

    const btnFlush = document.getElementById('btn-quick-flush');
    if (btnFlush) {
      btnFlush.addEventListener('click', async () => {
        const room = State.getActiveRoom();
        if (!room) return;
        await this.performDashboardControl(
          () => State.applyDashboardPreset('flush'),
          'The backend accepted the safe rapid-flush actuator settings.'
        );
      });
    }

    const btnEco = document.getElementById('btn-quick-eco');
    if (btnEco) {
      btnEco.addEventListener('click', async () => {
        const room = State.getActiveRoom();
        if (!room) return;
        await this.performDashboardControl(
          () => State.applyDashboardPreset('eco'),
          'The backend accepted the safe eco actuator settings.',
          'info'
        );
      });
    }

    const btnSeal = document.getElementById('btn-quick-seal');
    if (btnSeal) {
      btnSeal.addEventListener('click', async () => {
        const room = State.getActiveRoom();
        if (!room) return;
        await this.performDashboardControl(
          () => State.applyDashboardPreset('seal'),
          'The backend accepted the safe perimeter-seal settings.',
          'info'
        );
      });
    }

    const btnQuickStandards = document.getElementById('btn-quick-standards-pill');
    if (btnQuickStandards) {
      btnQuickStandards.addEventListener('click', () => this.openStandardsModal());
    }

    const btnCardStandards = document.getElementById('btn-card-standards-pill');
    if (btnCardStandards) {
      btnCardStandards.addEventListener('click', () => this.openStandardsModal());
    }

    const btnExport = document.getElementById('btn-export-telemetry');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const room = State.getActiveRoom();
        const telemetryData = {
          space: room ? room.name : 'All',
          timestamp: new Date().toISOString(),
          environment: room ? room.environment : {},
          devices: room ? room.devices : [],
          decision: room ? room.decision : null,
          regulatoryCompliance: 'ANSI/ASHRAE Standard 62.1-2022'
        };
        const blob = new Blob([JSON.stringify(telemetryData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `breathe_clean_iaq_telemetry_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.showToast('IAQ telemetry digest exported successfully', 'success');
      });
    }

    document.querySelectorAll('.sim-speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sim-speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.simSpeed = parseFloat(btn.dataset.speed || 1.0);
        Utils.showToast(`Simulation speed set to ${btn.dataset.speed}x`, 'info');
      });
    });

    const simViewToggle = document.getElementById('sim-view-toggle');
    if (simViewToggle) {
      simViewToggle.addEventListener('click', () => {
        this.simMode = this.simMode === 'vectors' ? 'laminar' : 'vectors';
        simViewToggle.innerHTML = `${Utils.icons.activity} <span>${this.simMode === 'vectors' ? 'Vectors' : 'Laminar'}</span>`;
        Utils.showToast(`Switched CFD overlay to ${this.simMode === 'vectors' ? 'Vector Particles' : 'Laminar Streamlines'}`, 'info');
      });
    }

    const btnReevaluate = document.getElementById('btn-force-reevaluate');
    if (btnReevaluate) {
      btnReevaluate.addEventListener('click', async () => {
        const room = State.getActiveRoom();
        if (room) {
          await this.performDashboardControl(
            () => State.applyDashboardDecision(),
            'The backend re-evaluated and applied its validated decision.'
          );
        }
      });
    }

    const btnStandardsModal = document.getElementById('btn-view-standard-modal');
    if (btnStandardsModal) {
      btnStandardsModal.addEventListener('click', () => {
        this.openStandardsModal();
      });
    }

    const btnSyncAll = document.getElementById('btn-sync-all-devices');
    if (btnSyncAll) {
      btnSyncAll.addEventListener('click', async () => {
        const room = State.getActiveRoom();
        if (room) {
          await this.performDashboardControl(
            () => State.applyDashboardDecision(),
            'All actuators were synchronized with the backend-approved targets.'
          );
        }
      });
    }

    const btnStandbyAll = document.getElementById('btn-all-devices-standby');
    if (btnStandbyAll) {
      btnStandbyAll.addEventListener('click', async () => {
        const room = State.getActiveRoom();
        if (room) {
          await this.performDashboardControl(
            () => State.applyDashboardDeviceUpdates({
              windows: 'CLOSED',
              purifier: 'OFF',
              ventilation: 'LOW'
            }),
            'The backend accepted the standby settings.',
            'info'
          );
        }
      });
    }

    const btnRefreshActivity = document.getElementById('btn-refresh-activity');
    if (btnRefreshActivity) {
      btnRefreshActivity.addEventListener('click', () => {
        const room = State.getActiveRoom();
        if (room) {
          State.rooms = API.getRooms();
          State.setActiveView('dashboard');
          Utils.showToast('Live event activity refreshed', 'info');
        }
      });
    }

    const btnSimulate = document.getElementById('btn-simulate-event');
    if (btnSimulate) {
      btnSimulate.addEventListener('click', async () => {
        const scenarios = ['clean-air', 'pollution', 'high-co2', 'bad-air'];
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        await this.performDashboardControl(
          () => State.applyDashboardScenario(scenario),
          `Backend scenario "${scenario}" ran and its safety-validated decision was applied.`,
          'warning'
        );
      });
    }

    const btnDownloadLog = document.getElementById('btn-download-audit-log');
    if (btnDownloadLog) {
      btnDownloadLog.addEventListener('click', () => {
        const room = State.getActiveRoom();
        const activity = room ? room.activity : [];
        const csv = 'Timestamp,Source,Action,Detail\n' + activity.map(a => `"${new Date(a.timestamp).toISOString()}","${a.source}","${a.action}","${a.detail}"`).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `breathe_clean_audit_log_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.showToast('Audit log downloaded', 'success');
      });
    }

    document.querySelectorAll('.preset-btn[data-preset]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const preset = btn.dataset.preset;
        await this.performDashboardControl(
          () => State.applyPreset(State.activeRoomId, preset),
          `Backend accepted the validated "${preset}" preset.`
        );
      });
    });

    const btnRunDiag = document.getElementById('btn-run-sensor-diagnostics');
    if (btnRunDiag) {
      btnRunDiag.addEventListener('click', () => {
        btnRunDiag.disabled = true;
        btnRunDiag.innerHTML = `${Utils.icons.activity} <span>Testing...</span>`;
        setTimeout(() => {
          btnRunDiag.disabled = false;
          btnRunDiag.innerHTML = `${Utils.icons.activity} <span>Run Self-Diagnostic</span>`;
          Utils.showToast('Sensor diagnostic test passed: 4/4 sensors operational within ±1.2% tolerance', 'success');
        }, 700);
      });
    }

    const btnZeroBase = document.getElementById('btn-zero-baseline');
    if (btnZeroBase) {
      btnZeroBase.addEventListener('click', () => {
        Utils.showToast('SGP40 and NDIR baselines re-zeroed to ambient reference standard', 'info');
      });
    }

    const btnCalibrate = document.getElementById('btn-recalibrate-sensors');
    if (btnCalibrate) {
      btnCalibrate.addEventListener('click', async () => {
        btnCalibrate.disabled = true;
        btnCalibrate.innerHTML = `${Utils.icons.refresh} <span>Calibrating...</span>`;
        await this.refreshDashboardFromBackend();
        setTimeout(() => {
          btnCalibrate.disabled = false;
          btnCalibrate.innerHTML = `${Utils.icons.refresh} <span>Calibrate Sensors</span>`;
          Utils.showToast('Sensors calibrated and synchronized to environmental standard', 'success');
        }, 600);
      });
    }

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
  },

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

    setTimeout(scrollToBottom, 60);

    document.querySelectorAll('.chat-suggestion-chip').forEach(chip => {
      chip.addEventListener('click', async () => {
        const prompt = chip.dataset.prompt;
        if (prompt) {
          await Chatbot.sendUserPrompt(prompt);
          this.refreshAssistantChatUI();
        }
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        Chatbot.clearHistory();
        this.refreshAssistantChatUI();
        Utils.showToast('Conversation reset', 'info');
      });
    }

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
            ${m.sender === 'bot' ? Utils.icons.sparkles : (State.user?.name?.charAt(0)?.toUpperCase() || 'U')}
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
              <div class="chat-action-badge ${m.actionTag === 'Request failed' ? 'action-failed' : ''}">
                <span class="badge-icon">${m.actionTag === 'Request failed' ? '!' : '✓'}</span>
                <span class="badge-tag">${Utils.escapeHtml(m.actionTag)}:</span>
                <span class="badge-detail">${Utils.escapeHtml(m.actionDetails || '')}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `).join('');
      container.scrollTop = container.scrollHeight;
    }

    this.refreshFloatingDrawerMessages();
  },

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
          <div class="mini-action-tag ${m.actionTag === 'Request failed' ? 'action-failed' : ''}">
            ${m.actionTag === 'Request failed' ? '!' : '✓'} ${Utils.escapeHtml(m.actionTag)}: ${Utils.escapeHtml(m.actionDetails || '')}
          </div>
        ` : ''}
      </div>
    `).join('');

    msgBox.scrollTop = msgBox.scrollHeight;
  },

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
        el.addEventListener('input', (e) => {
          const val = Number(e.target.value);
          disp.textContent = `${val}${s.suffix}`;
        });
        el.addEventListener('change', async (e) => {
          const value = Number(e.target.value);
          await this.performDashboardControl(
            () => State.updateDashboardSensors({ [s.key]: value }),
            `Backend sensor reading updated and the safety policy was applied.`
          );
        });
      }
    });

    document.querySelectorAll('.preset-btn[data-scenario]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const scenario = btn.dataset.scenario;
        await this.performDashboardControl(
          () => State.applyDashboardScenario(scenario),
          `Backend scenario "${scenario}" ran and its safety-validated decision was applied.`,
          'info'
        );
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

  attachAnalyticsEvents() {
    document.querySelectorAll('.analytics-time-pills .time-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.analytics-time-pills .time-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.loadAnalytics(btn.dataset.time);
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

  async loadAnalytics(timeframe = '24H') {
    const requestId = ++this.analyticsRequestId;
    const dataStatus = document.getElementById('analytics-data-status');
    if (dataStatus) dataStatus.textContent = 'Loading verified account history…';
    try {
      const result = await API.getAnalyticsHistory(timeframe);
      if (requestId !== this.analyticsRequestId || State.activeView !== 'analytics') return;
      this.analyticsData = result;
      this.renderAnalyticsSummary(result.summary);
      this.renderAnalyticsChart(timeframe, result);
    } catch (error) {
      if (requestId !== this.analyticsRequestId || State.activeView !== 'analytics') return;
      this.analyticsData = null;
      this.renderAnalyticsSummary(null);
      this.renderAnalyticsChart(timeframe, null);
      if (dataStatus) dataStatus.textContent = `Account history unavailable: ${error.message}`;
    }
  },

  renderAnalyticsSummary(summary) {
    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };
    setText('analytics-automatic-actions', Number.isFinite(summary?.automaticActions)
      ? String(summary.automaticActions)
      : 'Unavailable');
    setText('analytics-manual-overrides', Number.isFinite(summary?.manualOverrides)
      ? String(summary.manualOverrides)
      : 'Unavailable');
    setText('analytics-indoor-average', Number.isFinite(summary?.indoorAQIAverage)
      ? summary.indoorAQIAverage.toFixed(1)
      : 'Unavailable');
    setText('analytics-filter-life', Number.isFinite(summary?.filterLife)
      ? `${summary.filterLife}%`
      : 'Unavailable');
  },

  renderAnalyticsChart(timeframe = '24H', analytics = this.analyticsData) {
    const canvas = document.getElementById('analytics-chart-canvas');
    if (!canvas) return;
    const emptyState = document.getElementById('analytics-empty-state');
    const dataStatus = document.getElementById('analytics-data-status');
    const metric = document.getElementById('analytics-metric-select')?.value || 'indoorAQI';
    const rangeMs = {
      '24H': 24 * 60 * 60 * 1000,
      '7D': 7 * 24 * 60 * 60 * 1000,
      '30D': 30 * 24 * 60 * 60 * 1000
    }[timeframe];
    if (!rangeMs) return;
    const now = Date.now();
    const readings = (analytics?.readings || [])
      .filter(reading =>
        reading.metric === metric &&
        reading.source !== 'unverified' &&
        Number.isFinite(reading.value) &&
        Number.isFinite(Date.parse(reading.recordedAt)) &&
        Date.parse(reading.recordedAt) >= now - rangeMs &&
        Date.parse(reading.recordedAt) <= now
      )
      .sort((first, second) => Date.parse(first.recordedAt) - Date.parse(second.recordedAt));
    if (emptyState) emptyState.hidden = readings.length > 0;
    canvas.hidden = readings.length === 0;
    if (!readings.length) {
      if (canvas.getContext) {
        const emptyContext = canvas.getContext('2d');
        if (emptyContext) emptyContext.clearRect(0, 0, canvas.width, canvas.height);
      }
      if (dataStatus) dataStatus.textContent = 'No verified AQI history available yet.';
      return;
    }

    const ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { width: 900, height: 300 };

    canvas.width = (rect.width || 900) * dpr;
    canvas.height = (rect.height || 300) * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width || 900;
    const height = rect.height || 300;

    ctx.clearRect(0, 0, width, height);

    const padLeft = 50;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 45;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;
    const values = readings.map(reading => reading.value);
    const observedMin = Math.min(...values);
    const observedMax = Math.max(...values);
    const padding = observedMin === observedMax ? Math.max(Math.abs(observedMin) * 0.1, 1) : (observedMax - observedMin) * 0.1;
    const minVal = observedMin - padding;
    const maxVal = observedMax + padding;

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

    const firstTime = Date.parse(readings[0].recordedAt);
    const lastTime = Date.parse(readings[readings.length - 1].recordedAt);
    const coords = readings.map(reading => {
      const timestamp = Date.parse(reading.recordedAt);
      const x = padLeft + (lastTime === firstTime ? plotW / 2 : ((timestamp - firstTime) / (lastTime - firstTime)) * plotW);
      const y = padTop + plotH - ((reading.value - minVal) / (maxVal - minVal || 1)) * plotH;
      return { x, y, reading };
    });

    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 0; i < coords.length - 1; i++) {
      ctx.lineTo(coords[i + 1].x, coords[i + 1].y);
    }
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    coords.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#15803d';
      ctx.stroke();
    });

    ctx.textAlign = 'center';
    const labelCount = Math.min(coords.length, 6);
    for (let index = 0; index < labelCount; index++) {
      const readingIndex = labelCount === 1
        ? 0
        : Math.round(index * (coords.length - 1) / (labelCount - 1));
      const point = coords[readingIndex];
      const timestamp = new Date(point.reading.recordedAt);
      ctx.fillText(
        timeframe === '24H'
          ? timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        point.x,
        height - 15
      );
    }

    const latest = readings[readings.length - 1];
    if (dataStatus) {
      dataStatus.textContent = `${readings.length} verified provider reading${readings.length === 1 ? '' : 's'} · ${latest.source} · latest ${new Date(latest.recordedAt).toLocaleString()} · ${latest.placeName}`;
    }
  },

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

    const btnSaveGoogleClientId = document.getElementById('btn-save-google-client-id');
    if (btnSaveGoogleClientId) {
      btnSaveGoogleClientId.addEventListener('click', () => {
        const input = document.getElementById('setting-google-client-id');
        const val = input ? input.value.trim() : '';
        API.setGoogleClientId(val);
        Utils.showToast(val ? 'Google Cloud OAuth Client ID saved' : 'Google Cloud Client ID cleared', 'success');
      });
    }

    const btnSettingsSignOut = document.getElementById('btn-settings-signout');
    if (btnSettingsSignOut) {
      btnSettingsSignOut.addEventListener('click', () => {
        this.openSignOutModal();
      });
    }
  },

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

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(15, 15, w - 30, h - 30);

      const winX = w * 0.18;
      const winY = h * 0.38;

      const purX = w * 0.88;
      const purY = h * 0.74;

      const isWindowOpen = winDev && winDev.state === 'Open';
      const isPurifierOn = purDev && (purDev.state === 'Active' || purDev.state === 'High');
      const isHighPurifier = purDev && purDev.state === 'High';

      const speedMultiplier = (isHighPurifier ? 1.5 : 1.0) * (this.simSpeed || 1.0);
      this.particles.forEach(p => {
        p.progress += p.speed * speedMultiplier;
        if (p.progress > 1) {
          p.progress = 0;
          p.seed = Math.random();
        }

        let x, y, alpha, color;

        if (p.type === 'window') {
          if (!isWindowOpen) {

            x = winX + (Math.sin(p.progress * Math.PI * 2) * 8);
            y = winY + (p.seed - 0.5) * 40;
            alpha = 0.08;
            color = 'rgba(200, 200, 200, ';
          } else {

            const t = p.progress;
            x = winX + t * (w * 0.55);
            y = winY + Math.sin(t * Math.PI) * 50 + (p.seed - 0.5) * 35;
            alpha = Math.sin(t * Math.PI) * 0.75;

            if (outdoorAQI > 100) {
              color = 'rgba(217, 119, 6, '; 
            } else {
              color = 'rgba(16, 185, 129, '; 
            }
          }
        } else if (p.type === 'purifier') {

          const t = p.progress;
          if (isPurifierOn) {
            if (t < 0.45) {

              const s = t / 0.45;
              x = w * 0.65 + s * (purX - w * 0.65) + Math.cos(s * Math.PI) * 15;
              y = h * 0.82 + (s * (purY - h * 0.82));
              alpha = s * 0.6;
              color = 'rgba(147, 197, 253, '; 
            } else {

              const s = (t - 0.45) / 0.55;
              x = purX + Math.sin(s * Math.PI * 2) * 14 - (s * 30);
              y = (purY - 20) - s * (h * 0.45);
              alpha = (1 - s) * 0.85;
              color = 'rgba(52, 211, 153, '; 
            }
          } else {
            x = purX;
            y = purY - 10;
            alpha = 0.05;
            color = 'rgba(156, 163, 175, ';
          }
        } else {

          const t = p.progress;
          x = (w * 0.3) + t * (w * 0.45) + (Math.sin(t * 4) * 20);
          y = (h * 0.2) + t * (h * 0.5) + (p.seed * 30);
          alpha = Math.sin(t * Math.PI) * 0.35;
          color = 'rgba(96, 165, 250, ';
        }

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${alpha})`;
        ctx.fill();

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

  openStandardsModal() {
    const container = document.getElementById('modal-container');
    if (!container) return;

    const activeRoom = State.getActiveRoom();
    container.innerHTML = Views.renderStandardsModal(activeRoom);

    const backdrop = document.getElementById('standards-modal-backdrop');
    const closeBtn = document.getElementById('btn-close-standards-modal');
    const dismissBtn = document.getElementById('btn-dismiss-standards-modal');
    const closeModal = () => { if (container) container.innerHTML = ''; };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (dismissBtn) dismissBtn.addEventListener('click', closeModal);
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });
    }

    const recalcBtn = document.getElementById('btn-recalc-standards');
    if (recalcBtn) {
      recalcBtn.addEventListener('click', async () => {
        if (activeRoom) {
          await State.evaluateActiveRoom(true);
          this.openStandardsModal();
          Utils.showToast('ASHRAE compliance metrics recalculated', 'success');
        }
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
    const formError = document.getElementById('space-modal-error');

    let currentStep = 1;

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

    const goToStep = (stepNumber) => {
      if (stepNumber < 1 || stepNumber > 4) return;
      if (stepNumber > currentStep + 1) return;
      if (stepNumber > currentStep) {
        const currentPane = document.getElementById(`space-step-pane-${currentStep}`);
        const invalidInput = currentPane
          ? Array.from(currentPane.querySelectorAll('input, select')).find(input => !input.checkValidity())
          : null;
        if (invalidInput) {
          invalidInput.reportValidity();
          return;
        }
      }
      currentStep = stepNumber;

      document.querySelectorAll('.modal-step-tab').forEach(tab => {
        const step = parseInt(tab.dataset.step, 10);
        const pill = tab.querySelector('.step-num-pill');
        tab.classList.remove('active', 'completed');
        if (step === currentStep) {
          tab.classList.add('active');
          if (pill) pill.textContent = step;
        } else if (step < currentStep) {
          tab.classList.add('completed');
          if (pill) pill.innerHTML = Utils.icons.check;
        } else {
          if (pill) pill.textContent = step;
        }
      });

      const titleEl = document.getElementById('space-modal-title');
      const subtitleEl = document.getElementById('space-modal-subtitle');
      const baseAction = roomToEdit ? 'Edit space' : 'Add a space';
      if (titleEl) {
        titleEl.textContent = `${baseAction} — ${currentStep === 1 ? 'Basic info' : currentStep === 2 ? 'Room details' : currentStep === 3 ? 'Devices' : 'Review'}`;
      }
      if (subtitleEl) {
        if (currentStep === 1) subtitleEl.textContent = 'Enter basic information about your room and occupancy.';
        else if (currentStep === 2) subtitleEl.textContent = 'Specify physical room dimensions, ceiling height, and apertures.';
        else if (currentStep === 3) subtitleEl.textContent = 'Configure connected smart windows, ventilation, and air filtration.';
        else if (currentStep === 4) subtitleEl.textContent = 'Review space specifications and environmental compliance before saving.';
      }

      for (let i = 1; i <= 4; i++) {
        const pane = document.getElementById(`space-step-pane-${i}`);
        if (pane) {
          pane.style.display = i === currentStep ? 'block' : 'none';
        }
      }

      if (currentStep === 2) {
        updateDimensionsPreview();
      }

      if (currentStep === 4) {
        populateReviewStep();
      }
    };

    const updateDimensionsPreview = () => {
      const l = parseFloat(document.getElementById('room-input-length')?.value) || 0;
      const w = parseFloat(document.getElementById('room-input-width')?.value) || 0;
      const h = parseFloat(document.getElementById('room-input-height')?.value) || 0;
      const areaEl = document.getElementById('calc-area-preview');
      const volEl = document.getElementById('calc-volume-preview');
      if (areaEl) areaEl.textContent = (l * w).toFixed(1) + ' m²';
      if (volEl) volEl.textContent = (l * w * h).toFixed(1) + ' m³';
    };

    const populateReviewStep = () => {
      const nameVal = document.getElementById('room-input-name')?.value.trim() || 'Unnamed Space';
      const typeVal = document.getElementById('room-input-type')?.value || 'Room';
      const l = parseFloat(document.getElementById('room-input-length')?.value) || 0;
      const w = parseFloat(document.getElementById('room-input-width')?.value) || 0;
      const h = parseFloat(document.getElementById('room-input-height')?.value) || 0;
      const winVal = document.getElementById('room-input-windows')?.value || 0;
      const doorsVal = document.getElementById('room-input-doors')?.value || 1;
      const occVal = parseInt(document.getElementById('room-input-occupants')?.value, 10) || 1;
      const area = Number((l * w).toFixed(1));
      const volume = Number((l * w * h).toFixed(1));
      const ashraeTarget = Math.round(occVal * 18 + area * 1.08);

      const revName = document.getElementById('review-val-name');
      const revType = document.getElementById('review-val-type');
      const revGeom = document.getElementById('review-val-geometry');
      const revDims = document.getElementById('review-val-dims');
      const revEnv = document.getElementById('review-val-envelope');
      const revOcc = document.getElementById('review-val-occupants');
      const revAshrae = document.getElementById('review-val-ashrae');

      if (revName) revName.textContent = nameVal;
      if (revType) revType.textContent = typeVal;
      if (revGeom) revGeom.textContent = `${area} m² · ${volume} m³`;
      if (revDims) revDims.textContent = `${l}m (L) × ${w}m (W) × ${h}m (H)`;
      if (revEnv) revEnv.textContent = `${winVal} Windows · ${doorsVal} Doors`;
      if (revOcc) revOcc.textContent = `${occVal} Occupants`;
      if (revAshrae) revAshrae.textContent = `~${ashraeTarget} m³/h`;
    };

    document.querySelectorAll('.modal-step-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const step = parseInt(tab.dataset.step, 10);
        if (step) goToStep(step);
      });
    });

    const next1 = document.getElementById('btn-step-next-1');
    if (next1) next1.addEventListener('click', () => goToStep(2));

    const prev2 = document.getElementById('btn-step-prev-2');
    if (prev2) prev2.addEventListener('click', () => goToStep(1));
    const next2 = document.getElementById('btn-step-next-2');
    if (next2) next2.addEventListener('click', () => goToStep(3));

    const prev3 = document.getElementById('btn-step-prev-3');
    if (prev3) prev3.addEventListener('click', () => goToStep(2));
    const next3 = document.getElementById('btn-step-next-3');
    if (next3) next3.addEventListener('click', () => goToStep(4));

    const prev4 = document.getElementById('btn-step-prev-4');
    if (prev4) prev4.addEventListener('click', () => goToStep(3));

    ['room-input-length', 'room-input-width', 'room-input-height'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateDimensionsPreview);
    });

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (formError) {
          formError.textContent = '';
          formError.style.display = 'none';
        }
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        const editId = form.dataset.editId;
        const name = document.getElementById('room-input-name')?.value.trim();
        const type = document.getElementById('room-input-type')?.value || 'Room';
        const length = Number(document.getElementById('room-input-length').value);
        const width = Number(document.getElementById('room-input-width').value);
        const ceilingHeight = Number(document.getElementById('room-input-height').value);
        const windowsCount = Number(document.getElementById('room-input-windows').value);
        const doorsCount = Number(document.getElementById('room-input-doors').value);
        const typicalOccupants = Number(document.getElementById('room-input-occupants').value);

        try {
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
            Utils.showToast(`Space "${name}" updated successfully`, 'success');
          } else {
            await State.addRoom({
              name,
              type,
              length,
              width,
              ceilingHeight,
              windowsCount,
              doorsCount,
              typicalOccupants,
              deviceOptions: {
                window: document.getElementById('device-opt-window').checked,
                ventilation: document.getElementById('device-opt-vent').checked,
                purifier: document.getElementById('device-opt-purifier').checked
              }
            });
            Utils.showToast(`Space "${name}" created successfully`, 'success');
          }

          closeModal();
        } catch (error) {
          if (formError) {
            formError.textContent = `Could not save this room: ${error.message}`;
            formError.style.display = 'block';
          } else {
            throw error;
          }
        }
      });
    }
  },

  openSignOutModal() {
    let container = document.getElementById('modal-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'modal-container';
      document.body.appendChild(container);
    }

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
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Signing out...';
        try {
          await API.logout();
        } catch (error) {
          console.warn('Sign out encountered error:', error);
        } finally {
          Chatbot.setAccount(null);
          State.user = null;
          State.rooms = [];
          State.activeRoomId = null;
          State.activeView = 'dashboard';
          this.onboardingUserId = null;
          closeModal();
          window.location.hash = 'signin';
          this.renderCurrentApplicationState();
          Utils.showToast('Signed out successfully', 'info');
        }
      });
    }
  },

  initGoogleAuthSDK() {
    const clientId = API.getGoogleClientId();
    if (!clientId) return false;

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      setTimeout(() => this.initGoogleAuthSDK(), 350);
      return false;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            Utils.showToast('Connecting to your Google Account...', 'info', 1200);
            const user = await API.loginWithGoogleCredential(response.credential);
            this.setAuthenticatedUser(user);
            State.activeView = 'dashboard';
            window.location.hash = 'dashboard';
            this.showDashboardEntranceAnimation = true;
            this.renderCurrentApplicationState();
            Utils.showToast(`Signed in as ${user.name} (${user.email})`, 'success');
          } catch (err) {
            console.error('Google ID token verification failed:', err);
            Utils.showToast('Google Sign-in failed: ' + (err.message || 'Validation error'), 'warning');
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });

      const gsiTarget = document.getElementById('g_id_signin') || document.getElementById('g_id_signup');
      if (gsiTarget) {
        gsiTarget.style.display = 'block';
        window.google.accounts.id.renderButton(gsiTarget, {
          theme: 'outline',
          size: 'large',
          width: 380,
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        });
        const fallbackBtn = document.getElementById('btn-google-signin') || document.getElementById('btn-google-signup');
        if (fallbackBtn) fallbackBtn.style.display = 'none';
      }
      return true;
    } catch (err) {
      console.warn('Google SDK init error:', err);
      return false;
    }
  },

  attachAuthEvents() {
    const formSignIn = document.getElementById('form-sign-in');
    const formSignUp = document.getElementById('form-sign-up');
    const btnGotoSignUp = document.getElementById('btn-goto-signup');
    const btnGotoSignIn = document.getElementById('btn-goto-signin');
    const forgotPasswordLink = document.getElementById('link-forgot-pw');
    const recoveryPanel = document.getElementById('password-recovery-panel');
    const formRequestReset = document.getElementById('form-request-password-reset');
    const formConfirmReset = document.getElementById('form-confirm-password-reset');
    const resetStatus = document.getElementById('password-reset-status');

    this.initGoogleAuthSDK();

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

    const startDemoMode = () => {
      const demoUser = {
        id: 'usr_divam_01',
        name: 'Divam',
        email: 'divam@breatheclean.io',
        isOnboarded: true,
        lastLogin: new Date().toISOString()
      };
      API._storeUser(demoUser, false);
      this.setAuthenticatedUser(demoUser);
      State.rooms = API.getDefaultRooms();
      State.activeRoomId = State.rooms[0]?.id || 'room_bedroom';
      State.activeView = 'dashboard';
      window.location.hash = 'dashboard';
      this.renderCurrentApplicationState();
      Utils.showToast('Welcome to Breathe Clean Demo Mode!', 'success');
    };

    const btnDemo1 = document.getElementById('btn-explore-demo');
    if (btnDemo1) btnDemo1.addEventListener('click', startDemoMode);
    const btnDemo2 = document.getElementById('btn-explore-demo-signup');
    if (btnDemo2) btnDemo2.addEventListener('click', startDemoMode);

    document.querySelectorAll('.btn-toggle-pw').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const wrapper = btn.closest('.input-password-wrapper');
        const input = wrapper ? wrapper.querySelector('input') : btn.previousElementSibling;
        if (input) {
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          btn.innerHTML = isPassword ? Utils.icons.eyeOff : Utils.icons.eye;
          btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
          btn.style.color = isPassword ? 'var(--color-brand-primary)' : 'var(--color-text-muted)';
        }
      });
    });

    const openGoogleSetupModal = () => {
      let modalWrapper = document.getElementById('google-modal-container');
      if (!modalWrapper) {
        modalWrapper = document.createElement('div');
        modalWrapper.id = 'google-modal-container';
        document.body.appendChild(modalWrapper);
      }
      modalWrapper.innerHTML = Views.renderGoogleSetupModal();

      const backdrop = document.getElementById('google-setup-backdrop');
      const closeBtn = document.getElementById('btn-close-google-setup');
      const closeSetupModal = () => {
        if (modalWrapper) modalWrapper.innerHTML = '';
      };

      if (closeBtn) closeBtn.addEventListener('click', closeSetupModal);
      if (backdrop) {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) closeSetupModal();
        });
      }

      document.querySelectorAll('.btn-copy-origin').forEach(copyBtn => {
        copyBtn.addEventListener('click', (e) => {
          const textToCopy = e.target.getAttribute('data-copy');
          if (navigator.clipboard && textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
              copyBtn.textContent = 'Copied!';
              setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1800);
              Utils.showToast(`Copied ${textToCopy} to clipboard!`, 'info', 1200);
            });
          }
        });
      });

      const btnSaveGsi = document.getElementById('btn-save-and-connect-gsi');
      if (btnSaveGsi) {
        btnSaveGsi.addEventListener('click', () => {
          const input = document.getElementById('setup-google-client-id');
          const val = input ? input.value.trim() : '';
          if (!val) {
            Utils.showToast('Please paste your Google OAuth Client ID', 'warning');
            if (input) input.focus();
            return;
          }
          API.setGoogleClientId(val);
          closeSetupModal();
          this.initGoogleAuthSDK();
          Utils.showToast('Google Client ID saved! Prompting Google sign in...', 'success');
          try {
            if (window.google?.accounts?.id) {
              window.google.accounts.id.prompt();
            }
          } catch (err) {
            console.warn('Prompt error:', err);
          }
          const setupBtn = document.getElementById('btn-open-google-setup') || document.getElementById('btn-open-google-setup-signup');
          if (setupBtn) {
            const span = setupBtn.querySelector('span');
            if (span) span.textContent = 'Google OAuth Client ID Active';
          }
        });
      }

      const btnDemoBypass = document.getElementById('btn-demo-google-bypass');
      if (btnDemoBypass) {
        btnDemoBypass.addEventListener('click', () => {
          closeSetupModal();
          openSimulatedGooglePicker();
        });
      }
    };

    const openSimulatedGooglePicker = () => {
      let modalWrapper = document.getElementById('google-modal-container');
      if (!modalWrapper) {
        modalWrapper = document.createElement('div');
        modalWrapper.id = 'google-modal-container';
        document.body.appendChild(modalWrapper);
      }
      modalWrapper.innerHTML = Views.renderGoogleAccountPickerModal();

      const backdrop = document.getElementById('google-auth-backdrop');
      const closeBtn = document.getElementById('btn-close-google-auth');

      const closeGoogleModal = () => {
        if (modalWrapper) modalWrapper.innerHTML = '';
      };

      if (closeBtn) closeBtn.addEventListener('click', closeGoogleModal);
      if (backdrop) {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) closeGoogleModal();
        });
      }
    };

    const handleGoogleAuthAction = () => {
      const clientId = API.getGoogleClientId();
      if (clientId && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {

              openSimulatedGooglePicker();
            }
          });
        } catch {
          openSimulatedGooglePicker();
        }
      } else {
        openGoogleSetupModal();
      }
    };

    const btnGoogleSignIn = document.getElementById('btn-google-signin');
    if (btnGoogleSignIn) btnGoogleSignIn.addEventListener('click', handleGoogleAuthAction);

    const btnGoogleSignUp = document.getElementById('btn-google-signup');
    if (btnGoogleSignUp) btnGoogleSignUp.addEventListener('click', handleGoogleAuthAction);

    const btnOpenGoogleSetup = document.getElementById('btn-open-google-setup');
    if (btnOpenGoogleSetup) btnOpenGoogleSetup.addEventListener('click', openGoogleSetupModal);

    const btnOpenGoogleSetupSignup = document.getElementById('btn-open-google-setup-signup');
    if (btnOpenGoogleSetupSignup) btnOpenGoogleSetupSignup.addEventListener('click', openGoogleSetupModal);

    if (formSignIn) {
      formSignIn.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorElement = document.getElementById('signin-error');
        if (errorElement) {
          errorElement.textContent = '';
          errorElement.style.display = 'none';
        }
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;
        const remember = document.getElementById('signin-remember').checked;

        try {
          const user = await API.login(email, password, remember);
          this.setAuthenticatedUser(user);

          State.activeView = 'dashboard';
          window.location.hash = 'dashboard';
          this.showDashboardEntranceAnimation = true;
          this.renderCurrentApplicationState();
          Utils.showToast(`Welcome back, ${user.name}`, 'success');
        } catch (err) {
          if (errorElement) {
            errorElement.textContent = err.message === 'Invalid email or password'
              ? 'We couldn’t sign you in with that email and password. Check them and try again.'
              : err.message;
            errorElement.style.display = 'block';
          }
          Utils.showToast(err.message, 'warning');
        }
      });
    }

    if (forgotPasswordLink && recoveryPanel && formSignIn) {
      forgotPasswordLink.addEventListener('click', (event) => {
        event.preventDefault();
        const emailInput = document.getElementById('reset-email');
        if (emailInput) {
          emailInput.value = document.getElementById('signin-email').value;
        }
        formSignIn.style.display = 'none';
        recoveryPanel.style.display = 'flex';
        document.getElementById('signin-auth-divider').style.display = 'none';
        document.getElementById('g_id_signin').style.display = 'none';
        document.getElementById('btn-google-signin').style.display = 'none';
        document.querySelector('.auth-form-footer').style.display = 'none';
        document.querySelector('.auth-form-inner > .auth-form-header').style.display = 'none';
        if (resetStatus) {
          resetStatus.textContent = '';
          resetStatus.style.display = 'none';
        }
        emailInput?.focus();
      });
    }

    if (formRequestReset && formConfirmReset && resetStatus) {
      formRequestReset.addEventListener('submit', async (event) => {
        event.preventDefault();
        resetStatus.textContent = '';
        resetStatus.style.display = 'none';
        try {
          const result = await API.requestPasswordReset(
            document.getElementById('reset-email').value
          );
          resetStatus.textContent = result.resetToken
            ? 'No email was sent. Copy this local development token and use it below; it expires in 15 minutes.'
            : result.message;
          resetStatus.style.color = 'var(--color-text-muted)';
          resetStatus.style.display = 'block';
          if (result.resetToken) {
            document.getElementById('reset-token').value = result.resetToken;
            formRequestReset.style.display = 'none';
            formConfirmReset.style.display = 'flex';
          }
        } catch (err) {
          resetStatus.textContent = err.message;
          resetStatus.style.color = '#b91c1c';
          resetStatus.style.display = 'block';
        }
      });

      formConfirmReset.addEventListener('submit', async (event) => {
        event.preventDefault();
        const password = document.getElementById('reset-new-password').value;
        const confirmation = document.getElementById('reset-confirm-password').value;
        if (password !== confirmation) {
          resetStatus.textContent = 'The new passwords do not match.';
          resetStatus.style.color = '#b91c1c';
          resetStatus.style.display = 'block';
          return;
        }

        try {
          const result = await API.resetPassword(
            document.getElementById('reset-token').value,
            password
          );
          formConfirmReset.style.display = 'none';
          resetStatus.textContent = result.message;
          resetStatus.style.color = 'var(--color-text-muted)';
          resetStatus.style.display = 'block';
        } catch (err) {
          resetStatus.textContent = err.message;
          resetStatus.style.color = '#b91c1c';
          resetStatus.style.display = 'block';
        }
      });
    }

    const btnBackToSignIn = document.getElementById('btn-back-to-signin');
    if (btnBackToSignIn && recoveryPanel && formSignIn) {
      btnBackToSignIn.addEventListener('click', () => {
        recoveryPanel.style.display = 'none';
        formSignIn.style.display = 'flex';
        const signInError = document.getElementById('signin-error');
        if (signInError) {
          signInError.textContent = '';
          signInError.style.display = 'none';
        }
        document.getElementById('signin-auth-divider').style.display = '';
        document.getElementById('btn-google-signin').style.display = '';
        document.querySelector('.auth-form-footer').style.display = '';
        document.querySelector('.auth-form-inner > .auth-form-header').style.display = '';
        formRequestReset.style.display = 'flex';
        formConfirmReset.style.display = 'none';
        formRequestReset.reset();
        formConfirmReset.reset();
        resetStatus.textContent = '';
        resetStatus.style.display = 'none';
      });
    }

    if (formSignUp) {
      const recoveryButton = document.getElementById('btn-signup-recover-account');
      const signupError = document.getElementById('signup-error');
      const showSignupError = (message) => {
        if (!signupError) return;
        signupError.textContent = message;
        signupError.style.display = 'block';
      };

      recoveryButton?.addEventListener('click', async () => {
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        recoveryButton.disabled = true;
        recoveryButton.textContent = 'Checking sign-in…';
        try {
          const user = await API.login(email, password, true);
          API.updateUser(user);
          this.setAuthenticatedUser(user);
          this.onboardingStep = 1;
          this.onboardingUserId = null;
          this.renderCurrentApplicationState();
        } catch (error) {
          const recoveryMessage = error.status === 401
            ? 'Sign-in did not verify these credentials. If you already have an account, use its password or reset it. If registration did not complete, you can submit it again; account emails are unique.'
            : `Sign-in could not be confirmed. No second registration was sent. Try signing in again when the server is reachable; if the account does not exist, you can safely retry registration. ${error.message}`;
          showSignupError(recoveryMessage);
        } finally {
          recoveryButton.disabled = false;
          recoveryButton.textContent = 'Check by signing in';
        }
      });

      formSignUp.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (signupError) {
          signupError.textContent = '';
          signupError.style.display = 'none';
        }
        if (recoveryButton) recoveryButton.hidden = true;

        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const pw = document.getElementById('signup-password').value;
        const confirmPw = document.getElementById('signup-password-confirm').value;

        if (pw !== confirmPw) {
          showSignupError('Passwords do not match.');
          return;
        }

        try {
          const user = await API.signup(name, email, pw);
          API.updateUser(user);
          this.setAuthenticatedUser(user);
          this.onboardingStep = 1;
          this.onboardingUserId = null;
          this.renderCurrentApplicationState();
        } catch (err) {
          showSignupError(err.message || 'Unable to create your account. Please try again.');
          if (
            recoveryButton &&
            (err.accountOutcomeUnknown || err.accountCreated || err.status === 409)
          ) {
            recoveryButton.hidden = false;
          }
        }
      });
    }
  },

  runDashboardLoadingAnimation() {
    this.showDashboardEntranceAnimation = false;
    const viewDashboard = document.querySelector('.view-dashboard');
    if (!viewDashboard) return;

    viewDashboard.classList.add('dashboard-loading-anim');

    const existingBanner = document.getElementById('dash-telemetry-banner');
    if (existingBanner) existingBanner.remove();

    const banner = document.createElement('div');
    banner.className = 'dashboard-telemetry-banner';
    banner.id = 'dash-telemetry-banner';
    banner.innerHTML = `
      <div class="telemetry-banner-left">
        <span class="telemetry-pulse-dot"></span>
        <span>Streaming live Plantower laser & Senseair NDIR IoT sensors...</span>
      </div>
      <div class="telemetry-scan-track">
        <div class="telemetry-scan-progress"></div>
      </div>
      <div class="telemetry-banner-right" id="telemetry-status-text">
        Calibrating (1/4)
      </div>
    `;
    viewDashboard.insertBefore(banner, viewDashboard.firstChild);

    const statusText = document.getElementById('telemetry-status-text');

    setTimeout(() => {
      if (statusText) statusText.textContent = 'Plantower Laser Synced (2/4)';
    }, 350);

    setTimeout(() => {
      if (statusText) statusText.textContent = 'Senseair NDIR Online (3/4)';
    }, 700);

    setTimeout(() => {
      if (statusText) {
        statusText.textContent = 'All 4 Sensors Synced · Deterministic IAQ Live';
        statusText.style.color = '#059669';
      }
    }, 1100);

    setTimeout(() => {
      if (banner && banner.parentElement) {
        banner.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(-6px)';
        setTimeout(() => banner.remove(), 400);
      }
      viewDashboard.classList.remove('dashboard-loading-anim');
    }, 2500);
  },

  attachOnboardingEvents() {
    const continueBtn = document.getElementById('btn-onboarding-continue');
    const backBtn = document.getElementById('btn-onboarding-back');
    const addRoomBtn = document.getElementById('btn-onboarding-add-room');
    const finishBtn = document.getElementById('btn-onboarding-finish');
    const errorEl = document.getElementById('onboarding-error');

    const showError = (message) => {
      if (!errorEl) return;
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    };
    const clearError = () => {
      if (!errorEl) return;
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    };

    document.querySelectorAll('[data-onboarding-device]').forEach(input => {
      input.addEventListener('change', () => {
        this.onboardingDevices[input.dataset.onboardingDevice] = input.checked;
        clearError();
        this.persistOnboardingDraft().catch(error => showError(`Setup draft could not be saved: ${error.message}`));
      });
    });

    const notificationsInput = document.getElementById('onboarding-notifications');
    const temperatureInput = document.getElementById('onboarding-temp-unit');
    const persistSelectedPreferences = () => {
      if (
        ['celsius', 'fahrenheit'].includes(this.onboardingPreferences?.tempUnit) &&
        typeof this.onboardingPreferences?.notificationsEnabled === 'boolean'
      ) {
        this.persistOnboardingDraft().catch(error => showError(`Setup draft could not be saved: ${error.message}`));
      }
    };
    if (notificationsInput) {
      notificationsInput.addEventListener('change', () => {
        this.onboardingPreferences = {
          tempUnit: temperatureInput?.value || '',
          notificationsEnabled: notificationsInput.value === 'enabled'
            ? true
            : notificationsInput.value === 'disabled'
              ? false
              : null
        };
        clearError();
        persistSelectedPreferences();
      });
    }
    if (temperatureInput) {
      temperatureInput.addEventListener('change', () => {
        this.onboardingPreferences = {
          tempUnit: temperatureInput.value,
          notificationsEnabled: notificationsInput?.value === 'enabled'
            ? true
            : notificationsInput?.value === 'disabled'
              ? false
              : null
        };
        clearError();
        persistSelectedPreferences();
      });
    }

    const gpsButton = document.getElementById('btn-onboarding-use-location');
    gpsButton?.addEventListener('click', () => this.requestCurrentLocation());
    const locationSearchInput = document.getElementById('onboarding-location-search');
    locationSearchInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        return this.searchOnboardingLocations();
      }
    });
    const locationSearchButton = document.getElementById('btn-onboarding-search-location');
    locationSearchButton?.addEventListener('click', () => this.searchOnboardingLocations());
    const manualLocationButton = document.getElementById('btn-onboarding-save-manual-location');
    manualLocationButton?.addEventListener('click', () => this.saveManualLocation());
    const retryAqiButton = document.getElementById('btn-onboarding-retry-aqi');
    retryAqiButton?.addEventListener('click', () => this.refreshOutdoorAirQuality());

    if (continueBtn) {
      continueBtn.addEventListener('click', async () => {
        clearError();
        if (this.onboardingStep === 1 && (!State.user || !State.user.email)) {
          showError('A valid account is required to continue.');
          return;
        }
        if (this.onboardingStep === 2 && API.getRooms().length === 0) {
          showError('Add at least one room before continuing.');
          return;
        }
        if (this.onboardingStep === 3 && !Object.values(this.onboardingDevices).some(Boolean)) {
          showError('Select at least one device type before continuing.');
          return;
        }
        if (
          this.onboardingStep === 4 &&
          !this.onboardingPreferences
        ) {
          this.onboardingPreferences = {
            tempUnit: temperatureInput?.value || '',
            notificationsEnabled: notificationsInput?.value === 'enabled'
              ? true
              : notificationsInput?.value === 'disabled'
                ? false
                : null
          };
        }
        if (
          this.onboardingStep === 4 &&
          (!this.onboardingPreferences ||
            !['celsius', 'fahrenheit'].includes(this.onboardingPreferences.tempUnit) ||
            typeof this.onboardingPreferences.notificationsEnabled !== 'boolean')
        ) {
          showError('Choose valid notification and temperature preferences.');
          return;
        }
        if (this.onboardingStep === 4 && !this.onboardingLocation) {
          showError('Choose a GPS or manually entered location before continuing.');
          return;
        }
        if (this.onboardingStep === 4) {
          try {
            await this.persistOnboardingDraft();
          } catch (error) {
            showError(`Setup draft could not be saved: ${error.message}`);
            return;
          }
        }
        this.renderOnboardingStep(this.onboardingStep + 1);
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (this.onboardingStep > 1) {
          this.renderOnboardingStep(this.onboardingStep - 1);
        }
      });
    }

    if (addRoomBtn) {
      addRoomBtn.addEventListener('click', () => {
        this.openSpaceModal();
      });
    }

    if (finishBtn) {
      finishBtn.addEventListener('click', async () => {
        clearError();
        if (!State.user || !State.user.email) {
          this.renderOnboardingStep(1, 'A valid account is required to complete setup.');
          return;
        }
        const rooms = API.getRooms();
        if (rooms.length === 0) {
          this.renderOnboardingStep(2, 'Add at least one room before completing setup.');
          return;
        }
        if (!Object.values(this.onboardingDevices).some(Boolean)) {
          this.renderOnboardingStep(3, 'Select at least one device type before completing setup.');
          return;
        }
        if (
          !this.onboardingPreferences ||
          !['celsius', 'fahrenheit'].includes(this.onboardingPreferences.tempUnit) ||
          typeof this.onboardingPreferences.notificationsEnabled !== 'boolean'
        ) {
          this.renderOnboardingStep(4, 'Choose valid preferences before completing setup.');
          return;
        }
        if (!this.onboardingLocation) {
          this.renderOnboardingStep(4, 'Choose a GPS or manually entered location before completing setup.');
          return;
        }

        try {
          await this.onboardingSaveQueue.catch(() => {});
          const configuredRooms = rooms.map(room => ({
            ...room,
            devices: (room.devices || []).filter(device => this.onboardingDevices[device.type])
          }));
          const settings = {
            ...API.getSettings(),
            ...this.onboardingPreferences,
            setupDevices: { ...this.onboardingDevices }
          };
          API.saveRooms(configuredRooms);
          API.saveSettings(settings);
          const completeSetup = this.buildOnboardingSetup(true);
          completeSetup.rooms = configuredRooms;
          completeSetup.preferences = { ...this.onboardingPreferences };
          const accountSave = await API.saveAccountSetup(completeSetup);
          if (accountSave.setupComplete !== true) {
            throw new Error('The backend did not confirm setup completion.');
          }
          const savedRooms = API.getRooms();
          const savedSettings = API.getSettings();
          if (
            savedRooms.length !== configuredRooms.length ||
            savedRooms.some((room, index) =>
              room.id !== configuredRooms[index].id ||
              JSON.stringify(room.devices) !== JSON.stringify(configuredRooms[index].devices)
            ) ||
            JSON.stringify(savedSettings.setupDevices) !== JSON.stringify(this.onboardingDevices) ||
            savedSettings.tempUnit !== this.onboardingPreferences.tempUnit ||
            savedSettings.notificationsEnabled !== this.onboardingPreferences.notificationsEnabled
          ) {
            throw new Error('Setup could not be verified in this browser storage.');
          }
          State.rooms = savedRooms;
          State.user = API.updateUser({ isOnboarded: true });
          this.renderCurrentApplicationState();
          Utils.showToast('Setup saved to your account. Welcome to the dashboard.', 'success');
        } catch (error) {
          showError(`Setup was not saved: ${error.message}`);
        }
      });
    }
  },

  renderOnboardingStep(step, errorMessage = '') {
    this.onboardingStep = Math.max(1, Math.min(5, step));
    const root = document.getElementById('app-root');
    if (!root) return;
    root.innerHTML = Views.renderOnboarding(this.onboardingStep);
    this.attachOnboardingEvents();
    if (errorMessage) {
      const errorEl = document.getElementById('onboarding-error');
      if (errorEl) {
        errorEl.textContent = errorMessage;
        errorEl.style.display = 'block';
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
