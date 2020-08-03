const server = require('server');
const middlewares = require('./middlewares/index');

server.extend(module.superModule);
server.prepend('PlaceOrder', server.middleware.https, middlewares.placeOrder);

module.exports = server.exports();
