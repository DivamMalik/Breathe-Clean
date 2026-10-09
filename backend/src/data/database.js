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
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_sessions (
    sid TEXT PRIMARY KEY,
    session_json TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx
  ON user_sessions (expires_at);
`);

const insertUser = database.prepare(`
  INSERT INTO users (email, password_hash, created_at)
  VALUES (@email, @password_hash, @created_at)
`);
const selectUserByEmail = database.prepare(`
  SELECT id, email, password_hash, created_at AS createdAt
  FROM users
  WHERE email = @email
`);
const selectUserById = database.prepare(`
  SELECT id, email, created_at AS createdAt
  FROM users
  WHERE id = @id
`);

function createUser(email, passwordHash) {
  return insertUser.run({
    email,
    password_hash: passwordHash,
    created_at: new Date().toISOString()
  });
}

function getUserByEmail(email) {
  return selectUserByEmail.get({ email });
}

function getPublicUserById(id) {
  return selectUserById.get({ id });
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
  getPublicUserById,
  getUserByEmail,
  getLatestAppliedDeviceState,
  getLatestSensorReading,
  saveAppliedDecision,
  saveSensorReading
};
