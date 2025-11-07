const TranslationService = require("./services/TranslationService");
const DatabaseDriver = require("./db-driver/DatabaseDriver");

class Adapter {
  constructor(translatorInstance, dbDriverInstance) {
    this.translator = translatorInstance;
    this.dbDriver = dbDriverInstance;
  }
  async executeQuery(query) {
    try {
      const operation = this.translator.translateQuery(query);

      // connection and disconnection is handled inside executeQuery of DatabaseDriver
      const executionResult = await this.dbDriver.executeQuery(operation);

      if (!executionResult.success) {
        return { success: false, errors: executionResult.errors };
      }

      const translatedResult = this.translator.translateResult(
        executionResult.data
      );

      return { success: executionResult.success, data: translatedResult };
    } catch (error) {
      return { success: false, errors: [error.message] };
    }
  }
}

module.exports = Adapter;
