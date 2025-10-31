class Logger {
  static logInfo(message) {
    console.log(`INFO: ${new Date().toISOString()} - ${message}`);
  }

  static logError(message) {
    console.error(`ERROR: ${new Date().toISOString()} - ${message}`);
  }

  static logRequestMetadata(requestMetadata) {
    console.log(
      `REQUEST_METADATA: ${new Date().toISOString()} - ${JSON.stringify(
        requestMetadata
      )}`
    );
  }
}

module.exports = Logger;
