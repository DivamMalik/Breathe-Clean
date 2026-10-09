# Breathe Clean backend

## Run locally

Install dependencies and configure `backend/.env`:

```dotenv
PORT=5001
SESSION_SECRET=replace-with-a-random-secret-at-least-32-bytes-long
# Set this to the exact frontend origin when browser requests need cross-origin cookies.
# CORS_ORIGIN=http://localhost:3000
```

Generate a session secret locally, for example with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep the generated value private and do not commit `.env`. Start the backend from
this directory with `npm start`, or use `npm run dev` while developing. The
server requires `SESSION_SECRET` and exits on startup if it is missing or shorter
than 32 bytes. In production, serve over HTTPS so the session cookie's `Secure`
attribute is enabled.

When using a browser frontend on a different origin, set `CORS_ORIGIN` to that
single exact origin and send requests with credentials enabled. The session
cookie is HttpOnly, SameSite=Lax, and expires after eight hours.

## Authentication endpoints

- `POST /api/auth/register` with JSON `{ "email": "...", "password": "..." }`
  creates an account and returns the public user id and normalized email.
- `POST /api/auth/login` with the same JSON fields authenticates the user,
  creates a server-managed SQLite session, and sets the `breathe.sid` cookie.

Passwords must be at least 12 characters and at most 72 UTF-8 bytes. Existing
sensor, device, decision, and simulation endpoints remain public. Future routes
can use `requireAuthenticatedUser` from `src/auth/authMiddleware.js`.
