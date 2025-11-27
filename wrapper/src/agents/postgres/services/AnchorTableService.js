const path = require("path");
const fs = require("fs");

class AnchorTableService {
  WEIGHT_SCHEMA_UPDATES = 3;
  WEIGHT_ACCESS_FREQUENCY = 1;
  WEIGHT_COMPLEXITY = 0.5;
  constructor() {
    this._initTables();
  }

  async _initTables() {
    const modelsRootDir = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "adapters",
      "postgres",
      "models"
    );
    const modelFiles = fs
      .readdirSync(modelsRootDir)
      .filter((file) => file.endsWith("Model.js"));

    this.anchorTable = undefined;
    this.anchorTableScore = 0;
    this.tableScores = {};
    this.tableMetadata = {};
    for (const file of modelFiles) {
      const model = require(path.join(modelsRootDir, file));
      const complexity = model.attributes?.length || 0;
      this.tableScores[model.tableName] = {
        schemaUpdates: 0,
        accessFrequency: 0,
        complexity,
      };
      this.tableMetadata[model.tableName] = model;
      if (this.calculateDriftScore(model.tableName) > this.anchorTableScore) {
        this.anchorTable = model.tableName;
        this.anchorTableScore = this.calculateDriftScore(model.tableName);
      }
    }
  }

  calculateDriftScore(tableName) {
    const tableMetrics = this.tableScores[tableName];
    if (!tableMetrics) return 0;
    const { schemaUpdates, accessFrequency, complexity } = tableMetrics;
    const score =
      schemaUpdates * this.WEIGHT_SCHEMA_UPDATES +
      accessFrequency * this.WEIGHT_ACCESS_FREQUENCY +
      complexity * this.WEIGHT_COMPLEXITY;
    return score;
  }

  updateTableMetrics(tableName, updateType) {
    const tableMetrics = this.tableScores[tableName];
    if (!tableMetrics) return;
    if (updateType === "schema") {
      tableMetrics.schemaUpdates += 1;
    } else if (updateType === "access") {
      tableMetrics.accessFrequency += 1;
    }
    const newScore = this.calculateDriftScore(tableName);
    if (newScore > this.anchorTableScore) {
      this.anchorTable = tableName;
      this.anchorTableScore = newScore;
    }
  }

  getAnchorTable() {
    return this.tableMetadata[this.anchorTable];
  }
}

module.exports = AnchorTableService;
