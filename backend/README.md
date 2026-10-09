# Breathe Clean backend

## Run locally

Install dependencies and configure `backend/.env`:

```dotenv
PORT=5001
SESSION_SECRET=replace-with-a-random-secret-at-least-32-bytes-long
PASSWORD_RESET_DEV_TOKEN=true
# Set this to the exact frontend origin when browser requests need cross-origin cookies.
# CORS_ORIGIN=http://localhost:5500
# GOOGLE_MAPS_AIR_QUALITY_API_KEY=configure-locally
# GOOGLE_MAPS_GEOCODING_API_KEY=configure-locally
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

## Account setup and outdoor air quality

Authenticated users can read and update their own setup at
`GET /api/account/setup` and `PUT /api/account/setup`. Registration creates an
empty, incomplete setup record and empty per-user sensor/device state. Setup
records, rooms, preferences, locations, outdoor AQI, and account-scoped
sensor/device/decision state are associated with the session's user; these
routes do not accept a user ID for selecting whose data to access. Sensor and
decision routes return an explicit unavailable response for an account without
sensor readings instead of falling back to shared/demo readings.

Outdoor AQI is requested with `POST /api/account/outdoor-air-quality` and an
empty JSON body. The backend obtains coordinates only from the authenticated
user's saved setup location, returns current Universal AQI from Google Maps
Platform's Air Quality API, and stores the result in that user's setup record.
If the provider key is absent or the provider has no current AQI for the
coordinates, the API returns an error and does not invent or substitute a
value.

To enable this integration, enable the **Air Quality API** in the Google Cloud
project, configure billing as required by Google, and set
`GOOGLE_MAPS_AIR_QUALITY_API_KEY` in the backend environment. Restrict the key
to the Air Quality API and to the backend server's permitted network use (for
example, server IP restrictions where available); do not use browser/referrer
restrictions for a key used by this server. Never expose the key to frontend
code or commit it.

Indian city/address search and GPS reverse-geocoding use the separate
`GOOGLE_MAPS_GEOCODING_API_KEY`. Enable the **Geocoding API**, configure Google
Cloud billing, and restrict this backend-only key to the Geocoding API and the
backend's permitted network use. The frontend sends search text or coordinates
to authenticated backend routes; it never receives either provider key. If
Geocoding is not configured, GPS and manual latitude/longitude setup remain
available, while address search reports that it is unavailable.

During Setup Mode, browser GPS is requested only after the user clicks the
location button. The Geolocation API requires a secure context: use `localhost`
for local development or serve the frontend over HTTPS. Users can alternatively
enter latitude and longitude manually; manually supplied coordinates are
labelled as such and are not represented as GPS-detected. Authenticated
`POST /api/account/location-search` accepts `{ "query": "..." }`, while
`POST /api/account/location-reverse-geocode` accepts latitude and longitude.

## Authentication endpoints

- `POST /api/auth/register` with JSON `{ "name": "...", "email": "...", "password": "..." }`
  creates an account and returns the public user id, name, and normalized email.
- `POST /api/auth/login` with the same JSON fields authenticates the user,
  creates a server-managed SQLite session, and sets the `breathe.sid` cookie.
- `POST /api/auth/password-reset/request` accepts `{ "email": "..." }`.
  Without an email delivery service, production returns `503` and does not
  create a reset token. In local development, set
  `PASSWORD_RESET_DEV_TOKEN=true`; an existing account
  receives a 32-byte random, single-use token in the JSON response. No email is
  sent, and the token is never written to logs; use the returned token directly
  in the confirmation request.
- `POST /api/auth/password-reset/confirm` accepts
  `{ "token": "...", "password": "..." }`. Tokens expire after 15 minutes,
  are stored only as SHA-256 hashes, and cannot be reused.

Passwords must be at least 12 characters and at most 72 UTF-8 bytes. Existing
sensor, device, decision, and simulation endpoints remain public. Future routes
can use `requireAuthenticatedUser` from `src/auth/authMiddleware.js`.
