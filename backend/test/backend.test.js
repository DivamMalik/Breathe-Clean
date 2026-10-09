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
  saveSensorReading
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
  return { status: response.status, body: await response.json() };
}

beforeEach(async () => {
  restoreState();
  const app = express();
  app.use(express.json());
  app.use(createSessionMiddleware());
  app.use("/api/auth", authRoutes);
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
      'users', 'user_sessions', 'password_reset_tokens'
    )
    ORDER BY name
  `).all().map((row) => row.name);
  assert.deepEqual(tables, [
    "applied_device_states",
    "decision_history",
    "password_reset_tokens",
    "sensor_readings",
    "user_sessions",
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
    user: { id: 1, email: "person@example.com" }
  });
  assert.equal(JSON.stringify(response.body).includes(password), false);
  const savedUser = getUserByEmail("person@example.com");
  assert.equal(savedUser.email, "person@example.com");
  assert.notEqual(savedUser.password_hash, password);
  assert.match(savedUser.password_hash, /^\$2[aby]\$/);
  assert.ok(savedUser.createdAt);
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
      email: "person@example.com"
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
    createdAt: getUserByEmail("person@example.com").createdAt
  });

  const storedSessions = database.prepare(
    "SELECT COUNT(*) AS count FROM user_sessions"
  ).get().count;
  assert.equal(storedSessions, 1);
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
