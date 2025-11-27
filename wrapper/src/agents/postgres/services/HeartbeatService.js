class HeartbeatService {
  constructor({ dbDriver, anchorTableService }) {
    this.dbDriver = dbDriver;
    this.anchorTableService = anchorTableService;
  }

  hearBeatCallback() {
    const anchorTable = this.anchorTableService.getAnchorTable();
    const attributes = Object.values(anchorTable.mapping).join(", ");
    const heartBeat = `SELECT ${attributes} FROM ${anchorTable.tableName} LIMIT 1;`;

    const result = this.dbDriver.executeQuery(heartBeat);
    console.log(
      "Heartbeat executed on anchor table:",
      anchorTable.tableName,
      "Result:",
      result
    );
    return result;
  }
}

module.exports = HeartbeatService;
