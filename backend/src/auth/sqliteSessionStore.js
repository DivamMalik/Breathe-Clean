const session = require("express-session");
const { database } = require("../data/database");

const Store = session.Store;

class SQLiteSessionStore extends Store {
  constructor() {
    super();
    this.getStatement = database.prepare(`
      SELECT session_json
      FROM user_sessions
      WHERE sid = @sid AND expires_at > @now
    `);
    this.setStatement = database.prepare(`
      INSERT INTO user_sessions (sid, session_json, expires_at)
      VALUES (@sid, @session_json, @expires_at)
      ON CONFLICT(sid) DO UPDATE SET
        session_json = excluded.session_json,
        expires_at = excluded.expires_at
    `);
    this.destroyStatement = database.prepare(
      "DELETE FROM user_sessions WHERE sid = @sid"
    );
    this.pruneStatement = database.prepare(
      "DELETE FROM user_sessions WHERE expires_at <= @now"
    );
  }

  get(sid, callback) {
    try {
      const row = this.getStatement.get({ sid, now: Date.now() });
      callback(null, row ? JSON.parse(row.session_json) : null);
    } catch (error) {
      callback(error);
    }
  }

  set(sid, sessionData, callback = () => {}) {
    try {
      const expiresAt = sessionData.cookie?.expires
        ? new Date(sessionData.cookie.expires).getTime()
        : Date.now() + (sessionData.cookie?.maxAge ?? 8 * 60 * 60 * 1000);
      this.pruneStatement.run({ now: Date.now() });
      this.setStatement.run({
        sid,
        session_json: JSON.stringify(sessionData),
        expires_at: expiresAt
      });
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  destroy(sid, callback = () => {}) {
    try {
      this.destroyStatement.run({ sid });
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  touch(sid, sessionData, callback = () => {}) {
    this.set(sid, sessionData, callback);
  }
}

module.exports = SQLiteSessionStore;
