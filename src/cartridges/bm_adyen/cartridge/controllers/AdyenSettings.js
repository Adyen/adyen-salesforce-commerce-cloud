const server = require('server');
const Transaction = require('dw/system/Transaction');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

server.get('Start', csrfProtection.generateToken, (_req, res, next) => {
  res.render('adyenSettings/settings');
  return next();
});

server.post('Save', csrfProtection.generateToken, (req, res, next) => {
  const requestBody = JSON.parse(req.body);

  requestBody.settings.forEach((setting) => {
    Transaction.wrap(() => {
      AdyenConfigs.setCustomPreference(setting.key, setting.value);
    });
  });
  return next();
});

module.exports = server.exports();
