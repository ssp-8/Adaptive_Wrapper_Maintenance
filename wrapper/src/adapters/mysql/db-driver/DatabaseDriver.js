const mysql = require("mysql2/promise");
const CredentialService = require("../services/CredentialService");

class DatabaseDriver {
  constructor() {
    this.credentials = CredentialService.prototype.getCredentials();
    this.connectionPool = mysql.createPool({
      host: this.credentials.host,
      user: this.credentials.user,
      password: this.credentials.password,
      database: this.credentials.database,
      port: this.credentials.port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  async executeQuery(query, params = []) {
    try {
      console.log("Executing SQL Query:", query, "with params:", params);
      const [rows, fields] = await this.connectionPool.execute(query, params);
      console.log(rows);
      return { success: true, data: rows };
    } catch (error) {
      console.error("Error executing SQL Query:", error);
      return { success: false, errors: [error.message] };
    }
  }
}
module.exports = DatabaseDriver;
