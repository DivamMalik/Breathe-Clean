const bcrypt = require("bcryptjs");
const {
  createUser,
  getUserByEmail
} = require("../data/database");

const BCRYPT_ROUNDS = 12;
const MAX_PASSWORD_BYTES = 72;

function normalizeAndValidateCredentials(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }

  const unknownField = Object.keys(body).find(
    (field) => !["email", "password"].includes(field)
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

  return { email, password: body.password };
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
  const credentials = normalizeAndValidateCredentials(request.body);
  if (credentials.error) {
    return response.status(400).json({
      success: false,
      error: credentials.error
    });
  }

  const passwordHash = await bcrypt.hash(credentials.password, BCRYPT_ROUNDS);
  try {
    const result = createUser(credentials.email, passwordHash);
    return response.status(201).json({
      success: true,
      user: {
        id: Number(result.lastInsertRowid),
        email: credentials.email
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
      email: user.email
    }
  });
}

module.exports = { login, normalizeAndValidateCredentials, register };
