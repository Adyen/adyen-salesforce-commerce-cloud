const server = require('server');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

server.get('Start', csrfProtection.generateToken, (req, res, next) => {
  res.render('adyenSettings/settings', {
    merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
    apiKey: AdyenConfigs.getAdyenApiKey(),
    mode: AdyenConfigs.getAdyenEnvironment(),
  });
  return next();
});

module.exports = server.exports();
