const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const {
  createUser,
  createPasswordResetToken,
  getUserByEmail,
  resetPasswordWithToken
} = require("../data/database");

const BCRYPT_ROUNDS = 12;
const MAX_PASSWORD_BYTES = 72;
const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;

function normalizeAndValidateCredentials(body, { allowName = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }

  const unknownField = Object.keys(body).find(
    (field) => !["email", "password", ...(allowName ? ["name"] : [])].includes(field)
  );
  if (unknownField) {
    return { error: `Unexpected field: ${unknownField}` };
  }

  if (typeof body.email !== "string") {
    return { error: "Email must be a string" };
  }
  if (typeof body.password !== "string") {
    return { error: "Password must be a string" };
  }

  const email = body.email.trim().toLowerCase();
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { error: "A valid email address is required" };
  }

  const passwordBytes = Buffer.byteLength(body.password, "utf8");
  if (body.password.length < 12 || passwordBytes > MAX_PASSWORD_BYTES) {
    return {
      error: "Password must be at least 12 characters and no more than 72 bytes"
    };
  }

  const name = allowName && typeof body.name === "string"
    ? body.name.trim()
    : null;
  if (
    allowName &&
    body.name !== undefined &&
    (typeof body.name !== "string" || !name || name.length > 100)
  ) {
    return { error: "Name must be between 1 and 100 characters" };
  }

  return { email, password: body.password, name };
}

function createSession(request, userId) {
  return new Promise((resolve, reject) => {
    request.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }

      request.session.userId = userId;
      request.session.save((saveError) => {
        if (saveError) {
          reject(saveError);
          return;
        }
        resolve();
      });
    });
  });
}

async function register(request, response) {
  const credentials = normalizeAndValidateCredentials(request.body, { allowName: true });
  if (credentials.error) {
    return response.status(400).json({
      success: false,
      error: credentials.error
    });
  }

  const passwordHash = await bcrypt.hash(credentials.password, BCRYPT_ROUNDS);
  try {
    const result = createUser(credentials.email, passwordHash, credentials.name);
    const userId = Number(result.lastInsertRowid);
    try {
      await createSession(request, userId);
    } catch (error) {
      console.error("Account was created, but signup session creation failed.", error);
      return response.status(503).json({
        success: false,
        accountCreated: true,
        error: "Your account was created, but sign-in could not be started. Sign in with your new credentials."
      });
    }
    return response.status(201).json({
      success: true,
      user: {
        id: userId,
        email: credentials.email,
        name: credentials.name
      }
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return response.status(409).json({
        success: false,
        error: "An account with this email already exists"
      });
    }
    throw error;
  }
}

async function login(request, response) {
  const credentials = normalizeAndValidateCredentials(request.body);
  if (credentials.error) {
    return response.status(400).json({
      success: false,
      error: credentials.error
    });
  }

  const user = getUserByEmail(credentials.email);
  const passwordMatches = user
    ? await bcrypt.compare(credentials.password, user.password_hash)
    : false;
  if (!user || !passwordMatches) {
    return response.status(401).json({
      success: false,
      error: "Invalid email or password"
    });
  }

  await createSession(request, user.id);
  return response.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
}

function logout(request, response, next) {
  if (!request.session) {
    return response.json({ success: true });
  }
  return request.session.destroy((error) => {
    if (error) return next(error);
    response.clearCookie("breathe.sid");
    return response.json({ success: true });
  });
}

function requestPasswordReset(request, response) {
  if (
    !request.body ||
    typeof request.body !== "object" ||
    Array.isArray(request.body) ||
    Object.keys(request.body).some((field) => field !== "email") ||
    typeof request.body.email !== "string"
  ) {
    return response.status(400).json({
      success: false,
      error: "A valid email address is required"
    });
  }

  if (
    process.env.NODE_ENV === "production" ||
    (
      process.env.NODE_ENV !== "test" &&
      process.env.PASSWORD_RESET_DEV_TOKEN !== "true"
    )
  ) {
    return response.status(503).json({
      success: false,
      error: "Password reset delivery is not configured"
    });
  }

  const email = request.body.email.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({
      success: false,
      error: "A valid email address is required"
    });
  }

  const user = getUserByEmail(email);
  if (!user) {
    return response.json({
      success: true,
      message: "If the account exists, a local development reset token is available."
    });
  }

  const resetToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  createPasswordResetToken(
    user.id,
    tokenHash,
    Date.now() + PASSWORD_RESET_TTL_MS
  );

  return response.json({
    success: true,
    message: "Use the development reset token to choose a new password.",
    resetToken
  });
}

async function resetPassword(request, response) {
  const body = request.body;
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some((field) => !["token", "password"].includes(field)) ||
    typeof body.token !== "string" ||
    !body.token.trim() ||
    typeof body.password !== "string"
  ) {
    return response.status(400).json({
      success: false,
      error: "A reset token and valid new password are required"
    });
  }

  const passwordBytes = Buffer.byteLength(body.password, "utf8");
  if (body.password.length < 12 || passwordBytes > MAX_PASSWORD_BYTES) {
    return response.status(400).json({
      success: false,
      error: "Password must be at least 12 characters and no more than 72 bytes"
    });
  }

  const tokenHash = crypto.createHash("sha256").update(body.token).digest("hex");
  const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
  const reset = resetPasswordWithToken(tokenHash, passwordHash);
  if (!reset) {
    return response.status(400).json({
      success: false,
      error: "This password reset token is invalid or expired. Request a new one."
    });
  }

  return response.json({
    success: true,
    message: "Password reset successfully. Sign in with your new password."
  });
}

module.exports = {
  login,
  logout,
  normalizeAndValidateCredentials,
  register,
  requestPasswordReset,
  resetPassword
};
