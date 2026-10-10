const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawn } = require("node:child_process");
const { after, afterEach, beforeEach, test } = require("node:test");
const express = require("express");
const { createServer } = require("node:http");

const testDatabaseDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "breathe-clean-test-"));
process.env.BREATHE_CLEAN_DB_PATH = path.join(testDatabaseDirectory, "nested", "test.sqlite");
process.env.SESSION_SECRET = "test-session-secret-with-more-than-32-bytes";
process.env.NODE_ENV = "test";

const {
  database,
  databasePath,
  getUserByEmail,
  saveAppliedDecision,
  saveSensorReading,
  saveUserProviderAqiHistory
} = require("../src/data/database");
const { restorePersistedState } = require("../src/data/restorePersistedState");
const {
  allowedValues,
  getDeviceState,
  updateDeviceState
} = require("../src/data/deviceState");
const {
  getSensorData,
  updateSensorData,
  validateCompleteSensorData
} = require("../src/data/sensorData");
const sensorRoutes = require("../src/routes/sensorRoutes");
const decisionRoutes = require("../src/routes/decisionRoutes");
const deviceRoutes = require("../src/routes/deviceRoutes");
const simulationRoutes = require("../src/routes/simulationRoutes");
const authRoutes = require("../src/routes/authRoutes");
const accountRoutes = require("../src/routes/accountRoutes");
const { createSessionMiddleware } = require("../src/auth/sessionMiddleware");
const { requireAuthenticatedUser } = require("../src/auth/authMiddleware");
const { generateDecision } = require("../src/services/decisionEngine");
const { thresholds } = require("../src/services/environmentRules");
const { validateDecision } = require("../src/services/safetyValidator");

const initialSensorData = {
  room: "Classroom 301",
  indoorAQI: 72,
  outdoorAQI: 180,
  co2: 1100,
  temperature: 27,
  humidity: 58,
  occupancy: 32
};

const initialDeviceState = {
  windows: "CLOSED",
  purifier: "ON",
  ventilation: "FILTERED",
  mode: "PURIFICATION"
};

function clearDatabase() {
  database.exec(`
    DELETE FROM applied_device_states;
    DELETE FROM decision_history;
    DELETE FROM sensor_readings;
    DELETE FROM password_reset_tokens;
    DELETE FROM user_sessions;
    DELETE FROM user_aqi_history;
    DELETE FROM user_provider_aqi_history;
    DELETE FROM user_environment_state;
    DELETE FROM user_setups;
    DELETE FROM users;
  `);
}

const scenarios = [
  {
    name: "clean-air",
    sensors: { outdoorAQI: 40, indoorAQI: 45, co2: 600 },
    expected: {
      windows: "OPEN",
      purifier: "OFF",
      ventilation: "NORMAL",
      mode: "NORMAL"
    }
  },
  {
    name: "pollution",
    sensors: { outdoorAQI: 250, indoorAQI: 50, co2: 650 },
    expected: {
      windows: "CLOSED",
      purifier: "ON",
      ventilation: "FILTERED",
      mode: "PURIFICATION"
    }
  },
  {
    name: "high-co2",
    sensors: { outdoorAQI: 45, indoorAQI: 55, co2: 1600 },
    expected: {
      windows: "OPEN",
      purifier: "OFF",
      ventilation: "HIGH",
      mode: "VENTILATION"
    }
  },
  {
    name: "bad-air",
    sensors: { outdoorAQI: 280, indoorAQI: 180, co2: 1200 },
    expected: {
      windows: "CLOSED",
      purifier: "ON",
      ventilation: "FILTERED",
      mode: "PURIFICATION"
    }
  }
];

let server;
let baseUrl;
let loseRegistrationResponse;

function restoreState() {
  clearDatabase();
  const sensorResult = updateSensorData(initialSensorData);
  const deviceResult = updateDeviceState(initialDeviceState);
  assert.equal(sensorResult.error, undefined);
  assert.equal(deviceResult.error, undefined);
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  return {
    status: response.status,
    body: await response.json(),
    headers: response.headers
  };
}

async function registerAndLogin(email) {
  const password = "correct horse battery staple";
  const registration = await requestJson("/auth/register", {
    method: "POST",
    body: { email, password }
  });
  assert.equal(registration.status, 201);
  const login = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  assert.equal(login.status, 200);
  return {
    userId: registration.body.user.id,
    cookie: login.headers.get("set-cookie").split(";", 1)[0]
  };
}

beforeEach(async () => {
  loseRegistrationResponse = false;
  restoreState();
  const app = express();
  app.use(express.json());
  app.use(createSessionMiddleware());
  app.use((request, response, next) => {
    if (
      loseRegistrationResponse &&
      request.method === "POST" &&
      request.path === "/api/auth/register"
    ) {
      loseRegistrationResponse = false;
      const endResponse = response.end.bind(response);
      response.end = (...args) => {
        if (response.statusCode === 201) {
          response.destroy();
          return response;
        }
        return endResponse(...args);
      };
    }
    next();
  });
  app.use("/api/auth", authRoutes);
  app.use("/api/account", accountRoutes);
  app.get("/api/test/private", requireAuthenticatedUser, (request, response) => {
    response.json({ success: true, user: request.user });
  });
  app.use("/api/sensors", sensorRoutes);
  app.use("/api/decision", decisionRoutes);
  app.use("/api/devices", deviceRoutes);
  app.use("/api/simulation", simulationRoutes);
  server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

afterEach(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  restoreState();
});

after(() => {
  if (database.open) {
    database.close();
  }
  fs.rmSync(testDatabaseDirectory, { recursive: true, force: true });
});

test("database is initialized at the configured path with all persistence tables", () => {
  assert.equal(
    databasePath,
    path.join(testDatabaseDirectory, "nested", "test.sqlite")
  );
  assert.equal(fs.existsSync(path.dirname(databasePath)), true);
  assert.equal(fs.existsSync(databasePath), true);
  const tables = database.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name IN (
      'sensor_readings', 'applied_device_states', 'decision_history',
      'users', 'user_sessions', 'password_reset_tokens', 'user_setups',
      'user_environment_state', 'user_aqi_history'
    )
    ORDER BY name
  `).all().map((row) => row.name);
  assert.deepEqual(tables, [
    "applied_device_states",
    "decision_history",
    "password_reset_tokens",
    "sensor_readings",
    "user_aqi_history",
    "user_environment_state",
    "user_sessions",
    "user_setups",
    "users"
  ]);
});

test("registration stores a normalized email and password hash, not the password", async () => {
  const password = "correct horse battery staple";
  const response = await requestJson("/auth/register", {
    method: "POST",
    body: { email: "  Person@Example.COM ", password }
  });

  assert.equal(response.status, 201);
  assert.deepEqual(response.body, {
    success: true,
    user: { id: 1, email: "person@example.com", name: null }
  });
  assert.match(response.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(response.headers.get("set-cookie"), /SameSite=Lax/i);
  assert.equal(JSON.stringify(response.body).includes(password), false);
  const savedUser = getUserByEmail("person@example.com");
  assert.equal(savedUser.email, "person@example.com");
  assert.notEqual(savedUser.password_hash, password);
  assert.match(savedUser.password_hash, /^\$2[aby]\$/);
  assert.ok(savedUser.createdAt);
});

test("new accounts receive a clean, incomplete setup record", async () => {
  const registration = await requestJson("/auth/register", {
    method: "POST",
    body: { email: "clean-setup@example.com", password: "correct horse battery staple" }
  });
  assert.equal(registration.status, 201);

  const setup = database.prepare(
    "SELECT setup_json FROM user_setups WHERE user_id = ?"
  ).get(registration.body.user.id);
  assert.deepEqual(JSON.parse(setup.setup_json), {
    setupCompleted: false,
    rooms: [],
    devices: { window: false, ventilation: false, purifier: false },
    preferences: null,
    location: null,
    outdoorAirQuality: null
  });
  const environment = database.prepare(
    "SELECT sensor_json, device_json, decision_json FROM user_environment_state WHERE user_id = ?"
  ).get(registration.body.user.id);
  assert.deepEqual(environment, {
    sensor_json: null,
    device_json: null,
    decision_json: null
  });
  assert.equal(database.prepare(
    "SELECT COUNT(*) AS count FROM user_aqi_history WHERE user_id = ?"
  ).get(registration.body.user.id).count, 0);
});

test("registration stores the submitted account name and creates its authenticated session", async () => {
  const response = await requestJson("/auth/register", {
    method: "POST",
    body: {
      name: "Test Account",
      email: "named@example.com",
      password: "correct horse battery staple"
    }
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.user.name, "Test Account");
  const setCookie = response.headers.get("set-cookie");
  assert.match(setCookie, /breathe\.sid=/);
  const sessionCount = database.prepare(
    "SELECT COUNT(*) AS count FROM user_sessions"
  ).get().count;
  assert.equal(sessionCount, 1);
  const storedUser = getUserByEmail("named@example.com");
  assert.equal(storedUser.name, "Test Account");
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM users").get().count, 1);
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM user_setups WHERE user_id = ?")
      .get(response.body.user.id).count,
    1
  );

  const setup = await requestJson("/account/setup", {
    headers: { cookie: setCookie.split(";", 1)[0] }
  });
  assert.equal(setup.status, 200);
  assert.deepEqual(setup.body.setup, {
    setupCompleted: false,
    rooms: [],
    devices: { window: false, ventilation: false, purifier: false },
    preferences: null,
    location: null,
    outdoorAirQuality: null
  });
  const authenticatedUser = await requestJson("/test/private", {
    headers: { cookie: setCookie.split(";", 1)[0] }
  });
  assert.equal(authenticatedUser.status, 200);
  assert.equal(authenticatedUser.body.user.name, "Test Account");

  const login = await requestJson("/auth/login", {
    method: "POST",
    body: {
      email: "named@example.com",
      password: "correct horse battery staple"
    }
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.name, "Test Account");
  assert.match(login.headers.get("set-cookie"), /breathe\.sid=/);
});

test("account committed before a lost signup response can be recovered through login", async () => {
  const email = "lost-response@example.com";
  const password = "correct horse battery staple";
  loseRegistrationResponse = true;

  await assert.rejects(fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Recovered User", email, password })
  }));

  assert.ok(getUserByEmail(email), "registration committed before the response was lost");
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM users").get().count, 1);

  const login = await requestJson("/auth/login", {
    method: "POST",
    body: { email, password }
  });

  assert.equal(login.status, 200);
  assert.equal(login.body.user.email, email);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM users").get().count, 1);
});

test("registration rejects duplicate emails after normalization", async () => {
  await requestJson("/auth/register", {
    method: "POST",
    body: { email: "person@example.com", password: "correct horse battery staple" }
  });
  const response = await requestJson("/auth/register", {
    method: "POST",
    body: { email: " PERSON@EXAMPLE.COM ", password: "another secure password" }
  });

  assert.equal(response.status, 409);
  assert.deepEqual(response.body, {
    success: false,
    error: "An account with this email already exists"
  });
});

test("registration rejects invalid credentials and unexpected fields", async () => {
  const invalidBodies = [
    null,
    { email: "invalid", password: "correct horse battery staple" },
    { email: "person@example.com" },
    { email: "person@example.com", password: "short" },
    { email: "person@example.com", password: `${"a".repeat(71)}é` },
    { name: 42, email: "person@example.com", password: "correct horse battery staple" },
    { name: "   ", email: "person@example.com", password: "correct horse battery staple" },
    { name: "x".repeat(101), email: "person@example.com", password: "correct horse battery staple" },
    { email: "person@example.com", password: "correct horse battery staple", role: "admin" }
  ];

  for (const body of invalidBodies) {
    const response = await requestJson("/auth/register", {
      method: "POST",
      body
    });
    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
  }
});

test("login rejects incorrect passwords and authenticates valid credentials", async () => {
  const registration = await requestJson("/auth/register", {
    method: "POST",
    body: { email: "person@example.com", password: "correct horse battery staple" }
  });
  assert.equal(registration.status, 201);

  const incorrect = await requestJson("/auth/login", {
    method: "POST",
    body: { email: "person@example.com", password: "wrong password value" }
  });
  assert.equal(incorrect.status, 401);
  assert.deepEqual(incorrect.body, {
    success: false,
    error: "Invalid email or password"
  });

  const correct = await requestJson("/auth/login", {
    method: "POST",
    body: { email: " PERSON@EXAMPLE.COM ", password: "correct horse battery staple" }
  });
  assert.equal(correct.status, 200);
  assert.deepEqual(correct.body, {
    success: true,
    user: {
      id: registration.body.user.id,
      email: "person@example.com",
      name: null
    }
  });
  assert.equal(JSON.stringify(correct.body).includes("password_hash"), false);
});

test("password reset rejects expired tokens", async () => {
  const email = "reset-expired@example.com";
  await requestJson("/auth/register", {
    method: "POST",
    body: { email, password: "original password 123" }
  });
  const request = await requestJson("/auth/password-reset/request", {
    method: "POST",
    body: { email }
  });
  assert.equal(request.status, 200);
  assert.ok(request.body.resetToken);
  const storedToken = database.prepare(
    "SELECT token_hash, expires_at FROM password_reset_tokens"
  ).get();
  assert.equal(
    storedToken.token_hash,
    crypto.createHash("sha256").update(request.body.resetToken).digest("hex")
  );
  assert.ok(storedToken.expires_at > Date.now());

  database.prepare(
    "UPDATE password_reset_tokens SET expires_at = ?"
  ).run(Date.now() - 1);
  const reset = await requestJson("/auth/password-reset/confirm", {
    method: "POST",
    body: { token: request.body.resetToken, password: "replacement password 456" }
  });
  assert.equal(reset.status, 400);
  assert.match(reset.body.error, /invalid or expired/);
  const oldPasswordLogin = await requestJson("/auth/login", {
    method: "POST",
    body: { email, password: "original password 123" }
  });
  assert.equal(oldPasswordLogin.status, 200);
});

test("password reset does not claim email delivery is configured in production", async () => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  let response;
  try {
    response = await requestJson("/auth/password-reset/request", {
      method: "POST",
      body: { email: "person@example.com" }
    });
  } finally {
    process.env.NODE_ENV = previousEnvironment;
  }

  assert.equal(response.status, 503);
  assert.deepEqual(response.body, {
    success: false,
    error: "Password reset delivery is not configured"
  });
});

test("password reset is single-use and new password can log in", async () => {
  const email = "reset-single-use@example.com";
  await requestJson("/auth/register", {
    method: "POST",
    body: { email, password: "original password 123" }
  });
  const request = await requestJson("/auth/password-reset/request", {
    method: "POST",
    body: { email }
  });
  assert.equal(request.status, 200);
  assert.ok(request.body.resetToken);

  const weakPassword = await requestJson("/auth/password-reset/confirm", {
    method: "POST",
    body: { token: request.body.resetToken, password: "too short" }
  });
  assert.equal(weakPassword.status, 400);

  const reset = await requestJson("/auth/password-reset/confirm", {
    method: "POST",
    body: { token: request.body.resetToken, password: "replacement password 456" }
  });
  assert.equal(reset.status, 200);

  const tokenReuse = await requestJson("/auth/password-reset/confirm", {
    method: "POST",
    body: { token: request.body.resetToken, password: "another replacement 789" }
  });
  assert.equal(tokenReuse.status, 400);

  const oldPasswordLogin = await requestJson("/auth/login", {
    method: "POST",
    body: { email, password: "original password 123" }
  });
  assert.equal(oldPasswordLogin.status, 401);
  const newPasswordLogin = await requestJson("/auth/login", {
    method: "POST",
    body: { email, password: "replacement password 456" }
  });
  assert.equal(newPasswordLogin.status, 200);

  const user = getUserByEmail(email);
  assert.notEqual(user.password_hash, "replacement password 456");
  assert.match(user.password_hash, /^\$2[aby]\$/);
});

test("login sets HttpOnly SameSite cookie and persists authenticated session", async () => {
  const registration = await requestJson("/auth/register", {
    method: "POST",
    body: { email: "person@example.com", password: "correct horse battery staple" }
  });
  assert.equal(registration.status, 201);

  const unauthenticated = await requestJson("/test/private");
  assert.equal(unauthenticated.status, 401);

  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "person@example.com",
      password: "correct horse battery staple"
    })
  });
  assert.equal(loginResponse.status, 200);
  const setCookie = loginResponse.headers.get("set-cookie");
  assert.ok(setCookie);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);
  const cookie = setCookie.split(";", 1)[0];

  const authenticated = await fetch(`${baseUrl}/test/private`, {
    headers: { cookie }
  });
  assert.equal(authenticated.status, 200);
  assert.deepEqual((await authenticated.json()).user, {
    id: registration.body.user.id,
    email: "person@example.com",
    name: null,
    createdAt: getUserByEmail("person@example.com").createdAt
  });

  const storedSessions = database.prepare(
    "SELECT COUNT(*) AS count FROM user_sessions"
  ).get().count;
  assert.equal(storedSessions, 2);
});

test("account setup is isolated to the authenticated user and rejects client-invented AQI", async () => {
  const first = await registerAndLogin("first-setup@example.com");
  const second = await registerAndLogin("second-setup@example.com");
  const setup = {
    setupCompleted: true,
    rooms: [{ id: "room-one", name: "Office", devices: [{ type: "window" }] }],
    devices: { window: true, ventilation: false, purifier: false },
    preferences: { tempUnit: "celsius", notificationsEnabled: true },
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: null,
      recordedAt: new Date().toISOString(),
      source: "manual",
      placeName: "San Francisco, CA"
    },
    outdoorAirQuality: null
  };
  const saved = await requestJson("/account/setup", {
    method: "PUT",
    headers: { cookie: first.cookie },
    body: setup
  });

  assert.equal(saved.status, 200);
  assert.equal(saved.body.setupComplete, true);

  const secondSetup = await requestJson("/account/setup?userId=1", {
    headers: { cookie: second.cookie }
  });
  assert.equal(secondSetup.status, 200);
  assert.equal(secondSetup.body.setup.rooms.length, 0);
  assert.equal(secondSetup.body.setup.setupCompleted, false);

  const spoofed = await requestJson("/account/setup", {
    method: "PUT",
    headers: { cookie: second.cookie },
    body: { ...setup, userId: first.userId }
  });
  assert.equal(spoofed.status, 400);
  const firstSetup = await requestJson("/account/setup", {
    headers: { cookie: first.cookie }
  });
  assert.deepEqual(firstSetup.body.setup.rooms, setup.rooms);

  const inventedAqi = await requestJson("/account/setup", {
    method: "PUT",
    headers: { cookie: first.cookie },
    body: {
      ...setup,
      outdoorAirQuality: {
        aqi: 1,
        category: "Good",
        source: "Google Maps Platform Air Quality API (Universal AQI)",
        unit: "AQI index (unitless)",
        lastUpdated: new Date().toISOString(),
        latitude: 37.7749,
        longitude: -122.4194
      }
    }
  });
  assert.equal(inventedAqi.status, 400);
  assert.match(inventedAqi.body.error, /configured air-quality provider/);
});

test("Manual mode persists per account and prevents automatic decisions from replacing device settings", async () => {
  const manual = await registerAndLogin("manual-mode@example.com");
  const other = await registerAndLogin("auto-mode@example.com");
  const manualSetup = {
    setupCompleted: false,
    controlMode: "MANUAL",
    rooms: [{
      id: "office",
      name: "Office",
      mode: "MANUAL",
      devices: [{ type: "window" }, { type: "ventilation" }, { type: "purifier" }]
    }],
    devices: { window: true, ventilation: true, purifier: true },
    preferences: null,
    location: null,
    outdoorAirQuality: null
  };
  const saved = await requestJson("/account/setup", {
    method: "PUT",
    headers: { cookie: manual.cookie },
    body: manualSetup
  });
  assert.equal(saved.status, 200);

  const pollutedSensors = {
    room: "Office",
    outdoorAQI: 250,
    indoorAQI: 60,
    co2: 700,
    temperature: 24,
    humidity: 50,
    occupancy: 1
  };
  const sensorResponse = await requestJson("/sensors", {
    method: "PUT",
    headers: { cookie: manual.cookie },
    body: pollutedSensors
  });
  assert.equal(sensorResponse.status, 200);
  const manualDevices = {
    windows: "CLOSED",
    purifier: "ON",
    ventilation: "FILTERED",
    mode: "PURIFICATION"
  };
  const deviceResponse = await requestJson("/devices", {
    method: "PUT",
    headers: { cookie: manual.cookie },
    body: manualDevices
  });
  assert.equal(deviceResponse.status, 200);

  const cleanSensors = { ...pollutedSensors, outdoorAQI: 40, indoorAQI: 35 };
  await requestJson("/sensors", {
    method: "PUT",
    headers: { cookie: manual.cookie },
    body: cleanSensors
  });
  const decision = await requestJson("/decision", {
    headers: { cookie: manual.cookie }
  });
  const blocked = await requestJson("/decision/apply", {
    method: "POST",
    headers: { cookie: manual.cookie },
    body: decision.body.decision
  });
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.applied, false);
  assert.match(blocked.body.error, /Manual mode is enabled/);

  const persistedDevices = await requestJson("/devices", {
    headers: { cookie: manual.cookie }
  });
  assert.deepEqual(persistedDevices.body.deviceState, manualDevices);
  const otherSetup = await requestJson("/account/setup", {
    headers: { cookie: other.cookie }
  });
  assert.equal(otherSetup.body.setup.controlMode, undefined);

  const autoSensors = await requestJson("/sensors", {
    method: "PUT",
    headers: { cookie: other.cookie },
    body: { ...cleanSensors, room: "Other room" }
  });
  assert.equal(autoSensors.status, 200);
  const autoDecision = await requestJson("/decision", {
    headers: { cookie: other.cookie }
  });
  const applied = await requestJson("/decision/apply", {
    method: "POST",
    headers: { cookie: other.cookie },
    body: autoDecision.body.decision
  });
  assert.equal(applied.status, 200);
  assert.equal(applied.body.deviceState.windows, "OPEN");
});

test("provider configuration failure returns unavailable without storing an AQI", async () => {
  const account = await registerAndLogin("provider-failure@example.com");
  const location = await requestJson("/account/setup", {
    method: "PUT",
    headers: { cookie: account.cookie },
    body: {
      setupCompleted: false,
      rooms: [],
      devices: { window: false, ventilation: false, purifier: false },
      preferences: null,
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: null,
        recordedAt: new Date().toISOString(),
        source: "manual",
        placeName: "San Francisco, CA"
      },
      outdoorAirQuality: null
    }
  });
  assert.equal(location.status, 200);
  const previousApiKey = process.env.GOOGLE_MAPS_AIR_QUALITY_API_KEY;
  delete process.env.GOOGLE_MAPS_AIR_QUALITY_API_KEY;
  try {
    const response = await requestJson("/account/outdoor-air-quality", {
      method: "POST",
      headers: { cookie: account.cookie },
      body: { latitude: 0, longitude: 0 }
    });
    assert.equal(response.status, 503);
    assert.match(response.body.error, /not configured/);
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.GOOGLE_MAPS_AIR_QUALITY_API_KEY;
    } else {
      process.env.GOOGLE_MAPS_AIR_QUALITY_API_KEY = previousApiKey;
    }
  }
  const setup = await requestJson("/account/setup", {
    headers: { cookie: account.cookie }
  });
  assert.equal(setup.body.setup.outdoorAirQuality, null);
});

test("provider AQI without its observation timestamp is rejected rather than timestamped locally", async () => {
  const account = await registerAndLogin("provider-missing-time@example.com");
  const setup = await requestJson("/account/setup", {
    method: "PUT",
    headers: { cookie: account.cookie },
    body: {
      setupCompleted: false,
      rooms: [],
      devices: { window: false, ventilation: false, purifier: false },
      preferences: null,
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: null,
        recordedAt: new Date().toISOString(),
        source: "manual",
        placeName: "San Francisco, CA"
      },
      outdoorAirQuality: null
    }
  });
  assert.equal(setup.status, 200);
  const previousApiKey = process.env.GOOGLE_MAPS_AIR_QUALITY_API_KEY;
  const previousFetch = global.fetch;
  process.env.GOOGLE_MAPS_AIR_QUALITY_API_KEY = "test-provider-key";
  global.fetch = async (url, options) => {
    if (String(url).startsWith("https://airquality.googleapis.com/")) {
      return {
        ok: true,
        async json() {
          return { indexes: [{ code: "uaqi", aqi: 33, category: "Good" }] };
        }
      };
    }
    return previousFetch(url, options);
  };
  try {
    const response = await requestJson("/account/outdoor-air-quality", {
      method: "POST",
      headers: { cookie: account.cookie },
      body: {}
    });
    assert.equal(response.status, 502);
    assert.match(response.body.error, /unavailable/);
    const history = await requestJson("/account/analytics?range=24H", {
      headers: { cookie: account.cookie }
    });
    assert.deepEqual(history.body.readings, []);
  } finally {
    global.fetch = previousFetch;
    if (previousApiKey === undefined) {
      delete process.env.GOOGLE_MAPS_AIR_QUALITY_API_KEY;
    } else {
      process.env.GOOGLE_MAPS_AIR_QUALITY_API_KEY = previousApiKey;
    }
  }
});

test("manual locations persist only to the authenticated account", async () => {
  const first = await registerAndLogin("first-location@example.com");
  const second = await registerAndLogin("second-location@example.com");
  const firstLocation = {
    latitude: 12.9716,
    longitude: 77.5946,
    accuracy: null,
    recordedAt: new Date().toISOString(),
    source: "manual",
    placeName: "Bengaluru, Karnataka, India"
  };
  const secondLocation = {
    latitude: 19.076,
    longitude: 72.8777,
    accuracy: null,
    recordedAt: new Date().toISOString(),
    source: "manual",
    placeName: "Mumbai, Maharashtra, India"
  };

  for (const [account, location] of [[first, firstLocation], [second, secondLocation]]) {
    const saved = await requestJson("/account/setup", {
      method: "PUT",
      headers: { cookie: account.cookie },
      body: {
        setupCompleted: false,
        rooms: [],
        devices: { window: false, ventilation: false, purifier: false },
        preferences: null,
        location,
        outdoorAirQuality: null
      }
    });
    assert.equal(saved.status, 200);
  }

  const firstSetup = await requestJson("/account/setup", {
    headers: { cookie: first.cookie }
  });
  const secondSetup = await requestJson("/account/setup", {
    headers: { cookie: second.cookie }
  });
  assert.deepEqual(firstSetup.body.setup.location, firstLocation);
  assert.deepEqual(secondSetup.body.setup.location, secondLocation);
  assert.notDeepEqual(firstSetup.body.setup.location, secondSetup.body.setup.location);
});

test("provider AQI comes from a current provider response and is saved only for its account location", async () => {
  const account = await registerAndLogin("provider-success@example.com");
  const location = {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: null,
    recordedAt: new Date().toISOString(),
    source: "manual",
    placeName: "San Francisco, CA"
  };
  const draft = await requestJson("/account/setup", {
    method: "PUT",
    headers: { cookie: account.cookie },
    body: {
      setupCompleted: false,
      rooms: [],
      devices: { window: false, ventilation: false, purifier: false },
      preferences: null,
      location,
      outdoorAirQuality: null
    }
  });
  assert.equal(draft.status, 200);

  const previousApiKey = process.env.GOOGLE_MAPS_AIR_QUALITY_API_KEY;
  const previousFetch = global.fetch;
  process.env.GOOGLE_MAPS_AIR_QUALITY_API_KEY = "test-provider-key";
  let providerRequest;
  global.fetch = async (url, options) => {
    if (!String(url).startsWith("https://airquality.googleapis.com/")) {
      return previousFetch(url, options);
    }
    providerRequest = { url: String(url), options };
    return {
      ok: true,
      async json() {
        return {
          dateTime: "2026-10-10T04:00:00Z",
          indexes: [{ code: "uaqi", aqi: 52, category: "Good" }]
        };
      }
    };
  };
  try {
    const response = await requestJson("/account/outdoor-air-quality", {
      method: "POST",
      headers: { cookie: account.cookie },
      body: { latitude: 0, longitude: 0 }
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.airQuality.aqi, 52);
    assert.equal(response.body.airQuality.lastUpdated, "2026-10-10T04:00:00.000Z");
    assert.equal(response.body.airQuality.source, "Google Maps Platform Air Quality API (Universal AQI)");
    assert.equal(providerRequest.options.method, "POST");
    assert.deepEqual(JSON.parse(providerRequest.options.body), {
      location: { latitude: location.latitude, longitude: location.longitude },
      extraComputations: ["HEALTH_RECOMMENDATIONS"]
    });

    const savedSetup = await requestJson("/account/setup", {
      headers: { cookie: account.cookie }
    });
    assert.equal(savedSetup.body.setup.outdoorAirQuality.aqi, 52);
    assert.equal(savedSetup.body.setup.outdoorAirQuality.latitude, location.latitude);
  } finally {
    global.fetch = previousFetch;
    if (previousApiKey === undefined) {
      delete process.env.GOOGLE_MAPS_AIR_QUALITY_API_KEY;
    } else {
      process.env.GOOGLE_MAPS_AIR_QUALITY_API_KEY = previousApiKey;
    }
  }
});

test("analytics returns only verified, in-range provider observations for the signed-in account", async () => {
  const first = await registerAndLogin("analytics-first@example.com");
  const second = await registerAndLogin("analytics-second@example.com");
  const now = Date.now();
  const reading = (aqi, recordedAt) => ({
    aqi,
    category: "Good",
    source: "Google Maps Platform Air Quality API (Universal AQI)",
    unit: "AQI index (unitless)",
    latitude: 12.9716,
    longitude: 77.5946,
    lastUpdated: recordedAt
  });
  saveUserProviderAqiHistory(
    first.userId,
    reading(46, new Date(now - 60 * 60 * 1000).toISOString()),
    "Bengaluru, India"
  );
  saveUserProviderAqiHistory(
    first.userId,
    reading(80, new Date(now - 31 * 24 * 60 * 60 * 1000).toISOString()),
    "Bengaluru, India"
  );
  saveUserProviderAqiHistory(
    second.userId,
    reading(99, new Date(now - 30 * 60 * 1000).toISOString()),
    "Mumbai, India"
  );

  const firstHistory = await requestJson("/account/analytics?range=24H", {
    headers: { cookie: first.cookie }
  });
  assert.equal(firstHistory.status, 200);
  assert.equal(firstHistory.body.readings.length, 1);
  assert.equal(firstHistory.body.readings[0].value, 46);
  assert.equal(firstHistory.body.readings[0].placeName, "Bengaluru, India");
  assert.equal(firstHistory.body.readings[0].metric, "outdoorAQI");
  assert.equal(firstHistory.body.summary.verifiedOutdoorSamples, 1);
  assert.equal(firstHistory.body.summary.indoorAQIAverage, null);
  assert.equal(firstHistory.body.summary.automaticActions, null);
  assert.equal(firstHistory.body.summary.manualOverrides, null);
  assert.equal(firstHistory.body.summary.filterLife, null);

  const secondHistory = await requestJson("/account/analytics?range=24H", {
    headers: { cookie: second.cookie }
  });
  assert.equal(secondHistory.body.readings.length, 1);
  assert.equal(secondHistory.body.readings[0].value, 99);
  assert.equal(secondHistory.body.readings[0].placeName, "Mumbai, India");

  const unsupportedRange = await requestJson("/account/analytics?range=all", {
    headers: { cookie: first.cookie }
  });
  assert.equal(unsupportedRange.status, 400);
});

test("new account sensor, decision, device and AQI state stays isolated by authenticated user", async () => {
  const first = await registerAndLogin("telemetry-one@example.com");
  const second = await registerAndLogin("telemetry-two@example.com");

  const initial = await requestJson("/sensors", {
    headers: { cookie: first.cookie }
  });
  assert.equal(initial.status, 409);
  assert.match(initial.body.error, /No sensor readings/);

  const simulated = await requestJson("/simulation/clean-air", {
    method: "POST",
    headers: { cookie: first.cookie },
    body: {}
  });
  assert.equal(simulated.status, 200);
  assert.equal(simulated.body.sensorData.outdoorAQI, 40);
  assert.equal(simulated.body.decision.windows, "OPEN");

  const firstSensors = await requestJson("/sensors", {
    headers: { cookie: first.cookie }
  });
  assert.equal(firstSensors.status, 200);
  assert.equal(firstSensors.body.sensorData.outdoorAQI, 40);

  const secondSensors = await requestJson("/sensors", {
    headers: { cookie: second.cookie }
  });
  assert.equal(secondSensors.status, 409);
  const secondDecision = await requestJson("/decision", {
    headers: { cookie: second.cookie }
  });
  assert.equal(secondDecision.status, 409);
  const secondDevices = await requestJson("/devices", {
    headers: { cookie: second.cookie }
  });
  assert.equal(secondDevices.status, 409);

  const applied = await requestJson("/decision/apply", {
    method: "POST",
    headers: { cookie: first.cookie },
    body: simulated.body.decision
  });
  assert.equal(applied.status, 200);
  const firstDevices = await requestJson("/devices", {
    headers: { cookie: first.cookie }
  });
  assert.equal(firstDevices.status, 200);
  assert.equal(firstDevices.body.deviceState.windows, "OPEN");

  assert.equal(database.prepare(
    "SELECT COUNT(*) AS count FROM user_aqi_history WHERE user_id = ?"
  ).get(first.userId).count, 1);
  assert.equal(database.prepare(
    "SELECT COUNT(*) AS count FROM user_aqi_history WHERE user_id = ?"
  ).get(second.userId).count, 0);
});

test("location search reports missing configuration and restricts configured searches to India", async () => {
  const account = await registerAndLogin("location-search@example.com");
  const previousApiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
  const previousFetch = global.fetch;
  delete process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
  try {
    const unavailable = await requestJson("/account/location-search", {
      method: "POST",
      headers: { cookie: account.cookie },
      body: { query: "Bengaluru" }
    });
    assert.equal(unavailable.status, 503);
    assert.match(unavailable.body.error, /not configured/);

    process.env.GOOGLE_MAPS_GEOCODING_API_KEY = "test-geocoding-key";
    let requestedUrl;
    global.fetch = async (url, options) => {
      if (!String(url).startsWith("https://maps.googleapis.com/")) {
        return previousFetch(url, options);
      }
      requestedUrl = new URL(String(url));
      return {
        ok: true,
        async json() {
          return {
            status: "OK",
            results: [{
              formatted_address: "Bengaluru, Karnataka, India",
              geometry: { location: { lat: 12.9716, lng: 77.5946 } }
            }]
          };
        }
      };
    };
    const found = await requestJson("/account/location-search", {
      method: "POST",
      headers: { cookie: account.cookie },
      body: { query: "Bengaluru" }
    });
    assert.equal(found.status, 200);
    assert.deepEqual(found.body.locations, [{
      placeName: "Bengaluru, Karnataka, India",
      latitude: 12.9716,
      longitude: 77.5946
    }]);
    assert.equal(requestedUrl.searchParams.get("region"), "in");
    assert.equal(requestedUrl.searchParams.get("key"), "test-geocoding-key");
  } finally {
    global.fetch = previousFetch;
    if (previousApiKey === undefined) {
      delete process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
    } else {
      process.env.GOOGLE_MAPS_GEOCODING_API_KEY = previousApiKey;
    }
  }
});

test("startup restoration reloads latest sensor readings and applied device state", () => {
  const persistedSensorData = {
    room: "Persisted Room",
    indoorAQI: 65,
    outdoorAQI: 45,
    co2: 1400,
    temperature: 24,
    humidity: 48,
    occupancy: 18
  };
  const persistedDecision = {
    windows: "OPEN",
    purifier: "OFF",
    ventilation: "HIGH",
    mode: "VENTILATION",
    reason: "High CO2 with acceptable outdoor AQI"
  };

  saveSensorReading(persistedSensorData, "high-co2");
  saveAppliedDecision(persistedDecision, persistedSensorData);
  updateSensorData(initialSensorData);
  updateDeviceState(initialDeviceState);

  restorePersistedState();

  assert.deepEqual(getSensorData(), persistedSensorData);
  assert.deepEqual(getDeviceState(), {
    windows: "OPEN",
    purifier: "OFF",
    ventilation: "HIGH",
    mode: "VENTILATION"
  });
});

test("fresh backend process restores state from the same SQLite database after restart", async () => {
  const restartDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "breathe-clean-restart-test-")
  );
  const restartDatabasePath = path.join(restartDirectory, "restart.sqlite");
  const persistedSensorData = {
    room: "Restarted Classroom",
    indoorAQI: 60,
    outdoorAQI: 45,
    co2: 1450,
    temperature: 23,
    humidity: 46,
    occupancy: 16
  };
  const persistedDecision = {
    windows: "OPEN",
    purifier: "OFF",
    ventilation: "HIGH",
    mode: "VENTILATION",
    reason: "High CO2 with acceptable outdoor AQI"
  };
  const writerScript = `
    const { database, saveAppliedDecision, saveSensorReading } = require("./src/data/database");
    const sensors = ${JSON.stringify(persistedSensorData)};
    const decision = ${JSON.stringify(persistedDecision)};
    saveSensorReading(sensors, "high-co2");
    saveAppliedDecision(decision, sensors);
    database.close();
  `;

  let restartedServer;
  try {
    execFileSync(process.execPath, ["-e", writerScript], {
      cwd: path.resolve(__dirname, ".."),
      env: {
        ...process.env,
        BREATHE_CLEAN_DB_PATH: restartDatabasePath
      },
      stdio: "pipe"
    });

    const portProbe = createServer();
    await new Promise((resolve, reject) => {
      portProbe.once("error", reject);
      portProbe.listen(0, "127.0.0.1", resolve);
    });
    const port = portProbe.address().port;
    await new Promise((resolve, reject) => {
      portProbe.close((error) => (error ? reject(error) : resolve()));
    });

    restartedServer = spawn(process.execPath, ["src/server.js"], {
      cwd: path.resolve(__dirname, ".."),
      env: {
        ...process.env,
        PORT: String(port),
        BREATHE_CLEAN_DB_PATH: restartDatabasePath
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    let serverOutput = "";
    restartedServer.stdout.setEncoding("utf8").on("data", (chunk) => {
      serverOutput += chunk;
    });
    restartedServer.stderr.setEncoding("utf8").on("data", (chunk) => {
      serverOutput += chunk;
    });

    let sensorsResponse;
    let devicesResponse;
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      if (restartedServer.exitCode !== null) {
        throw new Error(`Restarted backend exited early: ${serverOutput}`);
      }
      try {
        [sensorsResponse, devicesResponse] = await Promise.all([
          fetch(`http://127.0.0.1:${port}/api/sensors`),
          fetch(`http://127.0.0.1:${port}/api/devices`)
        ]);
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    assert.ok(sensorsResponse, `Restarted backend did not start: ${serverOutput}`);
    assert.equal(sensorsResponse.status, 200);
    assert.equal(devicesResponse.status, 200);
    const sensors = await sensorsResponse.json();
    const devices = await devicesResponse.json();
    assert.deepEqual(sensors.sensorData, persistedSensorData);
    assert.deepEqual(devices.deviceState, {
      windows: "OPEN",
      purifier: "OFF",
      ventilation: "HIGH",
      mode: "VENTILATION"
    });
  } finally {
    if (restartedServer && restartedServer.exitCode === null) {
      const exited = new Promise((resolve) => restartedServer.once("exit", resolve));
      restartedServer.kill("SIGTERM");
      await exited;
    }
    fs.rmSync(restartDirectory, { recursive: true, force: true });
  }
});

for (const scenario of scenarios) {
  test(`${scenario.name} produces its intended actions and passes validation`, async () => {
    const decision = generateDecision(scenario.sensors);
    assert.deepEqual(
      Object.fromEntries(Object.keys(scenario.expected).map((field) => [field, decision[field]])),
      scenario.expected
    );
    assert.equal(validateDecision(decision, scenario.sensors).valid, true);

    const response = await requestJson(`/simulation/${scenario.name}`, { method: "POST" });
    assert.equal(response.status, 200);
    assert.deepEqual(
      Object.fromEntries(
        Object.keys(scenario.expected).map((field) => [field, response.body.decision[field]])
      ),
      scenario.expected
    );
    assert.equal(validateDecision(response.body.decision, response.body.sensorData).valid, true);
    const appliedResponse = await requestJson("/decision/apply", {
      method: "POST",
      body: response.body.decision
    });
    assert.equal(appliedResponse.status, 200);
    assert.equal(appliedResponse.body.applied, true);
    assert.deepEqual(
      Object.fromEntries(
        Object.keys(scenario.expected).map((field) => [field, appliedResponse.body.deviceState[field]])
      ),
      scenario.expected
    );
    const savedReading = database.prepare(`
      SELECT scenario, outdoor_aqi, indoor_aqi, co2, recorded_at
      FROM sensor_readings ORDER BY id DESC LIMIT 1
    `).get();
    assert.equal(savedReading.scenario, scenario.name);
    assert.equal(savedReading.outdoor_aqi, scenario.sensors.outdoorAQI);
    assert.equal(savedReading.indoor_aqi, scenario.sensors.indoorAQI);
    assert.equal(savedReading.co2, scenario.sensors.co2);
    assert.ok(savedReading.recorded_at);
  });
}

test("thresholds remain the shared configured cutoffs", () => {
  assert.deepEqual(thresholds, { outdoorAQI: 150, co2: 1000 });
});

test("only the intended device modes are allowed", () => {
  assert.deepEqual(allowedValues.mode, ["NORMAL", "PURIFICATION", "VENTILATION"]);
});

test("outdoor AQI at its cutoff prevents windows from opening", () => {
  const sensors = { outdoorAQI: thresholds.outdoorAQI, indoorAQI: 50, co2: 1600 };
  const decision = generateDecision(sensors);
  assert.equal(decision.windows, "CLOSED");
  assert.equal(decision.purifier, "ON");
  assert.equal(decision.ventilation, "FILTERED");
  assert.equal(validateDecision(decision, sensors).valid, true);
});

test("high CO2 with acceptable AQI triggers high ventilation", () => {
  const sensors = { outdoorAQI: 149, indoorAQI: 99, co2: thresholds.co2 };
  const decision = generateDecision(sensors);
  assert.equal(decision.windows, "OPEN");
  assert.equal(decision.purifier, "OFF");
  assert.equal(decision.ventilation, "HIGH");
  assert.equal(decision.mode, "VENTILATION");
  assert.equal(validateDecision(decision, sensors).valid, true);
  assert.equal(
    validateDecision({ ...decision, mode: "FRESH_AIR" }, sensors).valid,
    false
  );
});

test("high CO2 with polluted outdoor air does not open windows", () => {
  const sensors = { outdoorAQI: 151, indoorAQI: 50, co2: 2000 };
  const decision = generateDecision(sensors);
  assert.equal(decision.windows, "CLOSED");
  assert.equal(decision.purifier, "ON");
  assert.equal(decision.ventilation, "FILTERED");
  assert.equal(decision.mode, "PURIFICATION");
  assert.equal(validateDecision(decision, sensors).valid, true);
});

test("acceptable outdoor AQI follows CO2 rule when indoor AQI is elevated", () => {
  const sensors = { outdoorAQI: 40, indoorAQI: 180, co2: 1600 };
  const decision = generateDecision(sensors);
  assert.equal(decision.windows, "OPEN");
  assert.equal(decision.purifier, "OFF");
  assert.equal(decision.ventilation, "HIGH");
  assert.equal(decision.mode, "VENTILATION");
  assert.equal(validateDecision(decision, sensors).valid, true);
});

test("missing, invalid, negative, and incomplete sensor readings are rejected", () => {
  const validDecision = generateDecision({ outdoorAQI: 40, indoorAQI: 45, co2: 600 });
  const invalidReadings = [
    undefined,
    null,
    {},
    { outdoorAQI: 40, indoorAQI: 45 },
    { outdoorAQI: -1, indoorAQI: 45, co2: 600 },
    { outdoorAQI: 40, indoorAQI: Number.NaN, co2: 600 },
    { outdoorAQI: 40, indoorAQI: 45, co2: "600" }
  ];

  for (const sensors of invalidReadings) {
    assert.equal(validateDecision(validDecision, sensors).valid, false);
    assert.throws(() => generateDecision(sensors), TypeError);
  }

  assert.ok(validateCompleteSensorData({ outdoorAQI: 40 }).error);
  assert.ok(validateCompleteSensorData({
    room: "Classroom",
    indoorAQI: 45,
    outdoorAQI: 40,
    co2: -1,
    temperature: 25,
    humidity: 50,
    occupancy: 20
  }).error);
  assert.ok(updateSensorData({ co2: -1 }).error);
});

test("malformed, unexpected, and contradictory decisions are rejected", () => {
  const sensors = { outdoorAQI: 40, indoorAQI: 45, co2: 600 };
  const decision = generateDecision(sensors);
  const invalidDecisions = [
    null,
    [],
    {},
    { ...decision, unexpected: true },
    { ...decision, reason: "" },
    { ...decision, windows: "CLOSED" },
    { ...decision, purifier: "ON" },
    { ...decision, ventilation: "FILTERED" },
    { ...decision, mode: "PURIFICATION" }
  ];

  for (const invalidDecision of invalidDecisions) {
    assert.equal(validateDecision(invalidDecision, sensors).valid, false);
  }
});

test("safe PUT /api/devices succeeds", async () => {
  await updateSensorData({ outdoorAQI: 40, indoorAQI: 45, co2: 600 });
  const response = await requestJson("/devices", {
    method: "PUT",
    body: {
      windows: "OPEN",
      purifier: "OFF",
      ventilation: "NORMAL",
      mode: "NORMAL"
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.deepEqual(response.body.deviceState, {
    windows: "OPEN",
    purifier: "OFF",
    ventilation: "NORMAL",
    mode: "NORMAL"
  });
});

test("unsafe PUT /api/devices is rejected without changing device state", async () => {
  const before = getDeviceState();
  const response = await requestJson("/devices", {
    method: "PUT",
    body: { windows: "OPEN" }
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.error, /Unsafe decision/);
  assert.deepEqual(getDeviceState(), before);
});

test("PUT /api/sensors followed by decision apply synchronizes validated backend state", async () => {
  const sensorResponse = await requestJson("/sensors", {
    method: "PUT",
    body: { outdoorAQI: 45, indoorAQI: 55, co2: 1600 }
  });
  assert.equal(sensorResponse.status, 200);
  assert.deepEqual(
    {
      outdoorAQI: sensorResponse.body.sensorData.outdoorAQI,
      indoorAQI: sensorResponse.body.sensorData.indoorAQI,
      co2: sensorResponse.body.sensorData.co2
    },
    { outdoorAQI: 45, indoorAQI: 55, co2: 1600 }
  );

  const decisionResponse = await requestJson("/decision", { method: "GET" });
  assert.equal(decisionResponse.status, 200);
  assert.deepEqual(
    {
      windows: decisionResponse.body.decision.windows,
      purifier: decisionResponse.body.decision.purifier,
      ventilation: decisionResponse.body.decision.ventilation,
      mode: decisionResponse.body.decision.mode
    },
    {
      windows: "OPEN",
      purifier: "OFF",
      ventilation: "HIGH",
      mode: "VENTILATION"
    }
  );

  const applyResponse = await requestJson("/decision/apply", {
    method: "POST",
    body: decisionResponse.body.decision
  });
  assert.equal(applyResponse.status, 200);
  assert.equal(applyResponse.body.applied, true);
  assert.deepEqual(applyResponse.body.deviceState, {
    windows: "OPEN",
    purifier: "OFF",
    ventilation: "HIGH",
    mode: "VENTILATION"
  });
});

test("unsafe POST /api/decision/apply is rejected without changing device state", async () => {
  const before = getDeviceState();
  const historyBefore = database.prepare("SELECT COUNT(*) AS count FROM decision_history").get().count;
  const statesBefore = database.prepare("SELECT COUNT(*) AS count FROM applied_device_states").get().count;
  const response = await requestJson("/decision/apply", {
    method: "POST",
    body: {
      windows: "OPEN",
      purifier: "ON",
      ventilation: "FILTERED",
      mode: "PURIFICATION",
      reason: "Contradicts the polluted outdoor AQI"
    }
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.applied, false);
  assert.match(response.body.error, /Unsafe decision/);
  assert.deepEqual(getDeviceState(), before);
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM decision_history").get().count,
    historyBefore
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM applied_device_states").get().count,
    statesBefore
  );
});

test("POST /api/decision/apply rejects FRESH_AIR without changing device state", async () => {
  await updateSensorData({ outdoorAQI: 40, indoorAQI: 55, co2: 1600 });
  const before = getDeviceState();
  const historyBefore = database.prepare("SELECT COUNT(*) AS count FROM decision_history").get().count;
  const statesBefore = database.prepare("SELECT COUNT(*) AS count FROM applied_device_states").get().count;
  const response = await requestJson("/decision/apply", {
    method: "POST",
    body: {
      windows: "OPEN",
      purifier: "OFF",
      ventilation: "HIGH",
      mode: "FRESH_AIR",
      reason: "High CO2 requires increased ventilation"
    }
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.applied, false);
  assert.match(response.body.error, /Allowed values: NORMAL, PURIFICATION, VENTILATION/);
  assert.deepEqual(getDeviceState(), before);
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM decision_history").get().count,
    historyBefore
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM applied_device_states").get().count,
    statesBefore
  );
});

test("POST /api/decision/apply rejects an incomplete decision without persistence", async () => {
  const before = getDeviceState();
  const historyBefore = database.prepare("SELECT COUNT(*) AS count FROM decision_history").get().count;
  const statesBefore = database.prepare("SELECT COUNT(*) AS count FROM applied_device_states").get().count;
  const response = await requestJson("/decision/apply", {
    method: "POST",
    body: {
      windows: "CLOSED",
      purifier: "ON",
      ventilation: "FILTERED",
      reason: "Missing mode"
    }
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.applied, false);
  assert.match(response.body.error, /Invalid or missing decision field: mode/);
  assert.deepEqual(getDeviceState(), before);
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM decision_history").get().count,
    historyBefore
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM applied_device_states").get().count,
    statesBefore
  );
});

test("POST /api/decision/apply accepts high-CO2 and outdoor-pollution decisions", async () => {
  const acceptedScenarios = [
    {
      sensors: { outdoorAQI: 40, indoorAQI: 55, co2: 1600 },
      expectedMode: "VENTILATION"
    },
    {
      sensors: { outdoorAQI: 250, indoorAQI: 50, co2: 650 },
      expectedMode: "PURIFICATION"
    }
  ];

  for (const scenario of acceptedScenarios) {
    const sensorResult = updateSensorData(scenario.sensors);
    assert.equal(sensorResult.error, undefined);
    const decision = generateDecision(scenario.sensors);
    const response = await requestJson("/decision/apply", {
      method: "POST",
      body: decision
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.applied, true);
    assert.equal(response.body.deviceState.mode, scenario.expectedMode);
  }

  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM decision_history").get().count, 2);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM applied_device_states").get().count, 2);
  const savedDecision = database.prepare(`
    SELECT mode, reason, outdoor_aqi, co2, applied_at
    FROM decision_history ORDER BY id LIMIT 1
  `).get();
  assert.equal(savedDecision.mode, "VENTILATION");
  assert.equal(savedDecision.outdoor_aqi, 40);
  assert.equal(savedDecision.co2, 1600);
  assert.ok(savedDecision.reason);
  assert.ok(savedDecision.applied_at);
  const savedState = database.prepare(`
    SELECT windows, purifier, ventilation, mode, applied_at
    FROM applied_device_states ORDER BY id LIMIT 1
  `).get();
  assert.deepEqual(
    [savedState.windows, savedState.purifier, savedState.ventilation, savedState.mode],
    ["OPEN", "OFF", "HIGH", "VENTILATION"]
  );
  assert.ok(savedState.applied_at);
});

test("GET /api/decision and POST /api/decision/evaluate use the authoritative rules", async () => {
  const highCo2Sensors = {
    room: "Classroom 301",
    indoorAQI: 55,
    outdoorAQI: 45,
    co2: 1600,
    temperature: 25,
    humidity: 50,
    occupancy: 20
  };
  await updateSensorData(highCo2Sensors);

  const getResponse = await requestJson("/decision");
  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.body.decision.mode, "VENTILATION");
  assert.equal(validateDecision(getResponse.body.decision, getSensorData()).valid, true);

  const evaluateResponse = await requestJson("/decision/evaluate", {
    method: "POST",
    body: highCo2Sensors
  });
  assert.equal(evaluateResponse.status, 200);
  assert.deepEqual(evaluateResponse.body.decision, getResponse.body.decision);
});

test("GET /api/devices retains its response shape", async () => {
  const response = await requestJson("/devices");
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(response.body).sort(), ["deviceState", "success"]);
  assert.deepEqual(Object.keys(response.body.deviceState).sort(), [
    "mode",
    "purifier",
    "ventilation",
    "windows"
  ]);
});
