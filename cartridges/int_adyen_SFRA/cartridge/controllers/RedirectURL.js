"use strict";

var server = require('server');
var URLRedirectMgr = require('dw/web/URLRedirectMgr');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var constants = require('../client/default/js/constants');
server.extend(module.superModule);
server.prepend('Start', function (req, res, next) {
  var origin = URLRedirectMgr.redirectOrigin;
  // Intercept the incoming path request
  if (origin.match(constants.APPLE_DOMAIN_URL)) {
    var applePayDomainAssociation = AdyenConfigs.getApplePayDomainAssociation();
    response.getWriter().print(applePayDomainAssociation);
    return null;
  }
  return next();
});
module.exports = server.exports();