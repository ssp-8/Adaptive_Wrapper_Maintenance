const express = require('express');
const cors = require('cors');

const { mediatorConfig, routePaths } = require('./config/config');

const Logger = require('./services/Logger');
const CqlExecutionRouter = require('./routes/CqlExecutionRouter');

const privateMediatorApp = express();

privateMediatorApp.use(express.json());
privateMediatorApp.use(cors());
privateMediatorApp.use(routePaths.CQL_EXECUTE, CqlExecutionRouter);

privateMediatorApp.listen(mediatorConfig.PRIVATE_MEDIATOR_PORT, () => {
  Logger.logInfo(
    `Private Mediator is running on port ${mediatorConfig.PRIVATE_MEDIATOR_PORT}`
  );
});
