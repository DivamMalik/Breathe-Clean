const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const apiSource = readFileSync(path.join(__dirname, "../js/api.js"), "utf8");

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

function createApi(fetch) {
  const localStorage = createStorage();
  const context = vm.createContext({
    window: {},
    localStorage,
    sessionStorage: createStorage(),
    fetch,
    Utils: { generateId: prefix => `${prefix}-test` },
    console,
    setTimeout
  });
  vm.runInContext(apiSource, context);
  const api = vm.runInContext("API", context);
  api.testLocalStorage = localStorage;
  return api;
}

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    }
  };
}

test("signup uses the mounted auth route, then loads the clean setup using its session", async () => {
  const requests = [];
  const setup = {
    setupCompleted: false,
    rooms: [],
    devices: { window: false, ventilation: false, purifier: false },
    preferences: null,
    location: null,
    outdoorAirQuality: null
  };
  const api = createApi(async (url, options) => {
    requests.push({ url, options });
    if (url.endsWith("/auth/register")) {
      return jsonResponse(201, {
        success: true,
        user: { id: 34, email: "new@example.com", name: "New User" }
      });
    }
    if (url.endsWith("/account/setup")) {
      return jsonResponse(200, {
        success: true,
        hasSetup: true,
        setupComplete: false,
        setup
      });
    }
    throw new Error(`Unexpected URL: ${url}`);
  });

  const user = await api.signup("New User", "new@example.com", "correct horse battery staple");

  assert.deepEqual(
    requests.map(({ url, options }) => ({
      url,
      method: options.method || "GET",
      credentials: options.credentials
    })),
    [
      {
        url: "http://localhost:5001/api/auth/register",
        method: "POST",
        credentials: "include"
      },
      {
        url: "http://localhost:5001/api/account/setup",
        method: "GET",
        credentials: "include"
      }
    ]
  );
  assert.equal(user.id, 34);
  assert.equal(user.isOnboarded, false);
  assert.deepEqual(JSON.parse(JSON.stringify(api.getRooms())), []);
});

test("signup surfaces duplicate-registration errors without attempting login", async () => {
  const requests = [];
  const api = createApi(async (url, options) => {
    requests.push({ url, options });
    return jsonResponse(409, {
      success: false,
      error: "An account with this email already exists"
    });
  });

  await assert.rejects(
    api.signup("Existing User", "existing@example.com", "correct horse battery staple"),
    /An account with this email already exists/
  );
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "http://localhost:5001/api/auth/register");
  assert.equal(requests[0].options.method, "POST");
});

test("signup explains when registration succeeded but setup loading failed", async () => {
  const requests = [];
  const api = createApi(async (url, options) => {
    requests.push({ url, options });
    if (url.endsWith("/auth/register")) {
      return jsonResponse(201, {
        success: true,
        user: { id: 35, email: "partial@example.com", name: "Partial User" }
      });
    }
    return jsonResponse(404, { success: false, error: "Route not found" });
  });

  await assert.rejects(
    api.signup("Partial User", "partial@example.com", "correct horse battery staple"),
    /Your account was created, but setup could not be loaded.*Route not found/
  );
  assert.equal(requests.length, 2);
  assert.equal(requests[1].url, "http://localhost:5001/api/account/setup");
  assert.equal(requests[1].options.method || "GET", "GET");
});

test("account switching clears the prior cache and does not inherit prior rooms", async () => {
  const previousSetup = JSON.stringify({
    id: 1,
    name: "Previous User",
    email: "previous@example.com"
  });
  const api = createApi(async url => {
    if (url.endsWith("/auth/login")) {
      return jsonResponse(200, {
        success: true,
        user: { id: 2, email: "next@example.com", name: "Next User" }
      });
    }
    if (url.endsWith("/account/setup")) {
      return jsonResponse(200, {
        success: true,
        hasSetup: true,
        setupComplete: false,
        setup: {
          setupCompleted: false,
          rooms: [],
          devices: { window: false, ventilation: false, purifier: false },
          preferences: null,
          location: null,
          outdoorAirQuality: null
        }
      });
    }
    throw new Error(`Unexpected URL: ${url}`);
  });
  api.testLocalStorage.setItem("breatheclean_user", previousSetup);
  api.testLocalStorage.setItem("breatheclean_rooms:1", JSON.stringify([{ id: "old-room" }]));
  api.testLocalStorage.setItem("breatheclean_settings:1", JSON.stringify({ tempUnit: "fahrenheit" }));

  const user = await api.login("next@example.com", "correct horse battery staple");

  assert.equal(user.id, 2);
  assert.equal(api.testLocalStorage.getItem("breatheclean_rooms:1"), null);
  assert.equal(api.testLocalStorage.getItem("breatheclean_settings:1"), null);
  assert.deepEqual(JSON.parse(JSON.stringify(api.getRooms())), []);
});

test("new rooms do not invent sensor readings or preselect devices", async () => {
  const api = createApi(async () => {
    throw new Error("No request should be needed to construct a room");
  });
  api.testLocalStorage.setItem("breatheclean_user", JSON.stringify({ id: 7 }));
  const room = await api.createRoom({
    name: "Studio",
    type: "Study",
    length: 4,
    width: 3,
    ceilingHeight: 2.8,
    windowsCount: 1,
    doorsCount: 1,
    typicalOccupants: 1
  });

  assert.deepEqual(JSON.parse(JSON.stringify(room.environment)), {});
  assert.deepEqual(JSON.parse(JSON.stringify(room.devices)), []);
  assert.equal(room.activity[0].detail, "Room details saved to this account.");
});
