const Logger = require('../services/Logger');

class LogManager {
  constructor() {
    this.logger = new Logger();
  }

  logInfo(message) {
    Logger.logInfo(message);
  }

  logError(message) {
    Logger.logError(message);
  }

  logRequestMetadata(requestMetadata) {
    Logger.logRequestMetadata(requestMetadata);
  }
}

module.exports = LogManager;
