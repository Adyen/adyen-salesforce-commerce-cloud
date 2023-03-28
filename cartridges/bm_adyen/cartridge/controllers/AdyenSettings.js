"use strict";

var server = require('server');
var Transaction = require('dw/system/Transaction');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var constants = require('*/cartridge/adyenConstants/constants');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
server.get('Start', csrfProtection.generateToken, function (_req, res, next) {
  res.render('adyenSettings/settings');
  return next();
});
server.post('Save', server.middleware.https, function (req, res, next) {
  try {
    var requestBody = JSON.parse(req.body);
    requestBody.settings.forEach(function (setting) {
      Transaction.wrap(function () {
        AdyenConfigs.setCustomPreference(setting.key, setting.value);
      });
    });
    res.json({
      success: true
    });
  } catch (error) {
    AdyenLogs.error_log("Error while saving settings in BM configuration: ".concat(error));
    res.json({
      success: false
    });
  }
  return next();
});
server.post('TestConnection', server.middleware.https, function (req, res, next) {
  try {
    var service = AdyenHelper.getService(constants.SERVICE.CHECKOUTPAYMENTMETHODS);
    if (!service) {
      throw new Error('Could not do /paymentMethods call');
    }
    var requestBody = JSON.parse(req.body);
    var xApiKey = requestBody.xApiKey,
      merchantAccount = requestBody.merchantAccount;
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-key', xApiKey);
    var callResult = service.call(JSON.stringify({
      merchantAccount: merchantAccount
    }));
    if (!callResult.isOk()) {
      var _JSON$parse = JSON.parse(callResult.getErrorMessage()),
        message = _JSON$parse.message;
      res.json({
        success: false,
        message: message,
        error: true
      });
      return next();
    }
    res.json({
      success: true,
      error: false
    });
  } catch (error) {
    AdyenLogs.error_log("Error while testing API credentials: ".concat(error));
    res.json({
      error: true,
      message: 'an unknown error has occurred',
      success: false
    });
  }
  return next();
});
module.exports = server.exports();