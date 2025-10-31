const Logger = require('../services/logger');
const CqlExecuteService = require('../services/cql-execute-service');

class CqlExecuteController {
  constructor() {
    this.result = { success: false, errors: [] };
    this.service = new CqlExecuteService();
  }

  async executeQuery(req) {
    try {
      await this.service.loadConfigFiles();
      if (this.service.errors.length > 0) {
        this.result.errors = this.service.errors;
        return;
      }

      this.validateRequest(req);

      if (this.result.errors.length > 0) {
        Logger.logError(`Validation errors: ${this.result.errors.join(', ')}`);
        return this.result;
      }

      const query = req.body;
      Logger.logRequestMetadata(this._hideSensitiveInfo(query.req_meta));

      await this.service.executeCqlQuery(query);

      if (this.service.errors.length > 0) {
        this.result.errors = this.service.errors;
        Logger.logError(
          `CQL Execution errors: ${this.result.errors.join(', ')}`
        );
      } else {
        this.result.success = true;
        this.result.data = this.service.formattedQuery;
      }
    } catch (error) {
      Logger.logError(`Error in CQL execution: ${error.message}`);

      this.result.errors = [error.message];
    }
  }

  validateRequest(req) {
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

    if (!query[this.service.requiredKey]) {
      this.result.errors.push(`'Missing field: ${this.service.requiredKey}`);
      return;
    }

    const method = query[this.service.requiredKey].toUpperCase();
    const requiredFields =
      this.service.cqlRules[this.service.requiredKey][method]
        .requiredParameters;

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
  }

  _hideSensitiveInfo(reqMeta) {
    const hiddenMeta = { ...reqMeta };
    if (hiddenMeta.req_user_token) {
      hiddenMeta.req_user_token = 'HIDDEN';
    }
    return hiddenMeta;
  }
}

module.exports = CqlExecuteController;
