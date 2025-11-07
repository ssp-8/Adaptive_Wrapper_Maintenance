const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const PROJECT_ROOT = path.join(__dirname, "..");

const configFilePaths = {
  CQL_PATH: path.join(PROJECT_ROOT, "config", "cql-rules.json"),
  CDM_PATH: path.join(PROJECT_ROOT, "config", "cdm.json"),
  WRAPPER_CONFIG_PATH: path.join(PROJECT_ROOT, "config", "wrapper-config.json"),
  WRAPPER_INFO: path.join(PROJECT_ROOT, "..", "data", "wrapper-info.json"),
};

const wrapperConfig = {
  WRAPPER_PORT: process.env.WRAPPER_PORT || 4000,
  WRAPPER_HOST: process.env.WRAPPER_HOST || "localhost",
  WRAPPER_NAME: process.env.WRAPPER_NAME || "wrapper-mysql",
  WRAPPER_TYPE: process.env.WRAPPER_NAME.split("-")[1] || "mysql",
};

module.exports = {
  configFilePaths,
  wrapperConfig,
};
