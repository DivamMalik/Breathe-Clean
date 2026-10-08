/* Breathe Clean - API Client Abstraction Layer */

const STORAGE_KEYS = {
  USER: 'breatheclean_user',
  ROOMS: 'breatheclean_rooms',
  ACTIVE_ROOM_ID: 'breatheclean_active_room',
  SETTINGS: 'breatheclean_settings'
};

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
        action: 'Eco standby mode active',
        detail: 'Air quality in study is optimal.',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      }
    ]
  }
];

const API = {
  // Simulates network latency if desired
  async _delay(ms = 40) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Auth Endpoints
  async login(email, password, rememberMe = true) {
    await this._delay();
    if (!email || !password) throw new Error('Email and password are required');
    const user = {
      id: 'usr_divam_01',
      name: email.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()) || 'Divam',
      email: email,
      isOnboarded: true,
      lastLogin: new Date().toISOString()
    };
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
    return user;
  },

  async signup(name, email, password) {
    await this._delay();
    if (!email || !password || !name) throw new Error('All fields are required');
    const user = {
      id: Utils.generateId('usr'),
      name: name,
      email: email,
      isOnboarded: false, // Triggers first-time onboarding
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  },

  async logout() {
    await this._delay();
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    return true;
  },

  getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) {
      // Default initial mock logged-in state for instant preview unless signed out
      const defaultUser = {
        id: 'usr_divam_01',
        name: 'Divam',
        email: 'divam@breatheclean.io',
        isOnboarded: true,
        lastLogin: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
      return defaultUser;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  updateUser(updates) {
    const user = this.getCurrentUser() || {};
    const updated = { ...user, ...updates };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    return updated;
  },

  // Rooms Endpoints
  getRooms() {
    const raw = localStorage.getItem(STORAGE_KEYS.ROOMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(DEFAULT_ROOMS));
      return DEFAULT_ROOMS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_ROOMS;
    }
  },

  saveRooms(rooms) {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  },

  async getRoomById(id) {
    await this._delay();
    const rooms = this.getRooms();
    return rooms.find(r => r.id === id) || null;
  },

  async createRoom(roomData) {
    await this._delay();
    const rooms = this.getRooms();
    const newRoom = {
      id: Utils.generateId('room'),
      name: roomData.name || 'New Space',
      type: roomData.type || 'Bedroom',
      image: roomData.image || (roomData.type === 'Living Room' ? 'assets/images/room-livingroom.jpg' : (roomData.type === 'Study' ? 'assets/images/room-study.jpg' : 'assets/images/room-bedroom.jpg')),
      length: Number(roomData.length || 4.0),
      width: Number(roomData.width || 3.0),
      area: Number((Number(roomData.length || 4.0) * Number(roomData.width || 3.0)).toFixed(1)),
      ceilingHeight: Number(roomData.ceilingHeight || 2.8),
      windowsCount: Number(roomData.windowsCount || 1),
      doorsCount: Number(roomData.doorsCount || 1),
      typicalOccupants: Number(roomData.typicalOccupants || 2),
      mode: 'AUTO',
      environment: {
        outdoorAQI: 112,
        indoorAQI: 42,
        co2: 650,
        temperature: 23,
        humidity: 50,
        occupancy: Number(roomData.typicalOccupants || 2),
        timestamp: new Date().toISOString()
      },
      devices: [
        {
          id: Utils.generateId('dev_win'),
          type: 'window',
          name: 'Smart Windows',
          state: 'Closed',
          connectionState: 'Connected',
          lastUpdated: new Date().toISOString()
        },
        {
          id: Utils.generateId('dev_vent'),
          type: 'ventilation',
          name: 'Ventilation',
          state: 'Normal',
          connectionState: 'Connected',
          lastUpdated: new Date().toISOString()
        },
        {
          id: Utils.generateId('dev_pur'),
          type: 'purifier',
          name: 'Air Purifier',
          state: 'Active',
          connectionState: 'Connected',
          lastUpdated: new Date().toISOString()
        }
      ],
      activity: [
        {
          id: Utils.generateId('act'),
          source: 'SYSTEM',
          action: 'Space registered',
          detail: 'Autonomous air monitoring initialized.',
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

  // Active Room ID
  getActiveRoomId() {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROOM_ID);
    const rooms = this.getRooms();
    if (id && rooms.some(r => r.id === id)) {
      return id;
    }
    return rooms.length > 0 ? rooms[0].id : null;
  },

  setActiveRoomId(id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROOM_ID, id);
  },

  // Mode & Device Commands
  async setRoomMode(roomId, mode) {
    await this._delay();
    const rooms = this.getRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    room.mode = mode;
    this.saveRooms(rooms);
    return room;
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

  // Settings
  getSettings() {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
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

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
};
