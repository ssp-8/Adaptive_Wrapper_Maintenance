const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const PROJECT_ROOT = path.join(__dirname, '..');

const mediatorConfig = {
  PUBLIC_MEDIATOR_DOMAIN:
    process.env.PUBLIC_MEDIATOR_DOMAIN || 'http://localhost',
  PUBLIC_MEDIATOR_PORT: process.env.PUBLIC_MEDIATOR_PORT || 4000,

  PRIVATE_MEDIATOR_PORT: process.env.PRIVATE_MEDIATOR_PORT || 4001,
  PRIVATE_MEDIATOR_DOMAIN:
    process.env.PRIVATE_MEDIATOR_DOMAIN || 'http://localhost',
};

const routePaths = {
  CQL_EXECUTE: `/cql/execute`,
};

const configFilePaths = {
  CQL_PATH: path.join(PROJECT_ROOT, 'config', 'cql-rules.json'),
  CDM_PATH: path.join(PROJECT_ROOT, 'config', 'cdm.json'),
};

module.exports = {
  mediatorConfig,
  routePaths,
  configFilePaths,
};
