/* Breathe Clean - AI Assistant & Autonomous Control Co-Pilot */

const Chatbot = {
  storageKey: 'breatheclean_chat_history',
  messages: [],
  listeners: [],

  init() {
    const raw = localStorage.getItem(this.storageKey);
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
          text: `Hello! I am your **Breathe Clean Assistant**. I can monitor indoor environmental conditions, explain autonomous decisions, and directly control all functions across your spaces, devices, simulation, and settings.\n\nTry asking me to:\n- *"Turn air purifier to High"*\n- *"Switch Bedroom to Manual mode"*\n- *"Why are the windows closed?"*\n- *"Simulate outdoor smog spike (AQI 180)"*\n- *"Switch to Living Room"*`,
          timestamp: new Date().toISOString(),
          actionTag: null
        }
      ];
      this.save();
    }
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
    localStorage.setItem(this.storageKey, JSON.stringify(this.messages));
    this.notify();
  },

  clearHistory() {
    this.messages = [];
    localStorage.removeItem(this.storageKey);
    this.init();
    this.notify();
  },

  async sendUserPrompt(promptText) {
    if (!promptText || !promptText.trim()) return;

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
    const reply = await this.interpretAndExecute(trimmed);

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

  async interpretAndExecute(query) {
    const q = query.toLowerCase();
    const activeRoom = State.getActiveRoom() || (State.rooms[0] || null);
    const activeRoomName = activeRoom ? activeRoom.name : 'active space';

    // -------------------------------------------------------------
    // 1. SYSTEM MODE CONTROL (AUTO vs MANUAL)
    // -------------------------------------------------------------
    if (q.includes('manual mode') || q.includes('switch to manual') || q.includes('set mode to manual') || q.includes('enable manual') || q.includes('take manual control')) {
      if (activeRoom) {
        await State.setMode(activeRoom.id, 'MANUAL');
        Utils.showToast(`Switched ${activeRoom.name} to MANUAL mode`, 'success');
        return {
          text: `I've switched **${activeRoom.name}** to **MANUAL Mode**. Automatic adjustments are paused. You now have full direct control over smart windows, ventilation, and air purification.`,
          actionTag: 'Mode Changed',
          actionDetails: `Set ${activeRoom.name} to MANUAL`
        };
      }
    }

    if (q.includes('auto mode') || q.includes('switch to auto') || q.includes('set mode to auto') || q.includes('enable auto') || q.includes('automatic mode') || q.includes('resume auto')) {
      if (activeRoom) {
        await State.setMode(activeRoom.id, 'AUTO');
        Utils.showToast(`Resumed AUTO mode in ${activeRoom.name}`, 'success');
        return {
          text: `I've resumed **AUTO Mode** for **${activeRoom.name}**. Breathe Clean is once again autonomously orchestrating devices based on live ambient particulate, CO₂, and outdoor air thresholds.`,
          actionTag: 'Mode Changed',
          actionDetails: `Set ${activeRoom.name} to AUTO`
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
          if (activeRoom.mode === 'AUTO') {
            await State.setMode(activeRoom.id, 'MANUAL');
          }
          await State.setDeviceStateManual(activeRoom.id, winDev.id, 'Open');
          Utils.showToast(`Smart Windows opened in ${activeRoom.name}`, 'success');
          return {
            text: `Opened the **Smart Windows** in **${activeRoom.name}**. Switched to Manual mode to preserve your manual window position.`,
            actionTag: 'Device Actuated',
            actionDetails: `Smart Windows → Open (${activeRoom.name})`
          };
        }
      }
    }

    if (q.includes('close window') || q.includes('close the window') || q.includes('shut window') || q.includes('seal window')) {
      if (activeRoom) {
        const winDev = activeRoom.devices.find(d => d.type === 'window');
        if (winDev) {
          if (activeRoom.mode === 'AUTO') {
            await State.setMode(activeRoom.id, 'MANUAL');
          }
          await State.setDeviceStateManual(activeRoom.id, winDev.id, 'Closed');
          Utils.showToast(`Smart Windows closed in ${activeRoom.name}`, 'info');
          return {
            text: `Closed and sealed the **Smart Windows** in **${activeRoom.name}**. Boundary barrier active against outdoor air.`,
            actionTag: 'Device Actuated',
            actionDetails: `Smart Windows → Closed (${activeRoom.name})`
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

          if (activeRoom.mode === 'AUTO') {
            await State.setMode(activeRoom.id, 'MANUAL');
          }
          await State.setDeviceStateManual(activeRoom.id, purDev.id, targetState);
          Utils.showToast(`Air Purifier set to ${targetState}`, 'success');
          return {
            text: `Air Purifier in **${activeRoom.name}** has been set to **${targetState}**. Switched to Manual mode so the fan speed remains locked to your preference.`,
            actionTag: 'Device Actuated',
            actionDetails: `Air Purifier → ${targetState} (${activeRoom.name})`
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

          if (activeRoom.mode === 'AUTO') {
            await State.setMode(activeRoom.id, 'MANUAL');
          }
          await State.setDeviceStateManual(activeRoom.id, ventDev.id, targetState);
          Utils.showToast(`Ventilation set to ${targetState}`, 'success');
          return {
            text: `Ventilation system in **${activeRoom.name}** modulated to **${targetState}**. Recirculation dampers and fan velocity updated.`,
            actionTag: 'Device Actuated',
            actionDetails: `Ventilation → ${targetState} (${activeRoom.name})`
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
        return {
          text: `Switched active space to **${room.name}** (${room.type}, ${room.area} m²). Current operating mode: **${room.mode}**. Indoor AQI: **${room.environment.indoorAQI}**, CO₂: **${room.environment.co2} ppm**.`,
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
          text: `Created new space **${newSpace.name}** (14.4 m²). Autonomous environmental monitoring and smart device actuators have been calibrated.`,
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
        await State.updateEnvironment(activeRoom.id, {
          outdoorAQI: 175,
          indoorAQI: 55,
          co2: 680
        });
        Utils.showToast('Outdoor Smog scenario triggered (AQI 175)', 'warning');
        return {
          text: `Simulated **Severe Outdoor Smog** scenario for **${activeRoom.name}**.\n- Outdoor AQI: **175** (Poor)\n- Autonomous decision: Smart windows sealed, MERV ventilation filtered, and HEPA purifier boosted to High CADR.`,
          actionTag: 'Simulation Updated',
          actionDetails: `Outdoor AQI → 175 (Smog Trigger)`
        };
      }
    }

    if (q.includes('fresh morning') || q.includes('fresh air') || q.includes('clean outdoor')) {
      if (activeRoom) {
        await State.updateEnvironment(activeRoom.id, {
          outdoorAQI: 24,
          indoorAQI: 28,
          co2: 510,
          temperature: 22
        });
        Utils.showToast('Clean morning scenario applied', 'success');
        return {
          text: `Simulated **Pristine Morning Air** scenario for **${activeRoom.name}**.\n- Outdoor AQI: **24** (Good)\n- Autonomous decision: Natural cross-ventilation activated with open windows, purifier in eco standby.`,
          actionTag: 'Simulation Updated',
          actionDetails: `Outdoor AQI → 24 (Pristine Fresh)`
        };
      }
    }

    if (q.includes('crowded') || q.includes('meeting') || q.includes('high co2') || q.includes('stuffy')) {
      if (activeRoom) {
        await State.updateEnvironment(activeRoom.id, {
          co2: 1420,
          occupancy: 8
        });
        Utils.showToast('Crowded meeting scenario applied', 'info');
        return {
          text: `Simulated **Crowded Gathering** scenario for **${activeRoom.name}**.\n- CO₂: **1,420 ppm** (Elevated), Occupancy: **8 persons**\n- Autonomous decision: Ventilation increased to purge indoor stuffiness and restore oxygenation.`,
          actionTag: 'Simulation Updated',
          actionDetails: `CO₂ → 1,420 ppm (Crowded)`
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
      await State.updateEnvironment(activeRoom.id, envUpdates);
      const parts = Object.entries(envUpdates).map(([k, v]) => `${k}: ${v}`).join(', ');
      Utils.showToast(`Updated environment: ${parts}`, 'info');
      return {
        text: `Updated environmental parameters for **${activeRoom.name}**: ${parts}. The Autonomous Decision Engine has re-evaluated device states.`,
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
        text: `Air quality notifications have been **Disabled**.`,
        actionTag: 'Settings Updated',
        actionDetails: `Notifications: OFF`
      };
    }

    if (q.includes('reset demo') || q.includes('factory reset') || q.includes('reset data')) {
      localStorage.clear();
      sessionStorage.clear();
      State.init();
      this.clearHistory();
      Utils.showToast('Data reset to defaults', 'success');
      return {
        text: `Reset all demo spaces, mock telemetry, and device histories to initial factory defaults.`,
        actionTag: 'Data Reset',
        actionDetails: `Factory Defaults Restored`
      };
    }

    // -------------------------------------------------------------
    // 9. WHY ARE WINDOWS CLOSED / DECISION EXPLANATIONS
    // -------------------------------------------------------------
    if (q.includes('why') && (q.includes('window') || q.includes('decision') || q.includes('purifier') || q.includes('closed') || q.includes('open'))) {
      if (activeRoom) {
        const dec = activeRoom.decision || Engine.decide(activeRoom.environment, activeRoom, activeRoom.devices);
        return {
          text: `### System Decision Explanation for ${activeRoom.name}:\n\n**${dec.title}**\n\n- **Reason:** ${dec.reason}\n- **Device Action:** ${dec.action}\n- **Expected Outcome:** ${dec.expectedOutcome}\n\n*Current Conditions: Outdoor AQI ${activeRoom.environment.outdoorAQI}, Indoor AQI ${activeRoom.environment.indoorAQI}, CO₂ ${activeRoom.environment.co2} ppm.*`
        };
      }
    }

    // -------------------------------------------------------------
    // 10. CURRENT AIR QUALITY STATUS / SUMMARY REPORT
    // -------------------------------------------------------------
    if (q.includes('status') || q.includes('air quality') || q.includes('how is the air') || q.includes('report') || q.includes('summary')) {
      if (activeRoom) {
        const env = activeRoom.environment;
        const outStat = Utils.getAqiStatus(env.outdoorAQI);
        const inStat = Utils.getAqiStatus(env.indoorAQI);
        const co2Stat = Utils.getCo2Status(env.co2);

        return {
          text: `### Environmental Telemetry for ${activeRoom.name}\n\n- **Outdoor AQI:** ${env.outdoorAQI} (${outStat.label})\n- **Indoor AQI:** ${env.indoorAQI} (${inStat.label})\n- **CO₂:** ${env.co2} ppm (${co2Stat.label})\n- **Temperature:** ${env.temperature}°C\n- **Humidity:** ${env.humidity}%\n- **Occupancy:** ${env.occupancy} person${env.occupancy > 1 ? 's' : ''}\n- **Operating Mode:** ${activeRoom.mode}\n\nAll actuators are currently synchronized with the central decision engine.`
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
      text: `I've analyzed your request: *"${query}"*.\n\nYou can prompt me to control any function on Breathe Clean, such as:\n- **Modes:** *"Switch to Manual"* or *"Resume Auto mode"*\n- **Devices:** *"Turn purifier to High"*, *"Open windows"*, *"Filter ventilation"*\n- **Spaces:** *"Switch to Living Room"*, *"Add space Studio"*\n- **Simulation:** *"Simulate outdoor smog (AQI 180)"*, *"Set CO2 to 1200"*\n- **Navigation:** *"Go to Analytics"*, *"Open Simulation"*`
    };
  }
};
