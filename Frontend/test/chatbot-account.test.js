const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const chatbotSource = readFileSync(path.join(__dirname, "../js/chatbot.js"), "utf8");
const viewsSource = readFileSync(path.join(__dirname, "../js/views.js"), "utf8");
const appSource = readFileSync(path.join(__dirname, "../js/app.js"), "utf8");

function createStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

test("assistant history stays scoped to each account and returns with that account", () => {
  const localStorage = createStorage();
  const context = vm.createContext({
    localStorage,
    API: {
      getCurrentUser: () => ({ id: 1 }),
      getCachedAccountSetup: () => null
    },
    Utils: { generateId: prefix => `${prefix}-test` },
    State: { getActiveRoom: () => null, rooms: [] },
    window: { location: { hash: "" } }
  });
  vm.runInContext(chatbotSource, context);
  const chatbot = vm.runInContext("Chatbot", context);
  chatbot.init();
  chatbot.messages.push({ sender: "user", text: "private account detail" });
  chatbot.save();

  assert.ok(localStorage.getItem("breatheclean_chat_history:1"));
  assert.equal(localStorage.getItem("breatheclean_chat_history"), null);

  chatbot.setAccount(2);
  assert.ok(localStorage.getItem("breatheclean_chat_history:1"));
  assert.equal(chatbot.messages.some(message => message.text === "private account detail"), false);
  chatbot.setAccount(1);
  assert.equal(chatbot.messages.some(message => message.text === "private account detail"), true);
  chatbot.setAccount(null);
  assert.equal(chatbot.messages.some(message => message.text === "private account detail"), false);
  assert.ok(localStorage.getItem("breatheclean_chat_history:1"));
});

test("chat accepts a prompt, records the response, and reports backend failures honestly", async () => {
  const localStorage = createStorage();
  const room = {
    id: "room-1",
    name: "Office",
    devices: [{ id: "window-1", type: "window" }],
    environment: {}
  };
  const context = vm.createContext({
    localStorage,
    API: {
      getCurrentUser: () => ({ id: 8, name: "Test Account" }),
      getCachedAccountSetup: () => null
    },
    Utils: { generateId: prefix => `${prefix}-${Math.random()}` },
    State: {
      getActiveRoom: () => room,
      rooms: [room],
      setDeviceStateManual: async () => {
        throw new Error("Backend unavailable");
      }
    },
    window: { location: { hash: "" } },
    console
  });
  vm.runInContext(chatbotSource, context);
  const chatbot = vm.runInContext("Chatbot", context);
  chatbot.setAccount(8);

  const response = await chatbot.sendUserPrompt("Open the windows");

  assert.equal(chatbot.messages.length, 3);
  assert.equal(chatbot.messages[1].sender, "user");
  assert.match(response.text, /couldn't complete that request.*Backend unavailable/i);
  assert.equal(response.actionTag, "Request failed");
  assert.doesNotMatch(response.text, /opened|actuated|confirmed/i);
});

test("successful device controls report backend state without claiming hardware actuation", async () => {
  const localStorage = createStorage();
  const room = {
    id: "room-1",
    name: "Office",
    devices: [{ id: "window-1", type: "window" }],
    environment: {}
  };
  const context = vm.createContext({
    localStorage,
    API: {
      getCurrentUser: () => ({ id: 10, name: "Test Account" }),
      getCachedAccountSetup: () => null
    },
    Utils: {
      generateId: prefix => `${prefix}-test`,
      showToast: () => {}
    },
    State: {
      getActiveRoom: () => room,
      rooms: [room],
      setDeviceStateManual: async () => ({
        success: true,
        deviceState: { windows: "CLOSED" }
      })
    },
    window: { location: { hash: "" } }
  });
  vm.runInContext(chatbotSource, context);
  const chatbot = vm.runInContext("Chatbot", context);
  chatbot.setAccount(10);

  const response = await chatbot.sendUserPrompt("Close the windows");

  assert.equal(response.actionTag, "Backend State Confirmed");
  assert.match(response.text, /backend confirmed.*CLOSED/i);
  assert.match(response.text, /physical hardware actuation is not connected or confirmed/i);
  assert.doesNotMatch(response.text, /closed and sealed|actuated/i);
});

test("assistant air-quality context uses only this account's saved location and matching AQI", async () => {
  const localStorage = createStorage();
  const setup = {
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      placeName: "Bengaluru, Karnataka, India",
      source: "manual"
    },
    outdoorAirQuality: {
      latitude: 12.9716,
      longitude: 77.5946,
      aqi: 47,
      category: "Good",
      source: "Google Maps Platform Air Quality API (Universal AQI)",
      lastUpdated: "2026-10-09T10:00:00.000Z"
    }
  };
  const room = {
    name: "Office",
    mode: "AUTO",
    environment: {
      indoorAQI: 35,
      outdoorAQI: 52,
      co2: 600,
      temperature: 24,
      humidity: 50,
      occupancy: 1
    }
  };
  const context = vm.createContext({
    localStorage,
    API: {
      getCurrentUser: () => ({ id: currentUserId }),
      getCachedAccountSetup: () => setup
    },
    Utils: {
      generateId: prefix => `${prefix}-test`,
      getAqiStatus: value => ({ label: value < 50 ? "Good" : "Moderate" }),
      getCo2Status: () => ({ label: "Normal" })
    },
    State: { getActiveRoom: () => room, rooms: [room] },
    window: { location: { hash: "" } }
  });
  vm.runInContext(chatbotSource, context);
  const chatbot = vm.runInContext("Chatbot", context);
  let currentUserId = 9;
  chatbot.setAccount(9);

  const reply = await chatbot.interpretAndExecute("air quality status");

  assert.match(reply.text, /is \*\*47\*\* \(Good\)/);
  assert.match(reply.text, /Bengaluru, Karnataka, India/);
  assert.doesNotMatch(reply.text, /52|Indoor AQI:\*\* 35|CO₂:\*\* 600/);

  currentUserId = 10;
  const otherAccountReply = await chatbot.interpretAndExecute("outdoor AQI");
  assert.match(otherAccountReply.text, /No verified provider AQI is saved/);
  assert.doesNotMatch(otherAccountReply.text, /47|Bengaluru/);

  currentUserId = 9;
  setup.outdoorAirQuality.latitude = 28.6139;
  const withoutMatchingLocation = chatbot.getSavedOutdoorAirQuality();
  assert.equal(withoutMatchingLocation, null);
});

test("assistant greets naturally and reports AQI questions from the saved provider only", async () => {
  const setup = {
    location: null,
    outdoorAirQuality: null
  };
  const context = vm.createContext({
    localStorage: createStorage(),
    API: {
      getCurrentUser: () => ({ id: 21 }),
      getCachedAccountSetup: () => setup
    },
    Utils: { generateId: prefix => `${prefix}-test` },
    State: { getActiveRoom: () => null, rooms: [] },
    window: { location: { hash: "" } }
  });
  vm.runInContext(chatbotSource, context);
  const chatbot = vm.runInContext("Chatbot", context);
  chatbot.setAccount(21);

  const greeting = await chatbot.interpretAndExecute("hello");
  assert.match(greeting.text, /Hello!/);
  assert.doesNotMatch(greeting.text, /unsupported action|couldn't match/i);

  const unavailable = await chatbot.interpretAndExecute("what is the AQI?");
  assert.match(unavailable.text, /No verified provider AQI is saved/);
  assert.match(unavailable.text, /manual latitude\/longitude/i);
  assert.doesNotMatch(unavailable.text, /simulated|demo AQI/i);
});

test("assistant explains a decision before considering window-control commands", async () => {
  const room = {
    id: "room-1",
    name: "Office",
    devices: [{ id: "window-1", type: "window" }],
    environment: {
      indoorAQI: 35,
      outdoorAQI: 52,
      co2: 600,
      temperature: 24,
      humidity: 50,
      occupancy: 1
    },
    decision: {
      title: "Windows remain closed",
      reason: "Outdoor AQI exceeds the configured threshold",
      action: "Keep windows closed",
      expectedOutcome: "Reduce exposure"
    }
  };
  let controlCalls = 0;
  const context = vm.createContext({
    localStorage: createStorage(),
    API: {
      getCurrentUser: () => ({ id: 11 }),
      getCachedAccountSetup: () => null
    },
    Utils: { generateId: prefix => `${prefix}-test` },
    State: {
      getActiveRoom: () => room,
      rooms: [room],
      async setDeviceStateManual() {
        controlCalls += 1;
        throw new Error("A why-question must not submit a control");
      }
    },
    window: { location: { hash: "" } }
  });
  vm.runInContext(chatbotSource, context);
  const chatbot = vm.runInContext("Chatbot", context);
  chatbot.setAccount(11);

  const reply = await chatbot.interpretAndExecute("Why did you open the windows?");

  assert.match(reply.text, /System Decision Explanation/);
  assert.match(reply.text, /Outdoor AQI exceeds the configured threshold/);
  assert.equal(controlCalls, 0);
});

test("assistant does not change a device state for an informational device question", async () => {
  const room = {
    id: "room-1",
    name: "Office",
    devices: [{ id: "purifier-1", type: "purifier" }],
    environment: {}
  };
  let controlCalls = 0;
  const context = vm.createContext({
    localStorage: createStorage(),
    API: {
      getCurrentUser: () => ({ id: 12 }),
      getCachedAccountSetup: () => null
    },
    Utils: { generateId: prefix => `${prefix}-test` },
    State: {
      getActiveRoom: () => room,
      rooms: [room],
      async setDeviceStateManual() {
        controlCalls += 1;
        return { success: true, deviceState: { purifier: "ON" } };
      }
    },
    window: { location: { hash: "" } }
  });
  vm.runInContext(chatbotSource, context);
  const chatbot = vm.runInContext("Chatbot", context);
  chatbot.setAccount(12);

  const reply = await chatbot.interpretAndExecute("What is the purifier status?");

  assert.equal(controlCalls, 0);
  assert.match(reply.text, /did not change any device state/i);
  assert.doesNotMatch(reply.text, /confirmed|is on/i);
});

test("assistant describes its deterministic implementation and avoids invented AQI thresholds", async () => {
  const context = vm.createContext({
    localStorage: createStorage(),
    API: {
      getCurrentUser: () => ({ id: 13 }),
      getCachedAccountSetup: () => null
    },
    Utils: { generateId: prefix => `${prefix}-test` },
    State: { getActiveRoom: () => null, rooms: [] },
    window: { location: { hash: "" } }
  });
  vm.runInContext(chatbotSource, context);
  const chatbot = vm.runInContext("Chatbot", context);
  chatbot.setAccount(13);

  assert.match(chatbot.messages[0].text, /rule-based intent handling/i);
  assert.match(chatbot.messages[0].text, /no LLM, Ollama, or n8n service is connected/i);
  const reply = await chatbot.interpretAndExecute("What do AQI categories mean?");
  assert.match(reply.text, /thresholds differ by provider and region/i);
  assert.doesNotMatch(reply.text, /0–50|51–100|101–150|hazardous/i);
});

test("assistant labels canned demo telemetry as simulated rather than live sensor data", async () => {
  const room = {
    name: "Demo Office",
    mode: "AUTO",
    environment: {
      indoorAQI: 35,
      outdoorAQI: 52,
      co2: 600,
      temperature: 24,
      humidity: 50,
      occupancy: 1
    }
  };
  const context = vm.createContext({
    localStorage: createStorage(),
    API: {
      getCurrentUser: () => ({ id: "usr_divam_01" }),
      getCachedAccountSetup: () => null
    },
    Utils: {
      generateId: prefix => `${prefix}-test`,
      getAqiStatus: value => ({ label: value < 50 ? "Good" : "Moderate" }),
      getCo2Status: () => ({ label: "Normal" })
    },
    State: { getActiveRoom: () => room, rooms: [room] },
    window: { location: { hash: "" } }
  });
  vm.runInContext(chatbotSource, context);
  const chatbot = vm.runInContext("Chatbot", context);
  chatbot.setAccount("usr_divam_01");

  const reply = await chatbot.interpretAndExecute("air quality status");

  assert.match(reply.text, /Simulated demo telemetry for Demo Office/);
  assert.match(reply.text, /Simulated demo outdoor AQI:\*\* 52/);
  assert.doesNotMatch(reply.text, /Outdoor sensor AQI:\*\*/);
});

test("assistant workspace and floating chat retain their composer and message containers", () => {
  const context = vm.createContext({
    Utils: {
      icons: { sparkles: "*", trash: "x", send: ">" },
      escapeHtml: value => String(value),
      formatTime: () => "now"
    },
    Chatbot: {
      messages: [
        { sender: "bot", text: "Ready", timestamp: new Date().toISOString() },
        {
          sender: "bot",
          text: "The backend is unavailable.",
          actionTag: "Request failed",
          actionDetails: "Backend unavailable",
          timestamp: new Date().toISOString()
        }
      ]
    },
    State: { user: { name: "Test Account" } }
  });
  vm.runInContext(viewsSource, context);
  const views = vm.runInContext("Views", context);

  const workspace = views.renderAssistant({ name: "Office", mode: "AUTO" });
  const floating = views.renderFloatingAssistantWidget();

  assert.match(workspace, /id="assistant-composer-form"/);
  assert.match(workspace, /id="assistant-chat-container"/);
  assert.match(workspace, /id="assistant-prompt-input"/);
  assert.match(workspace, /Rule-based assistant; no LLM, Ollama, or n8n service is connected/);
  assert.match(workspace, /Ready/);
  assert.match(workspace, /The backend is unavailable/);
  assert.match(workspace, /chat-action-badge action-failed/);
  assert.match(workspace, />!<\/span>/);
  assert.match(floating, /id="btn-floating-assistant"/);
  assert.match(floating, /id="floating-drawer-form"/);
  assert.match(floating, /id="floating-prompt-input"/);
});

test("floating chat opens and submits messages through the existing handlers", async () => {
  const elements = new Map();
  const makeElement = id => {
    const listeners = new Map();
    const classes = new Set();
    const element = {
      id,
      value: "",
      listeners,
      focused: false,
      classList: {
        toggle(name) {
          if (classes.has(name)) classes.delete(name);
          else classes.add(name);
        },
        contains: name => classes.has(name),
        remove: name => classes.delete(name)
      },
      addEventListener: (name, handler) => listeners.set(name, handler),
      focus: () => { element.focused = true; }
    };
    elements.set(id, element);
    return element;
  };
  const toggle = makeElement("btn-floating-assistant");
  const drawer = makeElement("floating-chat-drawer");
  const input = makeElement("floating-prompt-input");
  const form = makeElement("floating-drawer-form");
  const sentPrompts = [];
  let refreshCount = 0;
  const context = vm.createContext({
    document: {
      addEventListener: () => {},
      getElementById: id => elements.get(id) || null,
      querySelectorAll: () => []
    },
    window: { location: { hash: "" } },
    State: { activeView: "dashboard" },
    Chatbot: { sendUserPrompt: async prompt => sentPrompts.push(prompt) }
  });
  vm.runInContext(appSource, context);
  const app = vm.runInContext("App", context);
  app.refreshFloatingDrawerMessages = () => { refreshCount += 1; };

  app.attachFloatingAssistantEvents();
  toggle.listeners.get("click")();
  assert.equal(drawer.classList.contains("open"), true);
  assert.equal(input.focused, true);

  input.value = "Check the air quality";
  await form.listeners.get("submit")({ preventDefault() {} });
  assert.deepEqual(sentPrompts, ["Check the air quality"]);
  assert.equal(input.value, "");
  assert.equal(refreshCount, 2);
});
