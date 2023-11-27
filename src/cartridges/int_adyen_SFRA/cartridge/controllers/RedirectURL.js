const server = require('server');
const URLRedirectMgr = require('dw/web/URLRedirectMgr');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const constants = require('../client/default/js/constants');

server.extend(module.superModule);

server.prepend('Start', (req, res, next) => {
  const origin = URLRedirectMgr.redirectOrigin;
  // Intercept the incoming path request
  if (origin.match(constants.APPLE_DOMAIN_URL)) {
    const applePayDomainAssociation =
      AdyenConfigs.getApplePayDomainAssociation();
    res.setHttpHeader(dw.system.Response.CONTENT_TYPE, 'text/plain');
    response.getWriter().println(applePayDomainAssociation);
    return null;
  }
  return next();
});

module.exports = server.exports();
