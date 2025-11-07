class ExecutionController {
  constructor(adapterInstance) {
    if (!adapterInstance) {
      throw new Error("ExecutionController requires an Adapter instance.");
    }
    this.adapter = adapterInstance;
    this.errors = [];
  }

  async executeQuery(req) {
    this.errors = [];
    try {
      this._validateQuery(req);
      const query = req.body["query"];

      if (!query) {
        throw new Error("No query provided in request body.");
      }

      const executionResult = await this.adapter.executeQuery(query);

      console.log("Execution Result:", executionResult);

      if (!executionResult.success) {
        this.errors = executionResult.errors;
        return { success: false, errors: this.errors };
      }

      return {
        success: true,
        data: executionResult.data,
        errors: [],
      };
    } catch (error) {
      this.errors.push(`Controller error: ${error.message}`);
      return { success: false, errors: this.errors };
    }
  }

  _validateQuery(req) {
    const { query } = req.body;
    if (!query || typeof query !== "object") {
      throw new Error(
        "Invalid query structure. Expected request body to contain a 'query' object."
      );
    }
  }
}

module.exports = ExecutionController;
