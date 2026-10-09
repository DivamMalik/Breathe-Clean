require("dotenv").config();

const express = require("express");
const cors = require("cors");
const sensorRoutes = require("./routes/sensorRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const decisionRoutes = require("./routes/decisionRoutes");
const simulationRoutes = require("./routes/simulationRoutes");
const { allowedValues } = require("./data/deviceState");
const { thresholds } = require("./services/environmentRules");
const { restorePersistedState } = require("./data/restorePersistedState");
const authRoutes = require("./routes/authRoutes");
const { createSessionMiddleware } = require("./auth/sessionMiddleware");

restorePersistedState();

const app = express();

const configuredCorsOrigin = process.env.CORS_ORIGIN;
app.use(cors(configuredCorsOrigin
  ? { origin: configuredCorsOrigin, credentials: true }
  : undefined));
app.use(express.json());
app.use(createSessionMiddleware());

app.get("/api/health", (_request, response) => {
  response.json({
    success: true,
    message: "Breathe Clean backend is running",
    decisionModes: allowedValues.mode,
    decisionThresholds: thresholds
  });
});

app.use("/api/sensors", sensorRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/decision", decisionRoutes);
app.use("/api/simulation", simulationRoutes);
app.use("/api/auth", authRoutes);

app.use((_request, response) => {
  response.status(404).json({ success: false, error: "Route not found" });
});

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return response.status(400).json({ success: false, error: "Invalid JSON request body" });
  }

  console.error(error);
  return response.status(500).json({ success: false, error: "Internal server error" });
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
  console.log(`Breathe Clean backend listening at http://localhost:${port}`);
});
