const server = require('server');
const Transaction = require('dw/system/Transaction');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

server.get('Start', csrfProtection.generateToken, (_req, res, next) => {
  res.render('adyenSettings/settings');
  return next();
});

server.post('Save', server.middleware.https, (req, res, next) => {
  try {
    const requestBody = JSON.parse(req.body);
    requestBody.settings.forEach((setting) => {
      Transaction.wrap(() => {
        AdyenConfigs.setCustomPreference(setting.key, setting.value);
      });
    });
    res.json({
      success: true,
    });
  } catch (error) {
    AdyenLogs.error_log(
      `Error while saving settings in BM configuration: ${error}`,
    );
    res.json({
      success: false,
    });
  }

  return next();
});

server.post('TestConnection', server.middleware.https, (req, res, next) => {
  try {
    const service = AdyenHelper.getService(
      constants.SERVICE.CHECKOUTPAYMENTMETHODS,
    );
    if (!service) {
      throw new Error('Could not do /paymentMethods call');
    }

    const requestBody = JSON.parse(req.body);

    const { xApiKey, merchantAccount } = requestBody;
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-key', xApiKey);

    const callResult = service.call(JSON.stringify({ merchantAccount }));
    if (!callResult.isOk()) {
      const { message } = JSON.parse(callResult.getErrorMessage());

      res.json({
        success: false,
        message,
        error: true,
      });
      return next();
    }

    res.json({
      success: true,
      error: false,
    });
  } catch (error) {
    AdyenLogs.error_log(`Error while testing API credentials: ${error}`);
    res.json({
      error: true,
      message: 'an unknown error has occurred',
      success: false,
    });
  }

  return next();
});

module.exports = server.exports();
