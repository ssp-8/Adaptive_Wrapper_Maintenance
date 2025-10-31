const express = require('express');

const Logger = require('../services/logger');
const CqlExecuteController = require('../controllers/cql-execute-controller');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const controller = new CqlExecuteController();
    await controller.executeQuery(req);
    const result = controller.result;
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    Logger.logError(`Error executing CQL query: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
