/* Breathe Clean - Central Application State Management */

const State = {
  user: null,
  rooms: [],
  activeRoomId: null,
  activeView: 'dashboard',
  decision: null,
  dashboardApiStatus: {
    state: 'idle',
    message: 'Live backend readings have not loaded yet.'
  },
  listeners: [],

  init() {
    this.user = API.getCurrentUser();
    this.rooms = API.getRooms();
    this.activeRoomId = API.getActiveRoomId();

    if (this.rooms.length > 0 && (!this.activeRoomId || !this.getRoom(this.activeRoomId))) {
      this.activeRoomId = this.rooms[0].id;
      API.setActiveRoomId(this.activeRoomId);
    }

    this.evaluateActiveRoom(false);
  },

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },

  notify(event, payload) {
    this.listeners.forEach(listener => {
      try {
        listener(event, payload, this);
      } catch (err) {
        console.error('State subscriber error:', err);
      }
    });
  },

  getActiveRoom() {
    return this.rooms.find(r => r.id === this.activeRoomId) || this.rooms[0] || null;
  },

  getRoom(id) {
    return this.rooms.find(r => r.id === id) || null;
  },

  setActiveRoom(id) {
    if (this.activeRoomId === id) return;
    this.activeRoomId = id;
    API.setActiveRoomId(id);
    this.evaluateActiveRoom(false);
    this.notify('room_changed', this.getActiveRoom());
  },

  setActiveView(viewName) {
    this.activeView = viewName;
    this.notify('view_changed', viewName);
  },

  async setMode(roomId, newMode) {
    const room = this.getRoom(roomId);
    if (!room || room.mode === newMode) return;

    const oldMode = room.mode;
    room.mode = newMode;
    await API.setRoomMode(roomId, newMode);

    const logText = newMode === 'AUTO' 
      ? 'Breathe Clean resumed control.' 
      : 'User took manual control of devices.';
    
    await API.logActivity(
      roomId, 
      'YOU', 
      `Switched to ${newMode === 'AUTO' ? 'Auto' : 'Manual'} mode`, 
      logText
    );

    // Refresh rooms state from storage
    this.rooms = API.getRooms();

    if (newMode === 'AUTO') {
      this.evaluateActiveRoom(true);
    }

    this.notify('mode_changed', { roomId, mode: newMode, oldMode });
  },

  evaluateActiveRoom(logChanges = true) {
    const room = this.getActiveRoom();
    if (!room) return null;

    const decision = Engine.decide(room.environment, room, room.devices);
    this.decision = decision;
    room.decision = decision;

    if (room.mode === 'AUTO') {
      let changed = false;

      // Smart Windows
      const winDev = room.devices.find(d => d.type === 'window');
      if (winDev && winDev.state !== decision.window) {
        const prev = winDev.state;
        winDev.state = decision.window;
        winDev.lastUpdated = new Date().toISOString();
        changed = true;
        if (logChanges) {
          API.logActivity(room.id, 'SYSTEM', `Windows ${decision.window.toLowerCase()}`, decision.reason);
        }
      }

      // Ventilation
      const ventDev = room.devices.find(d => d.type === 'ventilation');
      if (ventDev && ventDev.state !== decision.ventilation) {
        const prev = ventDev.state;
        ventDev.state = decision.ventilation;
        ventDev.lastUpdated = new Date().toISOString();
        changed = true;
        if (logChanges) {
          API.logActivity(room.id, 'SYSTEM', `Ventilation set to ${decision.ventilation.toLowerCase()}`, `System optimized air renewal.`);
        }
      }

      // Air Purifier
      const purDev = room.devices.find(d => d.type === 'purifier');
      if (purDev && purDev.state !== decision.purifier) {
        const prev = purDev.state;
        purDev.state = decision.purifier;
        purDev.lastUpdated = new Date().toISOString();
        changed = true;
        if (logChanges) {
          API.logActivity(room.id, 'SYSTEM', `Purifier set to ${decision.purifier.toLowerCase()}`, `Indoor AQI is ${room.environment.indoorAQI}.`);
        }
      }

      if (changed) {
        API.saveRooms(this.rooms);
      }
    }

    this.rooms = API.getRooms();
    this.notify('evaluated', { room, decision });
    return decision;
  },

  async evaluateRoom(roomId, logChanges = true) {
    if (!roomId) roomId = this.activeRoomId;
    const room = this.getRoom(roomId);
    if (!room) return null;

    const decision = Engine.decide(room.environment, room, room.devices);
    room.decision = decision;
    if (roomId === this.activeRoomId) {
      this.decision = decision;
    }

    if (room.mode === 'AUTO') {
      let changed = false;

      const winDev = room.devices.find(d => d.type === 'window');
      if (winDev && winDev.state !== decision.window) {
        winDev.state = decision.window;
        winDev.lastUpdated = new Date().toISOString();
        changed = true;
        if (logChanges) {
          API.logActivity(room.id, 'AUTO', `Window set to ${decision.window}`, decision.reason);
        }
      }

      const ventDev = room.devices.find(d => d.type === 'ventilation');
      if (ventDev && ventDev.state !== decision.ventilation) {
        ventDev.state = decision.ventilation;
        ventDev.lastUpdated = new Date().toISOString();
        changed = true;
        if (logChanges) {
          API.logActivity(room.id, 'AUTO', `Ventilation set to ${decision.ventilation}`, 'ASHRAE air displacement renewal.');
        }
      }

      const purDev = room.devices.find(d => d.type === 'purifier');
      if (purDev && purDev.state !== decision.purifier) {
        purDev.state = decision.purifier;
        purDev.lastUpdated = new Date().toISOString();
        changed = true;
        if (logChanges) {
          API.logActivity(room.id, 'AUTO', `Purifier set to ${decision.purifier}`, `Indoor AQI is ${room.environment.indoorAQI}.`);
        }
      }

      if (changed) {
        API.saveRooms(this.rooms);
      }
    } else {
      // In manual mode, still persist the latest evaluated decision metadata
      API.saveRooms(this.rooms);
    }

    this.rooms = API.getRooms();
    this.notify('evaluated', { room: this.getRoom(roomId), decision });
    return decision;
  },

  applyDashboardDataFromBackend(data) {
    const room = this.getActiveRoom();
    if (!room || !data || !data.sensors || !data.devices || !data.decision) {
      throw new Error('The backend returned incomplete dashboard data.');
    }

    const numericSensorFields = [
      'indoorAQI',
      'outdoorAQI',
      'co2',
      'temperature',
      'humidity',
      'occupancy'
    ];
    if (
      typeof data.sensors.room !== 'string' ||
      numericSensorFields.some((field) => !Number.isFinite(data.sensors[field]))
    ) {
      throw new Error('The backend returned incomplete or invalid sensor readings.');
    }

    const { windows, purifier, ventilation, mode, reason } = data.decision;
    if (
      !['OPEN', 'CLOSED'].includes(windows) ||
      !['ON', 'OFF'].includes(purifier) ||
      !['LOW', 'NORMAL', 'HIGH', 'FILTERED'].includes(ventilation) ||
      !['NORMAL', 'PURIFICATION', 'VENTILATION'].includes(mode) ||
      typeof reason !== 'string' ||
      !['OPEN', 'CLOSED'].includes(data.devices.windows) ||
      !['ON', 'OFF'].includes(data.devices.purifier) ||
      !['LOW', 'NORMAL', 'HIGH', 'FILTERED'].includes(data.devices.ventilation) ||
      !['NORMAL', 'PURIFICATION', 'VENTILATION'].includes(data.devices.mode)
    ) {
      throw new Error('The backend returned invalid device states or an invalid air-quality decision.');
    }

    room.environment = { ...room.environment, ...data.sensors };
    const displayDeviceStates = {
      window: data.devices.windows === 'OPEN' ? 'Open' : 'Closed',
      ventilation: data.devices.ventilation.charAt(0) + data.devices.ventilation.slice(1).toLowerCase(),
      purifier: data.devices.purifier === 'ON' ? 'Active' : 'Off'
    };
    room.devices.forEach((device) => {
      if (Object.hasOwn(displayDeviceStates, device.type)) {
        device.state = displayDeviceStates[device.type];
        device.lastUpdated = new Date().toISOString();
      }
    });

    const decisionStates = {
      window: windows === 'OPEN' ? 'Open' : 'Closed',
      ventilation: ventilation.charAt(0) + ventilation.slice(1).toLowerCase(),
      purifier: purifier === 'ON' ? 'Active' : 'Off'
    };
    const titles = {
      NORMAL: 'Air quality conditions are within configured thresholds.',
      PURIFICATION: 'Outdoor air pollution detected; purification is active.',
      VENTILATION: 'High CO₂ detected; fresh-air ventilation is active.'
    };
    const decision = {
      ...data.decision,
      window: decisionStates.window,
      purifier: decisionStates.purifier,
      ventilation: decisionStates.ventilation,
      title: titles[mode],
      action: `Recommended: windows ${decisionStates.window.toLowerCase()}, ventilation ${decisionStates.ventilation.toLowerCase()}, purifier ${decisionStates.purifier.toLowerCase()}.`,
      expectedOutcome: 'Device recommendations reflect the latest backend sensor readings and safety rules.',
      statusLevel: mode === 'PURIFICATION' ? 'elevated' : 'good',
      timestamp: new Date().toISOString()
    };
    room.decision = decision;
    this.decision = decision;
  },

  async applyDashboardDeviceUpdates(updates) {
    const result = await API.updateDashboardDevices(updates);
    this.applyDashboardDataFromBackend(await API.getDashboardData());
    this.notify('device_updated', result.deviceState);
    return result;
  },

  async applyDashboardDecision() {
    const currentData = await API.getDashboardData();
    const result = await API.applyDashboardDecision(currentData.decision);
    this.applyDashboardDataFromBackend(await API.getDashboardData());
    this.notify('device_updated', result.deviceState);
    return result;
  },

  async applyDashboardScenario(scenario) {
    const simulation = await API.runDashboardScenario(scenario);
    const applied = await API.applyDashboardDecision(simulation.decision);
    this.applyDashboardDataFromBackend(await API.getDashboardData());
    this.notify('environment_updated', this.getActiveRoom());
    return { ...simulation, deviceState: applied.deviceState };
  },

  async updateDashboardSensors(updates) {
    await API.updateDashboardSensors(updates);
    const currentData = await API.getDashboardData();
    await API.applyDashboardDecision(currentData.decision);
    this.applyDashboardDataFromBackend(await API.getDashboardData());
    this.notify('environment_updated', this.getActiveRoom());
  },

  async applyDashboardDeviceControl(deviceId, newState, roomId = this.activeRoomId) {
    const room = this.getRoom(roomId);
    const device = room?.devices.find((item) => item.id === deviceId);
    if (!device) throw new Error('The selected device is not available.');

    const fieldByType = {
      window: 'windows',
      ventilation: 'ventilation',
      purifier: 'purifier'
    };
    const valuesByType = {
      window: { Open: 'OPEN', Closed: 'CLOSED' },
      ventilation: {
        Low: 'LOW',
        Normal: 'NORMAL',
        High: 'HIGH',
        Filtered: 'FILTERED'
      },
      purifier: { Off: 'OFF', Active: 'ON' }
    };
    const field = fieldByType[device.type];
    const value = valuesByType[device.type]?.[newState];
    if (!field || !value) {
      throw new Error(`Unsupported ${device.type} setting: ${newState}`);
    }

    return this.applyDashboardDeviceUpdates({ [field]: value });
  },

  async applyDashboardPreset(presetName) {
    if (presetName === 'optimize') {
      return this.applyDashboardDecision();
    }

    let updates;
    if (presetName === 'seal') {
      updates = { windows: 'CLOSED', purifier: 'ON', ventilation: 'FILTERED' };
    } else {
      if (['eco', 'sleep', 'flush'].includes(presetName)) {
        throw new Error(`${presetName} preset is not supported by the backend.`);
      }
      throw new Error(`Unsupported dashboard preset: ${presetName}`);
    }

    return this.applyDashboardDeviceUpdates(updates);
  },

  async updateEnvironment(roomId, updates) {
    const room = this.getRoom(roomId);
    if (!room) return;

    room.environment = { ...room.environment, ...updates, timestamp: new Date().toISOString() };
    await API.updateEnvironment(roomId, updates);

    // Re-evaluate if active room
    if (roomId === this.activeRoomId) {
      this.evaluateActiveRoom(true);
    }
    this.notify('environment_updated', room);
  },

  async setDeviceStateManual(roomId, deviceId, newState) {
    const room = this.getRoom(roomId);
    if (!room) return;
    return this.applyDashboardDeviceControl(deviceId, newState, roomId);
  },

  async applyPreset(roomId, presetName) {
    const room = this.getRoom(roomId);
    if (!room) return { success: false, message: 'Room not found' };

    if (presetName === 'optimize') {
      const result = await this.applyDashboardDecision();
      return { success: true, message: result.reason };
    }

    const presetMap = { seal: 'seal', smog: 'seal', shield: 'seal' };
    if (presetMap[presetName]) {
      const result = await this.applyDashboardPreset(presetMap[presetName]);
      return { success: true, message: result.deviceState.mode };
    }
    if (['eco', 'sleep', 'flush'].includes(presetName)) {
      return { success: false, message: `${presetName} preset is not supported by the backend.` };
    }
    return { success: false, message: 'Unknown preset requested' };
  },

  async addRoom(roomData) {
    const newRoom = await API.createRoom(roomData);
    this.rooms = API.getRooms();
    this.setActiveRoom(newRoom.id);
    this.notify('room_created', newRoom);
    return newRoom;
  },

  async updateRoom(roomId, updates) {
    const updated = await API.updateRoom(roomId, updates);
    this.rooms = API.getRooms();
    this.notify('room_updated', updated);
    return updated;
  },

  async deleteRoom(roomId) {
    if (this.rooms.length <= 1) {
      throw new Error('At least one space must remain active.');
    }
    await API.deleteRoom(roomId);
    this.rooms = API.getRooms();
    if (this.activeRoomId === roomId) {
      this.activeRoomId = this.rooms[0].id;
      API.setActiveRoomId(this.activeRoomId);
    }
    this.evaluateActiveRoom(false);
    this.notify('room_deleted', roomId);
  },

  async duplicateRoom(roomId) {
    const duplicated = await API.duplicateRoom(roomId);
    this.rooms = API.getRooms();
    this.notify('room_created', duplicated);
    return duplicated;
  },

  reload() {
    this.rooms = API.getRooms();
    this.user = API.getCurrentUser();
    this.evaluateActiveRoom(false);
    this.notify('state_reloaded', null);
  }
};
