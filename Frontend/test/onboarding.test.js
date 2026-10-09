const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const appSource = readFileSync(path.join(__dirname, "../js/app.js"), "utf8");

function makeElement(properties = {}) {
  return {
    style: {},
    dataset: {},
    listeners: {},
    addEventListener(event, handler) {
      this.listeners[event] = handler;
    },
    click() {
      return this.listeners.click?.({ preventDefault() {}, stopPropagation() {} });
    },
    change() {
      return this.listeners.change?.({ target: this });
    },
    ...properties
  };
}

function createOnboardingHarness(initialRooms = [{
  id: "room-1",
  name: "Bedroom",
  devices: [
    { type: "window" },
    { type: "ventilation" },
    { type: "purifier" }
  ]
}]) {
  let step = 1;
  let elements = {};
  let savedUserUpdates = [];
  let savedSettings = null;
  let savedRooms = null;
  let currentSettings = { tempUnit: "celsius", notificationsEnabled: true };
  const saveOrder = [];
  let nextRoomId = 1;

  const rooms = [...initialRooms];
  const appRoot = makeElement();
  Object.defineProperty(appRoot, "innerHTML", {
    set(value) {
      this.content = value;
      elements = {};
      const add = (id, props) => { elements[id] = makeElement(props); };

      if (step < 5) add("btn-onboarding-continue");
      if (step > 1) add("btn-onboarding-back");
      if (step === 2) add("btn-onboarding-add-room");
      if (step === 5) add("btn-onboarding-finish");
      if ([2, 3, 4, 5].includes(step)) {
        elements["onboarding-error"] = makeElement();
      }
      if (step === 3) {
        elements.deviceInputs = ["window", "ventilation", "purifier"].map(type =>
          makeElement({
            checked: context.App.onboardingDevices[type],
            dataset: { onboardingDevice: type }
          })
        );
      }
      if (step === 4) {
        add("onboarding-notifications", {
          value: context.App.onboardingPreferences?.notificationsEnabled === true
            ? "enabled"
            : context.App.onboardingPreferences?.notificationsEnabled === false
              ? "disabled"
              : ""
        });
        add("onboarding-temp-unit", {
          value: context.App.onboardingPreferences?.tempUnit || ""
        });
        add("btn-onboarding-use-location");
        add("btn-onboarding-save-manual-location");
        add("btn-onboarding-retry-aqi");
        add("onboarding-location-feedback");
        add("onboarding-location-summary");
        add("onboarding-outdoor-aqi");
        add("onboarding-location-search", { value: "" });
        add("btn-onboarding-search-location");
        const resultButton = makeElement({ dataset: { locationIndex: "0" } });
        add("onboarding-location-results", {
          querySelectorAll: () => [resultButton]
        });
        elements.locationResultButton = resultButton;
        add("onboarding-manual-latitude", { value: "" });
        add("onboarding-manual-longitude", { value: "" });
      }
      add("modal-container");
    },
    get() { return this.content; }
  });

  const makeInput = (value, valid = true) => makeElement({
    value,
    checked: typeof value === "boolean" ? value : true,
    valid,
    checkValidity() { return this.valid; },
    reportValidity() { this.reported = true; },
    querySelectorAll: () => []
  });

  const document = {
    addEventListener() {},
    getElementById(id) {
      return id === "app-root" ? appRoot : elements[id] || null;
    },
    querySelectorAll(selector) {
      if (selector === "[data-onboarding-device]") return elements.deviceInputs || [];
      if (selector === ".modal-step-tab") return [];
      return [];
    }
  };

  const context = {
    document,
    console,
    window: { isSecureContext: true },
    navigator: {
      geolocation: {
        getCurrentPosition(success, error) {
          if (geolocationResult?.error) error(geolocationResult.error);
          else success(geolocationResult?.position || {
            coords: { latitude: 37.7749, longitude: -122.4194, accuracy: 12 }
          });
        }
      }
    },
    Utils: {
      icons: { check: "check", arrowRight: "right" },
      generateId: prefix => `${prefix}-new`,
      showToast() {}
    },
    Views: {
      renderOnboarding(renderedStep) {
        step = renderedStep;
        return `setup-${renderedStep}: ${rooms.map(room => room.name).join(", ")}`;
      },
      renderSpaceModal() {
        return "space-modal";
      }
    },
    Chatbot: {
      setAccount() {},
      clearHistory() {}
    },
    API: {
      getRooms: () => rooms,
      getActiveRoomId: () => rooms[0]?.id || null,
      saveRooms(value) {
        savedRooms = value;
        rooms.splice(0, rooms.length, ...value);
        saveOrder.push("rooms");
      },
      getSettings: () => ({ ...currentSettings }),
      getCachedAccountSetup: () => null,
      saveSettings(value) {
        currentSettings = value;
        savedSettings = value;
        saveOrder.push("settings");
      },
      async saveAccountSetup(setup) {
        saveOrder.push(setup.setupCompleted ? "account-complete" : "account-draft");
        return { success: true, setupComplete: setup.setupCompleted, setup };
      },
      async lookupOutdoorAirQuality(latitude, longitude) {
        if (providerError) throw providerError;
        return {
          aqi: 42,
          category: "Good",
          source: "Google Maps Platform Air Quality API (Universal AQI)",
          unit: "AQI index (unitless)",
          lastUpdated: new Date().toISOString(),
          latitude,
          longitude
        };
      },
      async searchIndianLocations() {
        return [{
          placeName: "Bengaluru, Karnataka, India",
          latitude: 12.9716,
          longitude: 77.5946
        }];
      },
      getCurrentUser: () => context.State.user,
      updateUser(updates) {
        savedUserUpdates.push(updates);
        saveOrder.push("user");
        context.State.user = { ...context.State.user, ...updates };
        return context.State.user;
      },
      async createRoom(roomData) {
        const room = { id: `room-${++nextRoomId}`, ...roomData };
        rooms.push(room);
        return room;
      }
    },
    State: {
      user: { id: 1, name: "Test User", email: "test@example.com", isOnboarded: false },
      rooms: [...rooms],
      addRoom: async function addRoom(roomData) {
        const room = await context.API.createRoom(roomData);
        this.rooms = context.API.getRooms();
        context.App.renderOnboardingStep(context.App.onboardingStep);
        return room;
      },
      updateRoom() {}
    }
  };

  const vmContext = vm.createContext(context);
  let geolocationResult = null;
  let providerError = null;
  vm.runInContext(appSource, vmContext);
  context.App = vm.runInContext("App", vmContext);
  context.App.renderCurrentApplicationState = function renderAfterSetup() {
    this.renderedAfterSetup = true;
  };
  context.App.onboardingPreferences = { tempUnit: "celsius", notificationsEnabled: true };
  context.App.onboardingDevices = { window: true, ventilation: true, purifier: true };
  context.App.onboardingLocation = {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: null,
    recordedAt: new Date().toISOString(),
    source: "manual"
  };
  context.App.onboardingUserId = "1";
  context.App.attachOnboardingEvents = context.App.attachOnboardingEvents.bind(context.App);
  context.App.renderOnboardingStep(1);

  return {
    context,
    appRoot,
    rooms,
    elements: () => elements,
    get step() { return context.App.onboardingStep; },
    get savedRooms() { return savedRooms; },
    get savedSettings() { return savedSettings; },
    get savedUserUpdates() { return savedUserUpdates; },
    get saveOrder() { return saveOrder; },
    setGeolocationResult(value) { geolocationResult = value; },
    setProviderError(error) { providerError = error; },
    makeInput
  };
}

test("onboarding navigation advances and returns one step at a time", async () => {
  const setup = createOnboardingHarness();
  await setup.elements()["btn-onboarding-continue"].click();
  assert.equal(setup.step, 2);

  await setup.elements()["btn-onboarding-continue"].click();
  assert.equal(setup.step, 3);

  setup.elements()["btn-onboarding-back"].click();
  assert.equal(setup.step, 2);
  await setup.elements()["btn-onboarding-continue"].click();
  assert.equal(setup.step, 3);
});

test("room step requires at least one room", async () => {
  const setup = createOnboardingHarness([]);
  setup.context.App.renderOnboardingStep(2);
  await setup.elements()["btn-onboarding-continue"].click();

  assert.equal(setup.step, 2);
  assert.equal(
    setup.elements()["onboarding-error"].textContent,
    "Add at least one room before continuing."
  );
});

test("Add another room opens the existing room modal and saves the completed form", async () => {
  const setup = createOnboardingHarness([]);
  const { context } = setup;
  const ids = [
    "room-input-name", "room-input-type", "room-input-occupants",
    "room-input-length", "room-input-width", "room-input-height",
    "room-input-windows", "room-input-doors",
    "device-opt-window", "device-opt-vent", "device-opt-purifier"
  ];
  const inputs = {
    "room-input-name": setup.makeInput("Home office"),
    "room-input-type": setup.makeInput("Study"),
    "room-input-occupants": setup.makeInput("2"),
    "room-input-length": setup.makeInput("4"),
    "room-input-width": setup.makeInput("3"),
    "room-input-height": setup.makeInput("2.8"),
    "room-input-windows": setup.makeInput("1"),
    "room-input-doors": setup.makeInput("1"),
    "device-opt-window": setup.makeInput(true),
    "device-opt-vent": setup.makeInput(false),
    "device-opt-purifier": setup.makeInput(true)
  };
  const form = makeElement({
    dataset: { editId: "" },
    checkValidity: () => true,
    reportValidity() {}
  });
  form.addEventListener = (event, handler) => { form.listeners[event] = handler; };
  const modalButtons = {};
  const modalPanes = {};
  ["btn-step-next-1", "btn-step-next-2", "btn-step-next-3"].forEach(id => {
    modalButtons[id] = makeElement();
  });
  const modalContainer = setup.elements()["modal-container"];
  Object.defineProperty(modalContainer, "innerHTML", { set() {}, get() { return ""; } });
  const originalGetElementById = context.document.getElementById;
  context.document.getElementById = id => {
    if (id === "modal-container") return modalContainer;
    if (id === "form-space-modal") return form;
    if (id === "space-modal-backdrop" || id === "btn-close-space-modal" ||
        id === "btn-cancel-space-modal") return null;
    if (modalButtons[id]) return modalButtons[id];
    if (ids.includes(id)) return inputs[id];
    if (id.startsWith("space-step-pane-")) {
      const paneIds = id.endsWith("-1")
        ? ids.slice(0, 3)
        : id.endsWith("-2") ? ids.slice(3, 8) : [];
      if (!modalPanes[id]) {
        modalPanes[id] = { style: {}, querySelectorAll: () => paneIds.map(inputId => inputs[inputId]) };
      }
      return modalPanes[id];
    }
    return originalGetElementById(id);
  };
  context.document.querySelectorAll = selector => selector === ".modal-step-tab" ? [] : [];

  context.App.renderOnboardingStep(2);
  context.App.attachOnboardingEvents();
  context.App.openSpaceModal = context.App.openSpaceModal.bind(context.App);

  const realOpenSpaceModal = context.App.openSpaceModal;
  context.App.openSpaceModal = function openAndCaptureRoom() {
    realOpenSpaceModal();
  };
  setup.elements()["btn-onboarding-add-room"].click();

  inputs["room-input-name"].valid = false;
  modalButtons["btn-step-next-1"].click();
  assert.equal(inputs["room-input-name"].reported, true);
  assert.equal(modalPanes["space-step-pane-1"].style.display, undefined);
  inputs["room-input-name"].valid = true;
  modalButtons["btn-step-next-1"].click();
  modalButtons["btn-step-next-2"].click();
  modalButtons["btn-step-next-3"].click();

  assert.equal(typeof form.listeners.submit, "function");
  await form.listeners.submit({ preventDefault() {} });
  assert.equal(setup.rooms.length, 1);
  assert.equal(setup.rooms[0].name, "Home office");
  assert.deepEqual(
    JSON.parse(JSON.stringify(setup.rooms[0].deviceOptions)),
    { window: true, ventilation: false, purifier: true }
  );
  assert.match(setup.appRoot.content, /Home office/);
});

test("device choices are validated and preserved when moving between steps", async () => {
  const setup = createOnboardingHarness();
  setup.context.App.renderOnboardingStep(3);
  setup.elements().deviceInputs.forEach(input => {
    input.checked = false;
    input.change();
  });
  await setup.elements()["btn-onboarding-continue"].click();
  assert.equal(setup.step, 3);

  setup.elements().deviceInputs[1].checked = true;
  setup.elements().deviceInputs[1].change();
  await setup.elements()["btn-onboarding-continue"].click();
  assert.equal(setup.step, 4);
  setup.elements()["btn-onboarding-back"].click();
  assert.equal(setup.elements().deviceInputs[1].checked, true);
});

test("preference selections survive moving backward and forward", async () => {
  const setup = createOnboardingHarness();
  setup.context.App.renderOnboardingStep(4);
  setup.elements()["onboarding-notifications"].value = "disabled";
  setup.elements()["onboarding-notifications"].change();
  setup.elements()["onboarding-temp-unit"].value = "invalid";
  setup.elements()["onboarding-temp-unit"].change();
  await setup.elements()["btn-onboarding-continue"].click();
  assert.equal(setup.step, 4);

  setup.elements()["onboarding-temp-unit"].value = "fahrenheit";
  setup.elements()["onboarding-temp-unit"].change();

  await setup.elements()["btn-onboarding-continue"].click();
  assert.equal(setup.step, 5);
  setup.elements()["btn-onboarding-back"].click();

  assert.equal(setup.step, 4);
  assert.equal(setup.elements()["onboarding-notifications"].value, "disabled");
  assert.equal(setup.elements()["onboarding-temp-unit"].value, "fahrenheit");
});

test("new account must explicitly select both preferences", async () => {
  const setup = createOnboardingHarness();
  setup.context.App.onboardingPreferences = null;
  setup.context.App.renderOnboardingStep(4);

  await setup.elements()["btn-onboarding-continue"].click();

  assert.equal(setup.step, 4);
  assert.match(
    setup.elements()["onboarding-error"].textContent,
    /valid notification and temperature preferences/
  );
});

test("finishing setup saves rooms and preferences before marking the user onboarded", async () => {
  const setup = createOnboardingHarness();
  setup.context.App.onboardingDevices = { window: false, ventilation: false, purifier: true };
  setup.context.App.renderOnboardingStep(5);
  await setup.elements()["btn-onboarding-finish"].click();

  assert.equal(setup.savedRooms.length, 1);
  assert.deepEqual(
    JSON.parse(JSON.stringify(setup.savedSettings.setupDevices)),
    { window: false, ventilation: false, purifier: true }
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(setup.savedRooms[0].devices)),
    [{ type: "purifier" }]
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(setup.savedUserUpdates)),
    [{ isOnboarded: true }]
  );
  assert.equal(setup.context.State.user.isOnboarded, true);
  assert.equal(setup.context.App.renderedAfterSetup, true);
  assert.deepEqual(
    JSON.parse(JSON.stringify(setup.saveOrder)),
    ["rooms", "settings", "account-complete", "user"]
  );
});

test("failed backend setup save does not mark the user onboarded", async () => {
  const setup = createOnboardingHarness();
  setup.context.API.saveAccountSetup = async () => {
    throw new Error("storage unavailable");
  };
  setup.context.App.renderOnboardingStep(5);
  await setup.elements()["btn-onboarding-finish"].click();

  assert.deepEqual(JSON.parse(JSON.stringify(setup.savedUserUpdates)), []);
  assert.equal(setup.context.State.user.isOnboarded, false);
  assert.match(setup.elements()["onboarding-error"].textContent, /storage unavailable/);
});

test("GPS location is captured only after explicit request and outdoor AQI is labelled", async () => {
  const setup = createOnboardingHarness();
  const { App } = setup.context;
  App.onboardingLocation = null;
  App.onboardingOutdoorAirQuality = null;
  App.renderOnboardingStep(4);
  App.attachOnboardingEvents();

  assert.equal(typeof setup.elements()["btn-onboarding-use-location"].listeners.click, "function");
  const saved = await setup.elements()["btn-onboarding-use-location"].click();

  assert.equal(saved, true);
  assert.equal(App.onboardingLocation.source, "gps");
  assert.equal(App.onboardingLocation.accuracy, 12);
  assert.equal(App.onboardingOutdoorAirQuality.aqi, 42);
  assert.match(setup.elements()["onboarding-location-summary"].textContent, /GPS-detected/);
  assert.match(setup.elements()["onboarding-outdoor-aqi"].textContent, /Outdoor AQI: 42/);
  assert.match(setup.elements()["onboarding-outdoor-aqi"].textContent, /AQI index \(unitless\)/);
});

test("denied browser location permission gives a retry and manual-entry message", async () => {
  const setup = createOnboardingHarness();
  const { App } = setup.context;
  App.onboardingLocation = null;
  setup.setGeolocationResult({ error: { code: 1 } });
  App.renderOnboardingStep(4);
  App.attachOnboardingEvents();

  const saved = await setup.elements()["btn-onboarding-use-location"].click();

  assert.equal(saved, false);
  assert.equal(App.onboardingLocation, null);
  assert.match(
    setup.elements()["onboarding-location-feedback"].textContent,
    /permission was denied.*manually/i
  );
});

test("provider failure never invents outdoor AQI and leaves a retry available", async () => {
  const setup = createOnboardingHarness();
  const { App } = setup.context;
  App.onboardingLocation = null;
  setup.setProviderError(new Error("provider unavailable"));
  App.renderOnboardingStep(4);
  App.attachOnboardingEvents();

  await setup.elements()["btn-onboarding-use-location"].click();

  assert.equal(App.onboardingLocation.source, "gps");
  assert.equal(App.onboardingOutdoorAirQuality, null);
  assert.match(setup.elements()["onboarding-outdoor-aqi"].textContent, /Outdoor AQI unavailable/);
  assert.match(setup.elements()["onboarding-location-feedback"].textContent, /retry/i);
  assert.equal(setup.elements()["btn-onboarding-retry-aqi"].disabled, false);
});

test("manual coordinates are range-checked and never labelled as GPS", async () => {
  const setup = createOnboardingHarness();
  const { App } = setup.context;
  App.onboardingLocation = null;
  App.renderOnboardingStep(4);
  App.attachOnboardingEvents();
  setup.elements()["onboarding-manual-latitude"].value = "37.7749";
  setup.elements()["onboarding-manual-longitude"].value = "-122.4194";

  await setup.elements()["btn-onboarding-save-manual-location"].click();

  assert.equal(App.onboardingLocation.source, "manual");
  assert.equal(App.onboardingLocation.accuracy, null);
  assert.match(setup.elements()["onboarding-location-summary"].textContent, /Manually entered/);
  assert.doesNotMatch(setup.elements()["onboarding-location-summary"].textContent, /GPS-detected/);
});

test("Indian location search selection is saved as a manual location", async () => {
  const setup = createOnboardingHarness();
  const { App } = setup.context;
  App.onboardingLocation = null;
  App.renderOnboardingStep(4);
  App.attachOnboardingEvents();
  setup.elements()["onboarding-location-search"].value = "Bengaluru";

  await setup.elements()["btn-onboarding-search-location"].click();
  assert.equal(App.onboardingLocationSearchResults.length, 1);
  await App.selectOnboardingLocation(App.onboardingLocationSearchResults[0]);

  assert.equal(App.onboardingLocation.source, "manual");
  assert.equal(App.onboardingLocation.placeName, "Bengaluru, Karnataka, India");
  assert.equal(App.onboardingLocation.latitude, 12.9716);
  assert.match(setup.elements()["onboarding-location-summary"].textContent, /Manually entered/);
});

test("setup cannot complete without a saved location", async () => {
  const setup = createOnboardingHarness();
  setup.context.App.onboardingLocation = null;
  setup.context.App.renderOnboardingStep(5);

  await setup.elements()["btn-onboarding-finish"].click();

  assert.deepEqual(JSON.parse(JSON.stringify(setup.savedUserUpdates)), []);
  assert.equal(setup.context.State.user.isOnboarded, false);
  assert.match(setup.elements()["onboarding-error"].textContent, /location/i);
});

test("switching accounts replaces in-memory rooms with the new account's rooms", () => {
  const setup = createOnboardingHarness();
  setup.rooms.splice(0, setup.rooms.length);

  setup.context.App.setAuthenticatedUser({
    id: 2,
    name: "Second User",
    email: "second@example.com",
    isOnboarded: false
  });

  assert.deepEqual(JSON.parse(JSON.stringify(setup.context.State.rooms)), []);
  assert.equal(setup.context.State.activeRoomId, null);
});
