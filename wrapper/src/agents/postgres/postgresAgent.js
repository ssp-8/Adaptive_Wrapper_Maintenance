const scheduler = require("node-schedule");
const FingerprintService = require("./services/FingerprintService");
const HeartbeatService = require("./services/HeartbeatService");
const MediatorCommunicationService = require("./services/MediatorCommunicationService");
const AnchorTableService = require("./services/AnchorTableService");
const CorrectionService = require("./services/CorrectionService");
const FileService = require("../../services/FileService");

class PostgresAgent {
  constructor(dbDriver) {
    this.dbDriver = dbDriver;
    this.enableDetection = true;
    this._initializeServices();

    this.initializeHeartbeating();
    this.initializeFingerprinting();
  }

  _initializeServices() {
    this.anchorTableService = new AnchorTableService();
    this.heartBeatService = new HeartbeatService({
      dbDriver: this.dbDriver,
      anchorTableService: this.anchorTableService,
    });
    this.finerprintService = new FingerprintService({
      dbDriver: this.dbDriver,
      anchorTableService: this.anchorTableService,
    });
    this.mediatorCommunicationService = new MediatorCommunicationService();
    this.correctionService = new CorrectionService();
  }

  initializeHeartbeating() {
    // every 10 seconds
    const heartBeatJob = scheduler.scheduleJob("*/300 * * * * *", async () => {
      if (this.enableDetection) {
        console.log("Executing Heartbeat Job");
        const hearbeatResult = await this.heartBeatService.hearBeatCallback();
        if (!hearbeatResult.success) {
          this.enableDetection = false;
          const start = process.hrtime.bigint();
          await this.mediatorCommunicationService.lockWrapper();
          await this.finerprintService.fingerprintCallback();
          const correctionSchema =
            await this.correctionService.triggerCorrection(
              this.anchorTableService.tableMetadata,
              this.finerprintService.metaData
            );

          await this.mediatorCommunicationService.unlockWrapper();
          await this.correctionService._writeCorrectedSchemaToFile(
            correctionSchema.schema
          );
          const end = process.hrtime.bigint();
          console.log(
            `Heartbeat correction process took ${
              (end - start) / BigInt(1e6)
            } ms`
          );
          FileService.writeFile(
            "./correction_times.txt",
            `Heartbeat Correction took ${(end - start) / BigInt(1e6)} ms\n`,
            "a"
          );
          this.enableDetection = true;
        }
      }
    });
  }

  initializeFingerprinting() {
    // every 5 minutes
    const fingerprintJob = scheduler.scheduleJob("*/5 * * * * *", async () => {
      await this._fingerprintCallBack();
    });
  }

  async _fingerprintCallBack() {
    if (this.enableDetection) {
      console.log("Executing Fingerprint Job");

      const newFingerprint = await this.finerprintService.fingerprintCallback();
      if (
        newFingerprint &&
        this.finerprintService.fingerprint &&
        newFingerprint !== this.finerprintService.fingerprint
      ) {
        this.enableDetection = false;
        const start = process.hrtime.bigint();
        await this.mediatorCommunicationService.lockWrapper();
        const correctedSchemaResult =
          await this.correctionService.triggerCorrection(
            this.anchorTableService.tableMetadata,
            this.finerprintService.metaData
          );
        if (correctedSchemaResult.success) {
          console.log(
            "Correction successful. Updated schema:",
            correctedSchemaResult.updatedSchema
          );

          await this.mediatorCommunicationService.unlockWrapper();
          await this.correctionService._writeCorrectedSchemaToFile(
            correctedSchemaResult.schema
          );
          const end = process.hrtime.bigint();
          console.log(
            `Correction process took ${(end - start) / BigInt(1e6)} ms`
          );
          FileService.writeFile(
            "./correction_times.txt",
            `Correction took ${(end - start) / BigInt(1e6)} ms\n`,
            "a"
          );
          this.enableDetection = true;
          this.finerprintService.fingerprint = newFingerprint;
        } else {
          console.error(
            "Correction failed with errors:",
            correctedSchemaResult.errors
          );
        }
      } else {
        this.finerprintService.fingerprint = newFingerprint;
      }
      console.log(
        "Updated Fingerprint:",
        this.finerprintService.fingerprint,
        "->",
        newFingerprint
      );
    }
  }

  updateTableScore(tableName, scoreType) {
    this.anchorTableService.updateTableMetrics(tableName, scoreType);
  }
}

module.exports = PostgresAgent;
