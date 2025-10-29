const express = require('express');
const config = require('./config/config');
const Logger = require('./services/logger');

const cqlExecuteRoute = require('./routes/cql_execute');

const privateMediatorApp = express();

privateMediatorApp.listen(config.PRIVATE_MEDIATOR_PORT, () => {
    Logger.logInfo(`Private Mediator is running on port ${config.PRIVATE_MEDIATOR_PORT}`);
});

privateMediatorApp
