require("dotenv").config();

const express = require("express");
const cors = require("cors");
const sensorRoutes = require("./routes/sensorRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const decisionRoutes = require("./routes/decisionRoutes");
const simulationRoutes = require("./routes/simulationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    success: true,
    message: "Breathe Clean backend is running"
  });
});

app.use("/api/sensors", sensorRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/decision", decisionRoutes);
app.use("/api/simulation", simulationRoutes);

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
