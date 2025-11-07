const mongoose = require("mongoose");
const CredentialService = require("../services/CredentialService");

class DatabaseDriver {
  constructor() {
    this.credentials = CredentialService.prototype.getCredentials();
    this.uri = this._buildMongoUri(this.credentials);
    console.log(this.uri);
    this.isConnected = false;
  }

  _buildMongoUri(credentials) {
    // encode user and password to avoid breaking the URI when they contain
    // special characters like '@', ':' or '/'.
    const user = credentials.user ? encodeURIComponent(credentials.user) : "";
    const password = credentials.password
      ? encodeURIComponent(credentials.password)
      : "";
    const auth = user ? `${user}:${password}@` : "";

    return `mongodb://${auth}${credentials.host}:${credentials.port}/${credentials.database}?authSource=${credentials.authSource}`;
  }

  async connect() {
    try {
      await mongoose.connect(this.uri);
      this.isConnected = true;
      console.log("MongoDB connection established.");
    } catch (error) {
      console.error("MongoDB Connection Failed:", error.message);
    }
  }

  async disconnect() {
    try {
      if (this.isConnected) {
        await mongoose.disconnect();
        this.isConnected = false;
        console.log("MongoDB connection disconnected.");
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async executeQuery(operation) {
    try {
      await this.connect();

      console.log("Executing MongoDB operation.");

      const result = await operation;

      return { success: true, data: result };
    } catch (error) {
      console.error("Error executing MongoDB operation:", error.message);
      return { success: false, errors: [error.message] };
    }
  }
}

module.exports = DatabaseDriver;
