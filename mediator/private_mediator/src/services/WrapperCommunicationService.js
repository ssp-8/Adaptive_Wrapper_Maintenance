class WrapperCommunicationService {
  constructor(cdmSchema, entityKey, wrapperLockController) {
    this.entityKey = entityKey;
    this.cdmSchema = cdmSchema;
    this.wrapperLockController = wrapperLockController;
  }

  prepareWrapperRequests(formattedQuery) {
    const wrapperRequests = [];
    const entity = formattedQuery[this.entityKey];

    const dataSources = this._determineDataSources(entity);
    for (const ds of dataSources) {
      const wrapperReq = this._prepareWrapperRequest(
        formattedQuery,
        this.wrapperLockController.wrapperInfo[ds]
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
        errors.push('Internal Server Error');
      }
    });
    if (aggregatedData.length > 0) {
      return { success: true, data: aggregatedData, errors: [] };
    }
    return {
      success: false,
      data: [],
      errors: errors,
    };
  }

  _determineDataSources(entity) {
    const dataSources = [];
    console.log(this.cdmSchema.definitions[entity]);
    console.log(
      'Wrapper Info in WrapperCommunicationService:',
      this.wrapperLockController.wrapperInfo
    );
    for (const ds of this.cdmSchema.definitions[entity].dataSources || []) {
      const lockStatus = this.wrapperLockController.wrapperInfo[ds];
      console.log('Lock status for', ds, ':', lockStatus);
      if (lockStatus && lockStatus.enabled) {
        dataSources.push(ds);
      }
    }
    return dataSources;
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

    wrapperRequest.body = { query: formattedQuery };
    return wrapperRequest;
  }
}
module.exports = WrapperCommunicationService;
