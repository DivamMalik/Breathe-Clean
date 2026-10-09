const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const databasePath =
  process.env.BREATHE_CLEAN_DB_PATH ||
  path.join(__dirname, "../../data/breathe-clean.sqlite");

if (databasePath !== ":memory:") {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}

const database = new Database(databasePath);
database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");

database.exec(`
  CREATE TABLE IF NOT EXISTS sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario TEXT,
    room TEXT NOT NULL,
    indoor_aqi REAL NOT NULL,
    outdoor_aqi REAL NOT NULL,
    co2 REAL NOT NULL,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    occupancy INTEGER NOT NULL,
    recorded_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS decision_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    indoor_aqi REAL NOT NULL,
    outdoor_aqi REAL NOT NULL,
    co2 REAL NOT NULL,
    windows TEXT NOT NULL CHECK (windows IN ('OPEN', 'CLOSED')),
    purifier TEXT NOT NULL CHECK (purifier IN ('ON', 'OFF')),
    ventilation TEXT NOT NULL CHECK (ventilation IN ('LOW', 'NORMAL', 'HIGH', 'FILTERED')),
    mode TEXT NOT NULL CHECK (mode IN ('NORMAL', 'PURIFICATION', 'VENTILATION')),
    reason TEXT NOT NULL,
    applied_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS applied_device_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    decision_history_id INTEGER NOT NULL UNIQUE,
    windows TEXT NOT NULL CHECK (windows IN ('OPEN', 'CLOSED')),
    purifier TEXT NOT NULL CHECK (purifier IN ('ON', 'OFF')),
    ventilation TEXT NOT NULL CHECK (ventilation IN ('LOW', 'NORMAL', 'HIGH', 'FILTERED')),
    mode TEXT NOT NULL CHECK (mode IN ('NORMAL', 'PURIFICATION', 'VENTILATION')),
    applied_at TEXT NOT NULL,
    FOREIGN KEY (decision_history_id) REFERENCES decision_history(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    name TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_setups (
    user_id INTEGER PRIMARY KEY,
    setup_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_environment_state (
    user_id INTEGER PRIMARY KEY,
    sensor_json TEXT,
    device_json TEXT,
    decision_json TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_aqi_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    indoor_aqi REAL NOT NULL,
    outdoor_aqi REAL NOT NULL,
    co2 REAL NOT NULL,
    recorded_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_sessions (
    sid TEXT PRIMARY KEY,
    session_json TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx
  ON password_reset_tokens (expires_at);

  CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx
  ON user_sessions (expires_at);
`);

const userColumns = database.prepare("PRAGMA table_info(users)").all();
if (!userColumns.some((column) => column.name === "name")) {
  database.exec("ALTER TABLE users ADD COLUMN name TEXT");
}

const insertUser = database.prepare(`
  INSERT INTO users (email, name, password_hash, created_at)
  VALUES (@email, @name, @password_hash, @created_at)
`);
const insertUserSetup = database.prepare(`
  INSERT INTO user_setups (user_id, setup_json, updated_at)
  VALUES (@user_id, @setup_json, @updated_at)
`);
const selectUserSetup = database.prepare(`
  SELECT setup_json AS setupJson, updated_at AS updatedAt
  FROM user_setups
  WHERE user_id = @user_id
`);
const upsertUserSetup = database.prepare(`
  INSERT INTO user_setups (user_id, setup_json, updated_at)
  VALUES (@user_id, @setup_json, @updated_at)
  ON CONFLICT(user_id) DO UPDATE SET
    setup_json = excluded.setup_json,
    updated_at = excluded.updated_at
`);
const insertUserEnvironmentState = database.prepare(`
  INSERT INTO user_environment_state (user_id, sensor_json, device_json, decision_json, updated_at)
  VALUES (@user_id, NULL, NULL, NULL, @updated_at)
`);
const selectUserEnvironmentState = database.prepare(`
  SELECT sensor_json AS sensorJson, device_json AS deviceJson,
    decision_json AS decisionJson, updated_at AS updatedAt
  FROM user_environment_state
  WHERE user_id = @user_id
`);
const updateUserEnvironmentState = database.prepare(`
  UPDATE user_environment_state
  SET sensor_json = COALESCE(@sensor_json, sensor_json),
      device_json = COALESCE(@device_json, device_json),
      decision_json = COALESCE(@decision_json, decision_json),
      updated_at = @updated_at
  WHERE user_id = @user_id
`);
const insertUserAqiHistory = database.prepare(`
  INSERT INTO user_aqi_history (user_id, indoor_aqi, outdoor_aqi, co2, recorded_at)
  VALUES (@user_id, @indoor_aqi, @outdoor_aqi, @co2, @recorded_at)
`);
const selectUserByEmail = database.prepare(`
  SELECT id, email, name, password_hash, created_at AS createdAt
  FROM users
  WHERE email = @email
`);
const selectUserById = database.prepare(`
  SELECT id, email, name, created_at AS createdAt
  FROM users
  WHERE id = @id
`);

const createUserTransaction = database.transaction((email, name, passwordHash) => {
  const createdAt = new Date().toISOString();
  const result = insertUser.run({
    email,
    name,
    password_hash: passwordHash,
    created_at: createdAt
  });
  const userId = Number(result.lastInsertRowid);
  insertUserSetup.run({
    user_id: userId,
    setup_json: JSON.stringify({
      setupCompleted: false,
      rooms: [],
      devices: { window: false, ventilation: false, purifier: false },
      preferences: null,
      location: null,
      outdoorAirQuality: null
    }),
    updated_at: createdAt
  });
  insertUserEnvironmentState.run({
    user_id: userId,
    updated_at: createdAt
  });
  return result;
});

function createUser(email, passwordHash, name = null) {
  return createUserTransaction(email, name, passwordHash);
}

function getUserSetup(userId) {
  const row = selectUserSetup.get({ user_id: userId });
  return row ? { ...row, setup: JSON.parse(row.setupJson) } : null;
}

function saveUserSetup(userId, setup) {
  upsertUserSetup.run({
    user_id: userId,
    setup_json: JSON.stringify(setup),
    updated_at: new Date().toISOString()
  });
  return getUserSetup(userId);
}

function getUserEnvironmentState(userId) {
  const row = selectUserEnvironmentState.get({ user_id: userId });
  if (!row) return null;
  return {
    sensorData: row.sensorJson ? JSON.parse(row.sensorJson) : null,
    deviceState: row.deviceJson ? JSON.parse(row.deviceJson) : null,
    decision: row.decisionJson ? JSON.parse(row.decisionJson) : null,
    updatedAt: row.updatedAt
  };
}

function saveUserEnvironmentState(userId, { sensorData, deviceState, decision } = {}) {
  const recordedAt = new Date().toISOString();
  updateUserEnvironmentState.run({
    user_id: userId,
    sensor_json: sensorData === undefined ? null : JSON.stringify(sensorData),
    device_json: deviceState === undefined ? null : JSON.stringify(deviceState),
    decision_json: decision === undefined ? null : JSON.stringify(decision),
    updated_at: recordedAt
  });
  if (sensorData) {
    insertUserAqiHistory.run({
      user_id: userId,
      indoor_aqi: sensorData.indoorAQI,
      outdoor_aqi: sensorData.outdoorAQI,
      co2: sensorData.co2,
      recorded_at: recordedAt
    });
  }
  return getUserEnvironmentState(userId);
}

function getUserByEmail(email) {
  return selectUserByEmail.get({ email });
}

function getPublicUserById(id) {
  return selectUserById.get({ id });
}

const insertPasswordResetToken = database.prepare(`
  INSERT INTO password_reset_tokens (token_hash, user_id, expires_at, created_at)
  VALUES (@token_hash, @user_id, @expires_at, @created_at)
`);
const deletePasswordResetTokensForUser = database.prepare(
  "DELETE FROM password_reset_tokens WHERE user_id = @user_id"
);
const findValidPasswordResetToken = database.prepare(`
  SELECT user_id
  FROM password_reset_tokens
  WHERE token_hash = @token_hash AND expires_at > @now
`);
const updatePasswordHash = database.prepare(
  "UPDATE users SET password_hash = @password_hash WHERE id = @user_id"
);
const deletePasswordResetToken = database.prepare(
  "DELETE FROM password_reset_tokens WHERE token_hash = @token_hash"
);

const createPasswordResetTokenTransaction = database.transaction(
  (userId, tokenHash, expiresAt) => {
    deletePasswordResetTokensForUser.run({ user_id: userId });
    insertPasswordResetToken.run({
      token_hash: tokenHash,
      user_id: userId,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    });
  }
);

function createPasswordResetToken(userId, tokenHash, expiresAt) {
  createPasswordResetTokenTransaction(userId, tokenHash, expiresAt);
}

const resetPasswordTransaction = database.transaction(
  (tokenHash, passwordHash, now) => {
    const resetToken = findValidPasswordResetToken.get({
      token_hash: tokenHash,
      now
    });
    if (!resetToken) {
      return false;
    }

    updatePasswordHash.run({
      password_hash: passwordHash,
      user_id: resetToken.user_id
    });
    deletePasswordResetToken.run({ token_hash: tokenHash });
    deletePasswordResetTokensForUser.run({ user_id: resetToken.user_id });
    return true;
  }
);

function resetPasswordWithToken(tokenHash, passwordHash, now = Date.now()) {
  return resetPasswordTransaction(tokenHash, passwordHash, now);
}

const insertSensorReading = database.prepare(`
  INSERT INTO sensor_readings (
    scenario, room, indoor_aqi, outdoor_aqi, co2,
    temperature, humidity, occupancy, recorded_at
  ) VALUES (
    @scenario, @room, @indoor_aqi, @outdoor_aqi, @co2,
    @temperature, @humidity, @occupancy, @recorded_at
  )
`);

const selectLatestSensorReading = database.prepare(`
  SELECT
    room,
    indoor_aqi AS indoorAQI,
    outdoor_aqi AS outdoorAQI,
    co2,
    temperature,
    humidity,
    occupancy
  FROM sensor_readings
  ORDER BY id DESC
  LIMIT 1
`);

const selectLatestAppliedDeviceState = database.prepare(`
  SELECT windows, purifier, ventilation, mode
  FROM applied_device_states
  ORDER BY id DESC
  LIMIT 1
`);

function getLatestSensorReading() {
  return selectLatestSensorReading.get();
}

function getLatestAppliedDeviceState() {
  return selectLatestAppliedDeviceState.get();
}

function saveSensorReading(sensorData, scenario) {
  const result = insertSensorReading.run({
    scenario,
    room: sensorData.room,
    indoor_aqi: sensorData.indoorAQI,
    outdoor_aqi: sensorData.outdoorAQI,
    co2: sensorData.co2,
    temperature: sensorData.temperature,
    humidity: sensorData.humidity,
    occupancy: sensorData.occupancy,
    recorded_at: new Date().toISOString()
  });

  return Number(result.lastInsertRowid);
}

const insertDecisionAndDeviceState = database.transaction((decision, sensorData) => {
  const appliedAt = new Date().toISOString();
  const decisionResult = database.prepare(`
    INSERT INTO decision_history (
      indoor_aqi, outdoor_aqi, co2, windows, purifier, ventilation,
      mode, reason, applied_at
    ) VALUES (
      @indoor_aqi, @outdoor_aqi, @co2, @windows, @purifier, @ventilation,
      @mode, @reason, @applied_at
    )
  `).run({
    indoor_aqi: sensorData.indoorAQI,
    outdoor_aqi: sensorData.outdoorAQI,
    co2: sensorData.co2,
    windows: decision.windows,
    purifier: decision.purifier,
    ventilation: decision.ventilation,
    mode: decision.mode,
    reason: decision.reason,
    applied_at: appliedAt
  });

  const decisionHistoryId = Number(decisionResult.lastInsertRowid);
  const deviceStateResult = database.prepare(`
    INSERT INTO applied_device_states (
      decision_history_id, windows, purifier, ventilation, mode, applied_at
    ) VALUES (
      @decision_history_id, @windows, @purifier, @ventilation, @mode, @applied_at
    )
  `).run({
    decision_history_id: decisionHistoryId,
    windows: decision.windows,
    purifier: decision.purifier,
    ventilation: decision.ventilation,
    mode: decision.mode,
    applied_at: appliedAt
  });

  return {
    decisionHistoryId,
    appliedDeviceStateId: Number(deviceStateResult.lastInsertRowid)
  };
});

function saveAppliedDecision(decision, sensorData) {
  return insertDecisionAndDeviceState(decision, sensorData);
}

module.exports = {
  database,
  databasePath,
  createUser,
  createPasswordResetToken,
  getPublicUserById,
  getUserByEmail,
  getUserEnvironmentState,
  getUserSetup,
  getLatestAppliedDeviceState,
  getLatestSensorReading,
  resetPasswordWithToken,
  saveAppliedDecision,
  saveUserSetup,
  saveUserEnvironmentState,
  saveSensorReading
};
