const fs = require('fs');

class FileService {
  static async readFile(files) {
    try {
      const reads = await Promise.allSettled(
        files.map(file =>
          fs.promises.readFile(file.path, file.encoding || 'utf-8')
        )
      );

      const results = reads.map((result, index) => {
        if (result.status === 'fulfilled') {
          if (files[index].isJson) {
            return {
              key: files[index].path,
              success: true,
              value: JSON.parse(result.value),
            };
          } else {
            return {
              key: files[index].path,
              success: true,
              value: result.value,
            };
          }
        } else {
          return {
            key: files[index].path,
            success: false,
            error: `Error reading file at ${files[index].path}: ${
              result.reason?.message || result.reason
            }`,
          };
        }
      });

      return results;
    } catch (error) {
      return [{ success: false, error: `Internal error: ${error.message}` }];
    }
  }
}

module.exports = FileService;
