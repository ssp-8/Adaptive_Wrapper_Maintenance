const dotenv = require("dotenv");
dotenv.config();

class CredentialService {
  getCredentials() {
    return {
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      authSource: process.env.DB_AUTH_SOURCE || "admin",
    };
  }
}

module.exports = CredentialService;
