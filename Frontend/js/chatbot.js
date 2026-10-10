
function hasCompleteChatSensorReadings(environment) {
  return Boolean(
    environment &&
    ['indoorAQI', 'outdoorAQI', 'co2', 'temperature', 'humidity', 'occupancy']
      .every(field => Number.isFinite(environment[field]))
  );
}

function isDirectCommand(query) {
  const commandText = query.trim().toLowerCase().replace(
    /^(?:(?:please\s+)?(?:(?:can|could|would)\s+you(?:\s+please)?\s+)?)/,
    ''
  );
  return /^(?:turn|switch|set|open|close|shut|seal|activate|deactivate|start|stop|run|apply|simulate|update|change|create|add|duplicate|clone|navigate|go|take|show|view|select|enable|disable|mute)\b/.test(commandText);
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
          text: `Hello! I am your **Breathe Clean Assistant**. I use local rule-based intent handling; no LLM, Ollama, or n8n service is connected. I can explain available account readings and safety decisions, help navigate the app, and report when data or controls are unavailable.`,
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
    if (!Number.isSafeInteger(user?.id) || String(user.id) !== this.accountId) return null;
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
      typeof airQuality.category !== 'string' ||
      airQuality.source !== 'Google Maps Platform Air Quality API (Universal AQI)' ||
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

    if (/^(?:hi|hello|hey|good morning|good afternoon|good evening)[!. ]*$/.test(q.trim())) {
      return {
        text: 'Hello! I can help with verified readings for your saved location, explain safety decisions, or navigate the app. What would you like to check?'
      };
    }

    if (isDirectCommand(q) && (q.includes('manual mode') || q.includes('take manual control'))) {
      if (activeRoom) {
        await State.setMode(activeRoom.id, 'MANUAL');
        return {
          text: 'Manual mode is saved for this account. Automatic decisions will not replace the selected device settings.',
          actionTag: 'Mode Updated',
          actionDetails: 'Operating mode: MANUAL'
        };
      }
    }

    if (
      isDirectCommand(q) &&
      (q.includes('auto mode') ||
        q.includes('switch to auto') ||
        q.includes('set mode to auto') ||
        q.includes('enable auto') ||
        q.includes('automatic mode') ||
        q.includes('resume auto'))
    ) {
      if (activeRoom) await State.setMode(activeRoom.id, 'AUTO');
    }

    if (!isDirectCommand(q) && /\b(?:what mode|which mode|operating mode)\b/.test(q)) {
      return {
        text: activeRoom
          ? `The saved operating mode for ${activeRoom.name} is **${activeRoom.mode || 'Unavailable'}**.`
          : 'No active space is available to report an operating mode.'
      };
    }

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

    if (
      !isDirectCommand(q) &&
      /\b(?:window|windows|purifier|air purifier|hepa|ventilation|hvac|fan)\b/.test(q) &&
      /\b(?:status|state|currently|running|on|off|open|closed)\b/.test(q)
    ) {
      return {
        text: 'I did not change any device state. This assistant can submit explicit backend state commands, but the backend does not provide a live physical-hardware status feed.',
        actionTag: 'Information unavailable',
        actionDetails: 'No device command was submitted'
      };
    }

    if (isDirectCommand(q) && (
      q.includes('auto mode') ||
      q.includes('switch to auto') ||
      q.includes('set mode to auto') ||
      q.includes('enable auto') ||
      q.includes('automatic mode') ||
      q.includes('resume auto') ||
      q.includes('safety policy') ||
      q.includes('current decision')
    )) {
      if (activeRoom) {
        const result = await State.applyDashboardDecision();
        if (result?.applied !== true) {
          throw new Error('The backend did not confirm applying its safety decision.');
        }
        Utils.showToast('Backend safety policy applied', 'success');
        return {
          text: `The backend evaluated available sensor readings and confirmed its validated backend device state. This is a one-time update; persistent AUTO mode and physical hardware actuation are not available.`,
          actionTag: 'Backend Policy Confirmed',
          actionDetails: `Validated backend decision for ${activeRoom.name}`
        };
      }
    }

    if (isDirectCommand(q) && (q.includes('open window') || q.includes('open the window') || q.includes('open windows'))) {
      if (activeRoom) {
        const winDev = activeRoom.devices.find(d => d.type === 'window');
        if (winDev) {
          const result = await State.setDeviceStateManual(activeRoom.id, winDev.id, 'Open');
          this.confirmedBackendState(result, 'windows', 'OPEN');
          Utils.showToast(`Backend window state updated for ${activeRoom.name}`, 'success');
          return {
            text: `The backend confirmed window state **OPEN**. This is backend state only; physical hardware actuation is not connected or confirmed.`,
            actionTag: 'Backend State Confirmed',
            actionDetails: 'Smart Windows → OPEN; backend state only'
          };
        }
      }
    }

    if (isDirectCommand(q) && (q.includes('close window') || q.includes('close the window') || q.includes('shut window') || q.includes('seal window'))) {
      if (activeRoom) {
        const winDev = activeRoom.devices.find(d => d.type === 'window');
        if (winDev) {
          const result = await State.setDeviceStateManual(activeRoom.id, winDev.id, 'Closed');
          this.confirmedBackendState(result, 'windows', 'CLOSED');
          Utils.showToast(`Backend window state updated for ${activeRoom.name}`, 'info');
          return {
            text: `The backend confirmed window state **CLOSED**. This is backend state only; physical hardware actuation is not connected or confirmed.`,
            actionTag: 'Backend State Confirmed',
            actionDetails: 'Smart Windows → CLOSED; backend state only'
          };
        }
      }
    }

    if (isDirectCommand(q) && (q.includes('purifier') || q.includes('air purifier') || q.includes('hepa'))) {
      if (activeRoom) {
        const purDev = activeRoom.devices.find(d => d.type === 'purifier');
        if (purDev) {
          if (q.includes('high') || q.includes('turbo') || q.includes('boost') || q.includes('max') ||
              q.includes('low') || q.includes('quiet') || q.includes('whisper') || q.includes('standby') ||
              q.includes('medium') || q.includes('normal')) {
            return {
              text: 'The backend supports only purifier on/off state; speed settings are not available. No device state was changed.',
              actionTag: 'Unsupported',
              actionDetails: 'Purifier speed control is not supported by the backend'
            };
          }
          const targetState = q.includes('off') || q.includes('deactivate') || q.includes('stop')
            ? 'Off'
            : q.includes('on') || q.includes('activate') || q.includes('start')
              ? 'Active'
              : null;
          if (!targetState) {
            return {
              text: 'Specify whether to turn the purifier on or off. No device state was changed.',
              actionTag: 'Unsupported',
              actionDetails: 'A supported purifier on/off state was not specified'
            };
          }

          const result = await State.setDeviceStateManual(activeRoom.id, purDev.id, targetState);
          const expectedState = targetState === 'Off' ? 'OFF' : 'ON';
          this.confirmedBackendState(result, 'purifier', expectedState);
          Utils.showToast(`Backend purifier state updated for ${activeRoom.name}`, 'success');
          return {
            text: `The backend confirmed the Air Purifier state as **${expectedState}**. This is backend state only; physical hardware actuation is not connected or confirmed.`,
            actionTag: 'Backend State Confirmed',
            actionDetails: `Air Purifier → ${expectedState}; backend state only`
          };
        }
      }
    }

    if (isDirectCommand(q) && (q.includes('ventilation') || q.includes('hvac') || q.includes('fan'))) {
      if (activeRoom) {
        const ventDev = activeRoom.devices.find(d => d.type === 'ventilation');
        if (ventDev) {
          if (q.includes('off') || q.includes('stop') || q.includes('deactivate')) {
            return {
              text: 'The backend does not support turning ventilation fully off. No device state was changed.',
              actionTag: 'Unsupported',
              actionDetails: 'Ventilation off state is not supported'
            };
          }
          let targetState = null;
          if (q.includes('filtered') || q.includes('filter')) targetState = 'Filtered';
          else if (q.includes('high') || q.includes('boost') || q.includes('fast')) targetState = 'High';
          else if (q.includes('low') || q.includes('quiet') || q.includes('eco')) targetState = 'Low';
          else if (q.includes('normal') || q.includes('standard') || q.includes(' on') || q.endsWith(' on')) targetState = 'Normal';
          if (!targetState) {
            return {
              text: 'Specify a supported ventilation level: low, normal, high, or filtered. No device state was changed.',
              actionTag: 'Unsupported',
              actionDetails: 'No supported ventilation level was specified'
            };
          }

          const result = await State.setDeviceStateManual(activeRoom.id, ventDev.id, targetState);
          const expectedState = targetState.toUpperCase();
          this.confirmedBackendState(result, 'ventilation', expectedState);
          Utils.showToast(`Backend ventilation state updated for ${activeRoom.name}`, 'success');
          return {
            text: `The backend confirmed Ventilation as **${targetState}**. This is backend state only; physical hardware actuation is not connected or confirmed.`,
            actionTag: 'Backend State Confirmed',
            actionDetails: `Ventilation → ${targetState}; backend state only`
          };
        }
      }
    }

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
      if (isDirectCommand(q) && (q.includes(`go to ${key}`) || q.includes(`open ${key}`) || q.includes(`view ${key}`) || q.includes(`show ${key}`) || q.includes(`navigate to ${key}`) || q.includes(`take me to ${key}`))) {
        window.location.hash = view;
        State.setActiveView(view);
        return {
          text: `Navigating to the **${view.charAt(0).toUpperCase() + view.slice(1)}** view.`,
          actionTag: 'Navigation',
          actionDetails: `Opened view: ${view}`
        };
      }
    }

    for (const room of State.rooms) {
      const roomLower = room.name.toLowerCase();
      if (isDirectCommand(q) && (q.includes(`switch to ${roomLower}`) || q.includes(`go to ${roomLower}`) || q.includes(`open ${roomLower}`) || q.includes(`select ${roomLower}`))) {
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

    if (isDirectCommand(q) && (q.includes('duplicate room') || q.includes('duplicate space') || q.includes('clone room') || q.includes('clone space'))) {
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

    const createMatch = q.match(/(?:create|add|new)\s+(?:space|room)\s+(?:called\s+|named\s+)?([a-z0-9\s]+)/i);
    if (isDirectCommand(q) && createMatch && !q.includes('duplicate')) {
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

    if (isDirectCommand(q) && (q.includes('smog') || q.includes('pollution spike') || q.includes('outdoor pollution') || q.includes('bad outdoor air'))) {
      if (activeRoom) {
        const result = await State.applyDashboardScenario('pollution');
        Utils.showToast('Backend outdoor-pollution scenario applied', 'warning');
        return {
          text: `The backend confirmed the simulated **Outdoor Pollution** scenario and saved its safety-validated device state. Readings are simulated; no physical hardware action is confirmed.`,
          actionTag: 'Simulation Updated',
          actionDetails: 'Scenario: pollution'
        };
      }
    }

    if (isDirectCommand(q) && (q.includes('fresh morning') || q.includes('fresh air') || q.includes('clean outdoor'))) {
      if (activeRoom) {
        const result = await State.applyDashboardScenario('clean-air');
        Utils.showToast('Backend clean-air scenario applied', 'success');
        return {
          text: `The backend confirmed the simulated **Clean Air** scenario and saved its safety-validated device state. Readings are simulated; no physical hardware action is confirmed.`,
          actionTag: 'Simulation Updated',
          actionDetails: 'Scenario: clean-air'
        };
      }
    }

    if (isDirectCommand(q) && (q.includes('crowded') || q.includes('meeting') || q.includes('high co2') || q.includes('stuffy'))) {
      if (activeRoom) {
        const result = await State.applyDashboardScenario('high-co2');
        Utils.showToast('Backend high-CO₂ scenario applied', 'info');
        return {
          text: `The backend confirmed the simulated **High CO₂** scenario and saved its safety-validated device state. Readings are simulated; no physical hardware action is confirmed.`,
          actionTag: 'Simulation Updated',
          actionDetails: 'Scenario: high-co2'
        };
      }
    }

    let envUpdated = false;
    let envUpdates = {};

    const explicitlyUpdatingSensors =
      isDirectCommand(q) && /\b(?:set|update|change|simulate)\b/.test(q);
    const outAqiMatch = explicitlyUpdatingSensors
      ? q.match(/outdoor\s+aqi\s+(?:to\s+)?(\d+)/i) || q.match(/set\s+outdoor\s+(?:aqi\s+)?(?:to\s+)?(\d+)/i)
      : null;
    if (outAqiMatch) {
      envUpdates.outdoorAQI = Math.min(400, Math.max(0, parseInt(outAqiMatch[1], 10)));
      envUpdated = true;
    }

    const inAqiMatch = explicitlyUpdatingSensors
      ? q.match(/indoor\s+aqi\s+(?:to\s+)?(\d+)/i) || q.match(/set\s+indoor\s+(?:aqi\s+)?(?:to\s+)?(\d+)/i)
      : null;
    if (inAqiMatch) {
      envUpdates.indoorAQI = Math.min(300, Math.max(0, parseInt(inAqiMatch[1], 10)));
      envUpdated = true;
    }

    const co2Match = explicitlyUpdatingSensors
      ? q.match(/co2\s+(?:to\s+)?(\d+)/i) || q.match(/set\s+co2\s+(?:to\s+)?(\d+)/i)
      : null;
    if (co2Match) {
      envUpdates.co2 = Math.min(2400, Math.max(300, parseInt(co2Match[1], 10)));
      envUpdated = true;
    }

    const tempMatch = explicitlyUpdatingSensors
      ? q.match(/temp(?:erature)?\s+(?:to\s+)?(\d+)/i)
      : null;
    if (tempMatch) {
      envUpdates.temperature = Math.min(45, Math.max(10, parseInt(tempMatch[1], 10)));
      envUpdated = true;
    }

    const humMatch = explicitlyUpdatingSensors
      ? q.match(/humidity\s+(?:to\s+)?(\d+)/i)
      : null;
    if (humMatch) {
      envUpdates.humidity = Math.min(100, Math.max(10, parseInt(humMatch[1], 10)));
      envUpdated = true;
    }

    const occMatch = explicitlyUpdatingSensors
      ? q.match(/occupan(?:cy|ts)\s+(?:to\s+)?(\d+)/i)
      : null;
    if (occMatch) {
      envUpdates.occupancy = Math.min(30, Math.max(1, parseInt(occMatch[1], 10)));
      envUpdated = true;
    }

    if (envUpdated && activeRoom) {
      await State.updateDashboardSensors(envUpdates);
      const parts = Object.entries(envUpdates).map(([k, v]) => `${k}: ${v}`).join(', ');
      Utils.showToast(`Backend sensor readings updated and policy applied: ${parts}`, 'info');
      const user = API.getCurrentUser();
      const scope = user && Number.isSafeInteger(user.id)
        ? 'These are account-level backend readings, not room-specific readings.'
        : 'These are shared interactive-demo readings, not room-specific readings.';
      return {
        text: `Updated backend sensor readings: ${parts}. The backend safety policy was applied. ${scope}`,
        actionTag: 'Environment Updated',
        actionDetails: parts
      };
    }

    if (isDirectCommand(q) && (q.includes('fahrenheit') || (q.includes('unit') && q.includes('f')))) {
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

    if (isDirectCommand(q) && (q.includes('celsius') || (q.includes('unit') && q.includes('c')))) {
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

    if (isDirectCommand(q) && (q.includes('enable notification') || q.includes('turn on notification') || q.includes('enable alert'))) {
      const s = API.getSettings();
      s.notificationsEnabled = true;
      API.saveSettings(s);
      Utils.showToast('Notification preference enabled', 'success');
      return {
        text: `Your air-quality notification preference is **Enabled** in this browser. No push notification service is connected.`,
        actionTag: 'Settings Updated',
        actionDetails: `Notifications: ON`
      };
    }

    if (isDirectCommand(q) && (q.includes('disable notification') || q.includes('turn off notification') || q.includes('mute alert'))) {
      const s = API.getSettings();
      s.notificationsEnabled = false;
      API.saveSettings(s);
      Utils.showToast('Notification preference disabled', 'info');
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

    if (q.includes('saved location') || q.includes('my location') || q.includes('where am i')) {
      const user = API.getCurrentUser();
      const setup = Number.isSafeInteger(user?.id) && String(user.id) === this.accountId
        ? API.getCachedAccountSetup()
        : null;
      const location = setup?.location;
      if (!location) {
        return {
          text: 'No location is saved for the active account. Save a location in Setup Mode using Google search, GPS, or manual latitude/longitude before requesting outdoor AQI.'
        };
      }
      const provider = this.getSavedOutdoorAirQuality();
      const aqiSummary = provider
        ? ` The latest saved provider AQI is ${provider.airQuality.aqi} (${provider.airQuality.category || 'category unavailable'}), observed ${new Date(provider.airQuality.lastUpdated).toLocaleString()}.`
        : ' No verified provider AQI is currently saved for this location. Configure GOOGLE_MAPS_AIR_QUALITY_API_KEY on the backend to retrieve one.';
      return {
        text: `Your saved location is **${location.placeName}** (${location.latitude}, ${location.longitude}; ${location.source === 'gps' ? 'GPS-detected' : 'manually entered'}).${aqiSummary}`
      };
    }

    if (
      /\b(?:what does|what do|meaning of|define|how does)\b.*\b(?:aqi|air quality index|aqi categories)\b/.test(q) ||
      /\baqi categories\b.*\bmean\b/.test(q)
    ) {
      return {
        text: '**Air Quality Index (AQI)** summarizes pollutant measurements using a provider-specific scale. Categories and thresholds differ by provider and region; this explanation is educational, not a current reading.'
      };
    }

    if (Number.isSafeInteger(API.getCurrentUser()?.id) && /\b(?:aqi|air quality)\b/.test(q)) {
      const provider = this.getSavedOutdoorAirQuality();
      if (!provider) {
        return {
          text: 'No verified provider AQI is saved for this account location. Save coordinates in Setup Mode using Google search or manual latitude/longitude, then configure GOOGLE_MAPS_AIR_QUALITY_API_KEY on the backend; no demo or other account reading will be substituted.',
          actionTag: 'Data unavailable'
        };
      }
      return {
        text: `The saved provider AQI for **${provider.location.placeName}** is **${provider.airQuality.aqi}** (${provider.airQuality.category || 'category unavailable'}). Source: ${provider.airQuality.source}; observed ${new Date(provider.airQuality.lastUpdated).toLocaleString()}. This is the saved provider reading, not a live hardware measurement.`,
        actionTag: 'Saved provider reading'
      };
    }

    if (q.includes('status') || q.includes('air quality') || q.includes('how is the air') || q.includes('report') || q.includes('summary')) {
      if (activeRoom) {
        const env = activeRoom.environment || {};
        const isDemoAccount = !Number.isSafeInteger(API.getCurrentUser()?.id);
        const outdoorContext = this.getSavedOutdoorAirQuality();
        const outdoorProviderSummary = outdoorContext
          ? `\n\n**Latest saved outdoor AQI provider reading:** ${outdoorContext.airQuality.aqi} (${outdoorContext.airQuality.category || 'category unavailable'}) at ${outdoorContext.location.placeName}. Source: ${outdoorContext.airQuality.source}; observed ${new Date(outdoorContext.airQuality.lastUpdated).toLocaleString()}.`
          : '\n\nNo provider AQI is saved for this account location.';
        if (!isDemoAccount) {
          return {
            text: `Verified provider and hardware data only.${outdoorProviderSummary}\n\nNo verified indoor AQI or CO₂ sensor reading is available for this account. Configure the backend provider and save this account's coordinates to retrieve outdoor AQI.`
          };
        }
        const telemetryTitle = `Simulated demo telemetry for ${activeRoom.name}`;
        const outdoorSensorLabel = 'Simulated demo outdoor AQI';
        if (!hasCompleteChatSensorReadings(env)) {
          return {
            text: `Simulated demo telemetry for ${activeRoom.name} is unavailable. No sensor readings have been configured.${outdoorProviderSummary}`
          };
        }
        const outStat = Utils.getAqiStatus(env.outdoorAQI);
        const inStat = Utils.getAqiStatus(env.indoorAQI);
        const co2Stat = Utils.getCo2Status(env.co2);

        return {
          text: `### ${telemetryTitle}\n\n- **${outdoorSensorLabel}:** ${env.outdoorAQI} (${outStat.label})\n- **Simulated indoor AQI:** ${env.indoorAQI} (${inStat.label})\n- **Simulated CO₂:** ${env.co2} ppm (${co2Stat.label})\n- **Simulated temperature:** ${env.temperature}°C\n- **Simulated humidity:** ${env.humidity}%\n- **Simulated occupancy:** ${env.occupancy} person${env.occupancy > 1 ? 's' : ''}\n- **Operating Mode:** ${activeRoom.mode}${outdoorProviderSummary}`
        };
      }
    }

    if (q.includes('co2') || q.includes('carbon dioxide')) {
      return {
        text: `**Indoor carbon dioxide (CO₂)** is commonly used as an indicator of ventilation and occupancy. It is not a direct measurement of oxygen level or overall air safety. Interpret a reading using the sensor’s calibration and applicable guidance; this educational answer does not provide a current measurement.`
      };
    }

    if (q.includes('aqi') || q.includes('pm2.5') || q.includes('particulate')) {
      return {
        text: `**Air Quality Index (AQI)** is a scale used to summarize pollutant concentrations. Category thresholds vary by provider and regional AQI standard, so use the category and source returned with a saved provider reading. No reading is available from this educational response.`
      };
    }

    return {
      text: `I couldn't match *"${query}"* to a supported assistant action. You can ask about your saved location and available readings, request a safety-validated backend device-state update, run a supported simulation, or navigate to a view. Physical hardware actuation is not confirmed.`
    };
  }
};
