const FileService = require('../services/FileService');
const { configFilePaths } = require('../config/config');

class WrapperLockController {
  constructor() {}

  async _initializeWrapperInfo() {
    const filesToRead = [
      { path: configFilePaths.WRAPPER_CONFIG_PATH, isJson: true },
    ];

    const results = await FileService.readFile(filesToRead);

    const wrapperInfoResult = results.find(
      result => result.key === configFilePaths.WRAPPER_CONFIG_PATH
    );
    console.log('Wrapper Info Result:', wrapperInfoResult);

    if (wrapperInfoResult && wrapperInfoResult.success) {
      this.wrapperInfo = wrapperInfoResult.value;
    } else {
      this.wrapperInfo = {};
    }
  }

  async lockWrapper(req) {
    const wrapperName = req.body.wrapperName;
    if (Object.keys(this.wrapperInfo).includes(wrapperName)) {
      this.wrapperInfo[wrapperName].enabled = false;
      // Here, you would typically write back to the file to persist the change
      return { success: true, message: JSON.stringify(this.wrapperInfo) };
    } else {
      return { success: false, message: `Wrapper ${wrapperName} not found.` };
    }
  }

  async unlockWrapper(req) {
    const wrapperName = req.body.wrapperName;
    if (Object.keys(this.wrapperInfo).includes(wrapperName)) {
      this.wrapperInfo[wrapperName].enabled = true;
      // Here, you would typically write back to the file to persist the change
      return { success: true, message: JSON.stringify(this.wrapperInfo) };
    } else {
      return { success: false, message: `Wrapper ${wrapperName} not found.` };
    }
  }
}
module.exports = WrapperLockController;
