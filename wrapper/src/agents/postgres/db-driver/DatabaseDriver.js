const { Pool } = require("pg");
const CredentialService = require("../services/CredentialService");

class DatabaseDriver {
  constructor() {
    this.credentials = CredentialService.prototype.getCredentials();
    this.pool = new Pool({
      host: this.credentials.host,
      user: this.credentials.user,
      password: this.credentials.password,
      database: this.credentials.database,
      port: this.credentials.port,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async executeQuery(query, params = []) {
    try {
      console.log("Executing SQL Query:", query, "with params:", params);
      const result = await this.pool.query(query, params);
      console.log("Query result object:", result);
      console.log("SQL Query Result:", result.rows);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error("Error executing SQL Query:", error);
      return { success: false, errors: [error.message] };
    }
  }
}
module.exports = DatabaseDriver;
