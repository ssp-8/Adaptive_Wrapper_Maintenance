const express = require('express');

const Logger = require('../services/Logger');
const ExecutionController = require('../controllers/QueryExecutionController');

const CqlExecutionRouter = controllerInstance => {
  const router = express.Router();
  router.post('/', async (req, res) => {
    try {
      console.log('Received CQL execution request.');
      await controllerInstance.executeQuery(req);
      const result = controllerInstance.result;
      controllerInstance.result = { success: false, errors: [] }; // Reset for next request
      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      Logger.logError(`Error executing CQL query: ${error.message}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  return router;
};

module.exports = CqlExecutionRouter;
