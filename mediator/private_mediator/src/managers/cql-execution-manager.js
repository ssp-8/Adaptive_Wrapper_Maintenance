const CqlTranslationService = require('../services/translation-service');
const CqlExecutionService = require('../services/execution-service');
const WrapperCommunicationService = require('../services/wrapper-communication-service');
const ReadFileService = require('../services/readfile-service');
const Logger = require('../services/logger');

const { configFilePaths } = require('../config/config');

class CQLExecutionManager {
  constructor() {
    this.cqlRules = undefined;
    this.cdmSchema = undefined;
    this.wrapperConfig = undefined;
  }

  async executeCqlQuery(query) {
    const areConfigsLoaded = await this.loadConfigFiles();
    if (!areConfigsLoaded.success) {
      return { success: false, errors: areConfigsLoaded.errors };
    }

    const translationService = new CqlTranslationService(
      this.cqlRules,
      this.cdmSchema
    );

    const tResult = await translationService.translateQuery(query);
    if (!tResult.success) {
      return { success: false, errors: tResult.errors };
    }

    const formattedQuery = tResult.formattedQuery;
    const wrapperService = new WrapperCommunicationService(
      this.cdmSchema,
      this.wrapperConfig,
      this.cqlRules.cqlEntityKey
    );

    const { wrapperRequests, dataSources } =
      wrapperService.prepareWrapperRequests(formattedQuery);

    const executionPromises = dataSources.map((ds, index) => {
      const wrapperRequest = wrapperRequests[index];
      return CqlExecutionService.executeWrapperRequest(wrapperRequest);
    });

    const results = await Promise.allSettled(executionPromises);
    const finalResult = wrapperService.aggregateResults(results);

    if (!finalResult.success) {
      return { success: false, errors: finalResult.errors };
    } else {
      return { success: true, data: finalResult.data };
    }
  }

  async loadConfigFiles() {
    try {
      const filesToRead = [
        { path: configFilePaths.CQL_PATH, isJson: true },
        { path: configFilePaths.CDM_PATH, isJson: true },
        { path: configFilePaths.WRAPPER_CONFIG_PATH, isJson: true },
      ];

      const results = await ReadFileService.readFile(filesToRead);
      for (const result of results) {
        if (!result.success) {
          return { success: false, errors: [result.error] };
        } else {
          if (result.key === configFilePaths.CQL_PATH) {
            this.cqlRules = result.value;
          } else if (result.key === configFilePaths.CDM_PATH) {
            this.cdmSchema = result.value;
          } else if (result.key === configFilePaths.WRAPPER_CONFIG_PATH) {
            this.wrapperConfig = result.value;
          }
        }
      }
      return { success: true };
    } catch (error) {
      console.error(`Error loading config files: ${error.message}`);
      return { success: false, errors: [error.message] };
    }
  }
}

module.exports = CQLExecutionManager;
