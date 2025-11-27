const express = require('express');

const wrapperLockRouter = wrapperLockControllerInstance => {
  const router = express.Router();
  router.post('/lock', async (req, res) => {
    try {
      console.log('Received request to lock wrapper.');
      const results = await wrapperLockControllerInstance.lockWrapper(req);
      console.log('Lock results:', wrapperLockControllerInstance.wrapperInfo);
      if (results.success) {
        res.status(200).send({ message: results.message });
      } else {
        res.status(400).send({ message: results.message });
      }
      //
    } catch (error) {
      console.error(`Error locking wrapper: ${error.message}`);
      res.status(500).send({ error: 'Internal Server Error' });
    }
  });

  router.post('/unlock', async (req, res) => {
    try {
      const results = await wrapperLockControllerInstance.unlockWrapper(req);
      console.log('Received request to unlock wrapper.');
      console.log('Unlock results:', wrapperLockControllerInstance.wrapperInfo);
      if (results.success) {
        res.status(200).send({ message: results.message });
      } else {
        res.status(400).send({ message: results.message });
      }
    } catch (error) {
      console.error(`Error unlocking wrapper: ${error.message}`);
      res.status(500).send({ error: 'Internal Server Error' });
    }
  });

  return router;
};

module.exports = wrapperLockRouter;
