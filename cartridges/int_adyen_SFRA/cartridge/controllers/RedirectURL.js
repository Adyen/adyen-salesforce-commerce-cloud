"use strict";

var server = require('server');
var URLRedirectMgr = require('dw/web/URLRedirectMgr');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
var constants = require('../adyen/config/constants');
server.extend(module.superModule);
server.prepend('Start', function (req, res, next) {
  var origin = URLRedirectMgr.redirectOrigin;
  // Intercept the incoming path request
  if (origin.match(constants.APPLE_DOMAIN_URL)) {
    var applePayDomainAssociation = AdyenConfigs.getApplePayDomainAssociation();
    res.setHttpHeader(dw.system.Response.CONTENT_TYPE, 'text/plain');
    response.getWriter().print(applePayDomainAssociation);
    return null;
  }
  return next();
});
module.exports = server.exports();