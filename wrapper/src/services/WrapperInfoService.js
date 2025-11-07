const { configFilePaths, wrapperConfig } = require("../config/config");
const FileService = require("./FileService");

class WrapperInfoService {
  static async getCurrentWrapperInfo() {
    const currentWrapperName = wrapperConfig.WRAPPER_NAME;
    return await this.getWrapperInfo(currentWrapperName);
  }

  static async getWrapperInfo(wrapperName) {
    const wrapperInfo = await FileService.readFile([
      WrapperInfoService._readFileFormat(configFilePaths.WRAPPER_CONFIG_PATH),
    ]);
    return (
      WrapperInfoService._parseWrapperInfo(wrapperName, wrapperInfo) || null
    );
  }

  static _parseWrapperInfo(wrapperName, wrapperInfo) {
    for (const result of wrapperInfo) {
      if (result.success) {
        return result.value[wrapperName];
      } else {
        return undefined;
      }
    }
  }

  static _readFileFormat(_fileName, isJson = true) {
    return {
      path: _fileName,
      isJson: isJson,
    };
  }
}
module.exports = WrapperInfoService;
