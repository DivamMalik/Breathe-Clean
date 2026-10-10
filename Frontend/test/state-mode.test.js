const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const stateSource = readFileSync(path.join(__dirname, "../js/state.js"), "utf8");
const appSource = readFileSync(path.join(__dirname, "../js/app.js"), "utf8");

function createState(room, api) {
  const context = vm.createContext({ API: api, Engine: {}, console });
  vm.runInContext(stateSource, context);
  const state = vm.runInContext("State", context);
  state.rooms = [room];
  state.activeRoomId = room.id;
  return state;
}

test("mode changes persist before updating active state and remain account-wide", async () => {
  const room = { id: "office", name: "Office", mode: "AUTO", devices: [], activity: [] };
  let persistedMode = "AUTO";
  const notifications = [];
  const api = {
    async setRoomMode(_roomId, mode) {
      persistedMode = mode;
      room.mode = mode;
    },
    getRooms: () => [room],
    logActivity: async () => ({ id: "mode-change" })
  };
  const state = createState(room, api);
  state.notify = (event, payload) => notifications.push({ event, payload });

  await state.setMode(room.id, "MANUAL");
  assert.equal(persistedMode, "MANUAL");
  assert.equal(state.getActiveRoom().mode, "MANUAL");
  assert.equal(notifications.at(-1).event, "mode_changed");
  assert.equal(notifications.at(-1).payload.mode, "MANUAL");
});

test("failed mode persistence leaves the selected mode unchanged", async () => {
  const room = { id: "office", name: "Office", mode: "AUTO", devices: [], activity: [] };
  const state = createState(room, {
    async setRoomMode() {
      throw new Error("save failed");
    },
    getRooms: () => [room],
    logActivity: async () => {}
  });

  await assert.rejects(state.setMode(room.id, "MANUAL"), /save failed/);
  assert.equal(room.mode, "AUTO");
});

test("dashboard mode selection accepts Manual, persists before confirmation, and applies decisions only in Auto", async () => {
  const room = { id: "office", name: "Office", mode: "AUTO" };
  let decisionCalls = 0;
  const messages = [];
  const context = vm.createContext({
    document: {
      addEventListener() {},
      getElementById: () => null
    },
    window: {},
    State: {
      getActiveRoom: () => room,
      async setMode(_roomId, mode) { room.mode = mode; },
      async applyDashboardDecision() { decisionCalls += 1; }
    },
    Utils: { showToast: message => messages.push(message) }
  });
  vm.runInContext(appSource, context);
  const app = vm.runInContext("App", context);
  app.updateDashboardApiStatus = () => {};

  assert.equal(await app.changeDashboardMode("MANUAL"), true);
  assert.equal(room.mode, "MANUAL");
  assert.equal(decisionCalls, 0);
  assert.match(messages.at(-1), /Manual mode saved/);

  assert.equal(await app.changeDashboardMode("AUTO"), true);
  assert.equal(room.mode, "AUTO");
  assert.equal(decisionCalls, 1);
  assert.match(messages.at(-1), /safety-validated decision/);
});

test("manual mode sensor updates never apply automatic device decisions", async () => {
  for (const [mode, expectedDecisionCalls] of [["MANUAL", 0], ["AUTO", 1]]) {
    const room = {
      id: "office",
      name: "Office",
      mode,
      devices: [{ type: "window", state: "Closed" }]
    };
    let decisionCalls = 0;
    const data = {
      sensors: {
        room: "Office",
        outdoorAQI: 40,
        indoorAQI: 35,
        co2: 600,
        temperature: 24,
        humidity: 50,
        occupancy: 1
      },
      devices: { windows: "CLOSED", purifier: "ON", ventilation: "FILTERED", mode: "PURIFICATION" },
      decision: {
        windows: "OPEN",
        purifier: "OFF",
        ventilation: "NORMAL",
        mode: "NORMAL",
        reason: "Safe outdoor air"
      }
    };
    const api = {
      async updateDashboardSensors() {},
      async getDashboardData() { return data; },
      async applyDashboardDecision() { decisionCalls += 1; }
    };
    const state = createState(room, api);
    state.applyDashboardDataFromBackend = () => {};
    state.notify = () => {};

    await state.updateDashboardSensors({ outdoorAQI: 40 });
    assert.equal(decisionCalls, expectedDecisionCalls);
  }
});
