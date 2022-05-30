const server = require('server');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

server.get('Start', csrfProtection.generateToken, (_req, res, next) => {
  res.render('adyenSettings/settings');
  return next();
});

server.post('Save', csrfProtection.generateToken, (req, res, next) => {
  const requestBody = JSON.parse(req.body);
  Logger.getLogger('Adyen').error(typeof requestBody.adyenSFRA6Compatibility);
  Logger.getLogger('Adyen').error(requestBody.adyenSFRA6Compatibility);
  const sfra6CompatibilityBoolean =
    requestBody.adyenSFRA6Compatibility === 'true';
  Logger.getLogger('Adyen').error(sfra6CompatibilityBoolean);
  Transaction.begin();
  AdyenConfigs.setAdyenSFRA6Compatibility(sfra6CompatibilityBoolean);
  Transaction.commit();
  return next();
});

module.exports = server.exports();
