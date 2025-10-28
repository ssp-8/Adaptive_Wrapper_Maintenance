const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    PUBLIC_MEDIATOR_PORT: process.env.PUBLIC_MEDIATOR_PORT || 4000,
    PRIVATE_MEDIATOR_PORT: process.env.PRIVATE_MEDIATOR_PORT || 4001,
}