const server = require('server');
const URLRedirectMgr = require('dw/web/URLRedirectMgr');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

server.extend(module.superModule);

server.prepend('Start', (req, res, next) => {
  const origin = URLRedirectMgr.redirectOrigin;
  // Intercept the incoming path request
  if (
    origin.match('/.well-known/apple-developer-merchantid-domain-association')
  ) {
    const applePayDomainAssociation =
      AdyenConfigs.getApplePayDomainAssociation();
    response.getWriter().print(applePayDomainAssociation);
    return null;
  }
  return next();
});

module.exports = server.exports();
