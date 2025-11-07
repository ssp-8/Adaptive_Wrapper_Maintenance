const express = require("express");

const ExecutionRouter = (controllerInstance) => {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const result = await controllerInstance.executeQuery(req);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error(`Error executing query: ${error.message}`);
      res
        .status(500)
        .json({ success: false, errors: ["Internal Server Error"] });
    }
  });

  return router;
};

module.exports = ExecutionRouter;
