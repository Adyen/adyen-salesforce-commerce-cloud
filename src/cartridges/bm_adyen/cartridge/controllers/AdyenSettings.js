const server = require('server');
const Transaction = require('dw/system/Transaction');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const Logger = require('dw/system/Logger');

server.get('Start', csrfProtection.generateToken, (_req, res, next) => {
  res.render('adyenSettings/settings');
  return next();
});

server.post('Save', server.middleware.https, (req, res, next) => {
  const requestBody = JSON.parse(req.body);

  try{
    requestBody.settings.forEach((setting) => {
      Transaction.wrap(() => {
        AdyenConfigs.setCustomPreference(setting.key, setting.value);
      });
    });
    res.json({
      success: true,
    })
  } catch(error) {
    Logger.getLogger('Adyen').error(`Error while saving settings in BM configuration: ${error}`);
    res.json({
      success: false,
    })
  }
  
  return next();
});

module.exports = server.exports();
