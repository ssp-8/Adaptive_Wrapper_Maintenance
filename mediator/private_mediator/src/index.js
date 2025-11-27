const express = require('express');
const cors = require('cors');

const { mediatorConfig, routePaths } = require('./config/config');

const WrapperLockController = require('./controllers/WrapperLockController');
const QueryExecutionController = require('./controllers/QueryExecutionController');

const Logger = require('./services/Logger');
const CqlExecutionRouter = require('./routes/CqlExecutionRouter');
const WrapperLockRouter = require('./routes/WrapperLockRouter');

const privateMediatorApp = express();

privateMediatorApp.use(express.json());
privateMediatorApp.use(cors());

async function initializeStack() {
  const wrapperLockController = new WrapperLockController();
  await wrapperLockController._initializeWrapperInfo();
  const queryExecutionController = new QueryExecutionController(
    wrapperLockController
  );
  return { wrapperLockController, queryExecutionController };
}

privateMediatorApp.listen(mediatorConfig.PRIVATE_MEDIATOR_PORT, async () => {
  const { wrapperLockController, queryExecutionController } =
    await initializeStack();
  privateMediatorApp.use(
    routePaths.CQL_EXECUTE,
    CqlExecutionRouter(queryExecutionController)
  );
  privateMediatorApp.use(
    routePaths.WRAPPER_LOCK,
    WrapperLockRouter(wrapperLockController)
  );
  Logger.logInfo(
    `Private Mediator is running on port ${mediatorConfig.PRIVATE_MEDIATOR_PORT}`
  );
});
