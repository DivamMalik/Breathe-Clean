/* Breathe Clean - AI Assistant & Autonomous Control Co-Pilot */

function hasCompleteChatSensorReadings(environment) {
  return Boolean(
    environment &&
    ['indoorAQI', 'outdoorAQI', 'co2', 'temperature', 'humidity', 'occupancy']
      .every(field => Number.isFinite(environment[field]))
  );
}

const Chatbot = {
  storageKey: 'breatheclean_chat_history',
  accountId: null,
  messages: [],
  listeners: [],

  init() {
    const user = API.getCurrentUser();
    this.setAccount(user?.id ?? null);
  },

  setAccount(accountId) {
    const nextAccountId = accountId === null || accountId === undefined
      ? null
      : String(accountId);
    this.accountId = nextAccountId;
    this.messages = [];
    const storageKey = this.accountId
      ? `${this.storageKey}:${encodeURIComponent(this.accountId)}`
      : null;
    const raw = storageKey ? localStorage.getItem(storageKey) : null;
    if (raw) {
      try {
        this.messages = JSON.parse(raw);
      } catch {
        this.messages = [];
      }
    }
    if (!this.messages || this.messages.length === 0) {
      this.messages = [
        {
          id: 'msg_welcome',
          sender: 'bot',
          text: `Hello! I am your **Breathe Clean Assistant**. I can explain available account readings and safety decisions, help navigate the app, and report when data or controls are unavailable.`,
          timestamp: new Date().toISOString(),
          actionTag: null
        }
      ];
      if (this.accountId) this.save();
    }
    this.notify();
  },

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },

  notify() {
    this.listeners.forEach(cb => {
      try { cb(this.messages); } catch (e) { console.error(e); }
    });
  },

  save() {
    if (this.accountId) {
      const storageKey = `${this.storageKey}:${encodeURIComponent(this.accountId)}`;
      localStorage.setItem(storageKey, JSON.stringify(this.messages));
    }
    this.notify();
  },

  clearHistory() {
    this.messages = [];
    if (this.accountId) {
      localStorage.removeItem(`${this.storageKey}:${encodeURIComponent(this.accountId)}`);
    }
    this.init();
    this.notify();
  },

  async sendUserPrompt(promptText) {
    if (!promptText || !promptText.trim()) return;

    const accountId = this.accountId;
    const trimmed = promptText.trim();
    const userMsg = {
      id: Utils.generateId('msg_user'),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toISOString()
    };
    this.messages.push(userMsg);
    this.save();

    // Generate AI response & execute functions
    let reply;
    try {
      reply = await this.interpretAndExecute(trimmed);
    } catch (error) {
      reply = {
        text: `I couldn't complete that request: ${error.message}`,
        actionTag: 'Request failed',
        actionDetails: error.message
      };
    }

    if (accountId !== this.accountId) return;

    const botMsg = {
      id: Utils.generateId('msg_bot'),
      sender: 'bot',
      text: reply.text,
      actionTag: reply.actionTag || null,
      actionDetails: reply.actionDetails || null,
      timestamp: new Date().toISOString()
    };
    this.messages.push(botMsg);
    this.save();

    return botMsg;
  },

  confirmedBackendState(result, field, expected) {
    if (result?.success !== true || result.deviceState?.[field] !== expected) {
      throw new Error('The backend did not confirm the requested device state.');
    }
    return result.deviceState;
  },

  getSavedOutdoorAirQuality() {
    const user = API.getCurrentUser();
    if (!user || String(user.id) !== this.accountId) return null;
    const setup = API.getCachedAccountSetup();
    const location = setup?.location;
    const airQuality = setup?.outdoorAirQuality;
    if (
      !location ||
      !airQuality ||
      !Number.isFinite(location.latitude) ||
      !Number.isFinite(location.longitude) ||
      airQuality.latitude !== location.latitude ||
      airQuality.longitude !== location.longitude ||
      !Number.isFinite(airQuality.aqi) ||
      typeof airQuality.lastUpdated !== 'string' ||
      Number.isNaN(Date.parse(airQuality.lastUpdated))
    ) {
      return null;
    }
    return { location, airQuality };
  },

  async interpretAndExecute(query) {
    const q = query.toLowerCase();
    const activeRoom = State.getActiveRoom() || (State.rooms[0] || null);
    const activeRoomName = activeRoom ? activeRoom.name : 'active space';

    // -------------------------------------------------------------
    // 1. SYSTEM MODE CONTROL (AUTO vs MANUAL)
    // -------------------------------------------------------------
    if (q.includes('manual mode') || q.includes('switch to manual') || q.includes('set mode to manual') || q.includes('enable manual') || q.includes('take manual control')) {
      return {
        text: 'Persistent AUTO/MANUAL mode is not supported by the backend. Individual device requests can be submitted, but the backend will reject any state that conflicts with current sensor safety rules.',
        actionTag: 'Unsupported',
        actionDetails: 'No backend room-mode endpoint'
      };
    }

    if (q.includes('auto mode') || q.includes('switch to auto') || q.includes('set mode to auto') || q.includes('enable auto') || q.includes('automatic mode') || q.includes('resume auto')) {
      if (activeRoom) {
        const result = await State.applyDashboardDecision();
        if (result?.applied !== true) {
          throw new Error('The backend did not confirm applying its safety decision.');
        }
        Utils.showToast('Backend safety policy applied', 'success');
        return {
          text: `The backend evaluated this account's sensor readings and confirmed its validated device state. This is a one-time backend update; persistent AUTO mode and physical hardware actuation are not available.`,
          actionTag: 'Backend Policy Confirmed',
          actionDetails: `Validated backend decision for ${activeRoom.name}`
        };
      }
    }

    // -------------------------------------------------------------
    // 2. DEVICE CONTROLS: SMART WINDOWS
    // -------------------------------------------------------------
    if (q.includes('open window') || q.includes('open the window') || q.includes('open windows')) {
      if (activeRoom) {
        const winDev = activeRoom.devices.find(d => d.type === 'window');
        if (winDev) {
          const result = await State.setDeviceStateManual(activeRoom.id, winDev.id, 'Open');
          this.confirmedBackendState(result, 'windows', 'OPEN');
          Utils.showToast(`Backend window state updated for ${activeRoom.name}`, 'success');
          return {
            text: `The backend confirmed the window state as **OPEN** for **${activeRoom.name}**. Physical hardware actuation is not connected or confirmed.`,
            actionTag: 'Backend State Confirmed',
            actionDetails: `Smart Windows → OPEN (${activeRoom.name}); hardware not confirmed`
          };
        }
      }
    }

    if (q.includes('close window') || q.includes('close the window') || q.includes('shut window') || q.includes('seal window')) {
      if (activeRoom) {
        const winDev = activeRoom.devices.find(d => d.type === 'window');
        if (winDev) {
          const result = await State.setDeviceStateManual(activeRoom.id, winDev.id, 'Closed');
          this.confirmedBackendState(result, 'windows', 'CLOSED');
          Utils.showToast(`Backend window state updated for ${activeRoom.name}`, 'info');
          return {
            text: `The backend confirmed the window state as **CLOSED** for **${activeRoom.name}**. Physical hardware actuation is not connected or confirmed.`,
            actionTag: 'Backend State Confirmed',
            actionDetails: `Smart Windows → CLOSED (${activeRoom.name}); hardware not confirmed`
          };
        }
      }
    }

    // -------------------------------------------------------------
    // 3. DEVICE CONTROLS: AIR PURIFIER
    // -------------------------------------------------------------
    if (q.includes('purifier') || q.includes('air purifier') || q.includes('hepa')) {
      if (activeRoom) {
        const purDev = activeRoom.devices.find(d => d.type === 'purifier');
        if (purDev) {
          let targetState = 'Active';
          if (q.includes('high') || q.includes('turbo') || q.includes('boost') || q.includes('max')) targetState = 'High';
          else if (q.includes('off') || q.includes('turn off') || q.includes('stop')) targetState = 'Off';
          else if (q.includes('low') || q.includes('quiet') || q.includes('whisper') || q.includes('standby')) targetState = 'Low';
          else if (q.includes('medium') || q.includes('normal') || q.includes('active') || q.includes('turn on')) targetState = 'Active';

          const result = await State.setDeviceStateManual(activeRoom.id, purDev.id, targetState);
          const expectedState = targetState === 'Off' ? 'OFF' : 'ON';
          this.confirmedBackendState(result, 'purifier', expectedState);
          Utils.showToast(`Backend purifier state updated for ${activeRoom.name}`, 'success');
          return {
            text: `The backend confirmed the Air Purifier state as **${expectedState}** for **${activeRoom.name}**. Physical hardware actuation is not connected or confirmed.`,
            actionTag: 'Backend State Confirmed',
            actionDetails: `Air Purifier → ${expectedState} (${activeRoom.name}); hardware not confirmed`
          };
        }
      }
    }

    // -------------------------------------------------------------
    // 4. DEVICE CONTROLS: VENTILATION
    // -------------------------------------------------------------
    if (q.includes('ventilation') || q.includes('hvac') || q.includes('fan')) {
      if (activeRoom) {
        const ventDev = activeRoom.devices.find(d => d.type === 'ventilation');
        if (ventDev) {
          let targetState = 'Normal';
          if (q.includes('filtered') || q.includes('filter')) targetState = 'Filtered';
          else if (q.includes('high') || q.includes('boost') || q.includes('fast')) targetState = 'High';
          else if (q.includes('low') || q.includes('quiet') || q.includes('eco')) targetState = 'Low';
          else if (q.includes('normal') || q.includes('standard')) targetState = 'Normal';

          const result = await State.setDeviceStateManual(activeRoom.id, ventDev.id, targetState);
          const expectedState = targetState.toUpperCase();
          this.confirmedBackendState(result, 'ventilation', expectedState);
          Utils.showToast(`Backend ventilation state updated for ${activeRoom.name}`, 'success');
          return {
            text: `The backend confirmed Ventilation as **${targetState}** for **${activeRoom.name}**. Physical hardware actuation is not connected or confirmed.`,
            actionTag: 'Backend State Confirmed',
            actionDetails: `Ventilation → ${targetState} (${activeRoom.name}); hardware not confirmed`
          };
        }
      }
    }

    // -------------------------------------------------------------
    // 5. NAVIGATION ACROSS VIEWS
    // -------------------------------------------------------------
    const navMap = {
      'dashboard': 'dashboard',
      'main dashboard': 'dashboard',
      'spaces': 'spaces',
      'rooms': 'spaces',
      'space list': 'spaces',
      'simulation': 'simulation',
      'simulator': 'simulation',
      'analytics': 'analytics',
      'charts': 'analytics',
      'trends': 'analytics',
      'devices': 'devices',
      'hardware': 'devices',
      'settings': 'settings',
      'preferences': 'settings'
    };

    for (const [key, view] of Object.entries(navMap)) {
      if (q.includes(`go to ${key}`) || q.includes(`open ${key}`) || q.includes(`view ${key}`) || q.includes(`show ${key}`) || q.includes(`navigate to ${key}`) || q.includes(`take me to ${key}`)) {
        window.location.hash = view;
        State.setActiveView(view);
        return {
          text: `Navigating to the **${view.charAt(0).toUpperCase() + view.slice(1)}** view.`,
          actionTag: 'Navigation',
          actionDetails: `Opened view: ${view}`
        };
      }
    }

    // -------------------------------------------------------------
    // 6. ROOM / SPACE SWITCHING
    // -------------------------------------------------------------
    for (const room of State.rooms) {
      const roomLower = room.name.toLowerCase();
      if (q.includes(`switch to ${roomLower}`) || q.includes(`go to ${roomLower}`) || q.includes(`open ${roomLower}`) || q.includes(`select ${roomLower}`)) {
        State.setActiveRoom(room.id);
        Utils.showToast(`Active space changed to ${room.name}`, 'info');
        const environment = room.environment || {};
        return {
          text: `Switched active space to **${room.name}** (${room.type}, ${room.area} m²). Current operating mode: **${room.mode}**. Indoor AQI: **${Number.isFinite(environment.indoorAQI) ? environment.indoorAQI : 'Unavailable'}**, CO₂: **${Number.isFinite(environment.co2) ? `${environment.co2} ppm` : 'Unavailable'}**.`,
          actionTag: 'Space Selected',
          actionDetails: `Active room: ${room.name}`
        };
      }
    }

    // Duplicate Space
    if (q.includes('duplicate room') || q.includes('duplicate space') || q.includes('clone room') || q.includes('clone space')) {
      if (activeRoom) {
        const copy = await State.duplicateRoom(activeRoom.id);
        Utils.showToast(`Duplicated ${activeRoom.name}`, 'success');
        return {
          text: `Successfully duplicated **${activeRoom.name}**. Created new space: **${copy.name}**.`,
          actionTag: 'Space Duplicated',
          actionDetails: `Cloned ${activeRoom.name}`
        };
      }
    }

    // Create New Space
    const createMatch = q.match(/(?:create|add|new)\s+(?:space|room)\s+(?:called\s+|named\s+)?([a-z0-9\s]+)/i);
    if (createMatch && !q.includes('duplicate')) {
      let newName = createMatch[1].trim();
      newName = newName.replace(/(?:with|having).*/i, '').trim();
      newName = newName.charAt(0).toUpperCase() + newName.slice(1);
      if (newName.length > 1 && newName.length < 30) {
        const newSpace = await State.addRoom({
          name: newName,
          type: 'Room',
          length: 4.5,
          width: 3.2,
          ceilingHeight: 2.8,
          windowsCount: 1,
          doorsCount: 1,
          typicalOccupants: 2
        });
        Utils.showToast(`Space "${newName}" created`, 'success');
        return {
          text: `Saved the new space **${newSpace.name}** (${newSpace.area} m²) to your account. Sensor readings and physical device connections are not configured.`,
          actionTag: 'Space Created',
          actionDetails: `New Space: ${newSpace.name}`
        };
      }
    }

    // -------------------------------------------------------------
    // 7. SIMULATION SCENARIO & ENVIRONMENTAL ADJUSTMENTS
    // -------------------------------------------------------------
    if (q.includes('smog') || q.includes('pollution spike') || q.includes('outdoor pollution') || q.includes('bad outdoor air')) {
      if (activeRoom) {
        const result = await State.applyDashboardScenario('pollution');
        Utils.showToast('Backend outdoor-pollution scenario applied', 'warning');
        return {
          text: `The backend confirmed the **Outdoor Pollution** scenario for this account and saved its safety-validated device state. This changes simulated readings; no physical hardware action is confirmed.`,
          actionTag: 'Simulation Updated',
          actionDetails: 'Scenario: pollution'
        };
      }
    }

    if (q.includes('fresh morning') || q.includes('fresh air') || q.includes('clean outdoor')) {
      if (activeRoom) {
        const result = await State.applyDashboardScenario('clean-air');
        Utils.showToast('Backend clean-air scenario applied', 'success');
        return {
          text: `The backend confirmed the **Clean Air** scenario for this account and saved its safety-validated device state. This changes simulated readings; no physical hardware action is confirmed.`,
          actionTag: 'Simulation Updated',
          actionDetails: 'Scenario: clean-air'
        };
      }
    }

    if (q.includes('crowded') || q.includes('meeting') || q.includes('high co2') || q.includes('stuffy')) {
      if (activeRoom) {
        const result = await State.applyDashboardScenario('high-co2');
        Utils.showToast('Backend high-CO₂ scenario applied', 'info');
        return {
          text: `The backend confirmed the **High CO₂** scenario for this account and saved its safety-validated device state. This changes simulated readings; no physical hardware action is confirmed.`,
          actionTag: 'Simulation Updated',
          actionDetails: 'Scenario: high-co2'
        };
      }
    }

    // Explicit Numerical Environmental Adjustments
    let envUpdated = false;
    let envUpdates = {};

    const outAqiMatch = q.match(/outdoor\s+aqi\s+(?:to\s+)?(\d+)/i) || q.match(/set\s+outdoor\s+(?:aqi\s+)?(?:to\s+)?(\d+)/i);
    if (outAqiMatch) {
      envUpdates.outdoorAQI = Math.min(400, Math.max(0, parseInt(outAqiMatch[1], 10)));
      envUpdated = true;
    }

    const inAqiMatch = q.match(/indoor\s+aqi\s+(?:to\s+)?(\d+)/i) || q.match(/set\s+indoor\s+(?:aqi\s+)?(?:to\s+)?(\d+)/i);
    if (inAqiMatch) {
      envUpdates.indoorAQI = Math.min(300, Math.max(0, parseInt(inAqiMatch[1], 10)));
      envUpdated = true;
    }

    const co2Match = q.match(/co2\s+(?:to\s+)?(\d+)/i) || q.match(/set\s+co2\s+(?:to\s+)?(\d+)/i);
    if (co2Match) {
      envUpdates.co2 = Math.min(2400, Math.max(300, parseInt(co2Match[1], 10)));
      envUpdated = true;
    }

    const tempMatch = q.match(/temp(?:erature)?\s+(?:to\s+)?(\d+)/i);
    if (tempMatch) {
      envUpdates.temperature = Math.min(45, Math.max(10, parseInt(tempMatch[1], 10)));
      envUpdated = true;
    }

    const humMatch = q.match(/humidity\s+(?:to\s+)?(\d+)/i);
    if (humMatch) {
      envUpdates.humidity = Math.min(100, Math.max(10, parseInt(humMatch[1], 10)));
      envUpdated = true;
    }

    const occMatch = q.match(/occupan(?:cy|ts)\s+(?:to\s+)?(\d+)/i);
    if (occMatch) {
      envUpdates.occupancy = Math.min(30, Math.max(1, parseInt(occMatch[1], 10)));
      envUpdated = true;
    }

    if (envUpdated && activeRoom) {
      await State.updateDashboardSensors(envUpdates);
      const parts = Object.entries(envUpdates).map(([k, v]) => `${k}: ${v}`).join(', ');
      Utils.showToast(`Backend sensor readings updated and policy applied: ${parts}`, 'info');
      return {
        text: `Updated backend sensor readings: ${parts}. The backend safety policy was applied. Sensor readings are global, not room-specific.`,
        actionTag: 'Environment Updated',
        actionDetails: parts
      };
    }

    // -------------------------------------------------------------
    // 8. SETTINGS & PREFERENCES
    // -------------------------------------------------------------
    if (q.includes('fahrenheit') || (q.includes('unit') && q.includes('f'))) {
      const s = API.getSettings();
      s.tempUnit = 'fahrenheit';
      API.saveSettings(s);
      Utils.showToast('Temperature unit set to Fahrenheit', 'info');
      return {
        text: `Temperature display unit changed to **Fahrenheit (°F)**.`,
        actionTag: 'Settings Updated',
        actionDetails: `Unit: Fahrenheit`
      };
    }

    if (q.includes('celsius') || (q.includes('unit') && q.includes('c'))) {
      const s = API.getSettings();
      s.tempUnit = 'celsius';
      API.saveSettings(s);
      Utils.showToast('Temperature unit set to Celsius', 'info');
      return {
        text: `Temperature display unit changed to **Celsius (°C)**.`,
        actionTag: 'Settings Updated',
        actionDetails: `Unit: Celsius`
      };
    }

    if (q.includes('enable notification') || q.includes('turn on notification') || q.includes('enable alert')) {
      const s = API.getSettings();
      s.notificationsEnabled = true;
      API.saveSettings(s);
      Utils.showToast('Air quality alerts enabled', 'success');
      return {
        text: `Air quality push notifications and alerts have been **Enabled**.`,
        actionTag: 'Settings Updated',
        actionDetails: `Notifications: ON`
      };
    }

    if (q.includes('disable notification') || q.includes('turn off notification') || q.includes('mute alert')) {
      const s = API.getSettings();
      s.notificationsEnabled = false;
      API.saveSettings(s);
      Utils.showToast('Air quality alerts disabled', 'info');
      return {
        text: `Your air-quality notification preference has been set to **Disabled** in this browser. No push notification service is connected.`,
        actionTag: 'Settings Updated',
        actionDetails: `Notifications: OFF`
      };
    }

    if (q.includes('reset demo') || q.includes('factory reset') || q.includes('reset data')) {
      return {
        text: `Account data cannot be reset through the assistant. Your saved account setup and data were not changed.`,
        actionTag: 'No Changes Made',
        actionDetails: `Account data reset is unavailable`
      };
    }

    // -------------------------------------------------------------
    // 9. WHY ARE WINDOWS CLOSED / DECISION EXPLANATIONS
    // -------------------------------------------------------------
    if (q.includes('why') && (q.includes('window') || q.includes('decision') || q.includes('purifier') || q.includes('closed') || q.includes('open'))) {
      if (activeRoom) {
        if (!hasCompleteChatSensorReadings(activeRoom.environment)) {
          return { text: `No complete sensor readings are available for ${activeRoom.name}; a current safety decision cannot be explained.` };
        }
        const dec = activeRoom.decision || Engine.decide(activeRoom.environment, activeRoom, activeRoom.devices);
        return {
          text: `### System Decision Explanation for ${activeRoom.name}:\n\n**${dec.title}**\n\n- **Reason:** ${dec.reason}\n- **Device Action:** ${dec.action}\n- **Expected Outcome:** ${dec.expectedOutcome}\n\n*Current Conditions: Outdoor AQI ${activeRoom.environment.outdoorAQI}, Indoor AQI ${activeRoom.environment.indoorAQI}, CO₂ ${activeRoom.environment.co2} ppm.*`
        };
      }
    }

    if (q.includes('saved location') || q.includes('my location') || q.includes('where am i')) {
      const user = API.getCurrentUser();
      const setup = user && String(user.id) === this.accountId
        ? API.getCachedAccountSetup()
        : null;
      const location = setup?.location;
      if (!location) {
        return { text: 'No location has been saved for your account yet. Choose one in Setup Mode before requesting outdoor air quality.' };
      }
      const provider = this.getSavedOutdoorAirQuality();
      const aqiSummary = provider
        ? ` The latest saved provider AQI is ${provider.airQuality.aqi} (${provider.airQuality.category || 'category unavailable'}), updated ${new Date(provider.airQuality.lastUpdated).toLocaleString()}.`
        : ' No provider AQI is currently saved for this location.';
      return {
        text: `Your saved location is **${location.placeName}** (${location.source === 'gps' ? 'GPS-detected' : 'manually selected'}).${aqiSummary}`
      };
    }

    // -------------------------------------------------------------
    // 10. CURRENT AIR QUALITY STATUS / SUMMARY REPORT
    // -------------------------------------------------------------
    if (q.includes('status') || q.includes('air quality') || q.includes('how is the air') || q.includes('report') || q.includes('summary')) {
      if (activeRoom) {
        const env = activeRoom.environment || {};
        const outdoorContext = this.getSavedOutdoorAirQuality();
        const outdoorProviderSummary = outdoorContext
          ? `\n\n**Latest saved outdoor AQI provider reading:** ${outdoorContext.airQuality.aqi} (${outdoorContext.airQuality.category || 'category unavailable'}) at ${outdoorContext.location.placeName}. Source: ${outdoorContext.airQuality.source}; updated ${new Date(outdoorContext.airQuality.lastUpdated).toLocaleString()}.`
          : '\n\nNo current provider AQI is saved for your account location.';
        if (!hasCompleteChatSensorReadings(env)) {
          return {
            text: `Account sensor telemetry for ${activeRoom.name} is unavailable. No sensor readings have been configured.${outdoorProviderSummary}`
          };
        }
        const outStat = Utils.getAqiStatus(env.outdoorAQI);
        const inStat = Utils.getAqiStatus(env.indoorAQI);
        const co2Stat = Utils.getCo2Status(env.co2);

        return {
          text: `### Environmental Telemetry for ${activeRoom.name}\n\n- **Outdoor sensor AQI:** ${env.outdoorAQI} (${outStat.label})\n- **Indoor AQI:** ${env.indoorAQI} (${inStat.label})\n- **CO₂:** ${env.co2} ppm (${co2Stat.label})\n- **Temperature:** ${env.temperature}°C\n- **Humidity:** ${env.humidity}%\n- **Occupancy:** ${env.occupancy} person${env.occupancy > 1 ? 's' : ''}\n- **Operating Mode:** ${activeRoom.mode}${outdoorProviderSummary}`
        };
      }
    }

    // -------------------------------------------------------------
    // 11. GENERAL IAQ & ENVIRONMENTAL EDUCATION / Q&A
    // -------------------------------------------------------------
    if (q.includes('co2') || q.includes('carbon dioxide')) {
      return {
        text: `**Indoor Carbon Dioxide (CO₂)** levels reflect ventilation efficacy:\n- **< 800 ppm:** Fresh, optimal cognitive focus.\n- **800–1,000 ppm:** Standard indoor comfort.\n- **1,000–1,500 ppm:** Drowsiness and slight cognitive fatigue.\n- **> 1,500 ppm:** Stuffy, poor oxygenation requiring immediate displacement ventilation or window flush.`
      };
    }

    if (q.includes('aqi') || q.includes('pm2.5') || q.includes('particulate')) {
      return {
        text: `**Air Quality Index (AQI)** measures ambient particulate matter (PM2.5 & PM10):\n- **0–50:** Healthy / Good (Safe for natural ventilation)\n- **51–100:** Moderate\n- **101–150:** Elevated (Windows should close to block outdoor dust/smog)\n- **> 150:** Hazardous (Windows sealed, HEPA purification at max CADR)`
      };
    }

    // Default friendly assistant fallback
    return {
      text: `I couldn't match *"${query}"* to a supported assistant action. You can ask about your saved location and available readings, request a safety-validated backend device-state update, run a supported simulation, or navigate to a view. Physical hardware actuation is not confirmed.`
    };
  }
};
