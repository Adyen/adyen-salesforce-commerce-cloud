'use strict';
var server = require('server');
server.extend(module.superModule);

server.prepend('Begin',
    server.middleware.https,
    function(req, res, next) {
        if(req.currentCustomer.raw.isAuthenticated()){
            require('int_adyen/cartridge/scripts/UpdateSavedCards').updateSavedCards({CurrentCustomer : req.currentCustomer.raw});
        }
        next();
    });

module.exports = server.exports();