const express = require("express");
const cors = require("cors");
const path = require("path");

const { wrapperConfig } = require("./config/config");
const ExecutionController = require("./controllers/ExecutionController");
const ExecutionRouter = require("./routes/ExecutionRouter");

function initializeAdapterStack(wrapperType) {
  const type = wrapperType.toLowerCase();

  try {
    const adapterPath = `./adapters/${type}/${type}Adapter`;
    const driverPath = `./adapters/${type}/db-driver/DatabaseDriver`;
    const translatorPath = `./adapters/${type}/services/TranslationService`;
    const agentPath = `./agents/${type}/${type}Agent`;

    const SpecificAdapter = require(adapterPath);
    const DatabaseDriver = require(driverPath);
    const TranslatorService = require(translatorPath);
    const SpecificAgent = require(agentPath);

    const translatorInstance = new TranslatorService();
    const dbDriverInstance = new DatabaseDriver();
    const agentInstance = new SpecificAgent(dbDriverInstance);

    const adapterInstance = new SpecificAdapter(
      translatorInstance,
      dbDriverInstance
    );

    return adapterInstance;
  } catch (error) {
    console.error(
      `FATAL ERROR: Could not initialize adapter stack for type '${wrapperType}'.`
    );
    throw error;
  }
}

const adapterInstance = initializeAdapterStack(wrapperConfig.WRAPPER_TYPE);

const controllerInstance = new ExecutionController(adapterInstance);

const wrapperApp = express();
const port = wrapperConfig.WRAPPER_PORT;

wrapperApp.use(express.json());
wrapperApp.use(cors());

wrapperApp.use("/cql/execute", ExecutionRouter(controllerInstance));

wrapperApp.listen(port, () => {
  console.log(
    `Wrapper server is running on port ${port} for type: ${wrapperConfig.WRAPPER_TYPE}`
  );
});
