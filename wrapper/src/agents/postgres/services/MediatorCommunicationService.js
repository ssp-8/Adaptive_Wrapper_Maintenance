const dotenv = require("dotenv");
const fetch = require("node-fetch");
dotenv.config();

class MediatorCommunicationService {
  async lockWrapper() {
    const mediatorUrl = `http://${process.env.MEDIATOR_HOST}:${process.env.MEDIATOR_PORT}/wrapper/lock`;
    console.log(`Locking wrapper via mediator at ${mediatorUrl}`);
    await fetch(mediatorUrl, {
      method: "POST",
      body: JSON.stringify({
        wrapperName: process.env.WRAPPER_NAME,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async unlockWrapper() {
    const mediatorUrl = `http://${process.env.MEDIATOR_HOST}:${process.env.MEDIATOR_PORT}/wrapper/unlock`;
    console.log(`Unlocking wrapper via mediator at ${mediatorUrl}`);
    await fetch(mediatorUrl, {
      method: "POST",
      body: JSON.stringify({
        wrapperName: process.env.WRAPPER_NAME,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

module.exports = MediatorCommunicationService;
