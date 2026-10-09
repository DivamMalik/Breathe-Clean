/* Breathe Clean - Central Application State Management */

const State = {
  user: null,
  rooms: [],
  activeRoomId: null,
  activeView: 'dashboard',
  decision: null,
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

    // Direct manual device control switches room to Manual mode so autonomous logic doesn't override user
    if (room.mode === 'AUTO') {
      await this.setMode(roomId, 'MANUAL');
    }

    await API.sendDeviceCommand(roomId, deviceId, newState, 'YOU');
    this.rooms = API.getRooms();
    this.notify('device_updated', { roomId, deviceId, newState });
  },

  async applyPreset(roomId, presetName) {
    const room = this.getRoom(roomId);
    if (!room) return { success: false, message: 'Room not found' };

    const win = room.devices.find(d => d.type === 'window');
    const vent = room.devices.find(d => d.type === 'ventilation');
    const pur = room.devices.find(d => d.type === 'purifier');

    if (presetName === 'optimize') {
      await this.setMode(roomId, 'AUTO');
      await this.evaluateRoom(roomId, true);
      return { success: true, message: 'All IAQ actuators synchronized with ASHRAE 62.1 optimal setpoints' };
    }

    // Manual presets switch space to Manual control
    if (room.mode === 'AUTO') {
      await this.setMode(roomId, 'MANUAL');
    }

    if (presetName === 'flush') {
      const winTarget = (room.environment.outdoorAQI <= 60 && win) ? 'Open' : 'Closed';
      if (win) await API.sendDeviceCommand(room.id, win.id, winTarget, 'QUICK_FLUSH');
      if (vent) await API.sendDeviceCommand(room.id, vent.id, 'High', 'QUICK_FLUSH');
      if (pur) await API.sendDeviceCommand(room.id, pur.id, 'High', 'QUICK_FLUSH');
      this.rooms = API.getRooms();
      this.notify('device_updated', { roomId });
      return { success: true, message: 'Rapid air displacement purge initiated at maximum CADR rate' };
    }

    if (presetName === 'eco' || presetName === 'sleep') {
      if (win) await API.sendDeviceCommand(room.id, win.id, 'Closed', 'ECO_MODE');
      if (vent) await API.sendDeviceCommand(room.id, vent.id, 'Low', 'ECO_MODE');
      if (pur) await API.sendDeviceCommand(room.id, pur.id, 'Low', 'ECO_MODE');
      this.rooms = API.getRooms();
      this.notify('device_updated', { roomId });
      return { success: true, message: 'Eco Silent whisper mode active (<22 dB, minimum energy consumption)' };
    }

    if (presetName === 'seal' || presetName === 'smog') {
      if (win) await API.sendDeviceCommand(room.id, win.id, 'Closed', 'PERIMETER_SEAL');
      if (vent) await API.sendDeviceCommand(room.id, vent.id, 'Filtered', 'PERIMETER_SEAL');
      if (pur) await API.sendDeviceCommand(room.id, pur.id, 'High', 'PERIMETER_SEAL');
      this.rooms = API.getRooms();
      this.notify('device_updated', { roomId });
      return { success: true, message: 'Perimeter Sealed: Windows hermetically closed, MERV-13 recirculation active' };
    }

    if (presetName === 'shield') {
      if (win) await API.sendDeviceCommand(room.id, win.id, 'Closed', 'CLEAN_SHIELD');
      if (vent) await API.sendDeviceCommand(room.id, vent.id, 'Filtered', 'CLEAN_SHIELD');
      if (pur) await API.sendDeviceCommand(room.id, pur.id, 'Active', 'CLEAN_SHIELD');
      this.rooms = API.getRooms();
      this.notify('device_updated', { roomId });
      return { success: true, message: 'Clean Air Shield active: Max protection against ambient smog' };
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
