const crypto = require("node:crypto");

class FingerprintService {
  constructor({ dbDriver, anchorTableService }) {
    this.dbDriver = dbDriver;
    this.fingerprint = "";
    this.anchorTableService = anchorTableService;
    this.metaData = {};
  }

  async fingerprintCallback() {
    const metadataQuery = `
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name IN (${Object.keys(
              this.anchorTableService.tableScores
            )
              .map((t) => `'${t}'`)
              .join(",")})
            ORDER BY table_name, ordinal_position;
        `;
    try {
      console.log("Executing fingerprint query:", metadataQuery);
      const result = await this.dbDriver.executeQuery(metadataQuery);
      this.metaData = result.data;
      let newFingerprint = crypto
        .createHash("sha256")
        .update(JSON.stringify(result.data))
        .digest("hex");
      return newFingerprint;
    } catch (error) {
      console.error("Error executing fingerprint query:", error);
    }
  }
}

module.exports = FingerprintService;
