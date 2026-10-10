const { getUserSetup } = require("../data/database");

function getAccountControlMode(userId, roomName) {
  const setup = getUserSetup(userId)?.setup;
  if (setup?.controlMode === "AUTO" || setup?.controlMode === "MANUAL") {
    return setup.controlMode;
  }
  const room = setup?.rooms?.find((candidate) => candidate.name === roomName);
  return room?.mode === "MANUAL" ? "MANUAL" : "AUTO";
}

module.exports = { getAccountControlMode };
