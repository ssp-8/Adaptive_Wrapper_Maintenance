const LogManager = require('../managers/LogManager');
const QueryExecutionManager = require('../managers/QueryExecutionManager');
const ReadFileService = require('../services/FileService');
const { configFilePaths } = require('../config/config');
const Logger = require('../services/Logger');

class ExecutionController {
  constructor(wrapperLockController) {
    this.result = { success: false, errors: [] };
    this.logManager = new LogManager();
    this.wrapperLockController = wrapperLockController;
    this.executionManager = new QueryExecutionManager(wrapperLockController);
  }

  async executeQuery(req) {
    try {
      await this._getCqlRules();
      console.log('CQL rules loaded successfully.');
      this._validateRequest(req);
      if (this.result.errors.length > 0) {
        console.log('Request validation failed:', this.result.errors);
        return this.result;
      }
      console.log('Request validated successfully.');
      const query = req.body;
      const execResult = await this.executionManager.executeCqlQuery(query);

      if (!execResult.success) {
        this.result.errors = execResult.errors;
        return this.result;
      }

      this.result.success = true;
      this.result.data = execResult.data;

      // Log request metadata
      if (query.req_meta) {
        const safeMeta = this._hideSensitiveInfo(query.req_meta);
        this.logManager.logRequestMetadata(safeMeta);
      }
    } catch (error) {
      this.result.errors.push(`Internal server error: ${error.message}`);
    }
    return this.result;
  }

  async _getCqlRules() {
    const filesToRead = [{ path: configFilePaths.CQL_PATH, isJson: true }];
    const result = await ReadFileService.readFile(filesToRead);
    for (const res of result) {
      if (!res.success) {
        this.result.errors.push(res.error);
        return this.result;
      } else {
        this.cqlRules = res.value;
      }
    }
  }

  _validateRequest(req) {
    /*
        Format of the query object:
        {
            "http_method": "GET|POST|PUT|DELETE",
            "entity": "User|Article|UserAction, etc.",
            "query": "firstName='Sumeet' AND age>25",
            "sort": "price:DESC",
            "limit": "100",
            "payload": "{ 'firstName': 'Sumeet', 'age': 26 }",
            "req_meta": {
                "req_ip": "IP address of the requester",
                "req_device_type": "Device type of the requester",
                "req_browser": "Browser info of the requester",
                "req_user_token": "Authentication token of the requester"
            }
        }
    */

    if (!req.body) {
      this.result.errors.push('Request body is missing');
      return;
    }

    const query = req.body;

    if (typeof query !== 'object') {
      this.result.errors.push('Query should be a JSON object');
      return;
    }

    const requiredKey = this.cqlRules.cqlKeys[0];

    if (!query[requiredKey]) {
      this.result.errors.push(`'Missing field: ${requiredKey}`);
      return;
    }

    const method = query[requiredKey].toUpperCase();
    const requiredFields =
      this.cqlRules[requiredKey][method].requiredParameters;

    if (!requiredFields) {
      this.result.errors.push(`Unsupported query method: ${method}`);
    } else {
      requiredFields.forEach(field => {
        if (!query.hasOwnProperty(field)) {
          this.result.errors.push(`Missing field for ${method}: ${field}`);
        } else if (
          field === 'req_meta' &&
          typeof query[field] !== 'object' &&
          !query[field].hasOwnProperty('req_user_token')
        ) {
          this.result.errors.push(`Field req_meta should be a JSON object`);
        }
      });
    }
    console.log('Request validation completed.');
  }

  _hideSensitiveInfo(reqMeta) {
    const hiddenMeta = { ...reqMeta };
    if (hiddenMeta.req_user_token) {
      hiddenMeta.req_user_token = 'HIDDEN';
    }
    return hiddenMeta;
  }
}

module.exports = ExecutionController;
