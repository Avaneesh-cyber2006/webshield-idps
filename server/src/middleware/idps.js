/**
 * IDPS Middleware Factory
 * Creates middleware that uses the IDPS inspector
 */
let inspectorInstance = null;

function createIDPSMiddleware(io) {
  if (!inspectorInstance) {
    const IDPSInspector = require('../idps/services/inspector');
    inspectorInstance = new IDPSInspector(io);
  }

  return (req, res, next) => {
    inspectorInstance.inspect(req, res, next);
  };
}

function getInspector() {
  return inspectorInstance;
}

module.exports = {
  createIDPSMiddleware,
  getInspector
};
