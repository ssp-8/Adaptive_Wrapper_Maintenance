const express = require('express');

const Logger = require('../services/Logger');
const ExecutionController = require('../controllers/QueryExecutionController');

const CqlExecutionRouter = express.Router();

CqlExecutionRouter.post('/', async (req, res) => {
  try {
    const controller = new ExecutionController();
    await controller.executeQuery(req);
    const result = controller.result;
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    Logger.logError(`Error executing CQL query: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = CqlExecutionRouter;
