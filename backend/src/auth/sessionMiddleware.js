const session = require("express-session");
const SQLiteSessionStore = require("./sqliteSessionStore");

const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

function createSessionMiddleware() {
  let secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    if (process.env.NODE_ENV === "production") {
      console.warn("⚠️  SESSION_SECRET not set or too short. Using automatic 32-byte secret.");
      secret = require("node:crypto").randomBytes(32).toString("hex");
    } else {
      secret = "breathe-clean-default-dev-session-secret-key-32-bytes";
    }
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
      secure: "auto",
      maxAge: SESSION_MAX_AGE_MS,
      path: "/"
    }
  });
}

module.exports = { createSessionMiddleware };
