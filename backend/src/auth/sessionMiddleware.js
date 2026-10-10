const session = require("express-session");
const SQLiteSessionStore = require("./sqliteSessionStore");

const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

function createSessionMiddleware() {
  const secret = process.env.SESSION_SECRET || (
    process.env.NODE_ENV !== "production"
      ? "breathe-clean-default-dev-session-secret-key-32-bytes"
      : null
  );
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 bytes");
  }

  return session({
    name: "breathe.sid",
    secret,
    store: new SQLiteSessionStore(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE_MS,
      path: "/"
    }
  });
}

module.exports = { createSessionMiddleware };
