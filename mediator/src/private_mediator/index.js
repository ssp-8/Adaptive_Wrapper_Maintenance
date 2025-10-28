const express = require('express');
const config = require('./services/EnvConfig');
const Logger = require('./services/Logger');

const publicMediatorApp = express();
const privateMediatorApp = express();

publicMediatorApp.listen(config.PUBLIC_MEDIATOR_PORT, () => {
    Logger.logInfo(`Public Mediator is running on port ${config.PUBLIC_MEDIATOR_PORT}`);
});

privateMediatorApp.listen(config.PRIVATE_MEDIATOR_PORT, () => {
    Logger.logInfo(`Private Mediator is running on port ${config.PRIVATE_MEDIATOR_PORT}`);
});