// log.js - Utility for logging important events

const fs = require('fs');
const path = require('path');

function logEvent(event, details) {
  const logPath = path.join(__dirname, '../logs/events.log');
  const logLine = `[${new Date().toISOString()}] ${event}: ${JSON.stringify(details)}\n`;
  fs.appendFileSync(logPath, logLine);
}

module.exports = { logEvent };