class WrapperCommunicationService {
  constructor(cdmSchema, wrapperConfig, entityKey) {
    this.entityKey = entityKey;
    this.cdmSchema = cdmSchema;
    this.wrapperConfig = wrapperConfig;
  }

  prepareWrapperRequests(formattedQuery) {
    const wrapperRequests = [];
    const entity = formattedQuery[this.entityKey];

    const dataSources = this._determineDataSources(entity);
    for (const ds of dataSources) {
      const wrapperReq = this._prepareWrapperRequest(
        formattedQuery,
        this.wrapperConfig[ds]
      );
      wrapperRequests.push(wrapperReq);
    }

    return { wrapperRequests, dataSources };
  }

  aggregateResults(results) {
    const aggregatedData = [];
    const errors = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const resData = result.value;
        if (resData.success) {
          aggregatedData.push(...resData.data);
        } else {
          errors.push(
            `Data source ${index} errors: ${resData.errors.join(', ')}`
          );
        }
      } else {
        errors.push(
          `Data source ${index} failed: ${
            result.reason?.message || result.reason
          }`
        );
      }
    });
    return {
      success: errors.length === 0,
      data: aggregatedData,
      errors: errors,
    };
  }

  _determineDataSources(entity) {
    return this.cdmSchema.definitions[entity].dataSources || [];
  }

  _prepareWrapperRequest(formattedQuery, wrapperConfig) {
    const wrapperRequest = {};
    const wrapperUrl = `${wrapperConfig.protocol}://${wrapperConfig.host}:${wrapperConfig.port}${wrapperConfig.cqlEndpoint}`;
    wrapperRequest.url = wrapperUrl;
    wrapperRequest.method = 'POST';
    wrapperRequest.headers = {
      'Content-Type': 'application/json',
    };
    wrapperRequest.timeout = wrapperConfig.timeout || 5000;
    wrapperRequest.retryAttempts = wrapperConfig.retryAttempts || 2;

    wrapperRequest.body = formattedQuery;
    return wrapperRequest;
  }
}
module.exports = WrapperCommunicationService;
