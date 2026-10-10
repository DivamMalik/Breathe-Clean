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
      credentials: options.credentials,
      body: options.body ? JSON.parse(options.body) : undefined
    })),
    [
      {
        url: "http://localhost:5001/api/auth/register",
        method: "POST",
        credentials: "include",
        body: {
          name: "New User",
          email: "new@example.com",
          password: "correct horse battery staple"
        }
      },
      {
        url: "http://localhost:5001/api/account/setup",
        method: "GET",
        credentials: "include",
        body: undefined
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

test("signup never retries a registration after connection loss and can recover by signing in", async () => {
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
      throw new TypeError("Failed to fetch");
    }
    if (url.endsWith("/auth/login")) {
      return jsonResponse(200, {
        success: true,
        user: { id: 37, email: "recovered@example.com", name: "Recovered User" }
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

  await assert.rejects(
    api.signup("Recovered User", "recovered@example.com", "correct horse battery staple"),
    error => {
      assert.match(error.message, /Try signing in before attempting registration again/);
      assert.equal(error.accountOutcomeUnknown, true);
      return true;
    }
  );
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "http://localhost:5001/api/auth/register");

  const user = await api.login("recovered@example.com", "correct horse battery staple");

  assert.equal(user.id, 37);
  assert.deepEqual(
    requests.map(({ url, options }) => [url, options.method || "GET"]),
    [
      ["http://localhost:5001/api/auth/register", "POST"],
      ["http://localhost:5001/api/auth/login", "POST"],
      ["http://localhost:5001/api/account/setup", "GET"]
    ]
  );
});

test("manual Indian location search uses the authenticated mounted POST route", async () => {
  const requests = [];
  const api = createApi(async (url, options) => {
    requests.push({ url, options });
    return jsonResponse(200, {
      success: true,
      locations: [{
        placeName: "Pune, Maharashtra, India",
        latitude: 18.5204,
        longitude: 73.8567
      }]
    });

    test("mode saves to the authenticated account setup and restores independently by account", async () => {
      const requests = [];
      const api = createApi(async (url, options) => {
        requests.push({ url, options });
        if (url.endsWith("/account/setup") && options.method === "PUT") {
          return jsonResponse(200, { success: true, setup: JSON.parse(options.body) });
        }
        throw new Error(`Unexpected URL: ${url}`);
      });
      const room = {
        id: "office",
        name: "Office",
        mode: "AUTO",
        devices: [{ type: "window" }]
      };
      const firstSetup = {
        setupCompleted: false,
        controlMode: "AUTO",
        rooms: [room],
        devices: { window: true, ventilation: false, purifier: false },
        preferences: null,
        location: null,
        outdoorAirQuality: null
      };
      api._storeUser({ id: 51 }, true);
      api._setScopedItem("breatheclean_setup", JSON.stringify(firstSetup), "51");
      api._setScopedItem("breatheclean_rooms", JSON.stringify([room]), "51");

      await api.setRoomMode("office", "MANUAL");
      assert.equal(requests.length, 1);
      assert.equal(requests[0].url, "http://localhost:5001/api/account/setup");
      assert.equal(requests[0].options.method, "PUT");
      const saved = JSON.parse(requests[0].options.body);
      assert.equal(saved.controlMode, "MANUAL");
      assert.equal(saved.rooms[0].mode, "MANUAL");

      const secondRoom = { ...room, mode: "AUTO" };
      api._storeUser({ id: 52 }, true);
      api._setScopedItem("breatheclean_rooms", JSON.stringify([secondRoom]), "52");
      assert.equal(api.getRooms()[0].mode, "AUTO");
      api._storeUser({ id: 51 }, true);
      assert.equal(api.getRooms()[0].mode, "MANUAL");
      const restored = await api._hydrateAccount(
        { id: 51 },
        { hasSetup: true, setupComplete: false, setup: saved }
      );
      assert.equal(restored.id, 51);
      assert.equal(api.getRooms()[0].mode, "MANUAL");
    });

    test("failed mode persistence does not visually or locally switch modes", async () => {
      const api = createApi(async () =>
        jsonResponse(503, { success: false, error: "Account setup unavailable" })
      );
      const room = {
        id: "office",
        name: "Office",
        mode: "AUTO",
        devices: [{ type: "window" }]
      };
      api._storeUser({ id: 53 }, true);
      api._setScopedItem("breatheclean_setup", JSON.stringify({
        setupCompleted: false,
        controlMode: "AUTO",
        rooms: [room],
        devices: { window: true, ventilation: false, purifier: false },
        preferences: null,
        location: null,
        outdoorAirQuality: null
      }), "53");
      api._setScopedItem("breatheclean_rooms", JSON.stringify([room]), "53");

      await assert.rejects(api.setRoomMode("office", "MANUAL"), /Account setup unavailable/);
      assert.equal(api.getRooms()[0].mode, "AUTO");
      assert.equal(api.getCachedAccountSetup().controlMode, "AUTO");
    });

    test("analytics requests use the authenticated account route and reject unsupported ranges", async () => {
      const requests = [];
      const api = createApi(async (url, options) => {
        requests.push({ url, options });
        return jsonResponse(200, { success: true, readings: [] });
      });
      await api.getAnalyticsHistory("7D");
      assert.equal(requests[0].url, "http://localhost:5001/api/account/analytics?range=7D");
      assert.equal(requests[0].options.credentials, "include");
      assert.equal(requests[0].options.method, undefined);
      await assert.rejects(api.getAnalyticsHistory("ALL"), /supported analytics time range/);
    });
  });

  const locations = await api.searchIndianLocations("Pune");

  assert.deepEqual(JSON.parse(JSON.stringify(locations)), [{
    placeName: "Pune, Maharashtra, India",
    latitude: 18.5204,
    longitude: 73.8567
  }]);
  assert.equal(requests[0].url, "http://localhost:5001/api/account/location-search");
  assert.equal(requests[0].options.method, "POST");
  assert.equal(requests[0].options.credentials, "include");
  assert.deepEqual(JSON.parse(requests[0].options.body), { query: "Pune" });
});

test("session restoration keeps the account full name while hydrating setup", async () => {
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
    return jsonResponse(200, {
      success: true,
      hasSetup: true,
      setupComplete: false,
      setup
    });
  });
  api.testLocalStorage.setItem("breatheclean_user", JSON.stringify({
    id: 36,
    name: "Restored Account",
    email: "restored@example.com"
  }));

  const user = await api.restoreAccountSetup();

  assert.equal(user.name, "Restored Account");
  assert.equal(user.isOnboarded, false);
  assert.equal(requests[0].url, "http://localhost:5001/api/account/setup");
  assert.equal(requests[0].options.credentials, "include");
  assert.equal(JSON.parse(api.testLocalStorage.getItem("breatheclean_user")).name, "Restored Account");
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
    error => {
      assert.match(error.message, /Your account was created, but setup could not be loaded.*Route not found/);
      assert.equal(error.accountCreated, true);
      return true;
    }
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
