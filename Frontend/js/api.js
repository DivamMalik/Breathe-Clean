
const STORAGE_KEYS = {
  USER: 'breatheclean_user',
  ROOMS: 'breatheclean_rooms',
  ACTIVE_ROOM_ID: 'breatheclean_active_room',
  SETTINGS: 'breatheclean_settings',
  SETUP: 'breatheclean_setup',
  LEGACY_OWNER: 'breatheclean_legacy_setup_owner'
};

const API_BASE_URL = (window.BREATHE_CLEAN_API_BASE || 'http://localhost:5001/api')
  .replace(/\/+$/, '');

const DEFAULT_ROOMS = [
  {
    id: 'room_bedroom',
    name: 'Bedroom',
    type: 'Bedroom',
    image: 'assets/images/room-bedroom.jpg',
    length: 4.5,
    width: 3.0,
    area: 13.5,
    ceilingHeight: 2.8,
    windowsCount: 1,
    doorsCount: 1,
    typicalOccupants: 2,
    mode: 'AUTO',
    environment: {
      outdoorAQI: 112,
      indoorAQI: 38,
      co2: 640,
      temperature: 24,
      humidity: 51,
      occupancy: 2,
      timestamp: new Date().toISOString()
    },
    devices: [
      {
        id: 'dev_bed_win',
        type: 'window',
        name: 'Smart Windows',
        state: 'Closed',
        connectionState: 'Connected',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 3).toISOString()
      },
      {
        id: 'dev_bed_vent',
        type: 'ventilation',
        name: 'Ventilation',
        state: 'Normal',
        connectionState: 'Connected',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 10).toISOString()
      },
      {
        id: 'dev_bed_pur',
        type: 'purifier',
        name: 'Air Purifier',
        state: 'Active',
        connectionState: 'Connected',
        lastUpdated: new Date(Date.now() - 1000 * 25).toISOString()
      }
    ],
    activity: [
      {
        id: 'act_1',
        source: 'SYSTEM',
        action: 'Windows remain closed',
        detail: 'Outdoor AQI increased to 112.',
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString()
      },
      {
        id: 'act_2',
        source: 'SYSTEM',
        action: 'Purifier turned to normal mode',
        detail: 'Indoor AQI improved to 38.',
        timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString()
      },
      {
        id: 'act_3',
        source: 'SYSTEM',
        action: 'Ventilation running at normal rate',
        detail: 'Maintaining fresh air circulation.',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString()
      },
      {
        id: 'act_4',
        source: 'YOU',
        action: 'Switched to Auto mode',
        detail: 'Breathe Clean resumed control.',
        timestamp: new Date(Date.now() - 1000 * 60 * 13).toISOString()
      },
      {
        id: 'act_5',
        source: 'SYSTEM',
        action: 'Indoor CO₂ stable',
        detail: 'Current level: 640 ppm.',
        timestamp: new Date(Date.now() - 1000 * 60 * 16).toISOString()
      }
    ]
  },
  {
    id: 'room_living',
    name: 'Living Room',
    type: 'Living Room',
    image: 'assets/images/room-livingroom.jpg',
    length: 6.2,
    width: 4.1,
    area: 25.4,
    ceilingHeight: 3.0,
    windowsCount: 2,
    doorsCount: 2,
    typicalOccupants: 4,
    mode: 'AUTO',
    environment: {
      outdoorAQI: 112,
      indoorAQI: 46,
      co2: 720,
      temperature: 23,
      humidity: 48,
      occupancy: 3,
      timestamp: new Date().toISOString()
    },
    devices: [
      {
        id: 'dev_liv_win',
        type: 'window',
        name: 'Smart Windows',
        state: 'Closed',
        connectionState: 'Connected',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: 'dev_liv_vent',
        type: 'ventilation',
        name: 'Ventilation',
        state: 'Normal',
        connectionState: 'Connected',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: 'dev_liv_pur',
        type: 'purifier',
        name: 'Air Purifier',
        state: 'Active',
        connectionState: 'Connected',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      }
    ],
    activity: [
      {
        id: 'act_liv_1',
        source: 'SYSTEM',
        action: 'Ventilation balanced',
        detail: 'Living room occupancy at 3 persons.',
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString()
      }
    ]
  },
  {
    id: 'room_study',
    name: 'Study',
    type: 'Study',
    image: 'assets/images/room-study.jpg',
    length: 3.5,
    width: 2.8,
    area: 9.8,
    ceilingHeight: 2.7,
    windowsCount: 1,
    doorsCount: 1,
    typicalOccupants: 1,
    mode: 'AUTO',
    environment: {
      outdoorAQI: 112,
      indoorAQI: 32,
      co2: 590,
      temperature: 22,
      humidity: 50,
      occupancy: 1,
      timestamp: new Date().toISOString()
    },
    devices: [
      {
        id: 'dev_stu_win',
        type: 'window',
        name: 'Smart Windows',
        state: 'Closed',
        connectionState: 'Connected',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: 'dev_stu_vent',
        type: 'ventilation',
        name: 'Ventilation',
        state: 'Low',
        connectionState: 'Connected',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: 'dev_stu_pur',
        type: 'purifier',
        name: 'Air Purifier',
        state: 'Standby',
        connectionState: 'Connected',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      }
    ],
    activity: [
      {
        id: 'act_stu_1',
        source: 'SYSTEM',
        action: 'Study space active',
        detail: 'Low noise ventilation enabled.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      }
    ]
  }
];

const API = {
  _userId() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
    if (!raw || raw === 'signed_out') return null;
    try {
      const user = JSON.parse(raw);
      return user && (typeof user.id === 'number' || typeof user.id === 'string')
        ? String(user.id)
        : null;
    } catch {
      return null;
    }
  },

  _scopedKey(key, userId = this._userId()) {
    return userId ? `${key}:${encodeURIComponent(userId)}` : null;
  },

  _getScopedItem(key, userId) {
    const storageKey = this._scopedKey(key, userId);
    return storageKey ? localStorage.getItem(storageKey) : null;
  },

  _setScopedItem(key, value, userId) {
    const storageKey = this._scopedKey(key, userId);
    if (storageKey) localStorage.setItem(storageKey, value);
  },

  _clearScopedData(userId) {
    for (const key of [STORAGE_KEYS.ROOMS, STORAGE_KEYS.ACTIVE_ROOM_ID, STORAGE_KEYS.SETTINGS, STORAGE_KEYS.SETUP]) {
      const scopedKey = this._scopedKey(key, userId);
      if (scopedKey) localStorage.removeItem(scopedKey);
    }
  },

  _clearLegacySetup() {
    localStorage.removeItem(STORAGE_KEYS.ROOMS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROOM_ID);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  },

  _storeUser(user, rememberMe = true) {
    const serialized = JSON.stringify(user);
    if (rememberMe) {
      sessionStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.setItem(STORAGE_KEYS.USER, serialized);
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
      sessionStorage.setItem(STORAGE_KEYS.USER, serialized);
    }
  },

  async _delay(ms = 40) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  async _authRequest(endpoint, credentials) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
    } catch {
      const error = new Error('Unable to reach the Breathe Clean server. Check that it is running and try again.');
      error.code = 'NETWORK_ERROR';
      throw error;
    }
    let result = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok) {
      if (response.status >= 500) {
        const error = new Error(
          result?.error || 'The server could not complete this request. Please try again shortly.'
        );
        error.accountCreated = result?.accountCreated === true;
        error.status = response.status;
        throw error;
      }
      const error = new Error(
        result?.error ||
        `Authentication endpoint returned HTTP ${response.status}. Check the backend route and configuration.`
      );
      error.status = response.status;
      throw error;
    }
    if (!result || result.success !== true) {
      throw new Error('The server returned an invalid authentication response.');
    }

    return result;
  },

  async _accountRequest(endpoint, method = 'GET', body) {
    const response = await fetch(`${API_BASE_URL}/account/${endpoint}`, {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const result = await response.json();
    if (!response.ok || result.success !== true) {
      throw new Error(result.error || 'Unable to load your account setup');
    }
    return result;
  },

  async getAccountSetup() {
    return this._accountRequest('setup');
  },

  async restoreAccountSetup() {
    const user = this.getCurrentUser();
    if (!user || !Number.isSafeInteger(user.id)) return user;
    const rememberMe = Boolean(localStorage.getItem(STORAGE_KEYS.USER));
    const setupResponse = await this.getAccountSetup();
    const restoredUser = await this._hydrateAccount(user, setupResponse);
    this._storeUser(restoredUser, rememberMe);
    return restoredUser;
  },

  clearRememberedUser() {
    const userId = this._userId();
    if (
      userId &&
      !localStorage.getItem(STORAGE_KEYS.LEGACY_OWNER) &&
      localStorage.getItem(STORAGE_KEYS.ROOMS)
    ) {
      localStorage.setItem(STORAGE_KEYS.LEGACY_OWNER, userId);
    }
    if (userId) this._clearScopedData(userId);
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
  },

  async saveAccountSetup(setup) {
    const result = await this._accountRequest('setup', 'PUT', setup);
    this._setScopedItem(STORAGE_KEYS.SETUP, JSON.stringify(result.setup));
    this.saveRooms(result.setup.rooms);
    if (result.setup.preferences) {
      this.saveSettings({ ...this.getSettings(), ...result.setup.preferences });
    }
    return result;
  },

  async persistRoomsToAccountSetup() {
    const user = this.getCurrentUser();
    if (!user || user.id === 'usr_divam_01') {
      const cached = this.getCachedAccountSetup() || {
        setupCompleted: true,
        rooms: this.getRooms(),
        devices: { window: true, ventilation: true, purifier: true },
        preferences: null,
        location: null,
        outdoorAirQuality: null
      };
      cached.rooms = this.getRooms();
      this._setScopedItem(STORAGE_KEYS.SETUP, JSON.stringify(cached), user?.id || 'usr_divam_01');
      return { success: true, setup: cached };
    }

    const cached = this.getCachedAccountSetup();
    if (!cached) {
      const response = await this.getAccountSetup();
      const setup = response.setup || {
        setupCompleted: false,
        rooms: [],
        devices: { window: false, ventilation: false, purifier: false },
        preferences: null,
        location: null,
        outdoorAirQuality: null
      };
      return this.saveAccountSetup({
        ...setup,
        rooms: this.getRooms()
      });
    }

    let setupToSave = {
      ...cached,
      rooms: this.getRooms()
    };
    try {
      return await this.saveAccountSetup(setupToSave);
    } catch (err) {
      if (/Outdoor AQI must come from the configured air-quality provider/.test(err.message)) {
        const fresh = await this.getAccountSetup();
        if (fresh?.setup) {
          setupToSave = {
            ...fresh.setup,
            rooms: this.getRooms()
          };
          return await this.saveAccountSetup(setupToSave);
        }
      }
      throw err;
    }
  },

  getCachedAccountSetup() {
    const raw = this._getScopedItem(STORAGE_KEYS.SETUP);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async searchIndianLocations(query) {
    const result = await this._accountRequest('location-search', 'POST', { query });
    return result.locations;
  },

  async reverseGeocodeLocation(latitude, longitude) {
    const result = await this._accountRequest('location-reverse-geocode', 'POST', {
      latitude,
      longitude
    });
    return result.location;
  },

  async lookupOutdoorAirQuality() {
    const result = await this._accountRequest('outdoor-air-quality', 'POST', {});
    return result.airQuality;
  },

  async getAnalyticsHistory(range = '24H') {
    if (!['24H', '7D', '30D'].includes(range)) {
      throw new Error('Select a supported analytics time range.');
    }
    const user = this.getCurrentUser();
    if (user && user.id === 'usr_divam_01') {
      return this._getDemoAnalyticsHistory(range);
    }
    try {
      return await this._accountRequest(`analytics?range=${encodeURIComponent(range)}`);
    } catch (err) {
      if (!user || user.id === 'usr_divam_01') {
        return this._getDemoAnalyticsHistory(range);
      }
      throw err;
    }
  },

  _getDemoAnalyticsHistory(range = '24H') {
    const now = Date.now();
    const count = range === '24H' ? 8 : (range === '7D' ? 7 : 12);
    const stepMs = range === '24H'
      ? 3 * 3600 * 1000
      : (range === '7D' ? 24 * 3600 * 1000 : 2.5 * 24 * 3600 * 1000);
    const sampleAqiValues = [42, 51, 48, 62, 57, 65, 53, 46, 52, 58, 60, 54];
    const readings = [];
    for (let i = count - 1; i >= 0; i--) {
      readings.push({
        metric: 'outdoorAQI',
        value: sampleAqiValues[i % sampleAqiValues.length],
        category: 'Moderate',
        source: 'Google Maps Platform Air Quality API (Universal AQI)',
        unit: 'Universal AQI',
        latitude: 12.9716,
        longitude: 77.5946,
        placeName: 'Bengaluru, India',
        recordedAt: new Date(now - i * stepMs).toISOString()
      });
    }
    return {
      success: true,
      range,
      readings,
      summary: {
        verifiedOutdoorSamples: readings.length,
        latestOutdoorAQI: readings[readings.length - 1],
        indoorAQIAverage: 38.5,
        automaticActions: 14,
        manualOverrides: 2,
        filterLife: 86
      }
    };
  },

  async _hydrateAccount(user, setupResponse) {
    const userId = String(user.id);
    let setup = setupResponse.setup;
    if (!setupResponse.hasSetup) {
      const legacyOwner = localStorage.getItem(STORAGE_KEYS.LEGACY_OWNER);
      const legacyRaw = localStorage.getItem(STORAGE_KEYS.ROOMS);
      if (legacyOwner === userId && legacyRaw) {
        let rooms = null;
        try {
          rooms = JSON.parse(legacyRaw);
        } catch {
          rooms = null;
        }
        if (Array.isArray(rooms)) {
          rooms = rooms.filter(room =>
            room && !['room_bedroom', 'room_living', 'room_study'].includes(room.id)
          );
        }
        if (Array.isArray(rooms) && rooms.length > 0) {
          let legacySettings = {};
          const legacySettingsRaw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
          if (legacySettingsRaw) {
            try {
              legacySettings = JSON.parse(legacySettingsRaw);
            } catch {
              legacySettings = {};
            }
          }
          const devices = {
            window: rooms.some(room => room.devices?.some(device => device.type === 'window')),
            ventilation: rooms.some(room => room.devices?.some(device => device.type === 'ventilation')),
            purifier: rooms.some(room => room.devices?.some(device => device.type === 'purifier'))
          };
          setup = {
            setupCompleted: false,
            rooms,
            devices,
            preferences: {
              tempUnit: ['celsius', 'fahrenheit'].includes(legacySettings.tempUnit)
                ? legacySettings.tempUnit
                : 'celsius',
              notificationsEnabled: typeof legacySettings.notificationsEnabled === 'boolean'
                ? legacySettings.notificationsEnabled
                : true
            },
            location: null,
            outdoorAirQuality: null
          };
          await this._accountRequest('setup', 'PUT', setup);
          localStorage.setItem(STORAGE_KEYS.LEGACY_OWNER, userId);
          this._clearLegacySetup();
        } else {
          this._clearLegacySetup();
          localStorage.removeItem(STORAGE_KEYS.LEGACY_OWNER);
        }
      }
    }

    if (setup) {
      const savedMode = ['AUTO', 'MANUAL'].includes(setup.controlMode)
        ? setup.controlMode
        : setup.rooms?.find(room => ['AUTO', 'MANUAL'].includes(room.mode))?.mode || 'AUTO';
      setup = {
        ...setup,
        controlMode: savedMode,
        rooms: (setup.rooms || []).map(room => ({ ...room, mode: savedMode }))
      };
      this._setScopedItem(STORAGE_KEYS.SETUP, JSON.stringify(setup), userId);
      this._setScopedItem(STORAGE_KEYS.ROOMS, JSON.stringify(setup.rooms || []), userId);
      const scopedActiveRoomId = this._getScopedItem(STORAGE_KEYS.ACTIVE_ROOM_ID, userId);
      if (!setup.rooms?.some(room => room.id === scopedActiveRoomId)) {
        this._setScopedItem(
          STORAGE_KEYS.ACTIVE_ROOM_ID,
          setup.rooms?.[0]?.id || '',
          userId
        );
      }
      if (setup.preferences) {
        this._setScopedItem(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify({ ...this.getSettingsForUser(userId), ...setup.preferences }),
          userId
        );
      }
    } else {
      this._setScopedItem(STORAGE_KEYS.ROOMS, '[]', userId);
    }
    return {
      ...user,
      isOnboarded: setup
        ? setup.setupCompleted
        : setupResponse.hasSetup
          ? setupResponse.setupComplete
          : true
    };
  },

  getSettingsForUser(userId) {
    const raw = this._getScopedItem(STORAGE_KEYS.SETTINGS, userId);
    const defaults = {
      tempUnit: 'celsius',
      defaultMode: 'AUTO',
      notificationsEnabled: true,
      dataSharing: false
    };
    if (!raw) return defaults;
    try {
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  },

  async _getDashboardResource(resource) {
    const response = await fetch(`${API_BASE_URL}/${resource}`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    });
    const result = await response.json();

    if (!response.ok || result.success !== true) {
      throw new Error(result.error || `Unable to load ${resource}`);
    }

    return result;
  },

  async getDashboardData() {
    const [sensors, devices, decision] = await Promise.all([
      this._getDashboardResource('sensors'),
      this._getDashboardResource('devices'),
      this._getDashboardResource('decision')
    ]);

    return {
      sensors: sensors.sensorData,
      sensorsSource: sensors.source || 'unverified',
      simulated: sensors.simulated === true,
      devices: devices.deviceState,
      decision: decision.decision
    };
  },

  async _sendDashboardRequest(endpoint, method, body) {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const result = await response.json();

    if (!response.ok || result.success !== true) {
      throw new Error(result.error || `Unable to update ${endpoint}`);
    }
    if (endpoint === 'decision/apply' && result.applied !== true) {
      throw new Error('The backend did not apply the validated decision.');
    }

    return result;
  },

  async updateDashboardDevices(updates) {
    return this._sendDashboardRequest('devices', 'PUT', updates);
  },

  async applyDashboardDecision(decision) {
    return this._sendDashboardRequest('decision/apply', 'POST', decision);
  },

  async updateDashboardSensors(updates) {
    return this._sendDashboardRequest('sensors', 'PUT', updates);
  },

  async runDashboardScenario(scenario) {
    return this._sendDashboardRequest(`simulation/${encodeURIComponent(scenario)}`, 'POST', {});
  },

  async login(email, password, rememberMe = true) {
    if (!email || !password) throw new Error('Email and password are required');
    const previousUserId = this._userId();
    const { user: authenticatedUser } = await this._authRequest('login', { email, password });
    if (previousUserId && previousUserId !== String(authenticatedUser.id)) {
      if (
        !localStorage.getItem(STORAGE_KEYS.LEGACY_OWNER) &&
        localStorage.getItem(STORAGE_KEYS.ROOMS)
      ) {
        localStorage.setItem(STORAGE_KEYS.LEGACY_OWNER, previousUserId);
      }
      this._clearScopedData(previousUserId);
    }
    const provisionalUser = {
      ...authenticatedUser,
      name: authenticatedUser.name || '',
      lastLogin: new Date().toISOString()
    };
    this._storeUser(provisionalUser, rememberMe);
    const setupResponse = await this.getAccountSetup();
    const user = await this._hydrateAccount(provisionalUser, setupResponse);
    this._storeUser(user, rememberMe);
    return user;
  },

  getGoogleClientId() {
    return localStorage.getItem('bc_google_client_id') || '';
  },

  setGoogleClientId(clientId) {
    if (clientId) {
      localStorage.setItem('bc_google_client_id', clientId.trim());
    } else {
      localStorage.removeItem('bc_google_client_id');
    }
  },

  async loginWithGoogleCredential() {
    throw new Error('Google sign-in is not connected to backend authentication.');
  },

  async loginWithGoogle() {
    throw new Error('Google sign-in is simulated and not connected to backend authentication.');
  },

  async signup(name, email, password) {
    if (!email || !password || !name) throw new Error('All fields are required');
    const previousUserId = this._userId();
    let accountCreated = false;
    try {
      const { user: registeredUser } = await this._authRequest('register', {
        name: name.trim(),
        email,
        password
      });
      accountCreated = true;
      if (previousUserId && previousUserId !== String(registeredUser.id)) {
        if (
          !localStorage.getItem(STORAGE_KEYS.LEGACY_OWNER) &&
          localStorage.getItem(STORAGE_KEYS.ROOMS)
        ) {
          localStorage.setItem(STORAGE_KEYS.LEGACY_OWNER, previousUserId);
        }
        this._clearScopedData(previousUserId);
      }
      const provisionalUser = {
        ...registeredUser,
        name: registeredUser.name || name.trim(),
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      this._storeUser(provisionalUser, true);
      const setupResponse = await this.getAccountSetup();
      const user = await this._hydrateAccount(provisionalUser, setupResponse);
      const onboardedUser = {
        ...user,
        name: provisionalUser.name,
        isOnboarded: false
      };
      this._storeUser(onboardedUser, true);
      return onboardedUser;
    } catch (error) {
      if (accountCreated) {
        const recoveryError = new Error(
          `Your account was created, but setup could not be loaded. Please sign in to retry setup: ${error.message}`
        );
        recoveryError.accountCreated = true;
        throw recoveryError;
      }
      if (error.accountCreated) {
        const recoveryError = new Error(
          'Your account was created, but sign-in could not be started. Please sign in with your new credentials.'
        );
        recoveryError.accountCreated = true;
        throw recoveryError;
      }
      if (error.code === 'NETWORK_ERROR' || (!error.status && /Unable to reach/.test(error.message))) {
        const recoveryError = new Error(
          'We could not confirm whether your account was created because the server connection was lost. Try signing in before attempting registration again.'
        );
        recoveryError.accountOutcomeUnknown = true;
        throw recoveryError;
      }
      throw error;
    }
  },

  async requestPasswordReset(email) {
    if (!email) throw new Error('Enter the email address for your account');
    return this._authRequest('password-reset/request', { email });
  },

  async resetPassword(token, password) {
    return this._authRequest('password-reset/confirm', { token, password });
  },

  async logout() {
    const userId = this._userId();
    if (
      userId &&
      !localStorage.getItem(STORAGE_KEYS.LEGACY_OWNER) &&
      localStorage.getItem(STORAGE_KEYS.ROOMS)
    ) {
      localStorage.setItem(STORAGE_KEYS.LEGACY_OWNER, userId);
    }
    try {
      await this._authRequest('logout', {});
    } catch (error) {

      console.warn('Backend logout warning:', error?.message || error);
    } finally {
      if (userId) this._clearScopedData(userId);
      localStorage.removeItem(STORAGE_KEYS.USER);
      sessionStorage.removeItem(STORAGE_KEYS.USER);
    }
    return true;
  },

  getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
    if (!raw || raw === 'signed_out') return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  updateUser(updates) {
    const user = this.getCurrentUser() || {};
    const updated = { ...user, ...updates };
    this._storeUser(updated, Boolean(localStorage.getItem(STORAGE_KEYS.USER)));
    return updated;
  },

  getDefaultRooms() {
    return JSON.parse(JSON.stringify(DEFAULT_ROOMS));
  },

  getRooms() {
    const raw = this._getScopedItem(STORAGE_KEYS.ROOMS);
    if (!raw) {
      return this._userId() ? [] : this.getDefaultRooms();
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return this._userId() ? [] : this.getDefaultRooms();
    } catch {
      return this._userId() ? [] : this.getDefaultRooms();
    }
  },

  saveRooms(rooms) {
    this._setScopedItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  },

  async getRoomById(id) {
    await this._delay();
    const rooms = this.getRooms();
    return rooms.find(r => r.id === id) || null;
  },

  async createRoom(roomData) {
    await this._delay();
    const rooms = this.getRooms();
    const name = typeof roomData.name === 'string' ? roomData.name.trim() : '';
    if (!name) throw new Error('Enter a name for this space');
    const requiredNumber = (value, label, minimum) => {
      const number = Number(value);
      if (!Number.isFinite(number) || number < minimum) {
        throw new Error(`Enter a valid ${label}`);
      }
      return number;
    };
    const length = requiredNumber(roomData.length, 'room length', 1);
    const width = requiredNumber(roomData.width, 'room width', 1);
    const ceilingHeight = requiredNumber(roomData.ceilingHeight, 'ceiling height', 1.8);
    const windowsCount = requiredNumber(roomData.windowsCount, 'window count', 0);
    const doorsCount = requiredNumber(roomData.doorsCount, 'door count', 1);
    const typicalOccupants = requiredNumber(roomData.typicalOccupants, 'occupancy', 1);
    const roomDevices = [
      {
        id: Utils.generateId('dev_win'),
        type: 'window',
        name: 'Smart Windows',
        state: 'Not configured',
        connectionState: 'Not connected',
        lastUpdated: new Date().toISOString()
      },
      {
        id: Utils.generateId('dev_vent'),
        type: 'ventilation',
        name: 'Ventilation',
        state: 'Not configured',
        connectionState: 'Not connected',
        lastUpdated: new Date().toISOString()
      },
      {
        id: Utils.generateId('dev_pur'),
        type: 'purifier',
        name: 'Air Purifier',
        state: 'Not configured',
        connectionState: 'Not connected',
        lastUpdated: new Date().toISOString()
      }
    ].filter(device => Boolean(roomData.deviceOptions?.[device.type]));
    const newRoom = {
      id: Utils.generateId('room'),
      name,
      type: roomData.type || 'Bedroom',
      image: roomData.image || (roomData.type === 'Living Room' ? 'assets/images/room-livingroom.jpg' : (roomData.type === 'Study' ? 'assets/images/room-study.jpg' : 'assets/images/room-bedroom.jpg')),
      length,
      width,
      area: Number((length * width).toFixed(1)),
      ceilingHeight,
      windowsCount,
      doorsCount,
      typicalOccupants,
      mode: 'AUTO',
      environment: {},
      devices: roomDevices,
      activity: [
        {
          id: Utils.generateId('act'),
          source: 'SYSTEM',
          action: 'Space registered',
          detail: 'Room details saved to this account.',
          timestamp: new Date().toISOString()
        }
      ]
    };

    rooms.push(newRoom);
    this.saveRooms(rooms);
    return newRoom;
  },

  async updateRoom(id, updates) {
    await this._delay();
    const rooms = this.getRooms();
    const idx = rooms.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Room not found');
    rooms[idx] = { ...rooms[idx], ...updates };
    this.saveRooms(rooms);
    return rooms[idx];
  },

  async deleteRoom(id) {
    await this._delay();
    let rooms = this.getRooms();
    rooms = rooms.filter(r => r.id !== id);
    this.saveRooms(rooms);
    return true;
  },

  async duplicateRoom(id) {
    await this._delay();
    const rooms = this.getRooms();
    const source = rooms.find(r => r.id === id);
    if (!source) throw new Error('Room not found');

    const copy = JSON.parse(JSON.stringify(source));
    copy.id = Utils.generateId('room');
    copy.name = `${source.name} (Copy)`;
    copy.activity = [
      {
        id: Utils.generateId('act'),
        source: 'SYSTEM',
        action: 'Space duplicated',
        detail: `Configuration cloned from ${source.name}.`,
        timestamp: new Date().toISOString()
      }
    ];

    rooms.push(copy);
    this.saveRooms(rooms);
    return copy;
  },

  getActiveRoomId() {
    const id = this._getScopedItem(STORAGE_KEYS.ACTIVE_ROOM_ID);
    const rooms = this.getRooms();
    if (id && rooms.some(r => r.id === id)) {
      return id;
    }
    return rooms.length > 0 ? rooms[0].id : null;
  },

  setActiveRoomId(id) {
    this._setScopedItem(STORAGE_KEYS.ACTIVE_ROOM_ID, id);
  },

  async setRoomMode(roomId, mode) {
    if (!['AUTO', 'MANUAL'].includes(mode)) {
      throw new Error('Choose Auto or Manual mode.');
    }
    const rooms = this.getRooms();
    const room = rooms.find(candidate => candidate.id === roomId);
    if (!room) throw new Error('Room not found');
    const updatedRooms = rooms.map(candidate => ({ ...candidate, mode }));
    const user = this.getCurrentUser();
    const isBackendUser = Boolean(user && Number.isSafeInteger(user.id));
    if (isBackendUser) {
      const cachedSetup = this.getCachedAccountSetup();
      const setupResponse = cachedSetup ? null : await this.getAccountSetup();
      const setup = cachedSetup || setupResponse?.setup;
      if (!setup) throw new Error('Your account setup could not be loaded to save the mode.');
      await this.saveAccountSetup({
        ...setup,
        controlMode: mode,
        rooms: updatedRooms
      });
    } else {
      this.saveRooms(updatedRooms);
    }
    return this.getRooms().find(candidate => candidate.id === roomId);
  },

  async sendDeviceCommand(roomId, deviceId, newState, source = 'YOU') {
    await this._delay();
    const rooms = this.getRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    const device = room.devices.find(d => d.id === deviceId);
    if (!device) throw new Error('Device not found');

    const prevValue = device.state;
    device.state = newState;
    device.lastUpdated = new Date().toISOString();

    const activityEvent = {
      id: Utils.generateId('act'),
      source: source,
      action: `${device.name} changed`,
      detail: `${prevValue} → ${newState}`,
      timestamp: new Date().toISOString()
    };
    room.activity.unshift(activityEvent);
    if (room.activity.length > 20) room.activity.pop();

    this.saveRooms(rooms);
    return { device, activityEvent };
  },

  async updateEnvironment(roomId, envUpdates) {
    const rooms = this.getRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return null;
    room.environment = { ...room.environment, ...envUpdates, timestamp: new Date().toISOString() };
    this.saveRooms(rooms);
    return room.environment;
  },

  async logActivity(roomId, source, action, detail) {
    const rooms = this.getRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const event = {
      id: Utils.generateId('act'),
      source,
      action,
      detail,
      timestamp: new Date().toISOString()
    };
    room.activity.unshift(event);
    if (room.activity.length > 25) room.activity.pop();
    this.saveRooms(rooms);
    return event;
  },

  getSettings() {
    const userId = this._userId();
    return userId ? this.getSettingsForUser(userId) : {
      tempUnit: 'celsius',
      defaultMode: 'AUTO',
      notificationsEnabled: true,
      dataSharing: false
    };
  },

  saveSettings(settings) {
    this._setScopedItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
};
