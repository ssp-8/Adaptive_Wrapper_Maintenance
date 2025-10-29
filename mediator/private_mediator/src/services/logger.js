class Logger {
    static logInfo(message) {
        console.log(`INFO: ${new Date().toISOString()} - ${message}`);
    }

    static logError(message) {
        console.error(`ERROR: ${new Date().toISOString()} - ${message}`);
    }
}

module.exports = Logger;