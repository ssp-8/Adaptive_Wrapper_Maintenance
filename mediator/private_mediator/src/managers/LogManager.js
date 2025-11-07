const Logger = require('../services/Logger');

class LogManager {
  constructor() {
    this.logger = new Logger();
  }

  logInfo(message) {
    this.logger.logInfo(message);
  }

  logError(message) {
    this.logger.logError(message);
  }

  logRequestMetadata(requestMetadata) {
    this.logger.logRequestMetadata(requestMetadata);
  }
}

module.exports = LogManager;
